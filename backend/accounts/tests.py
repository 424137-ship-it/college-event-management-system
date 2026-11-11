import datetime
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from events.models import EventCategory, Venue, Event, EventApproval
from clubs.models import Club, ClubMembership
from registrations.models import EventRegistration
from attendance.models import Attendance
from certificates.models import Certificate
from budgets.models import Budget, Expense

User = get_user_model()

class HarshaXComprehensiveIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        # Admin user
        self.admin = User.objects.create_superuser(
            username='test_admin', email='admin@test.com', password='password123', role='ADMIN'
        )

        # Organizer user
        self.organizer = User.objects.create_user(
            username='test_organizer', email='org@test.com', password='password123', role='ORGANIZER'
        )

        # Student user
        self.student = User.objects.create_user(
            username='test_student', email='student@test.com', password='password123', role='STUDENT'
        )

        # Category & Venue
        self.category = EventCategory.objects.create(name='Technical', description='Tech events')
        self.venue = Venue.objects.create(name='Main Hall', location='Block A', capacity=100)

        # Club
        self.club = Club.objects.create(
            name='Test Tech Club', tagline='Innovating', description='Test Club',
            category='Technical', president=self.organizer
        )

        # Event
        self.event = Event.objects.create(
            title='Integration Hackathon',
            category=self.category,
            venue=self.venue,
            club=self.club,
            organizer=self.organizer,
            start_date=self.now.date() + datetime.timedelta(days=5),
            end_date=self.now.date() + datetime.timedelta(days=6),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(18, 0),
            registration_deadline=self.now + datetime.timedelta(days=4),
            max_participants=2,
            status='PUBLISHED'
        )

    def test_user_registration_always_student(self):
        """Test public registration assigns STUDENT role automatically"""
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'User',
            'roll_number': '21BCE9999'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(username='newuser')
        self.assertEqual(new_user.role, User.STUDENT)
        self.assertTrue(hasattr(new_user, 'student_profile'))
        self.assertEqual(new_user.student_profile.roll_number, '21BCE9999')

    def test_jwt_login(self):
        """Test JWT token obtain and profile payload"""
        response = self.client.post('/api/auth/login/', {
            'username': 'test_student',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'STUDENT')

    def test_event_registration_and_duplicate_prevention(self):
        """Test event registration with QR generation and duplicate prevention"""
        self.client.force_authenticate(user=self.student)
        
        # 1. First registration should succeed
        res1 = self.client.post('/api/registrations/', {'event_id': self.event.id})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertIn('registration', res1.data)
        reg_id = res1.data['registration']['registration_id']
        self.assertTrue(reg_id.startswith('CX-'))

        # Check QR code generated
        reg = EventRegistration.objects.get(registration_id=reg_id)
        self.assertTrue(bool(reg.qr_code))

        # 2. Duplicate registration attempt should be rejected
        res2 = self.client.post('/api/registrations/', {'event_id': self.event.id})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already registered', res2.data['error'].lower())

    def test_event_capacity_limit(self):
        """Test that event capacity limit is enforced"""
        # Register student 1
        EventRegistration.objects.create(event=self.event, user=self.student, status='CONFIRMED')

        # Register student 2
        user2 = User.objects.create_user(username='stu2', password='password123', role='STUDENT')
        EventRegistration.objects.create(event=self.event, user=user2, status='CONFIRMED')

        # Try to register student 3 (max_participants is 2)
        user3 = User.objects.create_user(username='stu3', password='password123', role='STUDENT')
        self.client.force_authenticate(user=user3)
        res = self.client.post('/api/registrations/', {'event_id': self.event.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', res.data['error'].lower())

    def test_attendance_verification_and_duplicate_prevention(self):
        """Test ticket QR scanning, attendance marking, and duplicate scan rejection"""
        reg = EventRegistration.objects.create(event=self.event, user=self.student, status='CONFIRMED')
        
        # Authenticate as organizer
        self.client.force_authenticate(user=self.organizer)

        # First scan
        res1 = self.client.post('/api/attendance/verify/', {
            'ticket_code': reg.registration_id,
            'event_id': self.event.id,
            'method': 'QR_SCAN'
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data['success'])

        # Duplicate scan
        res2 = self.client.post('/api/attendance/verify/', {
            'ticket_code': reg.registration_id,
            'event_id': self.event.id,
            'method': 'QR_SCAN'
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('already_checked_in'))

    def test_admin_event_approval_workflow(self):
        """Test event draft, submission, and admin approval"""
        draft_event = Event.objects.create(
            title='Draft Event',
            category=self.category,
            venue=self.venue,
            organizer=self.organizer,
            start_date=self.now.date() + datetime.timedelta(days=10),
            end_date=self.now.date() + datetime.timedelta(days=10),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(12, 0),
            registration_deadline=self.now + datetime.timedelta(days=8),
            status='DRAFT'
        )

        # Organizer submits for approval
        self.client.force_authenticate(user=self.organizer)
        res_sub = self.client.post(f'/api/events/{draft_event.id}/submit_for_approval/')
        self.assertEqual(res_sub.status_code, status.HTTP_200_OK)
        draft_event.refresh_from_db()
        self.assertEqual(draft_event.status, 'PENDING_APPROVAL')

        # Admin approves
        self.client.force_authenticate(user=self.admin)
        res_app = self.client.post(f'/api/events/{draft_event.id}/approve/')
        self.assertEqual(res_app.status_code, status.HTTP_200_OK)
        draft_event.refresh_from_db()
        self.assertEqual(draft_event.status, 'PUBLISHED')

    def test_club_join_leave(self):
        """Test club membership join and leave functionality"""
        self.client.force_authenticate(user=self.student)
        
        # Join
        res_join = self.client.post(f'/api/clubs/{self.club.id}/join/')
        self.assertEqual(res_join.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ClubMembership.objects.filter(club=self.club, user=self.student).exists())

        # Leave
        res_leave = self.client.post(f'/api/clubs/{self.club.id}/leave/')
        self.assertEqual(res_leave.status_code, status.HTTP_200_OK)
        self.assertFalse(ClubMembership.objects.filter(club=self.club, user=self.student).exists())

    def test_public_certificate_verification(self):
        """Test public certificate verification endpoint"""
        cert = Certificate.objects.create(
            event=self.event,
            user=self.student,
            certificate_type='WINNER',
            recipient_name='Test Student',
            position_rank='1st Place'
        )

        # Public verification requires NO authentication
        res = self.client.get(f'/api/certificates/verify/{cert.certificate_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['valid'])
        self.assertEqual(res.data['recipient_name'], 'Test Student')

    def test_super_admin_signup_with_secret_key(self):
        """Test Super Admin registration with secret passkey ADMIN2026"""
        response = self.client.post('/api/auth/register/', {
            'username': 'superadmin_new',
            'email': 'superadmin@college.edu',
            'password': 'password123',
            'first_name': 'Chief',
            'last_name': 'Dean',
            'role': 'ADMIN',
            'admin_secret_key': 'ADMIN2026',
            'organization_name': 'Office of the Dean',
            'designation': 'Dean Student Affairs'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_admin = User.objects.get(username='superadmin_new')
        self.assertEqual(new_admin.role, 'ADMIN')
        self.assertTrue(new_admin.is_staff)
        self.assertTrue(new_admin.is_superuser)

    def test_organizer_signup_and_club_creation(self):
        """Test Organizer registration and ability to establish a club"""
        reg_response = self.client.post('/api/auth/register/', {
            'username': 'lead_org',
            'email': 'lead@college.edu',
            'password': 'password123',
            'first_name': 'Alex',
            'last_name': 'Rivera',
            'role': 'ORGANIZER',
            'organization_name': 'AI & Robotics Society',
            'designation': 'Society President',
            'department_name': 'Robotics Association',
            'department_code': 'ROBO'
        })
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        org_user = User.objects.get(username='lead_org')
        self.assertEqual(org_user.role, 'ORGANIZER')
        self.assertFalse(org_user.is_approved)

        # Admin approves the registered organizer
        org_user.is_approved = True
        org_user.save()

        # Organizer establishes a new club
        self.client.force_authenticate(user=org_user)
        club_res = self.client.post('/api/clubs/', {
            'name': 'AI Innovators Hub',
            'tagline': 'Building Tomorrow',
            'description': 'Student research and competition club.',
            'category': 'Technical',
            'logo_url': 'https://example.com/logo.png',
            'cover_url': 'https://example.com/cover.png'
        })
        self.assertEqual(club_res.status_code, status.HTTP_201_CREATED)
        new_club = Club.objects.get(name='AI Innovators Hub')
        self.assertEqual(new_club.president, org_user)
        self.assertTrue(ClubMembership.objects.filter(club=new_club, user=org_user, role='LEAD').exists())

    def test_event_editing_by_admin_and_organizer(self):
        """Test that Admin can edit any event and Organizer can edit their event"""
        # Organizer edits their own event
        self.client.force_authenticate(user=self.organizer)
        edit_res1 = self.client.put(f'/api/events/{self.event.id}/', {
            'title': 'Updated Hackathon Title',
            'category': self.category.id,
            'venue': self.venue.id,
            'club': self.club.id,
            'start_date': str(self.event.start_date),
            'end_date': str(self.event.end_date),
            'start_time': '10:00:00',
            'end_time': '18:00:00',
            'registration_deadline': str(self.event.registration_deadline).replace('+00:00', 'Z'),
            'description': 'Updated description',
            'max_participants': 200,
            'registration_fee': '0.00',
            'status': 'PUBLISHED'
        })
        self.assertEqual(edit_res1.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Updated Hackathon Title')

        # Admin edits event
        self.client.force_authenticate(user=self.admin)
        edit_res2 = self.client.put(f'/api/events/{self.event.id}/', {
            'title': 'Admin Revised Hackathon',
            'category': self.category.id,
            'venue': self.venue.id,
            'club': self.club.id,
            'start_date': str(self.event.start_date),
            'end_date': str(self.event.end_date),
            'start_time': '10:00:00',
            'end_time': '18:00:00',
            'registration_deadline': str(self.event.registration_deadline).replace('+00:00', 'Z'),
            'description': 'Admin modified',
            'max_participants': 300,
            'registration_fee': '50.00',
            'status': 'PUBLISHED'
        })
        self.assertEqual(edit_res2.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Admin Revised Hackathon')

        # Student cannot edit event
        self.client.force_authenticate(user=self.student)
        edit_res3 = self.client.put(f'/api/events/{self.event.id}/', {
            'title': 'Hacked Title',
            'category': self.category.id,
            'venue': self.venue.id,
            'club': self.club.id,
            'start_date': str(self.event.start_date),
            'end_date': str(self.event.end_date),
            'start_time': '10:00:00',
            'end_time': '18:00:00',
            'registration_deadline': str(self.event.registration_deadline).replace('+00:00', 'Z'),
            'description': 'Hacked',
            'max_participants': 300,
            'registration_fee': '0.00',
            'status': 'PUBLISHED'
        })
        self.assertEqual(edit_res3.status_code, status.HTTP_403_FORBIDDEN)

    def test_qr_code_data_url_in_registration_serializer(self):
        """Test that EventRegistrationSerializer generates qr_code_data_url"""
        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/registrations/', {'event_id': self.event.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        reg_data = res.data['registration']
        self.assertIn('qr_code_data_url', reg_data)
        self.assertTrue(reg_data['qr_code_data_url'].startswith('data:image/png;base64,'))

    def test_venue_double_booking_prevention(self):
        """Test that scheduling an overlapping event at the same venue is rejected"""
        self.client.force_authenticate(user=self.organizer)
        res = self.client.post('/api/events/', {
            'title': 'Overlapping Event',
            'category': self.category.id,
            'venue': self.venue.id,
            'club': self.club.id,
            'start_date': str(self.event.start_date),
            'end_date': str(self.event.end_date),
            'start_time': '12:00:00',
            'end_time': '16:00:00',
            'registration_deadline': str(self.event.registration_deadline).replace('+00:00', 'Z'),
            'description': 'Trying to double book',
            'max_participants': 100,
            'registration_fee': '0.00',
            'status': 'PUBLISHED'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('venue', res.data)
        self.assertIn('Venue conflict', str(res.data['venue']))

    def test_od_attendance_csv_export(self):
        """Test On-Duty (OD) CSV roster export for academic section"""
        # Register and mark attendance
        reg = EventRegistration.objects.create(event=self.event, user=self.student, status='CONFIRMED')
        Attendance.objects.create(registration=reg, verified_by=self.organizer, method='QR_SCAN')

        self.client.force_authenticate(user=self.organizer)
        res = self.client.get(f'/api/attendance/export_od/?event_id={self.event.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'text/csv')
        content = res.content.decode('utf-8')
        self.assertIn('APPROVED_OD_ATTENDANCE', content)
        self.assertIn(self.student.username, content)

    def test_public_user_profile_view(self):
        """Students can view President/Organizer profile and their conducted events."""
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f'/api/users/{self.organizer.id}/public_profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['id'], self.organizer.id)
        self.assertIn('led_clubs', res.data)
        self.assertIn('events', res.data)
        self.assertIn('stats', res.data)
        self.assertGreaterEqual(res.data['stats']['total_events'], 1)

    def test_otp_login_request_and_verify_flow(self):
        """Test full 2FA OTP login: request OTP, check generation, and verify with JWT issuance."""
        from accounts.models import EmailOTP

        # 1. Request OTP with valid credentials
        req_res = self.client.post('/api/auth/login-otp-request/', {
            'username': self.student.username,
            'password': 'password123'
        })
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        self.assertTrue(req_res.data.get('otp_required'))
        otp_code = req_res.data.get('demo_otp')
        self.assertEqual(len(otp_code), 6)

        # Verify DB entry
        otp_entry = EmailOTP.objects.filter(user=self.student, is_used=False).first()
        self.assertIsNotNone(otp_entry)
        self.assertEqual(otp_entry.otp_code, otp_code)

        # 2. Attempt verify with wrong OTP -> 400
        fail_res = self.client.post('/api/auth/login-otp-verify/', {
            'username': self.student.username,
            'otp': '000000'
        })
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Incorrect', fail_res.data['error'])

        # 3. Verify with valid OTP -> 200 OK + JWT tokens
        success_res = self.client.post('/api/auth/login-otp-verify/', {
            'username': self.student.username,
            'otp': otp_code
        })
        self.assertEqual(success_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', success_res.data)
        self.assertIn('refresh', success_res.data)
        self.assertEqual(success_res.data['user']['username'], self.student.username)

        # 4. Attempt verify with already used OTP -> 400
        reuse_res = self.client.post('/api/auth/login-otp-verify/', {
            'username': self.student.username,
            'otp': otp_code
        })
        self.assertEqual(reuse_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_organizer_registration_approval_and_login_flow(self):
        """
        Verify that:
        1. New organizer registers with is_approved=False.
        2. Attempting to login before approval returns 403 Forbidden.
        3. Admin approves organizer via /api/admin/organizers/<id>/approve/.
        4. Once approved, organizer can log in with OTP without needing further permissions.
        """
        # 1. Organizer registers
        reg_res = self.client.post('/api/auth/register/', {
            'username': 'new_organizer',
            'email': 'new_org@nit.ac.in',
            'password': 'password123',
            'first_name': 'Club',
            'last_name': 'Lead',
            'role': 'ORGANIZER',
            'organization_name': 'Robotics Club',
            'designation': 'President'
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(reg_res.data.get('pending_approval'))
        self.assertIn('pending administrator approval', reg_res.data.get('message', '').lower())

        org_user = User.objects.get(username='new_organizer')
        self.assertEqual(org_user.role, User.ORGANIZER)
        self.assertFalse(org_user.is_approved)
        self.assertFalse(org_user.organizer_profile.verified)

        # 2. Organizer attempts to login before admin approval -> 403 Forbidden
        login_res_pending = self.client.post('/api/auth/login-otp-request/', {
            'username': 'new_organizer',
            'password': 'password123'
        })
        self.assertEqual(login_res_pending.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('pending administrator approval', login_res_pending.data.get('error', '').lower())

        # 3. Admin approves organizer
        self.client.force_authenticate(user=self.admin)
        approve_res = self.client.post(f'/api/admin/organizers/{org_user.id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        org_user.refresh_from_db()
        self.assertTrue(org_user.is_approved)
        self.assertTrue(org_user.organizer_profile.verified)

        # 4. Now organizer logs in -> receives OTP directly without any permission required
        self.client.force_authenticate(user=None)
        login_res_approved = self.client.post('/api/auth/login-otp-request/', {
            'username': 'new_organizer',
            'password': 'password123'
        })
        self.assertEqual(login_res_approved.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res_approved.data.get('otp_required'))
        otp = login_res_approved.data.get('demo_otp')
        self.assertIsNotNone(otp)

        # Verify OTP
        verify_res = self.client.post('/api/auth/login-otp-verify/', {
            'username': 'new_organizer',
            'otp': otp
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', verify_res.data)
        self.assertEqual(verify_res.data['user']['role'], 'ORGANIZER')

        # 5. Subsequent login: no permission needed again, just OTP
        subsequent_login = self.client.post('/api/auth/login-otp-request/', {
            'username': 'new_organizer',
            'password': 'password123'
        })
        self.assertEqual(subsequent_login.status_code, status.HTTP_200_OK)
        self.assertTrue(subsequent_login.data.get('otp_required'))

