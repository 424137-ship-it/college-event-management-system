from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, AnnouncementViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet, basename='club')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = [
    path('', include(router.urls)),
]
