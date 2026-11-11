from rest_framework import serializers
from .models import GalleryAlbum, GalleryImage

class GalleryImageSerializer(serializers.ModelSerializer):
    album_title = serializers.ReadOnlyField(source='album.title')
    event_id = serializers.ReadOnlyField(source='album.event_id')
    event_title = serializers.ReadOnlyField(source='album.event.title')
    can_delete = serializers.SerializerMethodField()
    display_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = [
            'id', 'album', 'album_title', 'event_id', 'event_title',
            'image', 'image_url', 'display_url', 'caption', 'can_delete', 'uploaded_at'
        ]

    def get_display_url(self, obj):
        if obj.image:
            return obj.image.url
        return obj.image_url or ''

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        if obj.album and obj.album.event:
            return obj.album.event.organizer_id == request.user.id
        return False

class GalleryAlbumSerializer(serializers.ModelSerializer):
    images = GalleryImageSerializer(many=True, read_only=True)
    images_count = serializers.SerializerMethodField()
    event_title = serializers.ReadOnlyField(source='event.title')
    club_name = serializers.ReadOnlyField(source='club.name')

    class Meta:
        model = GalleryAlbum
        fields = ['id', 'event', 'event_title', 'club', 'club_name', 'title', 'description', 'images_count', 'images', 'created_at']

    def get_images_count(self, obj):
        return obj.images.count()
