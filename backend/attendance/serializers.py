from rest_framework import serializers
from .models import Attendance
from registrations.serializers import EventRegistrationSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    registration_id = serializers.ReadOnlyField(source='registration.registration_id')
    student_name = serializers.ReadOnlyField(source='registration.user.get_full_name')
    student_roll = serializers.SerializerMethodField()
    event_title = serializers.ReadOnlyField(source='registration.event.title')
    event_id = serializers.ReadOnlyField(source='registration.event.id')
    verified_by_name = serializers.ReadOnlyField(source='verified_by.get_full_name')

    class Meta:
        model = Attendance
        fields = [
            'id', 'registration', 'registration_id', 'student_name', 'student_roll',
            'event_id', 'event_title', 'verified_by', 'verified_by_name',
            'scanned_at', 'method'
        ]
        read_only_fields = ['id', 'verified_by', 'scanned_at']

    def get_student_roll(self, obj):
        if hasattr(obj.registration.user, 'student_profile'):
            return obj.registration.user.student_profile.roll_number
        return ''
