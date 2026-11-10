from django.db import models
from django.conf import settings

class Budget(models.Model):
    event = models.OneToOneField('events.Event', on_delete=models.CASCADE, related_name='budget')
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    approved_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=15, default='INR (₹)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_expenses(self):
        total = self.expenses.aggregate(models.Sum('amount'))['amount__sum']
        return total or 0.00

    @property
    def remaining_budget(self):
        return float(self.approved_budget) - float(self.total_expenses)

    def __str__(self):
        return f"Budget for {self.event.title} (₹{self.approved_budget})"

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('DECORATIONS', 'Decorations'),
        ('FOOD', 'Food & Catering'),
        ('MATERIALS', 'Materials'),
        ('PRINTING', 'Printing'),
        ('PRIZES', 'Prizes & Awards'),
        ('TRANSPORTATION', 'Transportation'),
        ('EQUIPMENT', 'Equipment & Sound'),
        ('OTHER', 'Other'),
    ]

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='OTHER')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt = models.ImageField(upload_to='receipts/', blank=True, null=True)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title}: ₹{self.amount} ({self.get_category_display()})"

class Sponsorship(models.Model):
    STATUS_CHOICES = [
        ('PROPOSED', 'Proposed'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('RECEIVED', 'Received'),
        ('REJECTED', 'Rejected'),
    ]

    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='sponsorships')
    sponsor_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=120, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tier = models.CharField(max_length=50, default='Gold')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROPOSED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-amount', '-created_at']

    def __str__(self):
        return f"{self.sponsor_name} (₹{self.amount}) - {self.event.title}"
