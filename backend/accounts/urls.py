from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, UserProfileView,
    DepartmentViewSet, FacultyViewSet, AdminUserManagementView, AdminToggleUserStatusView,
    AdminApproveOrganizerView, AdminRejectOrganizerView,
    PublicUserProfileView, LoginOTPRequestView, LoginOTPVerifyView, LoginOTPResendView
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'faculty', FacultyViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/login-otp-request/', LoginOTPRequestView.as_view(), name='login_otp_request'),
    path('auth/login-otp-verify/', LoginOTPVerifyView.as_view(), name='login_otp_verify'),
    path('auth/login-otp-resend/', LoginOTPResendView.as_view(), name='login_otp_resend'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/<int:user_id>/public_profile/', PublicUserProfileView.as_view(), name='public_user_profile'),
    path('admin/users/', AdminUserManagementView.as_view(), name='admin_users_list'),
    path('admin/users/<int:user_id>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin_toggle_user_status'),
    path('admin/organizers/<int:user_id>/approve/', AdminApproveOrganizerView.as_view(), name='admin_approve_organizer'),
    path('admin/organizers/<int:user_id>/reject/', AdminRejectOrganizerView.as_view(), name='admin_reject_organizer'),
    path('', include(router.urls)),
]
