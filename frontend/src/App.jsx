import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar } from './components/navbar/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { Home } from './pages/Home/Home';
import { Events } from './pages/Events/Events';
import { EventDetails } from './pages/EventDetails/EventDetails';
import { Clubs } from './pages/Clubs/Clubs';
import { ClubDetails } from './pages/ClubDetails/ClubDetails';
import { CalendarPage } from './pages/Calendar/Calendar';
import { Gallery } from './pages/Gallery/Gallery';
import { VerifyCertificate } from './pages/Certificates/VerifyCertificate';

// Auth Pages
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Profile } from './pages/Profile/Profile';
import { Notifications } from './pages/Notifications/Notifications';

// Dashboards
import { StudentDashboard } from './pages/dashboards/StudentDashboard';
import { OrganizerDashboard } from './pages/dashboards/OrganizerDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetails />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Protected Organizer Routes */}
          <Route
            path="/organizer"
            element={
              <ProtectedRoute requiredRole="ORGANIZER">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </div>
  );
}

export default App;
