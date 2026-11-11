from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import GalleryAlbum, GalleryImage
from .serializers import GalleryAlbumSerializer, GalleryImageSerializer
from events.models import Event
from accounts.permissions import IsOrganizerUserRole

class GalleryAlbumViewSet(viewsets.ModelViewSet):
    queryset = GalleryAlbum.objects.all().prefetch_related('images').select_related('event', 'club')
    serializer_class = GalleryAlbumSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsOrganizerUserRole()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def uploadable_events(self, request):
        """
        Returns events that the currently logged-in user has permission to upload photos for.
        Admins can upload for any event; organizers can upload for their own events.
        """
        user = request.user
        if user.role == 'ADMIN' or user.is_superuser:
            qs = Event.objects.all().order_by('-start_date')
        elif user.role == 'ORGANIZER':
            qs = Event.objects.filter(organizer=user).order_by('-start_date')
        else:
            qs = Event.objects.none()

        data = [
            {
                'id': e.id,
                'title': e.title,
                'club_name': e.club.name if e.club else 'National Institute of Technology',
                'start_date': str(e.start_date),
                'poster_url': e.poster_url or '',
            }
            for e in qs
        ]
        return Response(data, status=status.HTTP_200_OK)

class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all().select_related('album', 'album__event')
    serializer_class = GalleryImageSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        album_id = self.request.query_params.get('album_id')
        event_id = self.request.query_params.get('event_id')
        qs = GalleryImage.objects.all().select_related('album', 'album__event')
        if album_id:
            qs = qs.filter(album_id=album_id)
        if event_id:
            qs = qs.filter(album__event_id=event_id)
        return qs

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event_id') or request.data.get('event')
        album_id = request.data.get('album_id') or request.data.get('album')
        caption = request.data.get('caption', '').strip()
        image_url = request.data.get('image_url', '').strip()
        files = request.FILES.getlist('images') or ([request.FILES.get('image')] if request.FILES.get('image') else [])

        # 1. Resolve Album and verify ownership
        album = None
        if event_id:
            event = get_object_or_404(Event, id=event_id)
            is_admin = request.user.role == 'ADMIN' or request.user.is_superuser
            is_event_organizer = event.organizer_id == request.user.id
            if not is_admin and not is_event_organizer:
                return Response(
                    {'error': f"Permission denied: You can only upload gallery photos for events you organize ('{event.title}')."},
                    status=status.HTTP_403_FORBIDDEN
                )
            album, _ = GalleryAlbum.objects.get_or_create(
                event=event,
                defaults={
                    'title': f"{event.title} Highlights",
                    'club': event.club,
                    'description': f"Official photo memories and moments from {event.title}."
                }
            )
        elif album_id:
            album = get_object_or_404(GalleryAlbum, id=album_id)
            if album.event:
                is_admin = request.user.role == 'ADMIN' or request.user.is_superuser
                is_event_organizer = album.event.organizer_id == request.user.id
                if not is_admin and not is_event_organizer:
                    return Response(
                        {'error': f"Permission denied: You can only upload gallery photos for events you organize ('{album.event.title}')."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                if request.user.role != 'ADMIN' and not request.user.is_superuser:
                    return Response(
                        {'error': 'Permission denied: Only administrators can upload photos to general campus albums.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        else:
            return Response(
                {'error': 'Please select an event or album for these photos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Check for uploaded files or image URL
        if not files and not image_url:
            return Response(
                {'error': 'Please select an image file or provide a valid image URL.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_images = []
        if files:
            for f in files:
                img = GalleryImage.objects.create(
                    album=album,
                    image=f,
                    caption=caption
                )
                created_images.append(img)
        elif image_url:
            img = GalleryImage.objects.create(
                album=album,
                image_url=image_url,
                caption=caption
            )
            created_images.append(img)

        serializer = GalleryImageSerializer(created_images, many=True, context={'request': request})
        return Response({
            'message': f"Successfully uploaded {len(created_images)} photo(s) to '{album.title}'!",
            'images': serializer.data,
            'album_id': album.id,
            'album_title': album.title
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        image = self.get_object()
        is_admin = request.user.role == 'ADMIN' or request.user.is_superuser
        is_event_organizer = image.album.event and image.album.event.organizer_id == request.user.id
        if not is_admin and not is_event_organizer:
            return Response(
                {'error': 'Permission denied: You can only delete photos from your own event albums.'},
                status=status.HTTP_403_FORBIDDEN
            )
        image.delete()
        return Response({'message': 'Photo deleted successfully.'}, status=status.HTTP_200_OK)
