from django.db import models
from django.conf import settings
from django.utils.text import slugify

class EventCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='Calendar')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Event Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Venue(models.Model):
    name = models.CharField(max_length=150, unique=True)
    location = models.CharField(max_length=200)
    capacity = models.PositiveIntegerField(default=200)
    has_projector = models.BooleanField(default=True)
    has_sound_system = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Cap: {self.capacity})"

class Event(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PUBLISHED', 'Published'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events')
    club = models.ForeignKey('clubs.Club', on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True, related_name='events')
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, related_name='events')
    
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    poster = models.ImageField(upload_to='event_posters/', blank=True, null=True)
    poster_url = models.URLField(blank=True)

    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    registration_deadline = models.DateTimeField()

    max_participants = models.PositiveIntegerField(default=100)
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    eligibility = models.CharField(max_length=200, default='Open to all college students')
    rules = models.TextField(blank=True)

    faculty_coordinator = models.ForeignKey('accounts.Faculty', on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinated_events')
    student_coordinator_name = models.CharField(max_length=120, blank=True)
    student_coordinator_contact = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or 'event'
            unique_slug = base_slug
            counter = 1
            while Event.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        if not self.short_description and self.description:
            self.short_description = self.description[:250] + ('...' if len(self.description) > 250 else '')
        super().save(*args, **kwargs)

    @property
    def registered_count(self):
        return self.registrations.filter(status='CONFIRMED').count()

    @property
    def is_registration_open(self):
        from django.utils import timezone
        return self.status == 'PUBLISHED' and timezone.now() <= self.registration_deadline and self.registered_count < self.max_participants

    def __str__(self):
        return f"{self.title} [{self.status}]"

class EventSchedule(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    description = models.TextField(blank=True)
    speaker = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.event.title} - {self.title}"

class EventApproval(models.Model):
    STATUS_CHOICES = [
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='approval')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_approvals')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING_APPROVAL')
    rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Approval for {self.event.title}: {self.status}"

class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at.strftime('%Y-%m-%d %H:%M')} | {self.user} | {self.action}"
