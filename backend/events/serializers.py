from rest_framework import serializers
from .models import EventCategory, Venue, Event, EventSchedule, EventApproval, ActivityLog
from accounts.serializers import UserSerializer

class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = '__all__'

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'

class EventScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventSchedule
        fields = '__all__'

class EventApprovalSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.ReadOnlyField(source='reviewed_by.get_full_name')

    class Meta:
        model = EventApproval
        fields = '__all__'

class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ActivityLog
        fields = '__all__'

class EventListSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    venue_name = serializers.ReadOnlyField(source='venue.name')
    club_name = serializers.ReadOnlyField(source='club.name')
    organizer_name = serializers.ReadOnlyField(source='organizer.get_full_name')
    registered_count = serializers.IntegerField(read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'club', 'club_name',
            'venue', 'venue_name', 'organizer', 'organizer_name',
            'short_description', 'poster', 'poster_url',
            'start_date', 'end_date', 'start_time', 'end_time',
            'registration_deadline', 'max_participants', 'registration_fee',
            'status', 'is_featured', 'registered_count', 'is_registration_open',
            'is_saved', 'is_registered', 'created_at'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(user=request.user).exists()
        return False

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user, status='CONFIRMED').exists()
        return False

class EventDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    venue_name = serializers.ReadOnlyField(source='venue.name')
    venue_details = VenueSerializer(source='venue', read_only=True)
    club_name = serializers.ReadOnlyField(source='club.name')
    organizer_name = serializers.ReadOnlyField(source='organizer.get_full_name')
    schedules = EventScheduleSerializer(many=True, read_only=True)
    approval = EventApprovalSerializer(read_only=True)
    registered_count = serializers.IntegerField(read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    user_ticket = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'club', 'club_name',
            'venue', 'venue_name', 'venue_details', 'organizer', 'organizer_name',
            'description', 'short_description', 'poster', 'poster_url',
            'start_date', 'end_date', 'start_time', 'end_time',
            'registration_deadline', 'max_participants', 'registration_fee',
            'eligibility', 'rules', 'faculty_coordinator', 'student_coordinator_name',
            'student_coordinator_contact', 'contact_email', 'status', 'is_featured',
            'schedules', 'approval', 'registered_count', 'is_registration_open',
            'is_saved', 'is_registered', 'user_ticket', 'created_at', 'updated_at'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(user=request.user).exists()
        return False

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user, status='CONFIRMED').exists()
        return False

    def get_user_ticket(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reg = obj.registrations.filter(user=request.user, status='CONFIRMED').first()
            if reg:
                qr_data_url = ""
                try:
                    import qrcode, base64
                    from io import BytesIO
                    qr = qrcode.QRCode(version=1, box_size=8, border=2)
                    qr.add_data(f"CAMPUSX_TICKET:{reg.registration_id}")
                    qr.make(fit=True)
                    img = qr.make_image(fill_color="#17152B", back_color="#FFFFFF")
                    buf = BytesIO()
                    img.save(buf, format='PNG')
                    qr_data_url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')
                except Exception:
                    pass

                return {
                    'registration_id': reg.registration_id,
                    'registered_at': reg.registered_at,
                    'status': reg.status,
                    'qr_code': reg.qr_code.url if reg.qr_code else None,
                    'qr_code_data_url': qr_data_url,
                }
        return None

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['id', 'slug', 'organizer', 'created_at', 'updated_at']
