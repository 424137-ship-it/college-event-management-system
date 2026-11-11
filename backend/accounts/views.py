import random
import datetime
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from .models import Department, Faculty, StudentProfile, OrganizerProfile, EmailOTP
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    DepartmentSerializer, FacultySerializer, StudentProfileSerializer, OrganizerProfileSerializer
)
from .permissions import IsAdminUserRole

User = get_user_model()

def mask_email(email_str):
    if not email_str or '@' not in email_str:
        return 'your registered email'
    parts = email_str.split('@')
    name = parts[0]
    domain = parts[1]
    if len(name) <= 2:
        masked_name = name[0] + '*'
    else:
        masked_name = name[:2] + '*' * (len(name) - 3) + name[-1]
    return f"{masked_name}@{domain}"

class LoginOTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username_or_email or not password:
            return Response({'error': 'Please provide both username/email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow user to log in with either username or email
        user = None
        if '@' in username_or_email:
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            return Response({'error': 'Invalid credentials. Please check your username and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Your account is currently disabled. Please contact administration.'}, status=status.HTTP_403_FORBIDDEN)

        # Invalidate any previous unused OTPs for this user
        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate a secure 6-digit OTP
        otp_code = f"{random.randint(100000, 999999):06d}"
        expires_at = timezone.now() + datetime.timedelta(minutes=5)
        target_email = user.email if user.email else 'harshax000@gmail.com'

        EmailOTP.objects.create(
            user=user,
            otp_code=otp_code,
            email=target_email,
            expires_at=expires_at
        )

        email_sent = False
        try:
            subject = f"HarshaX • Your NIT Login Verification Code: {otp_code}"
            text_message = (
                f"Hello {user.get_full_name() or user.username},\n\n"
                f"Your 6-digit verification code for National Institute of Technology Event Portal is: {otp_code}\n\n"
                f"This code will expire in 5 minutes. Please do not share this OTP with anyone.\n\n"
                f"Regards,\nNational Institute of Technology Campus Team"
            )
            html_message = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #FFFFFF; border: 1.5px solid #E9E1F7; border-radius: 20px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #A855F7; background: #FAF5FF; padding: 6px 14px; border-radius: 9999px;">
                  National Institute of Technology
                </span>
                <h2 style="font-size: 22px; font-weight: 800; color: #17152B; margin: 16px 0 6px 0;">Login Verification Code</h2>
                <p style="font-size: 14px; color: #6B7280; margin: 0;">Use the code below to complete your authentication</p>
              </div>

              <div style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%); border: 1.5px dashed #C084FC; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace, Courier; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #7E22CE; display: inline-block;">
                  {otp_code}
                </span>
                <p style="font-size: 12px; color: #9333EA; font-weight: 600; margin: 8px 0 0 0;">Valid for 5 minutes</p>
              </div>

              <p style="font-size: 13px; color: #4B5563; line-height: 1.5; margin: 0 0 16px 0;">
                Hello <strong>{user.get_full_name() or user.username}</strong>, you requested to sign in to the NIT College Event Management System.
              </p>
              <p style="font-size: 12px; color: #9CA3AF; line-height: 1.4; margin: 0;">
                🔒 If you did not make this request, please contact NIT campus security or administrator immediately.
              </p>
            </div>
            """

            recipients = [target_email]
            admin_copy = 'harshax000@gmail.com'
            if admin_copy.lower() not in [r.lower() for r in recipients]:
                recipients.append(admin_copy)

            send_mail(
                subject=subject,
                message=text_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False
            )
            email_sent = True
            print(f"[OTP EMAIL SUCCESS] Dispatched email to {recipients}")
        except Exception as e:
            print(f"[OTP NOTICE] Live email send note: {str(e)}. Operating in developer fallback mode.")

        print(f"\n=======================================================")
        print(f" [HARSHAX OTP] User: {user.username} | Code: {otp_code} | Target: {target_email}")
        print(f"=======================================================\n")

        return Response({
            'otp_required': True,
            'username': user.username,
            'email': mask_email(target_email),
            'target_email': target_email,
            'demo_otp': otp_code,
            'email_sent': email_sent,
            'message': f"A 6-digit verification code has been dispatched to {mask_email(target_email)}."
        }, status=status.HTTP_200_OK)

class LoginOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        otp = request.data.get('otp', '').strip()

        if not username or not otp:
            return Response({'error': 'Username and OTP are both required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(models.Q(username__iexact=username) | models.Q(email__iexact=username)).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        otp_record = EmailOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if not otp_record or not otp_record.is_valid():
            return Response({'error': 'OTP has expired or is invalid. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp_code != otp:
            return Response({'error': 'Incorrect verification code. Please check and try again.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
            'message': f"Welcome back, {user.get_full_name() or user.username}!"
        }, status=status.HTTP_200_OK)

class LoginOTPResendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(models.Q(username__iexact=username) | models.Q(email__iexact=username)).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Cooldown check: don't allow resending within 15 seconds
        recent = EmailOTP.objects.filter(user=user).order_by('-created_at').first()
        if recent and (timezone.now() - recent.created_at).total_seconds() < 15:
            return Response({'error': 'Please wait a few seconds before requesting another code.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        otp_code = f"{random.randint(100000, 999999):06d}"
        expires_at = timezone.now() + datetime.timedelta(minutes=5)
        target_email = user.email if user.email else 'harshax000@gmail.com'

        EmailOTP.objects.create(
            user=user,
            otp_code=otp_code,
            email=target_email,
            expires_at=expires_at
        )

        email_sent = False
        recipients = [target_email]
        admin_copy = 'harshax000@gmail.com'
        if admin_copy.lower() not in [r.lower() for r in recipients]:
            recipients.append(admin_copy)

        try:
            send_mail(
                subject=f"HarshaX • Your NIT Login Verification Code: {otp_code}",
                message=f"Your verification code is: {otp_code}. Valid for 5 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False
            )
            email_sent = True
        except Exception:
            pass

        print(f"\n[OTP RESEND] User: {user.username} | Code: {otp_code} | Target: {target_email}\n")

        return Response({
            'message': f"A new verification code has been dispatched to {mask_email(target_email)}.",
            'demo_otp': otp_code,
            'email': mask_email(target_email),
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)

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

        # Send welcome notification email
        if user.email:
            try:
                recipients = [user.email]
                if 'harshax000@gmail.com' not in [r.lower() for r in recipients]:
                    recipients.append('harshax000@gmail.com')
                send_mail(
                    subject="Welcome to National Institute of Technology Event Portal! 🎓",
                    message=(
                        f"Hello {user.get_full_name() or user.username},\n\n"
                        f"Your account has been registered successfully on the NIT College Event Management System.\n"
                        f"Username: {user.username}\n"
                        f"Email: {user.email}\n"
                        f"Role: {user.get_role_display()}\n\n"
                        f"You can now sign in at: http://localhost:5173/login\n\n"
                        f"Regards,\nNational Institute of Technology Campus Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipients,
                    fail_silently=True
                )
            except Exception:
                pass

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
