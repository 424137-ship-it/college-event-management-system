from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from events.models import Event, EventCategory, Venue
from registrations.models import EventRegistration

User = get_user_model()

class EventRegistrationPaymentTests(APITestCase):
    def setUp(self):
        # Create organizer and student
        self.organizer = User.objects.create_user(
            username='org_user',
            email='org@nit.ac.in',
            password='TestPassword123!',
            role='ORGANIZER'
        )
        self.student = User.objects.create_user(
            username='student_user',
            email='student@nit.ac.in',
            password='TestPassword123!',
            role='STUDENT'
        )
        self.client.force_authenticate(user=self.student)

        self.category = EventCategory.objects.create(name='Technical')
        self.venue = Venue.objects.create(name='Dr. B.R. Ambedkar Auditorium', location='Campus Main Complex', capacity=500)

        # Free Event
        self.free_event = Event.objects.create(
            title='HackNIT Hackathon',
            organizer=self.organizer,
            category=self.category,
            venue=self.venue,
            description='NIT Annual Hackathon',
            start_date=timezone.now().date() + timedelta(days=5),
            end_date=timezone.now().date() + timedelta(days=6),
            start_time='09:00:00',
            end_time='18:00:00',
            registration_deadline=timezone.now() + timedelta(days=4),
            max_participants=200,
            registration_fee=Decimal('0.00'),
            status='PUBLISHED'
        )

        # Paid Event
        self.paid_event = Event.objects.create(
            title='National Robotics Workshop',
            organizer=self.organizer,
            category=self.category,
            venue=self.venue,
            description='Hands-on robotics workshop with kit',
            start_date=timezone.now().date() + timedelta(days=7),
            end_date=timezone.now().date() + timedelta(days=8),
            start_time='10:00:00',
            end_time='17:00:00',
            registration_deadline=timezone.now() + timedelta(days=5),
            max_participants=50,
            registration_fee=Decimal('350.00'),
            status='PUBLISHED'
        )

    def test_free_event_registration_succeeds_without_payment_token(self):
        """Free event should register successfully without any payment token."""
        response = self.client.post('/api/registrations/', {'event_id': self.free_event.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('registration', response.data)
        self.assertEqual(response.data['registration']['payment_status'], 'FREE')

        # Verify DB entry
        reg = EventRegistration.objects.get(event=self.free_event, user=self.student)
        self.assertEqual(reg.payment_status, 'FREE')
        self.assertEqual(reg.payment_reference, 'FREE_REGISTRATION')

    def test_paid_event_registration_fails_without_payment_token(self):
        """Paid event registration without payment token should return 400 Bad Request."""
        response = self.client.post('/api/registrations/', {'event_id': self.paid_event.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertTrue(response.data.get('requires_payment'))
        self.assertIn('350.00', response.data['error'])

        # Verify no registration was created
        self.assertFalse(EventRegistration.objects.filter(event=self.paid_event, user=self.student).exists())

    def test_paid_event_registration_succeeds_with_payment_token(self):
        """Paid event registration with valid payment token/reference should succeed."""
        tx_ref = 'UPI-NIT-20261111-998822'
        response = self.client.post('/api/registrations/', {
            'event_id': self.paid_event.id,
            'payment_token': tx_ref
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['registration']['payment_status'], 'PAID')
        self.assertEqual(response.data['registration']['payment_reference'], tx_ref)

        reg = EventRegistration.objects.get(event=self.paid_event, user=self.student)
        self.assertEqual(reg.payment_status, 'PAID')
        self.assertEqual(reg.payment_reference, tx_ref)

    def test_duplicate_registration_rejected(self):
        """Attempting to register twice for the same event should return 400."""
        self.client.post('/api/registrations/', {'event_id': self.free_event.id})
        response = self.client.post('/api/registrations/', {'event_id': self.free_event.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already registered', response.data['error'].lower())

    def test_requires_approval_flow(self):
        """Event with requires_approval=True should set status to PENDING until approved."""
        # Create approval-required event
        approval_event = Event.objects.create(
            title='NIT Competitive Coding Challenge',
            organizer=self.organizer,
            category=self.category,
            venue=self.venue,
            description='Screened competitive programming challenge',
            start_date=timezone.now().date() + timedelta(days=10),
            end_date=timezone.now().date() + timedelta(days=10),
            start_time='14:00:00',
            end_time='18:00:00',
            registration_deadline=timezone.now() + timedelta(days=9),
            max_participants=30,
            registration_fee=Decimal('0.00'),
            requires_approval=True,
            status='PUBLISHED'
        )

        # 1. Student registers
        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/registrations/', {'event_id': approval_event.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['registration']['status'], 'PENDING')
        reg_id = res.data['registration']['id']

        reg = EventRegistration.objects.get(id=reg_id)
        self.assertEqual(reg.status, 'PENDING')

        # 2. Random other student tries to approve -> 403 Forbidden
        other_student = User.objects.create_user(username='other_student', email='other@nit.ac.in', password='TestPassword123!', role='STUDENT')
        self.client.force_authenticate(user=other_student)
        approve_res_fail = self.client.post(f'/api/registrations/{reg_id}/approve/')
        self.assertEqual(approve_res_fail.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Organizer approves registration
        self.client.force_authenticate(user=self.organizer)
        approve_res = self.client.post(f'/api/registrations/{reg_id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_res.data['registration']['status'], 'CONFIRMED')

        reg.refresh_from_db()
        self.assertEqual(reg.status, 'CONFIRMED')

    def test_requires_approval_reject_flow(self):
        """Organizer can reject a pending attendee registration."""
        approval_event = Event.objects.create(
            title='NIT Paper Presentation 2026',
            organizer=self.organizer,
            category=self.category,
            venue=self.venue,
            description='Paper presentation track',
            start_date=timezone.now().date() + timedelta(days=12),
            end_date=timezone.now().date() + timedelta(days=12),
            start_time='10:00:00',
            end_time='16:00:00',
            registration_deadline=timezone.now() + timedelta(days=11),
            max_participants=20,
            requires_approval=True,
            status='PUBLISHED'
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/registrations/', {'event_id': approval_event.id})
        reg_id = res.data['registration']['id']

        # Organizer rejects with reason
        self.client.force_authenticate(user=self.organizer)
        reject_res = self.client.post(f'/api/registrations/{reg_id}/reject/', {'reason': 'Abstract does not match conference theme.'})
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        self.assertEqual(reject_res.data['registration']['status'], 'REJECTED')

        reg = EventRegistration.objects.get(id=reg_id)
        self.assertEqual(reg.status, 'REJECTED')
