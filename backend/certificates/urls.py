from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet, PublicCertificateVerifyView

router = DefaultRouter()
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('certificates/verify/<str:certificate_id>/', PublicCertificateVerifyView.as_view(), name='certificate_public_verify'),
    path('', include(router.urls)),
]
