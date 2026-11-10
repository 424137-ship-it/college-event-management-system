from django.db import models
from django.conf import settings

class Notification(models.Model):
    CATEGORY_CHOICES = [
        ('EVENT', 'Event'),
        ('REGISTRATION', 'Registration'),
        ('CLUB', 'Club'),
        ('SYSTEM', 'System'),
        ('CERTIFICATE', 'Certificate'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='EVENT')
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.username}: {self.title}"
