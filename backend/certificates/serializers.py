from rest_framework import serializers
from .models import Certificate

class CertificateSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    event_category = serializers.ReadOnlyField(source='event.category.name')
    event_date = serializers.ReadOnlyField(source='event.start_date')
    recipient_email = serializers.ReadOnlyField(source='user.email')
    type_display = serializers.CharField(source='get_certificate_type_display', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_id', 'event', 'event_title', 'event_category', 'event_date',
            'user', 'recipient_name', 'recipient_email', 'certificate_type', 'type_display',
            'title', 'position_rank', 'issue_date', 'qr_verification_code', 'pdf_file',
            'created_at'
        ]
        read_only_fields = ['id', 'certificate_id', 'qr_verification_code', 'created_at']
