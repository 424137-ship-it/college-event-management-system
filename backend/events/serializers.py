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
            'requires_approval', 'status', 'is_featured', 'registered_count', 'is_registration_open',
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
            return obj.registrations.filter(user=request.user, status__in=['CONFIRMED', 'PENDING']).exists()
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
    registration_status = serializers.SerializerMethodField()
    user_ticket = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'club', 'club_name',
            'venue', 'venue_name', 'venue_details', 'organizer', 'organizer_name',
            'description', 'short_description', 'poster', 'poster_url',
            'start_date', 'end_date', 'start_time', 'end_time',
            'registration_deadline', 'max_participants', 'registration_fee',
            'requires_approval', 'eligibility', 'rules', 'faculty_coordinator',
            'student_coordinator_name', 'student_coordinator_contact', 'contact_email',
            'status', 'is_featured', 'schedules', 'approval', 'registered_count',
            'is_registration_open', 'is_saved', 'is_registered', 'registration_status',
            'user_ticket', 'created_at', 'updated_at'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(user=request.user).exists()
        return False

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user, status__in=['CONFIRMED', 'PENDING']).exists()
        return False

    def get_registration_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reg = obj.registrations.filter(user=request.user).first()
            if reg:
                return reg.status
        return None

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
                    qr.add_data(f"NIT_TICKET:{reg.registration_id}")
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

    def validate(self, data):
        start_date = data.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = data.get('end_date') or (self.instance.end_date if self.instance else None)
        start_time = data.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = data.get('end_time') or (self.instance.end_time if self.instance else None)
        deadline = data.get('registration_deadline') or (self.instance.registration_deadline if self.instance else None)
        max_p = data.get('max_participants') if 'max_participants' in data else (self.instance.max_participants if self.instance else 100)
        fee = data.get('registration_fee') if 'registration_fee' in data else (self.instance.registration_fee if self.instance else 0)
        venue = data.get('venue') or (self.instance.venue if self.instance else None)

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be earlier than start date.'})

        if start_date and end_date and start_date == end_date and start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({'end_time': 'End time must be after start time on the same date.'})

        if deadline and end_date and deadline.date() > end_date:
            raise serializers.ValidationError({'registration_deadline': 'Registration deadline cannot be after the event end date.'})

        if max_p is not None and max_p <= 0:
            raise serializers.ValidationError({'max_participants': 'Max participants capacity must be greater than zero.'})

        if fee is not None and fee < 0:
            raise serializers.ValidationError({'registration_fee': 'Registration fee cannot be negative.'})

        # Overlapping venue reservation check
        if venue and start_date and end_date and start_time and end_time:
            overlapping = Event.objects.filter(
                venue=venue,
                status__in=['APPROVED', 'PUBLISHED'],
                start_date__lte=end_date,
                end_date__gte=start_date,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            if overlapping.exists():
                conflict = overlapping.first()
                raise serializers.ValidationError({
                    'venue': f"Venue conflict: '{venue.name}' is already reserved for '{conflict.title}' during this time."
                })

        return data
