from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GalleryAlbumViewSet, GalleryImageViewSet

router = DefaultRouter()
router.register(r'albums', GalleryAlbumViewSet, basename='gallery-album')
router.register(r'images', GalleryImageViewSet, basename='gallery-image')

urlpatterns = [
    path('', include(router.urls)),
]
