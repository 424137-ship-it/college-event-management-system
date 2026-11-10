from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, Announcement

User = get_user_model()

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.get_full_name')
    club_name = serializers.ReadOnlyField(source='club.name')

    class Meta:
        model = Announcement
        fields = ['id', 'club', 'club_name', 'author', 'author_name', 'title', 'content', 'is_pinned', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

class ClubMembershipSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    full_name = serializers.ReadOnlyField(source='user.get_full_name')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = ClubMembership
        fields = ['id', 'club', 'user', 'username', 'full_name', 'email', 'role', 'joined_at']
        read_only_fields = ['id', 'user', 'joined_at']

class ClubSerializer(serializers.ModelSerializer):
    president_name = serializers.ReadOnlyField(source='president.get_full_name')
    joint_secretary_name = serializers.ReadOnlyField(source='joint_secretary.get_full_name')
    faculty_coordinator_name = serializers.ReadOnlyField(source='faculty_coordinator.name')
    members_count = serializers.SerializerMethodField()
    upcoming_events_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = [
            'id', 'name', 'slug', 'tagline', 'description', 'category',
            'logo', 'cover_image', 'logo_url', 'cover_url',
            'president', 'president_name', 'joint_secretary', 'joint_secretary_name',
            'faculty_coordinator', 'faculty_coordinator_name',
            'is_active', 'members_count', 'upcoming_events_count', 'is_joined',
            'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_upcoming_events_count(self, obj):
        from django.utils import timezone
        return obj.events.filter(status='PUBLISHED', start_date__gte=timezone.now().date()).count()

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False
