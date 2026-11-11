from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from events.models import Event, EventCategory, EventApproval, ActivityLog
from clubs.models import Club, ClubMembership
from registrations.models import EventRegistration, SavedEvent
from attendance.models import Attendance
from certificates.models import Certificate
from budgets.models import Budget, Expense, Sponsorship
from accounts.permissions import IsOrganizerUserRole, IsAdminUserRole

User = get_user_model()

class PublicPlatformStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total_events = Event.objects.filter(status__in=['PUBLISHED', 'COMPLETED']).count()
        total_clubs = Club.objects.filter(is_active=True).count()
        total_students = User.objects.filter(role='STUDENT').count()
        total_competitions = Event.objects.filter(
            Q(category__name__icontains='Hackathon') |
            Q(category__name__icontains='Competition') |
            Q(title__icontains='Competition') |
            Q(title__icontains='Hackathon')
        ).count()
        total_registrations = EventRegistration.objects.filter(status='CONFIRMED').count()

        return Response({
            'total_events': total_events,
            'total_clubs': total_clubs,
            'total_students': total_students,
            'total_competitions': total_competitions,
            'total_registrations': total_registrations,
        })

class StudentDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        total_registrations = EventRegistration.objects.filter(user=user, status='CONFIRMED').count()
        upcoming_events_count = EventRegistration.objects.filter(
            user=user,
            status='CONFIRMED',
            event__start_date__gte=today
        ).count()
        events_attended_count = Attendance.objects.filter(registration__user=user).count()
        certificates_earned_count = Certificate.objects.filter(user=user).count()
        saved_events_count = SavedEvent.objects.filter(user=user).count()
        clubs_joined_count = ClubMembership.objects.filter(user=user).count()

        # Upcoming 3 registered events
        upcoming_registrations = EventRegistration.objects.filter(
            user=user,
            status='CONFIRMED',
            event__start_date__gte=today
        ).select_related('event', 'event__venue', 'event__category').order_by('event__start_date')[:4]

        from registrations.serializers import EventRegistrationSerializer
        recent_regs_data = EventRegistrationSerializer(upcoming_registrations, many=True).data

        return Response({
            'stats': {
                'total_registrations': total_registrations,
                'upcoming_events': upcoming_events_count,
                'events_attended': events_attended_count,
                'certificates_earned': certificates_earned_count,
                'saved_events': saved_events_count,
                'clubs_joined': clubs_joined_count,
            },
            'upcoming_registrations': recent_regs_data,
        })

class OrganizerDashboardStatsView(APIView):
    permission_classes = [IsOrganizerUserRole]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Filter events for this organizer (or all for admin)
        events_qs = Event.objects.all() if (user.role == 'ADMIN' or user.is_superuser) else Event.objects.filter(organizer=user)

        total_events = events_qs.count()
        published_events = events_qs.filter(status='PUBLISHED').count()
        upcoming_events = events_qs.filter(status='PUBLISHED', start_date__gte=today).count()
        completed_events = events_qs.filter(status='COMPLETED').count()

        registrations_qs = EventRegistration.objects.filter(event__in=events_qs, status='CONFIRMED')
        total_registrations = registrations_qs.count()

        attendance_qs = Attendance.objects.filter(registration__event__in=events_qs)
        total_attendance = attendance_qs.count()

        # Budget summary
        budgets_qs = Budget.objects.filter(event__in=events_qs)
        total_budget_approved = budgets_qs.aggregate(Sum('approved_budget'))['approved_budget__sum'] or 0.0
        total_expenses = Expense.objects.filter(budget__in=budgets_qs).aggregate(Sum('amount'))['amount__sum'] or 0.0

        # Registration trends by event (top 6)
        event_trends = []
        for ev in events_qs.filter(status__in=['PUBLISHED', 'COMPLETED'])[:6]:
            reg_c = ev.registrations.filter(status='CONFIRMED').count()
            att_c = Attendance.objects.filter(registration__event=ev).count()
            event_trends.append({
                'name': ev.title[:16] + ('...' if len(ev.title) > 16 else ''),
                'registrations': reg_c,
                'attendance': att_c,
                'capacity': ev.max_participants
            })

        # Category distribution
        category_distribution = EventCategory.objects.annotate(
            event_count=Count('events', filter=Q(events__in=events_qs))
        ).values('name', 'event_count')

        return Response({
            'stats': {
                'total_events': total_events,
                'published_events': published_events,
                'upcoming_events': upcoming_events,
                'completed_events': completed_events,
                'total_registrations': total_registrations,
                'total_attendance': total_attendance,
                'total_budget': float(total_budget_approved),
                'total_expenses': float(total_expenses),
            },
            'event_trends': event_trends,
            'category_distribution': list(category_distribution),
        })

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        today = timezone.now().date()

        total_students = User.objects.filter(role='STUDENT').count()
        total_organizers = User.objects.filter(role='ORGANIZER').count()
        total_clubs = Club.objects.count()
        total_events = Event.objects.count()
        pending_approvals = EventApproval.objects.filter(status='PENDING_APPROVAL').count()
        completed_events = Event.objects.filter(status='COMPLETED').count()
        total_registrations = EventRegistration.objects.filter(status='CONFIRMED').count()
        total_attendance = Attendance.objects.count()

        # Pending approval events list
        pending_events_qs = Event.objects.filter(status='PENDING_APPROVAL').select_related('organizer', 'category', 'venue')[:10]
        from events.serializers import EventListSerializer
        pending_events_data = EventListSerializer(pending_events_qs, many=True).data

        # Pending organizer registrations awaiting review
        pending_organizers_qs = User.objects.filter(role=User.ORGANIZER, is_approved=False).select_related('organizer_profile', 'organizer_profile__department')
        pending_organizers_count = pending_organizers_qs.count()
        from accounts.serializers import UserSerializer
        pending_organizers_data = UserSerializer(pending_organizers_qs[:20], many=True, context={'request': request}).data

        # Category analytics
        category_stats = EventCategory.objects.annotate(
            total_events=Count('events')
        ).values('name', 'total_events')

        # Recent activities
        recent_logs = ActivityLog.objects.select_related('user')[:10]
        from events.serializers import ActivityLogSerializer
        logs_data = ActivityLogSerializer(recent_logs, many=True).data

        return Response({
            'stats': {
                'total_students': total_students,
                'total_organizers': total_organizers,
                'total_clubs': total_clubs,
                'total_events': total_events,
                'pending_approvals': pending_approvals,
                'pending_organizers_count': pending_organizers_count,
                'completed_events': completed_events,
                'total_registrations': total_registrations,
                'total_attendance': total_attendance,
            },
            'pending_events': pending_events_data,
            'pending_organizers': pending_organizers_data,
            'category_stats': list(category_stats),
            'recent_logs': logs_data,
        })
