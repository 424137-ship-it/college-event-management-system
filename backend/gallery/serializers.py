from rest_framework import serializers
from .models import GalleryAlbum, GalleryImage

class GalleryImageSerializer(serializers.ModelSerializer):
    album_title = serializers.ReadOnlyField(source='album.title')

    class Meta:
        model = GalleryImage
        fields = ['id', 'album', 'album_title', 'image', 'image_url', 'caption', 'uploaded_at']

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
