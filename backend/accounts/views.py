from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
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
