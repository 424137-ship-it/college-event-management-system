import base64
import qrcode
import hmac
import hashlib
from io import BytesIO
from django.conf import settings
from rest_framework import serializers
from .models import EventRegistration, SavedEvent
from events.models import Event
from events.serializers import EventListSerializer

class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    event_start_date = serializers.ReadOnlyField(source='event.start_date')
    event_start_time = serializers.ReadOnlyField(source='event.start_time')
    venue_name = serializers.ReadOnlyField(source='event.venue.name')
    category_name = serializers.ReadOnlyField(source='event.category.name')
    poster_url = serializers.ReadOnlyField(source='event.poster_url')
    registration_fee = serializers.ReadOnlyField(source='event.registration_fee')
    user_full_name = serializers.ReadOnlyField(source='user.get_full_name')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_roll_number = serializers.SerializerMethodField()
    has_attended = serializers.SerializerMethodField()
    qr_code_data_url = serializers.SerializerMethodField()
    payment_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'registration_id', 'event', 'event_title', 'event_start_date', 'event_start_time',
            'venue_name', 'category_name', 'poster_url', 'registration_fee', 'user', 'user_full_name',
            'user_email', 'user_roll_number', 'status', 'payment_status', 'payment_reference',
            'payment_token', 'qr_code', 'qr_code_data_url', 'registered_at', 'has_attended'
        ]
        read_only_fields = ['id', 'registration_id', 'status', 'payment_status', 'payment_reference', 'qr_code', 'qr_code_data_url', 'registered_at']

    def get_user_roll_number(self, obj):
        if hasattr(obj.user, 'student_profile'):
            return obj.user.student_profile.roll_number
        return ''

    def get_has_attended(self, obj):
        return hasattr(obj, 'attendance')

    def get_qr_code_data_url(self, obj):
        try:
            secret = getattr(settings, 'SECRET_KEY', 'default-key').encode('utf-8')
            sig = hmac.new(secret, obj.registration_id.encode('utf-8'), hashlib.sha256).hexdigest()[:12]
            qr = qrcode.QRCode(version=1, box_size=8, border=2)
            ticket_data = f"NIT_TICKET:{obj.registration_id}:{sig}"
            qr.add_data(ticket_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#17152B", back_color="#FFFFFF")
            buf = BytesIO()
            img.save(buf, format='PNG')
            encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
            return f"data:image/png;base64,{encoded}"
        except Exception:
            return ""

class SavedEventSerializer(serializers.ModelSerializer):
    event_details = EventListSerializer(source='event', read_only=True)

    class Meta:
        model = SavedEvent
        fields = ['id', 'user', 'event', 'event_details', 'saved_at']
        read_only_fields = ['id', 'user', 'saved_at']
