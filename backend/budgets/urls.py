from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BudgetViewSet, ExpenseViewSet, SponsorshipViewSet

router = DefaultRouter()
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'sponsorships', SponsorshipViewSet, basename='sponsorship')

urlpatterns = [
    path('', include(router.urls)),
]
