from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import EventRegistration, SavedEvent
from .serializers import EventRegistrationSerializer, SavedEventSerializer
from events.models import Event
from notifications.models import Notification

class EventRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        scope = self.request.query_params.get('scope')

        if (user.role == 'ADMIN' or user.is_superuser) and scope == 'admin':
            qs = EventRegistration.objects.all()
            if event_id:
                qs = qs.filter(event_id=event_id)
            return qs.select_related('event', 'user', 'event__venue', 'event__category')

        if (user.role in ['ORGANIZER', 'ADMIN']) and scope == 'organizer':
            qs = EventRegistration.objects.filter(event__organizer=user)
            if event_id:
                qs = qs.filter(event_id=event_id)
            return qs.select_related('event', 'user', 'event__venue', 'event__category')

        # Default: current student's registrations
        return EventRegistration.objects.filter(user=user).select_related('event', 'user', 'event__venue', 'event__category')

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event') or request.data.get('event_id')
        if not event_id:
            return Response({'error': 'Event ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        try:
            with transaction.atomic():
                # Lock the event row for thread-safe capacity check
                event = Event.objects.select_for_update().get(id=event_id)

                # 1. Check event status
                if event.status != 'PUBLISHED':
                    return Response({'error': 'Registrations are not open for this event.'}, status=status.HTTP_400_BAD_REQUEST)

                # 2. Check deadline
                if timezone.now() > event.registration_deadline:
                    return Response({'error': 'Registration deadline for this event has passed.'}, status=status.HTTP_400_BAD_REQUEST)

                # 3. Check duplicate registration
                if EventRegistration.objects.filter(event=event, user=user, status='CONFIRMED').exists():
                    return Response({'error': 'You are already registered for this event! Check your tickets in dashboard.'}, status=status.HTTP_400_BAD_REQUEST)

                # 4. Check capacity
                current_count = EventRegistration.objects.filter(event=event, status='CONFIRMED').count()
                if current_count >= event.max_participants:
                    return Response({'error': 'This event has reached full participant capacity.'}, status=status.HTTP_400_BAD_REQUEST)

                # 5. Check payment requirement for paid events
                fee = float(event.registration_fee or 0)
                if fee > 0:
                    payment_token = (
                        request.data.get('payment_token')
                        or request.data.get('payment_reference')
                        or request.data.get('transaction_id')
                    )
                    if not payment_token or not str(payment_token).strip():
                        return Response({
                            'error': f'Payment required: This event requires a registration fee of ₹{fee:.2f}. Please complete payment to confirm registration.',
                            'registration_fee': f'{fee:.2f}',
                            'requires_payment': True
                        }, status=status.HTTP_400_BAD_REQUEST)
                    payment_status = 'PAID'
                    payment_reference = str(payment_token).strip()
                else:
                    payment_status = 'FREE'
                    payment_reference = 'FREE_REGISTRATION'

                # 6. Create Registration (QR is generated automatically in model save)
                registration = EventRegistration.objects.create(
                    event=event,
                    user=user,
                    status='CONFIRMED',
                    payment_status=payment_status,
                    payment_reference=payment_reference
                )

                # 7. Create confirmation notification
                if fee > 0:
                    notif_msg = f"You are successfully registered for '{event.title}'. Payment of ₹{fee:.2f} confirmed (Ref: {payment_reference}). Your digital ticket is ready with QR code."
                else:
                    notif_msg = f"You are successfully registered for '{event.title}'. Your digital ticket is ready with QR code."

                Notification.objects.create(
                    user=user,
                    title="Registration Confirmed! 🎟️",
                    message=notif_msg,
                    category='REGISTRATION',
                    link="/tickets"
                )

                serializer = self.get_serializer(registration)
                return Response({
                    'message': f"Successfully registered for '{event.title}'!",
                    'registration': serializer.data
                }, status=status.HTTP_201_CREATED)

        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Failed to register: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        if registration.status == 'CANCELLED':
            return Response({'message': 'Registration is already cancelled.'})
        registration.status = 'CANCELLED'
        registration.save()
        return Response({'message': 'Registration successfully cancelled.'})

class SavedEventViewSet(viewsets.ModelViewSet):
    serializer_class = SavedEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedEvent.objects.filter(user=self.request.user).select_related('event', 'event__venue', 'event__category')
