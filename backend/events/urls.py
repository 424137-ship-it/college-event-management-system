from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventCategoryViewSet, VenueViewSet, EventViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'categories', EventCategoryViewSet, basename='category')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'events', EventViewSet, basename='event')
router.register(r'admin/logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('', include(router.urls)),
]
