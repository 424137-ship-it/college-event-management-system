from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventRegistrationViewSet, SavedEventViewSet

router = DefaultRouter()
router.register(r'registrations', EventRegistrationViewSet, basename='registration')
router.register(r'saved-events', SavedEventViewSet, basename='saved-event')

urlpatterns = [
    path('', include(router.urls)),
]
