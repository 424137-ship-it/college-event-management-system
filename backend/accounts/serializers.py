from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Department, Faculty, StudentProfile, OrganizerProfile

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class FacultySerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Faculty
        fields = '__all__'

class StudentProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = StudentProfile
        fields = ['id', 'roll_number', 'department', 'department_name', 'year_of_study', 'semester', 'bio', 'interests', 'created_at', 'updated_at']

class OrganizerProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = OrganizerProfile
        fields = ['id', 'organization_name', 'designation', 'department', 'department_name', 'verified', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    organizer_profile = OrganizerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'avatar_url', 'is_active_user',
            'student_profile', 'organizer_profile', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_active_user', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    roll_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), write_only=True, required=False, allow_null=True)
    year_of_study = serializers.IntegerField(write_only=True, required=False, default=1)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'roll_number', 'department', 'year_of_study']

    def create(self, validated_data):
        roll_number = validated_data.pop('roll_number', None)
        department = validated_data.pop('department', None)
        year_of_study = validated_data.pop('year_of_study', 1)
        password = validated_data.pop('password')

        # Public registrations ALWAYS get STUDENT role as per requirements
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=User.STUDENT,
        )
        user.set_password(password)
        user.save()

        # Create student profile
        generated_roll = roll_number if roll_number else f"STU-{user.id:04d}"
        StudentProfile.objects.create(
            user=user,
            roll_number=generated_roll,
            department=department,
            year_of_study=year_of_study,
        )

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['name'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.is_active_user or not user.is_active:
            raise serializers.ValidationError("This account has been deactivated. Please contact campus admin.")
        data['user'] = UserSerializer(user).data
        return data
