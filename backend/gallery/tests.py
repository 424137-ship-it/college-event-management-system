from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from events.models import Event, EventCategory, Venue
from clubs.models import Club
from gallery.models import GalleryAlbum, GalleryImage

User = get_user_model()

class GalleryUploadAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin_test@nit.ac.in',
            password='password123',
            role='ADMIN'
        )
        self.organizer1 = User.objects.create_user(
            username='org1',
            email='org1@nit.ac.in',
            password='password123',
            role='ORGANIZER'
        )
        self.organizer2 = User.objects.create_user(
            username='org2',
            email='org2@nit.ac.in',
            password='password123',
            role='ORGANIZER'
        )

        # Category and Venue
        self.category = EventCategory.objects.create(name='Tech', slug='tech')
        self.venue = Venue.objects.create(name='Auditorium', location='Central', capacity=500)
        self.club = Club.objects.create(name='Coding Club', slug='coding-club')

        # Event owned by organizer1
        self.event1 = Event.objects.create(
            title='Hackathon 2026',
            slug='hackathon-2026',
            category=self.category,
            venue=self.venue,
            club=self.club,
            organizer=self.organizer1,
            start_date=timezone.now().date(),
            end_date=timezone.now().date(),
            start_time='10:00:00',
            end_time='18:00:00',
            registration_deadline=timezone.now() + timezone.timedelta(days=2),
            status='PUBLISHED'
        )

    def test_organizer_can_upload_image_for_own_event(self):
        self.client.force_authenticate(user=self.organizer1)
        res = self.client.post('/api/images/', {
            'event_id': self.event1.id,
            'image_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
            'caption': 'Coding Sprint Round 1'
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(GalleryImage.objects.count(), 1)
        img = GalleryImage.objects.first()
        self.assertEqual(img.caption, 'Coding Sprint Round 1')
        self.assertEqual(img.album.event, self.event1)

    def test_other_organizer_cannot_upload_for_unowned_event(self):
        self.client.force_authenticate(user=self.organizer2)
        res = self.client.post('/api/images/', {
            'event_id': self.event1.id,
            'image_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
            'caption': 'Unauthorized Upload'
        }, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(GalleryImage.objects.count(), 0)

    def test_admin_can_upload_for_any_event(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/images/', {
            'event_id': self.event1.id,
            'image_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
            'caption': 'Admin Highlight'
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(GalleryImage.objects.count(), 1)

    def test_uploadable_events_endpoint(self):
        self.client.force_authenticate(user=self.organizer1)
        res = self.client.get('/api/albums/uploadable_events/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], self.event1.id)
