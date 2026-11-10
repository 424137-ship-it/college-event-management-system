from django.db import models
from django.conf import settings

class Attendance(models.Model):
    METHOD_CHOICES = [
        ('QR_SCAN', 'QR Code Scan'),
        ('MANUAL', 'Manual Ticket Verification'),
    ]

    registration = models.OneToOneField('registrations.EventRegistration', on_delete=models.CASCADE, related_name='attendance')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_attendances')
    scanned_at = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='QR_SCAN')

    class Meta:
        ordering = ['-scanned_at']

    def __str__(self):
        return f"Attendance: {self.registration.registration_id} ({self.registration.user.username})"
