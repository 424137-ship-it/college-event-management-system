from django.urls import path
from .views import (
    PublicPlatformStatsView, StudentDashboardStatsView,
    OrganizerDashboardStatsView, AdminDashboardStatsView
)

urlpatterns = [
    path('stats/public/', PublicPlatformStatsView.as_view(), name='public_stats'),
    path('stats/student/', StudentDashboardStatsView.as_view(), name='student_stats'),
    path('stats/organizer/', OrganizerDashboardStatsView.as_view(), name='organizer_stats'),
    path('stats/admin/', AdminDashboardStatsView.as_view(), name='admin_stats'),
]
