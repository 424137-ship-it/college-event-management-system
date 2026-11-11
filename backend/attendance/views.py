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

        # Parse QR code format if applicable: "HARSHAX_TICKET:CX-1-XXXX" or "CAMPUSX_TICKET:CX-1-XXXX"
        reg_id = raw_code.replace('HARSHAX_TICKET:', '').replace('CAMPUSX_TICKET:', '').strip()

        try:
            reg = EventRegistration.objects.select_related('user', 'event').get(registration_id=reg_id)
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

        # Record attendance
        attendance = Attendance.objects.create(
            registration=reg,
            verified_by=user,
            method=method
        )

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
