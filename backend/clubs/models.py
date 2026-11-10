from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Club(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=100, default='Technical')
    logo = models.ImageField(upload_to='club_logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='club_covers/', blank=True, null=True)
    logo_url = models.URLField(blank=True)
    cover_url = models.URLField(blank=True)
    
    president = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_clubs')
    joint_secretary = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='secretary_clubs')
    faculty_coordinator = models.ForeignKey('accounts.Faculty', on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinated_clubs')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class ClubMembership(models.Model):
    ROLE_CHOICES = [
        ('MEMBER', 'Member'),
        ('LEAD', 'Lead'),
        ('CORE', 'Core Team'),
        ('COORDINATOR', 'Coordinator'),
    ]

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['club', 'user'], name='unique_club_membership')
        ]

    def __str__(self):
        return f"{self.user.username} in {self.club.name} ({self.role})"

class Announcement(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='announcements', null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_announcements')
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
