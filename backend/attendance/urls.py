from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, VerifyAttendanceView

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('attendance/verify/', VerifyAttendanceView.as_view(), name='attendance_verify'),
    path('', include(router.urls)),
]
