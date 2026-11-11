import io
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from .models import Certificate
from .serializers import CertificateSerializer
from accounts.permissions import IsOrganizerUserRole

def generate_pdf_certificate(cert):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Background decorative border
    p.setStrokeColor(colors.HexColor('#A855F7'))
    p.setLineWidth(4)
    p.rect(30, 30, width - 60, height - 60)

    p.setStrokeColor(colors.HexColor('#D8B4FE'))
    p.setLineWidth(1.5)
    p.rect(36, 36, width - 72, height - 72)

    # Top Brand Header
    p.setFont("Helvetica-Bold", 14)
    p.setFillColor(colors.HexColor('#A855F7'))
    p.drawCentredString(width / 2.0, height - 70, "HARSHAX • DIGITAL CAMPUS EXPERIENCE")

    # Main Certificate Title
    p.setFont("Helvetica-Bold", 32)
    p.setFillColor(colors.HexColor('#17152B'))
    p.drawCentredString(width / 2.0, height - 120, cert.title.upper())

    # Subtitle
    p.setFont("Helvetica-Oblique", 14)
    p.setFillColor(colors.HexColor('#77738B'))
    p.drawCentredString(width / 2.0, height - 150, "This is proudly presented to")

    # Recipient Name
    p.setFont("Helvetica-Bold", 26)
    p.setFillColor(colors.HexColor('#A855F7'))
    p.drawCentredString(width / 2.0, height - 195, cert.recipient_name)

    # Underline under name
    p.setStrokeColor(colors.HexColor('#D8B4FE'))
    p.setLineWidth(1)
    p.line((width / 2.0) - 150, height - 205, (width / 2.0) + 150, height - 205)

    # Description text
    p.setFont("Helvetica", 14)
    p.setFillColor(colors.HexColor('#17152B'))
    desc = f"for outstanding participation and contribution in '{cert.event.title}'"
    if cert.position_rank:
        desc += f" securing {cert.position_rank}"
    p.drawCentredString(width / 2.0, height - 240, desc)

    # Event date and venue
    venue_name = cert.event.venue.name if cert.event.venue else 'Campus Auditorium'
    p.setFont("Helvetica", 11)
    p.setFillColor(colors.HexColor('#77738B'))
    p.drawCentredString(width / 2.0, height - 265, f"Organized by {cert.event.organizer.get_full_name() or 'HarshaX'} on {cert.event.start_date.strftime('%B %d, %Y')} at {venue_name}")

    # Signatures
    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(colors.HexColor('#17152B'))
    p.drawString(100, 105, "Dr. S. K. Sharma")
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#77738B'))
    p.drawString(100, 90, "Dean of Student Affairs")
    p.setStrokeColor(colors.HexColor('#77738B'))
    p.line(100, 120, 240, 120)

    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(colors.HexColor('#17152B'))
    p.drawString(width - 240, 105, cert.event.organizer.get_full_name() or "Event Convener")
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#77738B'))
    p.drawString(width - 240, 90, "Event Lead Coordinator")
    p.line(width - 240, 120, width - 100, 120)

    # Footer verification
    import os
    frontend_url = os.getenv('FRONTEND_URL', 'https://college-event-management-system.vercel.app').rstrip('/')
    p.setFont("Helvetica", 9)
    p.setFillColor(colors.HexColor('#77738B'))
    p.drawCentredString(width / 2.0, 50, f"Certificate ID: {cert.certificate_id}  |  Verify online at {frontend_url}/verify-certificate/{cert.certificate_id}")

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer

class CertificateViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsOrganizerUserRole()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.validated_data.get('event')
        recipient_user = serializer.validated_data.get('user')

        # Organizer authorization check: must own event or be admin
        if user.role != 'ADMIN' and not user.is_superuser and event.organizer != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only issue certificates for events you organize.")

        # Ensure recipient student was registered for this event
        from registrations.models import EventRegistration
        if not EventRegistration.objects.filter(event=event, user=recipient_user, status='CONFIRMED').exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'user': f"Student '{recipient_user.username}' does not have a confirmed registration for '{event.title}'."})

        recipient_name = serializer.validated_data.get('recipient_name') or recipient_user.get_full_name() or recipient_user.username
        serializer.save(recipient_name=recipient_name)

    def get_queryset(self):
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        scope = self.request.query_params.get('scope')

        if (user.role == 'ADMIN' or user.is_superuser) and scope == 'admin':
            qs = Certificate.objects.all()
        elif (user.role in ['ORGANIZER', 'ADMIN']) and scope == 'organizer':
            qs = Certificate.objects.filter(event__organizer=user)
        else:
            # Student views their own certificates
            qs = Certificate.objects.filter(user=user)

        if event_id:
            qs = qs.filter(event_id=event_id)

        return qs.select_related('event', 'user', 'event__venue', 'event__category')

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        cert = self.get_object()
        # Verify access: owner, organizer, or admin
        user = request.user
        if user.role != 'ADMIN' and not user.is_superuser and cert.user != user and cert.event.organizer != user:
            return Response({'error': 'Unauthorized to download this certificate.'}, status=status.HTTP_403_FORBIDDEN)

        pdf_buffer = generate_pdf_certificate(cert)
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Certificate_{cert.certificate_id}.pdf"'
        return response

class PublicCertificateVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, certificate_id):
        try:
            cert = Certificate.objects.select_related('event', 'user', 'event__venue', 'event__category').get(certificate_id=certificate_id)
            return Response({
                'valid': True,
                'certificate_id': cert.certificate_id,
                'recipient_name': cert.recipient_name,
                'event_title': cert.event.title,
                'category': cert.event.category.name if cert.event.category else 'General',
                'certificate_type': cert.get_certificate_type_display(),
                'position_rank': cert.position_rank or 'Participant',
                'issue_date': cert.issue_date,
                'organizer': cert.event.organizer.get_full_name() or cert.event.organizer.username,
            })
        except Certificate.DoesNotExist:
            return Response({
                'valid': False,
                'error': f"Certificate with ID '{certificate_id}' was not found in the authentic HarshaX registry."
            }, status=status.HTTP_404_NOT_FOUND)
