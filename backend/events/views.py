from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import EventCategory, Venue, Event, EventSchedule, EventApproval, ActivityLog
from .serializers import (
    EventCategorySerializer, VenueSerializer, EventListSerializer,
    EventDetailSerializer, EventCreateUpdateSerializer, EventScheduleSerializer,
    EventApprovalSerializer, ActivityLogSerializer
)
from registrations.models import SavedEvent
from accounts.permissions import IsOrganizerUserRole, IsAdminUserRole

class EventCategoryViewSet(viewsets.ModelViewSet):
    queryset = EventCategory.objects.all().order_by('name')
    serializer_class = EventCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.filter(is_active=True).order_by('name')
    serializer_class = VenueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class EventViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'short_description', 'venue__name', 'category__name', 'club__name']
    ordering_fields = ['start_date', 'created_at', 'title', 'max_participants']
    ordering = ['start_date']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsOrganizerUserRole()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOrganizerUserRole()]
        return super().get_permissions()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if self.action in ['update', 'partial_update', 'destroy']:
            # Admin can edit/delete anything; Organizer can edit/delete their own event
            if request.user.role == 'ADMIN' or request.user.is_superuser:
                return
            if obj.organizer != request.user:
                self.permission_denied(request, message="You do not have permission to edit this event.")

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.all().select_related('category', 'venue', 'club', 'organizer').annotate(
            annotated_registered_count=Count('registrations', filter=Q(registrations__status='CONFIRMED'))
        )

        # Non-admins and non-organizers only see PUBLISHED events in general list
        scope = self.request.query_params.get('scope')
        category_id = self.request.query_params.get('category')
        club_id = self.request.query_params.get('club')
        venue_id = self.request.query_params.get('venue')
        timeframe = self.request.query_params.get('timeframe') # upcoming, past, today

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)

        today = timezone.now().date()
        if timeframe == 'upcoming':
            queryset = queryset.filter(start_date__gt=today).exclude(status__in=['COMPLETED', 'CANCELLED'])
        elif timeframe == 'ongoing':
            queryset = queryset.filter(start_date__lte=today, end_date__gte=today).exclude(status__in=['COMPLETED', 'CANCELLED'])
        elif timeframe in ['completed', 'past']:
            queryset = queryset.filter(Q(end_date__lt=today) | Q(status='COMPLETED')).exclude(status='CANCELLED')
        elif timeframe == 'today':
            queryset = queryset.filter(start_date__lte=today, end_date__gte=today).exclude(status='CANCELLED')

        if scope == 'organizer' and user.is_authenticated:
            # Events created by this organizer
            return queryset.filter(organizer=user).order_by('-created_at')
        elif scope == 'admin' and user.is_authenticated and (user.role == 'ADMIN' or user.is_superuser):
            # Admin sees everything
            status_param = self.request.query_params.get('status')
            if status_param:
                queryset = queryset.filter(status=status_param)
            return queryset.order_by('-created_at')

        # For any detail action (retrieve, submit_for_approval, approve, reject, etc.), allow all events
        if getattr(self, 'detail', False) or self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'submit_for_approval', 'approve', 'reject', 'save_toggle']:
            return queryset

        if timeframe in ['completed', 'past']:
            return queryset.filter(status__in=['PUBLISHED', 'COMPLETED']).order_by('-start_date')
        elif timeframe in ['upcoming', 'ongoing', 'today']:
            return queryset.filter(status='PUBLISHED').order_by('start_date')

        return queryset.filter(status__in=['PUBLISHED', 'COMPLETED']).order_by('start_date')

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'retrieve':
            return EventDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        event = serializer.save(organizer=user)
        # If created as PENDING_APPROVAL or SUBMITTED, create approval entry
        if event.status in ['PENDING_APPROVAL', 'SUBMITTED']:
            EventApproval.objects.create(event=event, status='PENDING_APPROVAL')
        
        # Log activity
        ActivityLog.objects.create(
            user=user,
            action=f"Created Event: {event.title}",
            details=f"Status: {event.status}, Venue: {event.venue.name if event.venue else 'None'}"
        )

    def perform_update(self, serializer):
        user = self.request.user
        event = serializer.save()
        if event.status in ['PENDING_APPROVAL', 'SUBMITTED']:
            approval, _ = EventApproval.objects.get_or_create(event=event)
            approval.status = 'PENDING_APPROVAL'
            approval.save()

        ActivityLog.objects.create(
            user=user,
            action=f"Updated Event: {event.title}",
            details=f"Status: {event.status}"
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def featured(self, request):
        featured_events = Event.objects.filter(status='PUBLISHED', is_featured=True).order_by('start_date')[:6]
        serializer = EventListSerializer(featured_events, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def calendar(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        events = Event.objects.filter(status='PUBLISHED')
        if year:
            events = events.filter(start_date__year=year)
        if month:
            events = events.filter(start_date__month=month)
        serializer = EventListSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_toggle(self, request, id=None):
        event = self.get_object()
        saved = SavedEvent.objects.filter(user=request.user, event=event)
        if saved.exists():
            saved.delete()
            return Response({'message': 'Event removed from saved list', 'is_saved': False})
        else:
            SavedEvent.objects.create(user=request.user, event=event)
            return Response({'message': 'Event saved to your bookmarks!', 'is_saved': True})

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerUserRole])
    def submit_for_approval(self, request, id=None):
        event = self.get_object()
        event.status = 'PENDING_APPROVAL'
        event.save()
        approval, _ = EventApproval.objects.get_or_create(event=event)
        approval.status = 'PENDING_APPROVAL'
        approval.save()
        ActivityLog.objects.create(
            user=request.user,
            action=f"Submitted Event for Approval: {event.title}"
        )
        return Response({'message': 'Event submitted for admin approval!', 'status': event.status})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def approve(self, request, id=None):
        event = self.get_object()
        event.status = 'PUBLISHED'
        event.save()
        approval, _ = EventApproval.objects.get_or_create(event=event)
        approval.status = 'APPROVED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save()
        
        # Notify the organizer
        from notifications.models import Notification
        Notification.objects.create(
            user=event.organizer,
            title="Event Approved! 🎉",
            message=f"Your event '{event.title}' has been approved and published to HarshaX.",
            category='EVENT',
            link=f"/events/{event.id}"
        )

        ActivityLog.objects.create(
            user=request.user,
            action=f"Approved Event: {event.title}"
        )
        return Response({'message': f"Event '{event.title}' has been approved and published!"})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def reject(self, request, id=None):
        event = self.get_object()
        reason = request.data.get('reason', 'Event does not meet campus guidelines.')
        event.status = 'REJECTED'
        event.save()
        approval, _ = EventApproval.objects.get_or_create(event=event)
        approval.status = 'REJECTED'
        approval.rejection_reason = reason
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save()

        # Notify organizer
        from notifications.models import Notification
        Notification.objects.create(
            user=event.organizer,
            title="Event Revision Required ⚠️",
            message=f"Your event '{event.title}' was rejected. Reason: {reason}",
            category='EVENT',
            link=f"/organizer/events"
        )

        ActivityLog.objects.create(
            user=request.user,
            action=f"Rejected Event: {event.title}",
            details=f"Reason: {reason}"
        )
        return Response({'message': f"Event '{event.title}' has been rejected."})

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUserRole]
