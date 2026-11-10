# CampusX: Futuristic College Event Management System

[![Django](https://img.shields.io/badge/Django-5.2%2B-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

## 1. Project Overview

**CampusX** is a modern, enterprise-grade, centralized College Event and Community Management platform. Inspired by modern SaaS platforms, CampusX provides a single digital nexus where college students, club organizers, faculty mentors, and academic administrators collaborate seamlessly.

From participating in 36-hour hackathons and cultural pageants to instant QR ticket generation, live mobile attendance verification, financial budget tracking in INR (₹), and cryptographically verifiable PDF certificates, CampusX eliminates campus paperwork and empowers student innovation.

---

## 2. Key Features

### 🌟 Student Experience
- **Explore & Filter Events:** Search across categories (Technical, Hackathons, Cultural, Workshops, Sports, Art, Photography) with live search and sort filters.
- **1-Click Registration & Instant QR Passes:** Thread-safe backend registration prevents duplicates, verifies capacity and deadlines, and generates digital passes with QR codes.
- **My Digital Wallet:** Access all active event passes, QR codes for venue entry, and bookmarks.
- **Club Communities:** Discover campus clubs, join/leave communities, read executive announcements, and connect with members.
- **Verified Digital Certificates:** Download tamper-proof participation and winner PDF certificates generated dynamically via ReportLab.
- **Interactive Calendar:** Monthly and timeline agendas highlighting category color tags and day-wise schedules.

### ⚡ Organizer Console
- **Multi-Step Event Wizard:** 5-step guided creator (Basic Info, Schedule, Location/Capacity, Rules/Coordinators, Live Preview) supporting Draft and Submit for Review modes.
- **Live QR Attendance Scanner:** Instant ticket verification via QR code scan or manual pass ID entry with duplicate check-in prevention.
- **Financial Budget & Expense Manager:** Track approved budgets vs actual expenses in INR (₹) across categories (Equipment, Food, Printing, Materials, etc.) with 1-click CSV export.
- **Sponsorship Portal:** Manage tiered partnerships (Platinum, Gold, Silver) and track corporate sponsorship status.
- **Event Analytics:** Interactive Recharts charts detailing registration velocity, attendance rate, and category distribution.

### 🛡️ Administration Console
- **Event Approval Workflow:** Review event proposals with 1-click Approve & Publish or Reject with feedback modal.
- **User Governance:** Inspect student and organizer accounts with instant activate/deactivate toggles.
- **System Audit Logs:** Real-time chronological audit trail of all administrative and event operations.
- **Venue & Category Management:** Manage college auditoriums, labs, and capacities.

### 🔍 Public Verification Portal
- **Tamper-Proof Certificate Verifier:** Publicly accessible URL (`/verify-certificate/:id`) allowing external recruiters to verify genuine credentials directly against the MySQL registry.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript (ES6+), React Router DOM, Axios, Framer Motion, Lucide React, Recharts, Canvas Confetti, HTML5 QR Scanner, React Toastify |
| **Backend** | Python 3.14+, Django 5.2/6.0, Django REST Framework, Simple JWT, Django CORS Headers, Django Filter, Pillow, ReportLab, QRCode, PyMySQL |
| **Database** | MySQL 8.0+ (utf8mb4 encoding, InnoDB engine) |
| **Architecture** | Decoupled Client-Server REST API with JWT Bearer Token Security |

---

## 4. Application Architecture

```
                      ┌─────────────────────────┐
                      │    END USERS / BROWSER  │
                      └────────────┬────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │   REACT 19 + VITE UI    │
                      │  (http://localhost:5173)│
                      └────────────┬────────────┘
                                   │  Axios REST Calls (JWT Bearer)
                                   ▼
                      ┌─────────────────────────┐
                      │    DJANGO REST API      │
                      │ (http://127.0.0.1:8000) │
                      └────────────┬────────────┘
                                   │  Django ORM Queries
                                   ▼
                      ┌─────────────────────────┐
                      │    MYSQL 8.0 DATABASE   │
                      │      (campusx_db)       │
                      └─────────────────────────┘
```

---

## 5. Prerequisites

Before installing CampusX, ensure your machine has:
1. **Node.js** (v18.x or v20.x+) and **npm** installed.
2. **Python** (v3.10+ or v3.14+) with `pip`.
3. **MySQL Server 8.0+** running locally on port `3306`.
4. **Git** for version control.

---

## 6. Database Setup (MySQL)

Start your MySQL server and create the application database:

```sql
CREATE DATABASE IF NOT EXISTS campusx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 7. Backend Setup & Startup

### Step 1: Navigate to backend
```bash
cd backend
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and verify your MySQL credentials:
```ini
DEBUG=True
SECRET_KEY=django-insecure-campusx-super-secret-key-change-in-production-2026
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=campusx_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Step 3: Install Python Dependencies
```bash
python -m pip install -r requirements.txt
```

### Step 4: Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Seed Database with Realistic Data
Populate events, clubs, venues, budgets, and preconfigured demo accounts:
```bash
python manage.py seed_campusx
```

### Step 6: Run Automated Integration Tests
```bash
python manage.py test accounts
```

### Step 7: Start Django Server
```bash
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at: `http://127.0.0.1:8000/api/`

---

## 8. Frontend Setup & Startup

Open a **separate terminal**:

### Step 1: Navigate to frontend
```bash
cd frontend
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Start Vite Development Server
```bash
npm run dev
```
Frontend application will be live at: `http://localhost:5173/`

---

## 9. Demo Credentials

Use these pre-seeded accounts for testing and demonstration:

| Role | Username | Password | Notes |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full control over approvals, users, and audit logs |
| **Organizer** | `organizer` | `organizer123` | Convener with access to event creation, attendance scanner, and budgets |
| **Student (Featured)** | `harsha` | `harsha123` | Pre-registered for National Hackathon with active QR pass & Certificate |
| **Student (General)** | `student` | `student123` | Standard student account |

*Note: New public registrations automatically receive the `STUDENT` role with immediate login access.*

---

## 10. API Endpoints Reference

### Authentication (`/api/auth/`)
- `POST /api/auth/register/` - Create a new student account
- `POST /api/auth/login/` - Obtain JWT access and refresh tokens
- `POST /api/auth/token/refresh/` - Refresh expired access token
- `GET /api/auth/profile/` - Retrieve authenticated user profile
- `PUT /api/auth/profile/` - Update profile bio, phone, and avatar

### Events (`/api/events/`)
- `GET /api/events/` - List published events (supports `?category=`, `?timeframe=`, `?search=`)
- `GET /api/events/featured/` - Retrieve top featured events
- `GET /api/events/calendar/` - Events structured for monthly/weekly calendar
- `GET /api/events/{id}/` - Detailed event schedule, rules, and user registration status
- `POST /api/events/` - Create event (Organizer/Admin)
- `POST /api/events/{id}/submit_for_approval/` - Transition draft to approval queue
- `POST /api/events/{id}/approve/` - Admin approves and publishes event
- `POST /api/events/{id}/reject/` - Admin rejects event with feedback
- `POST /api/events/{id}/save_toggle/` - Bookmark or unbookmark event

### Registrations & Tickets (`/api/registrations/`)
- `POST /api/registrations/` - Register student for event and generate QR pass
- `GET /api/registrations/` - Get current student's passes or organizer's attendee list
- `POST /api/registrations/{id}/cancel/` - Cancel event registration

### Attendance (`/api/attendance/`)
- `POST /api/attendance/verify/` - Verify QR code / ticket ID and prevent duplicates
- `GET /api/attendance/` - List checked-in attendees

### Budgets & Financials (`/api/budgets/` & `/api/expenses/`)
- `GET /api/budgets/` - Event budget summaries
- `POST /api/expenses/` - Record an expense in INR (₹)
- `GET /api/expenses/export_csv/` - Export real expense records to CSV

### Certificates (`/api/certificates/`)
- `GET /api/certificates/` - Student's earned certificates
- `GET /api/certificates/{id}/download/` - Dynamic PDF certificate download
- `GET /api/certificates/verify/{certificate_id}/` - Public verification endpoint

---

## 11. Security Implementation

1. **Password Hashing:** PBKDF2 with SHA256 through Django's authentication framework.
2. **Token Security:** Short-lived JWT access tokens with rotating refresh tokens and server-side blacklisting.
3. **Role-Based Access Control:** Strict custom permissions (`IsAdminUserRole`, `IsOrganizerUserRole`, `IsStudentUserRole`) enforced on the backend.
4. **Duplicate Prevention:** Database `UniqueConstraint` on `(event, user)` combined with `select_for_update()` transactional locks.
5. **No Public Escalation:** Public registration endpoints are locked to create `STUDENT` profiles only.
6. **Credential Protection:** Secrets stored in `.env`, excluded from git via `.gitignore`.

---

## 12. Troubleshooting

- **MySQL Connection Error:** Ensure MySQL service is running (`Get-Service MySQL80` on Windows) and credentials in `backend/.env` match your local root password.
- **Port 8000 / 5173 in use:** Terminate existing processes on those ports or run Django on `python manage.py runserver 8001`.
- **CORS Errors:** Verify that `CORS_ALLOW_ALL_ORIGINS = True` is present in `backend/config/settings.py`.

---

## 13. License

Distributed under the MIT License. Developed for Academic and Demonstration Excellence.
