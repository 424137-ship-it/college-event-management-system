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
        status_param = self.request.query_params.get('status')

        # Allow detail actions to locate the registration before checking permission
        if self.action in ['approve', 'reject', 'cancel']:
            return EventRegistration.objects.all().select_related('event', 'user', 'event__venue')

        if (user.role == 'ADMIN' or user.is_superuser) and scope == 'admin':
            qs = EventRegistration.objects.all()
            if event_id:
                qs = qs.filter(event_id=event_id)
            if status_param:
                qs = qs.filter(status=status_param)
            return qs.select_related('event', 'user', 'event__venue', 'event__category')

        if (user.role in ['ORGANIZER', 'ADMIN']) and scope == 'organizer':
            qs = EventRegistration.objects.filter(event__organizer=user)
            if event_id:
                qs = qs.filter(event_id=event_id)
            if status_param:
                qs = qs.filter(status=status_param)
            return qs.select_related('event', 'user', 'event__venue', 'event__category')

        # Default: current student's registrations
        qs = EventRegistration.objects.filter(user=user)
        if event_id:
            qs = qs.filter(event_id=event_id)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.select_related('event', 'user', 'event__venue', 'event__category')

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
                existing_reg = EventRegistration.objects.filter(event=event, user=user).first()
                if existing_reg:
                    if existing_reg.status == 'CONFIRMED':
                        return Response({'error': 'You are already registered for this event! Check your tickets in dashboard.'}, status=status.HTTP_400_BAD_REQUEST)
                    elif existing_reg.status == 'PENDING':
                        return Response({'error': 'Your registration request is currently pending organizer approval.'}, status=status.HTTP_400_BAD_REQUEST)

                # 4. Check capacity (only count confirmed participants against capacity)
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

                # 6. Determine registration status based on event.requires_approval
                if event.requires_approval:
                    reg_status = 'PENDING'
                else:
                    reg_status = 'CONFIRMED'

                if existing_reg and existing_reg.status in ['CANCELLED', 'REJECTED']:
                    registration = existing_reg
                    registration.status = reg_status
                    registration.payment_status = payment_status
                    registration.payment_reference = payment_reference
                    registration.save()
                else:
                    registration = EventRegistration.objects.create(
                        event=event,
                        user=user,
                        status=reg_status,
                        payment_status=payment_status,
                        payment_reference=payment_reference
                    )

                # 7. Create notifications
                if reg_status == 'PENDING':
                    # Student notification
                    Notification.objects.create(
                        user=user,
                        title="Registration Under Review ⏳",
                        message=f"Your registration for '{event.title}' has been submitted and is awaiting organizer approval.",
                        category='REGISTRATION',
                        link=f"/events/{event.id}"
                    )
                    # Organizer notification
                    if event.organizer and event.organizer != user:
                        Notification.objects.create(
                            user=event.organizer,
                            title="New Attendee Application 📋",
                            message=f"{user.get_full_name() or user.username} has applied to register for '{event.title}'. Please review in Attendee Approvals.",
                            category='REGISTRATION',
                            link="/dashboard"
                        )
                    message_text = f"Registration submitted! '{event.title}' requires organizer approval. You will receive your pass upon review."
                else:
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
                    message_text = f"Successfully registered for '{event.title}'!"

                serializer = self.get_serializer(registration)
                return Response({
                    'message': message_text,
                    'registration': serializer.data,
                    'requires_approval': event.requires_approval,
                    'status': reg_status,
                }, status=status.HTTP_201_CREATED)

        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Failed to register: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        registration = self.get_object()
        user = request.user

        # Ensure only the event's organizer or an admin can approve
        if not (user == registration.event.organizer or user.role == 'ADMIN' or user.is_superuser):
            return Response({'error': 'You do not have permission to approve registrations for this event.'}, status=status.HTTP_403_FORBIDDEN)

        # Capacity check
        confirmed_count = EventRegistration.objects.filter(event=registration.event, status='CONFIRMED').count()
        if confirmed_count >= registration.event.max_participants:
            return Response({'error': 'Cannot approve: Event has already reached maximum participant capacity.'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = 'CONFIRMED'
        registration.save()

        # Notify student
        Notification.objects.create(
            user=registration.user,
            title="Registration Approved! 🎉",
            message=f"Great news! Your registration for '{registration.event.title}' has been approved by the organizer. Your official NIT QR ticket is now active.",
            category='REGISTRATION',
            link="/tickets"
        )

        serializer = self.get_serializer(registration)
        return Response({
            'message': f"Registration for {registration.user.get_full_name() or registration.user.username} successfully approved!",
            'registration': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        registration = self.get_object()
        user = request.user

        # Ensure only the event's organizer or an admin can reject
        if not (user == registration.event.organizer or user.role == 'ADMIN' or user.is_superuser):
            return Response({'error': 'You do not have permission to reject registrations for this event.'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', '').strip()
        registration.status = 'REJECTED'
        registration.save()

        # Notify student
        reason_note = f" Reason: {reason}" if reason else ""
        Notification.objects.create(
            user=registration.user,
            title="Registration Update ⚠️",
            message=f"Your registration application for '{registration.event.title}' was not approved.{reason_note}",
            category='REGISTRATION',
            link=f"/events/{registration.event.id}"
        )

        serializer = self.get_serializer(registration)
        return Response({
            'message': f"Registration for {registration.user.get_full_name() or registration.user.username} rejected.",
            'registration': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        user = request.user

        # Ensure only the attendee themselves or an admin can cancel
        if not (registration.user == user or user.role == 'ADMIN' or user.is_superuser):
            return Response({'error': 'You do not have permission to cancel this registration.'}, status=status.HTTP_403_FORBIDDEN)

        if registration.status == 'CANCELLED':
            return Response({'message': 'Registration is already cancelled.', 'status': 'CANCELLED'})

        event_title = registration.event.title
        registration.status = 'CANCELLED'
        registration.save()

        # Notify student
        Notification.objects.create(
            user=registration.user,
            title="Registration Cancelled ❌",
            message=f"Your registration for '{event_title}' has been successfully cancelled. Your seat has been released.",
            category='REGISTRATION',
            link=f"/events/{registration.event.id}"
        )

        return Response({
            'message': f"Registration for '{event_title}' successfully cancelled.",
            'registration_id': registration.id,
            'status': 'CANCELLED'
        })

    @action(detail=False, methods=['post'], url_path='cancel_by_event')
    def cancel_by_event(self, request):
        event_id = request.data.get('event_id') or request.data.get('event')
        if not event_id:
            return Response({'error': 'Event ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        registration = EventRegistration.objects.filter(
            event_id=event_id,
            user=request.user,
            status__in=['CONFIRMED', 'PENDING']
        ).first()

        if not registration:
            return Response({'error': 'No active registration found for this event.'}, status=status.HTTP_404_NOT_FOUND)

        event_title = registration.event.title
        registration.status = 'CANCELLED'
        registration.save()

        # Send notification to student
        Notification.objects.create(
            user=request.user,
            title="Registration Cancelled ❌",
            message=f"You have successfully unregistered from '{event_title}'. Your reserved seat has been released.",
            category='REGISTRATION',
            link=f"/events/{event_id}"
        )

        return Response({
            'message': f"You have successfully unregistered from '{event_title}'.",
            'registration_id': registration.id,
            'status': 'CANCELLED'
        }, status=status.HTTP_200_OK)

class SavedEventViewSet(viewsets.ModelViewSet):
    serializer_class = SavedEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedEvent.objects.filter(user=self.request.user).select_related('event', 'event__venue', 'event__category')
