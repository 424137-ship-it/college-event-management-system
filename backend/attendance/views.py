import csv
from django.http import HttpResponse
from django.db import transaction, IntegrityError
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Attendance
from .serializers import AttendanceSerializer
from registrations.models import EventRegistration
from events.models import Event
from accounts.permissions import IsOrganizerUserRole

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsOrganizerUserRole]

    def get_queryset(self):
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        qs = Attendance.objects.all().select_related('registration', 'registration__user', 'registration__event', 'verified_by')

        if user.role != 'ADMIN' and not user.is_superuser:
            qs = qs.filter(registration__event__organizer=user)

        if event_id:
            qs = qs.filter(registration__event_id=event_id)

        return qs

class VerifyAttendanceView(APIView):
    permission_classes = [IsOrganizerUserRole]

    def post(self, request):
        raw_code = request.data.get('ticket_code', '').strip()
        event_id = request.data.get('event_id')
        method = request.data.get('method', 'QR_SCAN')

        if not raw_code:
            return Response({'error': 'Ticket code or registration ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse QR code format if applicable: "NIT_TICKET:CX-1-XXXX:sig" or legacy "HARSHAX_TICKET:CX-1-XXXX"
        cleaned_code = raw_code.replace('NIT_TICKET:', '').replace('HARSHAX_TICKET:', '').replace('CAMPUSX_TICKET:', '').strip()
        parts = cleaned_code.split(':')
        reg_id = parts[0].strip()

        # If cryptographic signature is present, verify authenticity
        if len(parts) > 1:
            import hmac
            import hashlib
            from django.conf import settings
            sig = parts[1].strip()
            secret = getattr(settings, 'SECRET_KEY', 'default-key').encode('utf-8')
            expected_sig = hmac.new(secret, reg_id.encode('utf-8'), hashlib.sha256).hexdigest()[:12]
            if not hmac.compare_digest(sig, expected_sig):
                return Response({'error': 'Security Warning: Counterfeit ticket detected. Cryptographic signature invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                try:
                    reg = EventRegistration.objects.select_for_update().select_related('user', 'event').get(registration_id=reg_id)
                except EventRegistration.DoesNotExist:
                    return Response({'error': f"Invalid Ticket: No registration found for '{reg_id}'."}, status=status.HTTP_404_NOT_FOUND)

                # Check event match if event_id is supplied
                if event_id and str(reg.event_id) != str(event_id):
                    return Response({'error': f"Ticket belongs to a different event: '{reg.event.title}'."}, status=status.HTTP_400_BAD_REQUEST)

                # Check organizer permissions: must be event organizer or admin
                user = request.user
                if user.role != 'ADMIN' and not user.is_superuser and reg.event.organizer != user:
                    return Response({'error': 'You are not authorized to scan tickets for this event.'}, status=status.HTTP_403_FORBIDDEN)

                # Check registration status
                if reg.status != 'CONFIRMED':
                    return Response({'error': f"Ticket is invalid: Registration is {reg.status}."}, status=status.HTTP_400_BAD_REQUEST)

                # Check duplicate attendance
                if hasattr(reg, 'attendance'):
                    existing_att = reg.attendance
                    return Response({
                        'already_checked_in': True,
                        'message': f"Duplicate scan: Attendance already recorded at {existing_att.scanned_at.strftime('%I:%M %p')}.",
                        'student_name': reg.user.get_full_name() or reg.user.username,
                        'registration_id': reg.registration_id,
                        'scanned_at': existing_att.scanned_at,
                    }, status=status.HTTP_200_OK)

                try:
                    # Record attendance atomically
                    attendance = Attendance.objects.create(
                        registration=reg,
                        verified_by=user,
                        method=method
                    )
                except IntegrityError:
                    # Caught concurrent duplicate scan
                    existing_att = Attendance.objects.get(registration=reg)
                    return Response({
                        'already_checked_in': True,
                        'message': f"Duplicate scan: Attendance was just recorded at {existing_att.scanned_at.strftime('%I:%M %p')}.",
                        'student_name': reg.user.get_full_name() or reg.user.username,
                        'registration_id': reg.registration_id,
                        'scanned_at': existing_att.scanned_at,
                    }, status=status.HTTP_200_OK)

                return Response({
                    'success': True,
                    'message': f"Verified! Attendance marked for {reg.user.get_full_name() or reg.user.username}.",
                    'student_name': reg.user.get_full_name() or reg.user.username,
                    'roll_number': getattr(getattr(reg.user, 'student_profile', None), 'roll_number', 'N/A'),
                    'registration_id': reg.registration_id,
                    'event_title': reg.event.title,
                    'scanned_at': attendance.scanned_at,
                    'method': attendance.method,
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f"Attendance check failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ExportODReportView(APIView):
    """Generates official On-Duty (OD) CSV Attendance roster for college Academic Dean / HOD approval"""
    permission_classes = [IsOrganizerUserRole]

    def get(self, request):
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response({'error': 'event_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role != 'ADMIN' and not user.is_superuser and event.organizer != user:
            return Response({'error': 'Unauthorized to export attendance for this event.'}, status=status.HTTP_403_FORBIDDEN)

        attendances = Attendance.objects.filter(registration__event=event).select_related(
            'registration__user', 'registration__user__student_profile', 'registration__user__student_profile__department', 'verified_by'
        ).order_by('scanned_at')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="OD_Attendance_{event.slug}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Sl No', 'Roll Number', 'Student Name', 'Department', 'Email', 'Ticket ID', 'Gate Check-in Time', 'Verified By', 'OD Status'])

        for idx, att in enumerate(attendances, 1):
            student = att.registration.user
            profile = getattr(student, 'student_profile', None)
            roll = profile.roll_number if profile else 'N/A'
            dept = profile.department.name if (profile and profile.department) else 'N/A'
            verifier = att.verified_by.get_full_name() if att.verified_by else 'Gate System'

            writer.writerow([
                idx,
                roll,
                student.get_full_name() or student.username,
                dept,
                student.email,
                att.registration.registration_id,
                att.scanned_at.strftime('%Y-%m-%d %H:%M:%S'),
                verifier,
                'APPROVED_OD_ATTENDANCE'
            ])

        return response
