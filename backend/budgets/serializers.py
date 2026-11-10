from rest_framework import serializers
from .models import Budget, Expense, Sponsorship

class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'budget', 'title', 'category', 'category_display', 'amount', 'receipt', 'date', 'notes', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

class SponsorshipSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Sponsorship
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    organizer_id = serializers.ReadOnlyField(source='event.organizer.id')
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_budget = serializers.FloatField(read_only=True)
    expenses = ExpenseSerializer(many=True, read_only=True)
    total_sponsorship = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'event', 'event_title', 'organizer_id', 'estimated_budget', 'approved_budget',
            'currency', 'total_expenses', 'remaining_budget', 'total_sponsorship', 'expenses',
            'created_at', 'updated_at'
        ]

    def get_total_sponsorship(self, obj):
        from django.db.models import Sum
        total = obj.event.sponsorships.filter(status__in=['APPROVED', 'RECEIVED']).aggregate(Sum('amount'))['amount__sum']
        return float(total or 0.0)
