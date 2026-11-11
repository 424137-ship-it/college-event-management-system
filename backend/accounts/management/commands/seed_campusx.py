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
        self.stdout.write(self.style.NOTICE('Starting HarshaX database seed for National Institute of Technology...'))

        # 1. Departments at National Institute of Technology
        dept_data = [
            ('Computer Science & Engineering', 'CSE'),
            ('Electronics & Communication Engineering', 'ECE'),
            ('Electrical Engineering', 'EEE'),
            ('Mechanical Engineering', 'MECH'),
            ('Civil Engineering', 'CIVIL'),
            ('Chemical Engineering', 'CHEM'),
            ('Biotechnology', 'BIOTECH'),
            ('Metallurgical & Materials Engineering', 'MME'),
        ]
        departments = {}
        for name, code in dept_data:
            dept = Department.objects.filter(name=name).first() or Department.objects.filter(code=code).first()
            if not dept:
                dept = Department.objects.create(name=name, code=code)
            else:
                dept.name = name
                dept.code = code
                dept.save()
            departments[code] = dept
        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} NIT departments.'))

        # 2. Faculty & Administration
        faculty_data = [
            ('Dr. P. Dinesh Sankar Reddy', 'dean_sa@nit.ac.in', 'CHEM', 'Dean of Student Affairs'),
            ('Dr. Karthick Seshadri', 'hod_cse@nit.ac.in', 'CSE', 'Associate Professor & HOD'),
            ('Dr. P. S. V. Shanmukhi', 'shanmukhi@nit.ac.in', 'ECE', 'Assistant Professor & Faculty Advisor'),
            ('Dr. V. Sandeep', 'sandeep@nit.ac.in', 'EEE', 'Associate Professor & SAC In-charge'),
        ]
        faculties = []
        for name, email, d_code, desig in faculty_data:
            fac, _ = Faculty.objects.get_or_create(
                email=email,
                defaults={'name': name, 'department': departments[d_code], 'designation': desig, 'phone': '+91 8818284710'}
            )
            faculties.append(fac)
        self.stdout.write(self.style.SUCCESS(f'Created {len(faculties)} NIT faculty members.'))

        # 3. Users
        # Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@nit.ac.in',
                'first_name': 'NIT',
                'last_name': 'Administrator',
                'role': User.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'phone': '+91 8818284700',
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
                'email': 'organizer@nit.ac.in',
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
                    'organization_name': 'ASCII & NIT Student Affairs Council',
                    'designation': 'Lead Student Convener',
                    'department': departments['CSE'],
                    'verified': True
                }
            )

        # Student 1: Harsha
        harsha_user, created = User.objects.get_or_create(
            username='harsha',
            defaults={
                'email': 'harsha@student.nit.ac.in',
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
                    'roll_number': '9211042',
                    'department': departments['CSE'],
                    'year_of_study': 3,
                    'semester': 6,
                    'bio': 'Passionate Full-Stack Developer & Cloud Architect at National Institute of Technology. Technical Lead for ASCII.',
                    'interests': ['Hackathons', 'Web Development', 'AI/ML', 'Competitive Coding']
                }
            )

        # Student 2: Aarav
        student_user, created = User.objects.get_or_create(
            username='student',
            defaults={
                'email': 'aarav@student.nit.ac.in',
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
                    'roll_number': '9221015',
                    'department': departments['ECE'],
                    'year_of_study': 2,
                    'semester': 4,
                    'bio': 'ECE enthusiast & Core Member of Pixel Photography Club at National Institute of Technology.',
                    'interests': ['Photography', 'Music', 'Robotics']
                }
            )

        # 4. Campus Venues at National Institute of Technology
        venues_data = [
            ('Dr. B. R. Ambedkar Central Auditorium', 'Main Academic Complex, NIT Campus', 1200, True, True),
            ('Student Activity Centre (SAC)', 'Central Campus, South Wing', 850, True, True),
            ('CSE Department Seminar Hall', 'Academic Block-3, 2nd Floor', 250, True, True),
            ('Open Air Theatre (OAT Grounds)', 'Central Lake Lawn, NIT', 3000, True, True),
            ('Central Library Audio-Visual Hall', 'Central Library Complex, 1st Floor', 350, True, True),
            ('Sports Complex & Main Pavilion Ground', 'NIT Athletic Arena', 1500, False, True),
        ]
        venues = []
        for name, loc, cap, proj, sound in venues_data:
            v, _ = Venue.objects.get_or_create(
                name=name,
                defaults={'location': loc, 'capacity': cap, 'has_projector': proj, 'has_sound_system': sound}
            )
            venues.append(v)
        self.stdout.write(self.style.SUCCESS(f'Created {len(venues)} NIT venues.'))

        # 5. Categories
        categories_data = [
            ('Department Associations', 'Official student associations across CSE, ECE, EEE, Mech, Civil, Biotech, and MME.'),
            ('Technical', 'Code, build, hackathons, robotics, and engineering innovation.'),
            ('Cultural', 'Music, dance, fine arts, drama, and celebration of traditions at NIT.'),
            ('Hackathons', 'Sprint coding, open-source challenges, and AI solution marathons.'),
            ('Workshops', 'Hands-on tech bootcamps, hardware tinkering, and career workshops.'),
            ('Art & Painting', 'Canvas exhibitions, sketching, and campus wall murals with Kala Club.'),
            ('Photography', 'Campus photowalks, cinematography, and aesthetic captures by Pixel.'),
            ('Music & Dance', 'Acoustic jam sessions, choreo face-offs, and live rock band nights.'),
            ('Sports', 'Inter-branch tournaments, Prahelika athletic meet, and esports leagues.'),
            ('Seminars', 'Keynotes, alumni panels, guest lectures, and research symposiums.'),
            ('Festivals', 'Mega annual campus festivals including Vulcanzy and Technodaya.'),
        ]
        categories = {}
        for name, desc in categories_data:
            cat, _ = EventCategory.objects.get_or_create(name=name, defaults={'description': desc})
            categories[name] = cat
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories)} categories.'))

        # 6. Clubs & Associations at National Institute of Technology
        # Purge any legacy generic placeholder clubs or fake test clubs
        legacy_fake_names = ['PNP', 'Coding Club', 'Robotics Club', 'Painting Club', 'Photography Club', 'Cultural Club', 'Music Club', 'Dance Club', 'Literary Club', 'Sports Club', 'Entrepreneurship Club']
        Club.objects.filter(name__in=legacy_fake_names).delete()

        clubs_data = [
            ('ASCII - Computer Science Association', 'Code. Innovate. Transcend.', 'The premier student association of the Department of Computer Science & Engineering at National Institute of Technology. Organizes national hackathons, code sprints, technical symposiums, and developer workshops.', 'Department Associations', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'),
            ('ECEA - Electronics Association', 'Connecting Signals, Powering Dreams', 'The official association of the Department of Electronics & Communication Engineering at National Institute of Technology. Conducting workshops on VLSI, Embedded Systems, IoT, and Signal Processing.', 'Department Associations', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80'),
            ('Coding Club NIT', 'Think. Code. Deploy.', 'The official competitive programming and software engineering community of National Institute of Technology. Conducting weekly Codeforces/LeetCode contests, web dev hackathons, and open-source sprints.', 'Technical', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80'),
            ('Robotics & Automation Society', 'Engineering Autonomous Tomorrow', 'The premier robotics and mechatronics body of NIT. Building drones, autonomous rovers, battlebots, and robotic manipulators.', 'Technical', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80'),
            ('Kala - Fine Arts Club', 'Colors of NITian Imagination', 'The fine arts club of National Institute of Technology. Organizes canvas exhibitions, live speed painting, digital art masterclasses, and campus murals.', 'Art & Painting', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80'),
            ('Swara - Music Society', 'Symphonies & Acoustic Jams', 'The official music society of NIT. Home to vocalists, guitarists, drummers, and classical instrumentalists. Hosts unplugged acoustic nights and band battles.', 'Music & Dance', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'),
            ('Nrithya - Dance Club', 'Rhythm, Beats & Grace', 'The premier dance troupe of National Institute of Technology, performing classical Bharatanatyam, western hip-hop, contemporary, and street choreography.', 'Music & Dance', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&auto=format&fit=crop&q=80'),
            ('Pixel - Photography Club', 'Freezing Campus Memories', 'The official photography and cinematography body of NIT. Covering major campus fests, sports meets, and campus photo walks.', 'Photography', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80'),
            ('Literary & Debating Society (LDS)', 'Words, Wit & Diplomacy', 'Organizes parliamentary debates, youth parliaments, Model United Nations (MUN), creative writing, and quiz championships at NIT.', 'Cultural', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80'),
            ('E-Cell National Institute of Technology', 'From Campus Ideas to Unicorns', 'The Entrepreneurship Cell fostering student startups, incubation support, angel investor connect, and the annual E-Summit.', 'Technical', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80'),
            ('NIT Sports Association', 'Speed. Stamina. Sportsmanship.', 'The official collegiate athletic and sports body of National Institute of Technology. Organizing inter-branch leagues, Prahelika annual sports meet, badminton championships, and national NIT tournaments.', 'Sports', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80'),
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
                title=f'Welcome to the 2026 Academic Season of {c.name} at NIT!',
                defaults={
                    'content': f'Welcome NITians! We are thrilled to kick off this semester with marquee hackathons, workshops, and inter-collegiate events. Stay tuned to HarshaX for registration details.',
                    'is_pinned': True
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(clubs)} clubs and associations.'))

        # 7. Events
        # Purge fake or duplicate dummy events
        fake_event_titles = ['painting', 'DVKLND', 'National Hackathon 2026: CodeSphere', 'Vibrant Cultural Fest: Tarang 2026', 'Kaleidoscope: Live Canvas Art & Mural Contest', 'Frames of Life: Street Photography Contest', 'Sonic Eclipse: Battle of the Campus Bands', 'NextGen Startup Pitch Arena']
        Event.objects.filter(title__in=fake_event_titles).delete()

        now = timezone.now()
        today = now.date()

        events_data = [
            {
                'title': 'Vulcanzy 2026: Annual Socio-Cultural Festival',
                'category': 'Festivals',
                'club': 'ASCII - Computer Science Association',
                'venue': venues[0],
                'poster_url': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=12),
                'end_date': today + datetime.timedelta(days=14),
                'start_time': datetime.time(16, 0),
                'end_time': datetime.time(22, 30),
                'registration_deadline': now + datetime.timedelta(days=10),
                'max_participants': 2500,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Vulcanzy is the flagship annual socio-cultural festival of National Institute of Technology (NIT)! Three electrifying days filled with celebrity musical nights, battle of bands, choreo showdowns, fashion pageants, art installations, and multi-cuisine food fests. NIT On-Duty (OD) attendance provided for all registered student coordinators.',
                'rules': 'National Institute of Technology Student ID card is strictly mandatory for campus entry. Outside food, unauthorized recording gear, and alcohol/contraband are strictly prohibited.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'vulcanzy@nit.ac.in',
                'budget': 500000.00,
            },
            {
                'title': 'ASCII CodeSprint 2026: 24-Hour National Hackathon',
                'category': 'Hackathons',
                'club': 'ASCII - Computer Science Association',
                'venue': venues[2],
                'poster_url': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=6),
                'end_date': today + datetime.timedelta(days=7),
                'start_time': datetime.time(9, 0),
                'end_time': datetime.time(17, 0),
                'registration_deadline': now + datetime.timedelta(days=4),
                'max_participants': 300,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Organized by ASCII (CSE Association) in collaboration with C-Coding Club at National Institute of Technology. 24 hours of non-stop coding, developer mentorship, cash prizes worth ₹1,50,000, and placement referral opportunities. Tracks: Generative AI, Web3, Distributed Cloud, and Smart Campus Solutions.',
                'rules': 'Teams must consist of 2 to 4 students. All code repositories must be initiated during the hackathon. High-speed campus Wi-Fi and power hubs provided in Academic Block-3.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'ascii@nit.ac.in',
                'budget': 175000.00,
            },
            {
                'title': 'Technodaya 2026: All-India Technical Symposium',
                'category': 'Technical',
                'club': 'Robotics & Automation Society',
                'venue': venues[1],
                'poster_url': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=18),
                'end_date': today + datetime.timedelta(days=19),
                'start_time': datetime.time(9, 30),
                'end_time': datetime.time(17, 30),
                'registration_deadline': now + datetime.timedelta(days=16),
                'max_participants': 600,
                'registration_fee': 150.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'The premier national technical symposium of National Institute of Technology. Features RoboWars, Line Follower Arena, CAD Modeling Sprint, Paper Presentations, and Embedded IoT Showcases. Top projects win research publication grants.',
                'rules': 'Open to all engineering students across India. Working prototypes must comply with safety voltage standards (<24V).',
                'student_coordinator_name': 'Vikram Aditya',
                'student_coordinator_contact': '+91 9811223344',
                'contact_email': 'technodaya@nit.ac.in',
                'budget': 220000.00,
            },
            {
                'title': 'Autonomous Robotics & Drone Workshop',
                'category': 'Workshops',
                'club': 'Robotics & Automation Society',
                'venue': venues[1],
                'poster_url': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=4),
                'end_date': today + datetime.timedelta(days=5),
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(16, 30),
                'registration_deadline': now + datetime.timedelta(days=2),
                'max_participants': 120,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Hands-on training assembling quadcopter drones, flight controllers, and ROS2 computer-vision at National Institute of Technology.',
                'rules': 'Hardware kits provided by NIT Robotics Club. Laptops with Ubuntu/WSL recommended.',
                'student_coordinator_name': 'Aarav Patel',
                'student_coordinator_contact': '+91 9234567890',
                'contact_email': 'robotics@nit.ac.in',
                'budget': 85000.00,
            },
            {
                'title': 'Kala Utsav 2026: Live Art & Mural Exhibition',
                'category': 'Art & Painting',
                'club': 'Kala - Fine Arts Club',
                'venue': venues[4],
                'poster_url': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=10),
                'end_date': today + datetime.timedelta(days=10),
                'start_time': datetime.time(11, 0),
                'end_time': datetime.time(17, 0),
                'registration_deadline': now + datetime.timedelta(days=8),
                'max_participants': 80,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Unleash your artistic soul at the Central Library Lawn. Themed around "Futuristic National Institute of Technology", live acrylic and mixed media canvas painting.',
                'rules': 'Canvases and easels provided by Kala Club. OD attendance provided.',
                'student_coordinator_name': 'Divya Krishnan',
                'student_coordinator_contact': '+91 9776655443',
                'contact_email': 'kala@nit.ac.in',
                'budget': 40000.00,
            },
            {
                'title': 'Pixel Frames: NIT Campus PhotoWalk & Contest',
                'category': 'Photography',
                'club': 'Pixel - Photography Club',
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
                'description': 'A 4-hour photowalk through National Institute of Technology modern architecture, lush central lawn, and central campus lake surroundings.',
                'rules': 'Photos must be captured during the walk. RAW + JPEG submission.',
                'student_coordinator_name': 'Aarav Patel',
                'student_coordinator_contact': '+91 9234567890',
                'contact_email': 'pixel@nit.ac.in',
                'budget': 30000.00,
            },
            {
                'title': 'Swara Unplugged: Live Acoustic Night & Battle of Bands',
                'category': 'Music & Dance',
                'club': 'Swara - Music Society',
                'venue': venues[3],
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
                'description': 'Swara Music Society presents acoustic harmony, rock band riffs, and regional fusion at the Open Air Theatre (OAT) of National Institute of Technology.',
                'rules': 'College ID required for entry at OAT grounds.',
                'student_coordinator_name': 'Kabir Mehra',
                'student_coordinator_contact': '+91 9665544332',
                'contact_email': 'swara@nit.ac.in',
                'budget': 120000.00,
            },
            {
                'title': 'E-Summit National Institute of Technology: Startup Pitch Arena',
                'category': 'Technical',
                'club': 'E-Cell National Institute of Technology',
                'venue': venues[1],
                'poster_url': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=25),
                'end_date': today + datetime.timedelta(days=25),
                'start_time': datetime.time(10, 0),
                'end_time': datetime.time(16, 0),
                'registration_deadline': now + datetime.timedelta(days=20),
                'max_participants': 100,
                'registration_fee': 0.00,
                'is_featured': False,
                'status': 'PUBLISHED',
                'description': 'Pitch your venture in front of accredited venture capitalists and angel networks. Top 3 startups receive equity-free seed grants and incubation support at NIT.',
                'rules': '5-minute pitch deck followed by 3-minute jury Q&A. Functional prototype or MVP required.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'ecell@nit.ac.in',
                'budget': 150000.00,
            },
            {
                'title': 'AI Game Development Bootcamp [Completed]',
                'category': 'Workshops',
                'club': 'Coding Club NIT',
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
            },
            {
                'title': 'AI & Quantum Computing Summit 2026',
                'category': 'Technical',
                'club': 'ASCII - Computer Science Association',
                'venue': venues[2],
                'poster_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
                'start_date': today,
                'end_date': today + datetime.timedelta(days=1),
                'start_time': datetime.time(9, 0),
                'end_time': datetime.time(20, 0),
                'registration_deadline': now + datetime.timedelta(hours=6),
                'max_participants': 300,
                'registration_fee': 0.00,
                'is_featured': True,
                'status': 'PUBLISHED',
                'description': 'Live national symposium featuring keynotes on Quantum Algorithms, Hybrid QPU architectures, and Large Language Models. Live interactive panels happening today in CSE Seminar Hall.',
                'rules': 'College ID required for entry.',
                'student_coordinator_name': 'Harsha Vardhan',
                'student_coordinator_contact': '+91 9123456789',
                'contact_email': 'ascii@nit.ac.in',
                'budget': 95000.00,
            },
            {
                'title': 'NIT Inter-Branch Badminton & Sports Championship',
                'category': 'Sports',
                'club': 'NIT Sports Association',
                'venue': venues[5],
                'poster_url': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
                'start_date': today + datetime.timedelta(days=8),
                'end_date': today + datetime.timedelta(days=9),
                'start_time': datetime.time(9, 0),
                'end_time': datetime.time(18, 0),
                'registration_deadline': now + datetime.timedelta(days=6),
                'max_participants': 200,
                'registration_fee': 0.00,
                'is_featured': False,
                'status': 'PUBLISHED',
                'description': 'Annual inter-departmental badminton championship at the NIT Main Sports Arena Pavilion. Singles, doubles, and mixed doubles fixtures.',
                'rules': 'Standard BWF rules apply. Feather shuttles provided by the sports council.',
                'student_coordinator_name': 'Aarav Patel',
                'student_coordinator_contact': '+91 9234567890',
                'contact_email': 'sports@nit.ac.in',
                'budget': 50000.00,
            }
        ]

        created_events = []
        for ed in events_data:
            ev, _ = Event.objects.get_or_create(
                title=ed['title'],
                defaults={
                    'category': categories[ed['category']],
                    'club': clubs.get(ed['club'], list(clubs.values())[0]),
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
            club=clubs.get('Coding Club NIT', list(clubs.values())[0]),
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
