import uuid
import qrcode
from io import BytesIO
from django.db import models
from django.conf import settings
from django.core.files.base import ContentFile

class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('WAITLISTED', 'Waitlisted'),
    ]

    registration_id = models.CharField(max_length=50, unique=True, db_index=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    payment_status = models.CharField(max_length=20, default='FREE')
    payment_reference = models.CharField(max_length=120, blank=True, default='')
    qr_code = models.ImageField(upload_to='ticket_qrs/', blank=True, null=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['event', 'user'], name='unique_event_registration')
        ]
        ordering = ['-registered_at']

    def save(self, *args, **kwargs):
        if not self.registration_id:
            short_id = uuid.uuid4().hex[:8].upper()
            self.registration_id = f"CX-{self.event_id}-{short_id}"

        # Generate QR code if missing
        if not self.qr_code:
            import hmac
            import hashlib
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=8,
                border=2,
            )
            # Digitally signed ticket verification payload (HMAC-SHA256)
            secret = getattr(settings, 'SECRET_KEY', 'default-key').encode('utf-8')
            sig = hmac.new(secret, self.registration_id.encode('utf-8'), hashlib.sha256).hexdigest()[:12]
            ticket_data = f"NIT_TICKET:{self.registration_id}:{sig}"
            qr.add_data(ticket_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#17152B", back_color="#FFFFFF")

            buffer = BytesIO()
            img.save(buffer, format='PNG')
            file_name = f"ticket_{self.registration_id}.png"
            self.qr_code.save(file_name, ContentFile(buffer.getvalue()), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.registration_id} - {self.user.username} for {self.event.title}"

class SavedEvent(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_events')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'event'], name='unique_saved_event')
        ]
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.event.title}"
