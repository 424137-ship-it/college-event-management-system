import uuid
from django.db import models
from django.conf import settings

class Certificate(models.Model):
    TYPE_CHOICES = [
        ('PARTICIPATION', 'Certificate of Participation'),
        ('WINNER', 'Certificate of Merit & Excellence'),
        ('VOLUNTEER', 'Certificate of Appreciation (Volunteer)'),
        ('ORGANIZER', 'Certificate of Leadership (Organizer)'),
    ]

    certificate_id = models.CharField(max_length=60, unique=True, db_index=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='certificates')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    certificate_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='PARTICIPATION')
    title = models.CharField(max_length=200, default='Certificate of Participation')
    recipient_name = models.CharField(max_length=150)
    position_rank = models.CharField(max_length=100, blank=True)
    issue_date = models.DateField(auto_now_add=True)
    qr_verification_code = models.CharField(max_length=100, blank=True)
    pdf_file = models.FileField(upload_to='certificates_pdf/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.certificate_id:
            short_id = uuid.uuid4().hex[:8].upper()
            self.certificate_id = f"CX-CERT-{self.event_id}-{short_id}"
        if not self.recipient_name and self.user:
            self.recipient_name = self.user.get_full_name() or self.user.username
        if not self.qr_verification_code:
            self.qr_verification_code = f"VERIFY-{self.certificate_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.certificate_id} - {self.recipient_name} ({self.get_certificate_type_display()})"
