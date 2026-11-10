import csv
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Budget, Expense, Sponsorship
from .serializers import BudgetSerializer, ExpenseSerializer, SponsorshipSerializer
from accounts.permissions import IsOrganizerUserRole, IsAdminUserRole

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsOrganizerUserRole]

    def get_queryset(self):
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        qs = Budget.objects.all().select_related('event', 'event__organizer').prefetch_related('expenses')

        if user.role != 'ADMIN' and not user.is_superuser:
            qs = qs.filter(event__organizer=user)

        if event_id:
            qs = qs.filter(event_id=event_id)

        return qs

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsOrganizerUserRole]

    def get_queryset(self):
        user = self.request.user
        budget_id = self.request.query_params.get('budget_id')
        event_id = self.request.query_params.get('event_id')
        category = self.request.query_params.get('category')

        qs = Expense.objects.all().select_related('budget', 'budget__event', 'created_by')

        if user.role != 'ADMIN' and not user.is_superuser:
            qs = qs.filter(budget__event__organizer=user)

        if budget_id:
            qs = qs.filter(budget_id=budget_id)
        if event_id:
            qs = qs.filter(budget__event_id=event_id)
        if category:
            qs = qs.filter(category=category)

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        expenses = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="campusx_expenses.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Event', 'Expense Title', 'Category', 'Amount (INR)', 'Date', 'Recorded By', 'Notes'])

        for exp in expenses:
            writer.writerow([
                exp.id,
                exp.budget.event.title,
                exp.title,
                exp.get_category_display(),
                exp.amount,
                exp.date,
                exp.created_by.get_full_name() if exp.created_by else 'N/A',
                exp.notes
            ])

        return response

class SponsorshipViewSet(viewsets.ModelViewSet):
    serializer_class = SponsorshipSerializer
    permission_classes = [IsOrganizerUserRole]

    def get_queryset(self):
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        qs = Sponsorship.objects.all().select_related('event')

        if user.role != 'ADMIN' and not user.is_superuser:
            qs = qs.filter(event__organizer=user)

        if event_id:
            qs = qs.filter(event_id=event_id)

        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def approve(self, request, pk=None):
        sponsor = self.get_object()
        sponsor.status = 'APPROVED'
        sponsor.save()
        return Response({'message': f"Sponsorship from '{sponsor.sponsor_name}' approved successfully."})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def reject(self, request, pk=None):
        sponsor = self.get_object()
        sponsor.status = 'REJECTED'
        sponsor.save()
        return Response({'message': f"Sponsorship from '{sponsor.sponsor_name}' rejected."})
