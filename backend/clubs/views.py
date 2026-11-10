from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Club, ClubMembership, Announcement
from .serializers import ClubSerializer, ClubMembershipSerializer, AnnouncementSerializer
from accounts.permissions import IsOrganizerUserRole, IsAdminUserRole

class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.filter(is_active=True).order_by('name')
    serializer_class = ClubSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOrganizerUserRole()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, id=None):
        club = self.get_object()
        membership, created = ClubMembership.objects.get_or_create(
            club=club,
            user=request.user,
            defaults={'role': 'MEMBER'}
        )
        if not created:
            return Response({'message': 'You are already a member of this club.'}, status=status.HTTP_200_OK)
        return Response({'message': f'Successfully joined {club.name}!', 'is_joined': True}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, id=None):
        club = self.get_object()
        deleted_count, _ = ClubMembership.objects.filter(club=club, user=request.user).delete()
        if deleted_count == 0:
            return Response({'message': 'You are not a member of this club.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': f'Successfully left {club.name}.', 'is_joined': False}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def members(self, request, id=None):
        club = self.get_object()
        memberships = club.memberships.all().select_related('user')
        serializer = ClubMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def announcements(self, request, id=None):
        club = self.get_object()
        announcements = club.announcements.all().order_by('-is_pinned', '-created_at')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
