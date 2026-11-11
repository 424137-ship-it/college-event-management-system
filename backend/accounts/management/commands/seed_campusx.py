import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.models import Department, Faculty, StudentProfile, OrganizerProfile
from events.models import EventCategory, Venue, Event, EventSchedule, EventApproval, ActivityLog
from clubs.models import Club, ClubMembership, Announcement
from registrations.models import EventRegistration, SavedEvent
from attendance.models import Attendance
from budgets.models import Budget, Expense, Sponsorship
from certificates.models import Certificate
from gallery.models import GalleryAlbum, GalleryImage
from notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial realistic data for HarshaX College Event Management System'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting HarshaX database seed...'))

        # 1. Departments
        dept_data = [
            ('Computer Science & Engineering', 'CSE'),
            ('Electronics & Communication Engineering', 'ECE'),
            ('Mechanical Engineering', 'MECH'),
            ('Information Technology', 'IT'),
            ('Biotechnology', 'BT'),
            ('Management Studies', 'MBA'),
        ]
        departments = {}
        for name, code in dept_data:
            dept, _ = Department.objects.get_or_create(code=code, defaults={'name': name})
            departments[code] = dept
        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} departments.'))

        # 2. Faculty
        faculty_data = [
            ('Dr. Arvind Raman', 'arvind.raman@campus.edu', 'CSE', 'Professor & HOD'),
            ('Dr. Meenakshi Sundaram', 'meenakshi.s@campus.edu', 'ECE', 'Associate Professor'),
            ('Dr. Rajesh Verma', 'rajesh.verma@campus.edu', 'MECH', 'Dean of Student Affairs'),
            ('Prof. Sneha Kulkarni', 'sneha.k@campus.edu', 'IT', 'Assistant Professor'),
        ]
        faculties = []
        for name, email, d_code, desig in faculty_data:
            fac, _ = Faculty.objects.get_or_create(
                email=email,
                defaults={'name': name, 'department': departments[d_code], 'designation': desig, 'phone': '+91 9876543210'}
            )
            faculties.append(fac)
        self.stdout.write(self.style.SUCCESS(f'Created {len(faculties)} faculty members.'))

        # 3. Users
        # Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@harshax.edu',
                'first_name': 'Chief',
                'last_name': 'Administrator',
                'role': User.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 9900112233',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()

        # Organizer
        org_user, created = User.objects.get_or_create(
            username='organizer',
            defaults={
                'email': 'organizer@harshax.edu',
                'first_name': 'Vikram',
                'last_name': 'Aditya',
                'role': User.ORGANIZER,
                'phone': '+91 9811223344',
                'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            }
        )
        if created:
            org_user.set_password('organizer123')
            org_user.save()
            OrganizerProfile.objects.get_or_create(
                user=org_user,
                defaults={
                    'organization_name': 'Campus Technical Affairs Council',
                    'designation': 'Lead Convener',
                    'department': departments['CSE'],
                    'verified': True
                }
            )

        # Student 1: Harsha
        harsha_user, created = User.objects.get_or_create(
            username='harsha',
            defaults={
                'email': 'harsha@student.campus.edu',
                'first_name': 'Harsha',
                'last_name': 'Vardhan',
                'role': User.STUDENT,
                'phone': '+91 9123456789',
                'avatar_url': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
            }
        )
        if created:
            harsha_user.set_password('harsha123')
            harsha_user.save()
            StudentProfile.objects.get_or_create(
                user=harsha_user,
                defaults={
                    'roll_number': '21BCE1042',
                    'department': departments['CSE'],
                    'year_of_study': 3,
                    'semester': 6,
                    'bio': 'Passionate Full-Stack Developer & Cloud Architect. Building the future with React, Django & MySQL.',
                    'interests': ['AI/ML', 'Web Development', 'Hackathons', 'Robotics']
                }
            )

        # Student 2: Aarav
        student_user, created = User.objects.get_or_create(
            username='student',
            defaults={
                'email': 'student@campus.edu',
                'first_name': 'Aarav',
                'last_name': 'Patel',
                'role': User.STUDENT,
                'phone': '+91 9234567890',
                'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            }
        )
        if created:
            student_user.set_password('student123')
            student_user.save()
            StudentProfile.objects.get_or_create(
                user=student_user,
                defaults={
                    'roll_number': '22BIT1015',
                    'department': departments['IT'],
                    'year_of_study': 2,
                    'semester': 4,
                    'bio': 'Competitive programmer & Photography enthusiast.',
                    'interests': ['Photography', 'Music', 'Competitive Coding']
                }
            )

        # 4. Venues
        venues_data = [
            ('Dr. APJ Abdul Kalam Grand Auditorium', 'Main Academic Complex, Block A', 1200, True, True),
            ('Sir M. Visvesvaraya Innovation Hall', 'Technology Incubation Center, 3rd Floor', 450, True, True),
            ('Aryabhata Open Air Amphitheatre', 'Campus Central Lake Lawn', 2500, True, True),
            ('Alan Turing Advanced Computing Lab', 'Computer Sciences Wing, Lab 402', 180, True, True),
            ('Rabindranath Tagore Cultural Center', 'Student Activity Center, South Wing', 850, True, True),
            ('Vikram Sarabhai Seminar Hall', 'Department of ECE, 2nd Floor', 300, True, True),
        ]
        venues = []
        for name, loc, cap, proj, sound in venues_data:
            v, _ = Venue.objects.get_or_create(
                name=name,
                defaults={'location': loc, 'capacity': cap, 'has_projector': proj, 'has_sound_system': sound}
            )
            venues.append(v)
        self.stdout.write(self.style.SUCCESS(f'Created {len(venues)} venues.'))

        # 5. Categories
        categories_data = [
            ('Technical', 'Code, build, and engineer next-generation software and hardware.'),
            ('Cultural', 'Celebrate tradition, creativity, drama, and artistic expression.'),
            ('Hackathons', 'Intense 24 to 36-hour sprint challenges to build innovative solutions.'),
            ('Workshops', 'Hands-on skill building led by senior industry mentors and alumni.'),
            ('Art & Painting', 'Canvas exhibitions, live speed painting, and digital sketching.'),
            ('Photography', 'Photo walks, street photography, and aesthetic capture contests.'),
            ('Music & Dance', 'High-energy musical battles, choir symphonies, and choreography.'),
            ('Sports', 'Inter-department athletic meets, esports, football, and badminton.'),
            ('Seminars', 'Keynotes, technology talks, research symposiums, and career panels.'),
            ('Festivals', 'Mega annual campus festivals and cultural celebrations.'),
        ]
        categories = {}
        for name, desc in categories_data:
            cat, _ = EventCategory.objects.get_or_create(name=name, defaults={'description': desc})
            categories[name] = cat
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories)} categories.'))

        # 6. Clubs
        clubs_data = [
            ('Coding Club', 'Code. Build. Innovate.', 'The premier software engineering and algorithms club of the campus.', 'Technical', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'),
            ('Robotics Club', 'Engineering Autonomous Tomorrow', 'Designing autonomous drones, competitive rovers, and IoT automated systems.', 'Technical', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80'),
            ('Painting Club', 'Colors of Campus Imagination', 'Fine arts, oil painting, digital illustration, and campus wall murals.', 'Art & Painting', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80'),
            ('Photography Club', 'Freeze The Campus Moments', 'Capturing stories, campus life, aesthetic portraits, and wildlife photography.', 'Photography', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80'),
            ('Cultural Club', 'Heartbeat of Campus Festivities', 'Drama, theatre, cultural exchanges, street plays, and festive celebrations.', 'Cultural', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80'),
            ('Music Club', 'Symphony & Sound Waves', 'Live rock bands, acoustic jam circles, instrumental harmony, and vocal choir.', 'Music & Dance', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'),
            ('Dance Club', 'Rhythm, Beats & Grace', 'Contemporary, hip-hop, classical fusion, and national inter-college dance faceoffs.', 'Music & Dance', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&auto=format&fit=crop&q=80'),
            ('Literary Club', 'Words, Debates & Eloquence', 'Parliamentary debates, model united nations, poetry slams, and creative writing.', 'Cultural', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80'),
            ('Sports Club', 'Champions on the Field', 'Inter-branch athletics, basketball tournaments, football leagues, and fitness.', 'Sports', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80'),
            ('Entrepreneurship Club', 'Ideas That Scale', 'Startup incubator, angel pitches, venture capital discussions, and hackathons.', 'Technical', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80'),
        ]
        clubs = {}
        for name, tag, desc, cat, l_url, c_url in clubs_data:
            c, _ = Club.objects.get_or_create(
                name=name,
                defaults={
                    'tagline': tag,
                    'description': desc,
                    'category': cat,
                    'logo_url': l_url,
                    'cover_url': c_url,
                    'president': org_user,
                    'joint_secretary': harsha_user,
                    'faculty_coordinator': faculties[0],
                }
            )
            clubs[name] = c

            # Add memberships
            ClubMembership.objects.get_or_create(club=c, user=harsha_user, defaults={'role': 'CORE'})
            ClubMembership.objects.get_or_create(club=c, user=student_user, defaults={'role': 'MEMBER'})

            # Add announcements
            Announcement.objects.get_or_create(
                club=c,
                author=org_user,
                title=f'Welcome to the 2026 Season of {c.name}!',
                defaults={
                    'content': f'We are excited to welcome all new and returning members. Check out our upcoming flagship projects, workshops, and weekly meetups.',
                    'is_pinned': True
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(clubs)} clubs with memberships and announcements.'))

        # 7. Events
        now = timezone.now()
        today = now.date()

        events_data = [
            {
                'title': 'National Hackathon 2026: CodeSphere',
                'category': 'Hackathons',
                'club': 'Coding Club',
                'venue': venues[0],
                'poster_url': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=7),
                'end_date': today + datetime.timedelta(days=9),
                'start_time': datetime.time(9, 0),
                'end_time': datetime.time(18, 0),
                'registration_deadline': now + datetime.timedelta(days=5),
                'max_participants': 250,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Join India\'s premier collegiate hackathon! 36 hours of non-stop innovation, developer mentorship, cash prizes worth ₹1,50,000, and direct internship opportunities with leading tech firms. Themes include Generative AI, Decentralized Systems, and Green Tech.',
                'rules': 'Teams must consist of 2 to 4 members. All code must be written during the hackathon. Plagiarism or pre-built prototypes will result in disqualification.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'hackathon@harshax.edu',
                'budget': 180000.00,
            },
            {
                'title': 'Vibrant Cultural Fest: Tarang 2026',
                'category': 'Cultural',
                'club': 'Cultural Club',
                'venue': venues[2],
                'poster_url': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=14),
                'end_date': today + datetime.timedelta(days=16),
                'start_time': datetime.time(16, 0),
                'end_time': datetime.time(22, 0),
                'registration_deadline': now + datetime.timedelta(days=12),
                'max_participants': 1500,
                'registration_fee': 100.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Tarang is the mega annual cultural festival of HarshaX! Three evenings of high-voltage musical performances, celebrity DJ nights, dramatic theatre showdowns, fashion pageants, and food stalls.',
                'rules': 'College ID cards are strictly mandatory for entry. Outside food, beverages, and bags are subject to security screening.',
                'student_coordinator_name': 'Rohan Sen',
                'student_coordinator_contact': '+91 9876540011',
                'contact_email': 'cultural@harshax.edu',
                'budget': 350000.00,
            },
            {
                'title': 'Autonomous Robotics & Drone Workshop',
                'category': 'Workshops',
                'club': 'Robotics Club',
                'venue': venues[1],
                'poster_url': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=4),
                'end_date': today + datetime.timedelta(days=5),
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(16, 30),
                'registration_deadline': now + datetime.timedelta(days=2),
                'max_participants': 120,
                'registration_fee': 250.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Get hands-on experience assembling quadcopter drones, calibrating flight controllers, and programming computer-vision obstacle avoidance with ROS2 and OpenCV.',
                'rules': 'Hardware kits are provided per team. Laptops with Ubuntu or WSL recommended for programming sessions.',
                'student_coordinator_name': 'Ananya Roy',
                'student_coordinator_contact': '+91 9887766554',
                'contact_email': 'robotics@harshax.edu',
                'budget': 85000.00,
            },
            {
                'title': 'Kaleidoscope: Live Canvas Art & Mural Contest',
                'category': 'Art & Painting',
                'club': 'Painting Club',
                'venue': venues[4],
                'poster_url': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=10),
                'end_date': today + datetime.timedelta(days=10),
                'start_time': datetime.time(11, 0),
                'end_time': datetime.time(17, 0),
                'registration_deadline': now + datetime.timedelta(days=8),
                'max_participants': 80,
                'registration_fee': 50.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Unleash your artistic soul on a grand canvas. Themed around "Futuristic Utopias", participants get 4 hours to paint their vision with acrylics, pastels, and mixed media.',
                'rules': 'Canvases and basic easels are provided. Artists may bring their own specialty brushes and paints.',
                'student_coordinator_name': 'Divya Krishnan',
                'student_coordinator_contact': '+91 9776655443',
                'contact_email': 'artclub@harshax.edu',
                'budget': 40000.00,
            },
            {
                'title': 'Frames of Life: Street Photography Contest',
                'category': 'Photography',
                'club': 'Photography Club',
                'venue': venues[2],
                'poster_url': 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=18),
                'end_date': today + datetime.timedelta(days=18),
                'start_time': datetime.time(8, 0),
                'end_time': datetime.time(14, 0),
                'registration_deadline': now + datetime.timedelta(days=15),
                'max_participants': 90,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'A 4-hour photowalk through the historic campus architecture and surrounding city avenues. Capture unscripted emotion, shadows, and reflections.',
                'rules': 'Photos must be submitted in RAW + JPEG. Minimal color correction allowed; generative manipulation strictly banned.',
                'student_coordinator_name': 'Aarav Patel',
                'student_coordinator_contact': '+91 9234567890',
                'contact_email': 'photo@harshax.edu',
                'budget': 30000.00,
            },
            {
                'title': 'Sonic Eclipse: Battle of the Campus Bands',
                'category': 'Music & Dance',
                'club': 'Music Club',
                'venue': venues[0],
                'poster_url': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=22),
                'end_date': today + datetime.timedelta(days=22),
                'start_time': datetime.time(17, 30),
                'end_time': datetime.time(22, 0),
                'registration_deadline': now + datetime.timedelta(days=18),
                'max_participants': 600,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Campus rock and acoustic bands clash for the golden trophy! Featuring original compositions and electrifying covers with professional studio lighting and concert audio.',
                'rules': 'Each band is allotted 20 minutes on stage including sound check. Drum kit and PA provided; guitarists bring their pedals.',
                'student_coordinator_name': 'Kabir Mehra',
                'student_coordinator_contact': '+91 9665544332',
                'contact_email': 'music@harshax.edu',
                'budget': 120000.00,
            },
            {
                'title': 'AI & Quantum Computing Summit 2026',
                'category': 'Technical',
                'club': 'Coding Club',
                'venue': venues[3],
                'poster_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=1),
                'end_date': today + datetime.timedelta(days=2),
                'start_time': datetime.time(9, 30),
                'end_time': datetime.time(17, 0),
                'registration_deadline': now + datetime.timedelta(hours=24),
                'max_participants': 150,
                'registration_fee': 0.00,
                'is_featured': False,
                'status': 'PUBLISHED',
                'description': 'Distinguished scientists and Silicon Valley AI researchers discuss Large Multimodal Models, Qubit coherence, and next-gen quantum cryptography.',
                'rules': 'Open to undergraduate and graduate scholars. Certificate of attendance provided.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'summit@harshax.edu',
                'budget': 95000.00,
            },
            {
                'title': 'Inter-College Badminton Championship',
                'category': 'Sports',
                'club': 'Sports Club',
                'venue': venues[4],
                'poster_url': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=11),
                'end_date': today + datetime.timedelta(days=13),
                'start_time': datetime.time(8, 0),
                'end_time': datetime.time(18, 0),
                'registration_deadline': now + datetime.timedelta(days=9),
                'max_participants': 120,
                'registration_fee': 150.00,
                'is_featured': False,
                'status': 'PUBLISHED',
                'description': 'Men and Women singles, doubles, and mixed doubles badminton championship. Yonex Mavis 350 shuttles will be used on indoor wooden courts.',
                'rules': 'Non-marking court shoes compulsory. BWF standard tournament rules apply.',
                'student_coordinator_name': 'Siddharth Nair',
                'student_coordinator_contact': '+91 9554433221',
                'contact_email': 'sports@harshax.edu',
                'budget': 50000.00,
            },
            {
                'title': 'NextGen Startup Pitch Arena',
                'category': 'Technical',
                'club': 'Entrepreneurship Club',
                'venue': venues[5],
                'poster_url': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=25),
                'end_date': today + datetime.timedelta(days=25),
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(16, 0),
                'registration_deadline': now + datetime.timedelta(days=20),
                'max_participants': 100,
                'registration_fee': 0.00,
                'is_featured': False,
                'status': 'PENDING_APPROVAL',
                'description': 'Pitch your venture in front of accredited venture capitalists and angel networks. Top 3 startups receive equity-free seed grants and 6-month incubator access.',
                'rules': '5-minute pitch deck followed by 3-minute jury Q&A. Functional prototype or MVP required.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'e-cell@harshax.edu',
                'budget': 150000.00,
            },
            {
                'title': 'AI Game Development Bootcamp [Completed]',
                'category': 'Workshops',
                'club': 'Coding Club',
                'venue': venues[3],
                'poster_url': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
                'start_date': today - datetime.timedelta(days=5),
                'end_date': today - datetime.timedelta(days=3),
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(16, 0),
                'registration_deadline': now - datetime.timedelta(days=7),
                'max_participants': 100,
                'registration_fee': 0.00,
                'is_featured': False,
                'status': 'COMPLETED',
                'description': 'Completed high-intensity workshop on Unreal Engine 5 and procedural level generation using machine learning models.',
                'rules': 'Participants completed a functional 3D demo.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'gamedev@harshax.edu',
                'budget': 60000.00,
            }
        ]

        created_events = []
        for ed in events_data:
            ev, _ = Event.objects.get_or_create(
                title=ed['title'],
                defaults={
                    'category': categories[ed['category']],
                    'club': clubs[ed['club']],
                    'venue': ed['venue'],
                    'organizer': org_user,
                    'poster_url': ed['poster_url'],
                    'start_date': ed['start_date'],
                    'end_date': ed['end_date'],
                    'start_time': ed['start_time'],
                    'end_time': ed['end_time'],
                    'registration_deadline': ed['registration_deadline'],
                    'max_participants': ed['max_participants'],
                    'registration_fee': ed['registration_fee'],
                    'is_featured': ed['is_featured'],
                    'status': ed['status'],
                    'description': ed['description'],
                    'rules': ed['rules'],
                    'faculty_coordinator': faculties[0],
                    'student_coordinator_name': ed['student_coordinator_name'],
                    'student_coordinator_contact': ed['student_coordinator_contact'],
                    'contact_email': ed['contact_email'],
                }
            )
            created_events.append(ev)

            # Schedules
            EventSchedule.objects.get_or_create(
                event=ev,
                title='Inauguration & Keynote Address',
                defaults={
                    'start_time': timezone.make_aware(datetime.datetime.combine(ev.start_date, ev.start_time)),
                    'end_time': timezone.make_aware(datetime.datetime.combine(ev.start_date, ev.start_time)) + datetime.timedelta(hours=1),
                    'description': 'Welcome address and presentation of guidelines.',
                    'speaker': 'Chief Guest & Faculty Coordinator'
                }
            )

            # Approvals
            app_status = 'APPROVED' if ev.status in ['PUBLISHED', 'COMPLETED'] else ('PENDING_APPROVAL' if ev.status == 'PENDING_APPROVAL' else 'DRAFT')
            EventApproval.objects.get_or_create(
                event=ev,
                defaults={
                    'status': app_status,
                    'reviewed_by': admin_user if app_status == 'APPROVED' else None,
                    'reviewed_at': now if app_status == 'APPROVED' else None
                }
            )

            # Budget
            budget_amount = ed['budget']
            b, _ = Budget.objects.get_or_create(
                event=ev,
                defaults={
                    'estimated_budget': budget_amount,
                    'approved_budget': budget_amount * 0.95,
                }
            )

            # Add sample expenses to published/completed events
            if ev.status in ['PUBLISHED', 'COMPLETED']:
                Expense.objects.get_or_create(
                    budget=b,
                    title='Venue Stage & Lighting Setup',
                    defaults={
                        'category': 'EQUIPMENT',
                        'amount': 25000.00,
                        'date': ev.start_date - datetime.timedelta(days=1),
                        'notes': 'Professional concert audio and spotlights',
                        'created_by': org_user
                    }
                )
                Expense.objects.get_or_create(
                    budget=b,
                    title='Participant Kits & ID Badges',
                    defaults={
                        'category': 'PRINTING',
                        'amount': 8500.00,
                        'date': ev.start_date - datetime.timedelta(days=2),
                        'notes': 'Lanyards, RFID cards, and information booklets',
                        'created_by': org_user
                    }
                )

                # Sponsorship
                Sponsorship.objects.get_or_create(
                    event=ev,
                    sponsor_name='TechCorp Cloud Solutions',
                    defaults={
                        'contact_person': 'Anita Roy (Director of Developer Relations)',
                        'contact_email': 'sponsorships@techcorp.io',
                        'contact_phone': '+91 9988776655',
                        'amount': 50000.00,
                        'tier': 'Platinum',
                        'status': 'RECEIVED',
                        'notes': 'Official Cloud Infrastructure and API Sponsor'
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Created {len(created_events)} events with schedules and budgets.'))

        # 8. Registrations, Attendance & Certificates
        hackathon_event = created_events[0]
        completed_event = created_events[-1]

        # Register Harsha for Hackathon
        reg_harsha, _ = EventRegistration.objects.get_or_create(
            event=hackathon_event,
            user=harsha_user,
            defaults={'status': 'CONFIRMED'}
        )
        SavedEvent.objects.get_or_create(user=harsha_user, event=created_events[1])

        # Register Harsha for Completed Event and grant Attendance & Certificate!
        reg_harsha_completed, _ = EventRegistration.objects.get_or_create(
            event=completed_event,
            user=harsha_user,
            defaults={'status': 'CONFIRMED'}
        )
        Attendance.objects.get_or_create(
            registration=reg_harsha_completed,
            defaults={'verified_by': org_user, 'method': 'QR_SCAN'}
        )
        Certificate.objects.get_or_create(
            event=completed_event,
            user=harsha_user,
            defaults={
                'certificate_type': 'WINNER',
                'title': 'Certificate of Merit & Excellence',
                'recipient_name': 'Harsha Vardhan',
                'position_rank': '1st Place Winner',
            }
        )

        # Register Aarav for Hackathon
        EventRegistration.objects.get_or_create(
            event=hackathon_event,
            user=student_user,
            defaults={'status': 'CONFIRMED'}
        )

        # 9. Gallery Albums and Images
        album, _ = GalleryAlbum.objects.get_or_create(
            event=completed_event,
            club=clubs['Coding Club'],
            title='AI Game Dev Bootcamp 2026 Highlights',
            defaults={'description': 'Memorable moments from the 3-day intense Unreal Engine game development sprint.'}
        )
        gallery_images = [
            ('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80', 'Keynote on procedural generation by industry mentors'),
            ('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80', 'Students collaborating in teams during sprint challenge'),
            ('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80', 'Final award ceremony and winner celebrations'),
            ('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80', 'Hardware and VR demo testing session'),
        ]
        for img_url, caption in gallery_images:
            GalleryImage.objects.get_or_create(
                album=album,
                image_url=img_url,
                defaults={'caption': caption}
            )

        # 10. Notifications for Harsha
        Notification.objects.get_or_create(
            user=harsha_user,
            title="Registration Confirmed: National Hackathon 2026",
            defaults={
                'message': 'Your seat for CodeSphere 2026 is confirmed! View your QR entry ticket in your dashboard.',
                'category': 'REGISTRATION',
                'link': '/tickets'
            }
        )
        Notification.objects.get_or_create(
            user=harsha_user,
            title="Certificate Ready: AI Game Dev Bootcamp",
            defaults={
                'message': 'Congratulations on winning 1st Place! Your verified digital certificate is available for download.',
                'category': 'CERTIFICATE',
                'link': '/certificates'
            }
        )

        # 11. Activity Log
        ActivityLog.objects.get_or_create(
            user=admin_user,
            action="System Initialization",
            defaults={'details': 'HarshaX database initialized with master production seed.'}
        )

        self.stdout.write(self.style.SUCCESS('\n========================================='))
        self.stdout.write(self.style.SUCCESS('HARSHAX DATABASE SEED COMPLETED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('========================================='))
        self.stdout.write('Default login credentials:')
        self.stdout.write('  ADMIN:     admin     / admin123')
        self.stdout.write('  ORGANIZER: organizer / organizer123')
        self.stdout.write('  STUDENT 1: harsha    / harsha123 (Roll: 21BCE1042)')
        self.stdout.write('  STUDENT 2: student   / student123')
        self.stdout.write('=========================================\n')
