from rest_framework import viewsets, permissions
from .models import GalleryAlbum, GalleryImage
from .serializers import GalleryAlbumSerializer, GalleryImageSerializer
from accounts.permissions import IsOrganizerUserRole

class GalleryAlbumViewSet(viewsets.ModelViewSet):
    queryset = GalleryAlbum.objects.all().prefetch_related('images').select_related('event', 'club')
    serializer_class = GalleryAlbumSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsOrganizerUserRole()]
        return [permissions.AllowAny()]

class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all().select_related('album')
    serializer_class = GalleryImageSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsOrganizerUserRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        album_id = self.request.query_params.get('album_id')
        qs = GalleryImage.objects.all().select_related('album')
        if album_id:
            qs = qs.filter(album_id=album_id)
        return qs
