from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from .models import Department, Faculty, StudentProfile, OrganizerProfile
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    DepartmentSerializer, FacultySerializer, StudentProfileSerializer, OrganizerProfileSerializer
)
from .permissions import IsAdminUserRole

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Registration successful! You can now log in with your credentials.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # Update user fields
        for field in ['first_name', 'last_name', 'phone', 'avatar_url']:
            if field in request.data:
                setattr(user, field, request.data[field])
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
        user.save()

        # Update profile fields if student
        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            if 'bio' in request.data:
                profile.bio = request.data['bio']
            if 'year_of_study' in request.data:
                profile.year_of_study = request.data['year_of_study']
            if 'semester' in request.data:
                profile.semester = request.data['semester']
            if 'interests' in request.data:
                profile.interests = request.data['interests']
            profile.save()

        # Update profile fields if organizer
        if hasattr(user, 'organizer_profile'):
            profile = user.organizer_profile
            if 'organization_name' in request.data:
                profile.organization_name = request.data['organization_name']
            if 'designation' in request.data:
                profile.designation = request.data['designation']
            profile.save()

        return Response(UserSerializer(user).data)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class AdminUserManagementView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        role_filter = request.query_params.get('role')
        queryset = User.objects.all().order_by('-date_joined')
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

class AdminToggleUserStatusView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active_user = not user.is_active_user
            user.is_active = user.is_active_user
            user.save()
            return Response({
                'message': f"User {'activated' if user.is_active_user else 'deactivated'} successfully",
                'is_active_user': user.is_active_user
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class PublicUserProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        from events.models import Event
        from events.serializers import EventListSerializer
        from clubs.models import Club
        from registrations.models import EventRegistration

        try:
            target_user = User.objects.select_related(
                'student_profile', 'organizer_profile', 'student_profile__department', 'organizer_profile__department'
            ).get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User / Organizer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Clubs where target_user is President or Joint Secretary
        led_clubs = Club.objects.filter(models.Q(president=target_user) | models.Q(joint_secretary=target_user), is_active=True)
        clubs_data = [
            {
                'id': c.id,
                'name': c.name,
                'category': c.category,
                'tagline': c.tagline,
                'logo_url': c.logo_url or (c.logo.url if c.logo else ''),
                'members_count': c.memberships.count(),
                'role': 'President' if c.president == target_user else 'Joint Secretary',
            } for c in led_clubs
        ]

        # Events conducted by this user (either as event organizer or president of the organizing club)
        events_qs = Event.objects.filter(
            models.Q(organizer=target_user) | models.Q(club__president=target_user),
            status__in=['PUBLISHED', 'COMPLETED', 'APPROVED']
        ).distinct().order_by('-start_date')

        now = timezone.now().date()
        upcoming_events_qs = events_qs.filter(start_date__gte=now).order_by('start_date')
        past_events_qs = events_qs.filter(models.Q(start_date__lt=now) | models.Q(status='COMPLETED')).order_by('-start_date')

        # Total footfall / attendees across all their events
        total_attendees = EventRegistration.objects.filter(
            event__in=events_qs, status='CONFIRMED'
        ).count()

        full_name = target_user.get_full_name() or target_user.username
        department_name = ''
        roll_number = ''
        year_of_study = None
        bio = ''
        organization_name = ''
        designation = 'Student Leader / Event Organizer'
        verified = True

        if hasattr(target_user, 'student_profile'):
            sp = target_user.student_profile
            department_name = sp.department.name if sp.department else ''
            roll_number = sp.roll_number
            year_of_study = sp.year_of_study
            bio = sp.bio

        if hasattr(target_user, 'organizer_profile'):
            op = target_user.organizer_profile
            organization_name = op.organization_name
            designation = op.designation or 'Club President'
            verified = op.verified
            if op.department:
                department_name = op.department.name

        context = {'request': request}
        upcoming_serialized = EventListSerializer(upcoming_events_qs, many=True, context=context).data
        past_serialized = EventListSerializer(past_events_qs, many=True, context=context).data
        all_serialized = EventListSerializer(events_qs, many=True, context=context).data

        return Response({
            'id': target_user.id,
            'username': target_user.username,
            'full_name': full_name,
            'email': target_user.email,
            'phone': target_user.phone if target_user.phone else '',
            'role': target_user.role,
            'avatar_url': target_user.avatar_url or (target_user.avatar.url if target_user.avatar else ''),
            'department': department_name,
            'roll_number': roll_number,
            'year_of_study': year_of_study,
            'bio': bio,
            'organization_name': organization_name,
            'designation': designation,
            'verified': verified,
            'led_clubs': clubs_data,
            'stats': {
                'total_events': events_qs.count(),
                'total_attendees': total_attendees,
                'upcoming_count': upcoming_events_qs.count(),
                'past_count': past_events_qs.count(),
                'clubs_led_count': led_clubs.count(),
            },
            'events': all_serialized,
            'upcoming_events': upcoming_serialized,
            'past_events': past_serialized,
        })
