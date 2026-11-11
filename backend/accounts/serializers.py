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
            'role', 'phone', 'avatar', 'avatar_url', 'is_active_user', 'is_approved',
            'student_profile', 'organizer_profile', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_active_user', 'is_approved', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['STUDENT', 'ORGANIZER', 'ADMIN'], default='STUDENT', write_only=True)
    admin_secret_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    organization_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    designation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), write_only=True, required=False, allow_null=True)
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    roll_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    year_of_study = serializers.IntegerField(write_only=True, required=False, default=1)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name', 'phone',
            'role', 'admin_secret_key', 'organization_name', 'designation',
            'department', 'department_name', 'department_code', 'roll_number', 'year_of_study'
        ]

    def create(self, validated_data):
        role = validated_data.pop('role', 'STUDENT')
        admin_secret_key = validated_data.pop('admin_secret_key', '').strip()
        organization_name = validated_data.pop('organization_name', '').strip()
        designation = validated_data.pop('designation', '').strip()
        dept = validated_data.pop('department', None)
        dept_name = validated_data.pop('department_name', '').strip()
        dept_code = validated_data.pop('department_code', '').strip()
        roll_number = validated_data.pop('roll_number', '').strip()
        year_of_study = validated_data.pop('year_of_study', 1)
        password = validated_data.pop('password')

        # If organizer/admin created a custom department
        if not dept and dept_name:
            code = dept_code if dept_code else dept_name[:4].upper()
            dept, _ = Department.objects.get_or_create(code=code, defaults={'name': dept_name})

        # Validate super admin signup
        if role == 'ADMIN':
            import os
            # Read admin secret from environment variable; defaults to institutional setup key if unset
            admin_env_key = os.getenv('ADMIN_REGISTRATION_SECRET', 'ADMIN2026')
            if admin_secret_key != admin_env_key:
                raise serializers.ValidationError({'admin_secret_key': 'Invalid Admin Secret Key. Registration rejected.'})

            user = User(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone=validated_data.get('phone', ''),
                role=User.ADMIN,
                is_staff=True,
                is_superuser=True,
                is_approved=True,
            )
            user.set_password(password)
            user.save()

            OrganizerProfile.objects.create(
                user=user,
                organization_name=organization_name or 'College Central Administration',
                designation=designation or 'Super Administrator',
                department=dept,
                verified=True,
            )
            return user

        elif role == 'ORGANIZER':
            user = User(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone=validated_data.get('phone', ''),
                role=User.ORGANIZER,
                is_staff=False,
                is_superuser=False,
                is_approved=False,  # Organizer registration requires administrator approval
            )
            user.set_password(password)
            user.save()

            OrganizerProfile.objects.create(
                user=user,
                organization_name=organization_name or f"{user.first_name}'s Club Association",
                designation=designation or 'Lead Organizer',
                department=dept,
                verified=False,  # Requires administrator review before hosting events
            )
            return user

        else:
            # STUDENT role
            user = User(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone=validated_data.get('phone', ''),
                role=User.STUDENT,
                is_staff=False,
                is_superuser=False,
                is_approved=True,
            )
            user.set_password(password)
            user.save()

            generated_roll = roll_number if roll_number else f"STU-{user.id:04d}"
            StudentProfile.objects.create(
                user=user,
                roll_number=generated_roll,
                department=dept,
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
        if user.role == User.ORGANIZER and not getattr(user, 'is_approved', True):
            raise serializers.ValidationError("Your organizer registration is pending administrative approval. Once approved, you can log in directly using your email OTP.")
        data['user'] = UserSerializer(user).data
        return data
