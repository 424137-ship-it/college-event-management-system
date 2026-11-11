import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Calendar, Award, Bookmark, Users,
  Bell, User, Settings, ArrowRight, Download, CheckCircle2, Clock, MapPin, QrCode, UserMinus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI, registrationsAPI, certificatesAPI, clubsAPI, API_BASE_URL } from '../../services/api';
import { TicketModal } from '../../components/modals/TicketModal';
import { toast } from 'react-toastify';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_registrations: 0,
    upcoming_events: 0,
    events_attended: 0,
    certificates_earned: 0,
    saved_events: 0,
    clubs_joined: 0,
  });
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [statsRes, regsRes, certsRes, savedRes] = await Promise.all([
          reportsAPI.getStudentStats(),
          registrationsAPI.getMyRegistrations(),
          certificatesAPI.getMyCertificates(),
          registrationsAPI.getSavedEvents(),
        ]);
        if (statsRes.data.stats) setStats(statsRes.data.stats);
        setRegistrations(regsRes.data.results || regsRes.data || []);
        setCertificates(certsRes.data.results || certsRes.data || []);
        setSavedEvents(savedRes.data.results || savedRes.data || []);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  const handleOpenTicket = (reg) => {
    setSelectedTicket({
      ...reg,
      user_full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username,
      user_roll_number: user?.student_profile?.roll_number,
    });
    setTicketModalOpen(true);
  };

  const handleCancelRegistration = async (regId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to unregister from '${eventTitle}'? Your pass will be cancelled and reserved seat released.`)) {
      return;
    }
    try {
      await registrationsAPI.cancel(regId);
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
      setStats((prev) => ({
        ...prev,
        total_registrations: Math.max(0, prev.total_registrations - 1),
        upcoming_events: Math.max(0, prev.upcoming_events - 1),
      }));
      toast.success(`Successfully unregistered from '${eventTitle}'.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel registration.');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'tickets', label: 'My Registrations & Tickets', icon: <Ticket size={18} /> },
    { id: 'certificates', label: 'My Certificates', icon: <Award size={18} /> },
    { id: 'saved', label: 'Saved Bookmarks', icon: <Bookmark size={18} /> },
  ];

  const studentName = user?.first_name || user?.username || 'Student';

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F7FD 100%)',
          borderRadius: 24,
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          border: '1.5px solid var(--soft-border)',
        }}
      >
        <div>
          <span className="badge badge-purple" style={{ marginBottom: 8 }}>STUDENT PORTAL</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Welcome back, {studentName}! 👋
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 4 }}>
            Roll No: <strong>{user?.student_profile?.roll_number || user?.username}</strong> • Year {user?.student_profile?.year_of_study || 1}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/events" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Explore More Events
          </Link>
          <Link to="/profile" className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Layout: Sidebar & Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }} className="dashboard-layout">
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderRadius: 14,
                fontWeight: 600,
                fontSize: '0.92rem',
                border: 'none',
                background: activeTab === item.id ? 'var(--primary-purple)' : '#FFFFFF',
                color: activeTab === item.id ? '#FFFFFF' : 'var(--dark-navy)',
                boxShadow: activeTab === item.id ? '0 4px 14px rgba(168, 85, 247, 0.3)' : 'none',
                textAlign: 'left',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-purple)', marginBottom: 8 }}>
                    <Ticket size={22} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_registrations}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)' }}>Total Registrations</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>All campus events</p>
                </div>

                <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-blue)', marginBottom: 8 }}>
                    <Calendar size={22} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.upcoming_events}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)' }}>Upcoming Events</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>Scheduled ahead</p>
                </div>

                <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', marginBottom: 8 }}>
                    <CheckCircle2 size={22} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.events_attended}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)' }}>Events Attended</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>Verified at venue</p>
                </div>

                <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F59E0B', marginBottom: 8 }}>
                    <Award size={22} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.certificates_earned}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)' }}>Certificates</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>Earned & verified</p>
                </div>
              </div>

              {/* Upcoming Event Tickets preview */}
              <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Upcoming Passes</h3>
                  <button onClick={() => setActiveTab('tickets')} style={{ fontSize: '0.85rem', color: 'var(--primary-purple)', fontWeight: 700, background: 'transparent' }}>
                    View All ({registrations.length})
                  </button>
                </div>

                {registrations.length === 0 ? (
                  <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>You have not registered for any upcoming events yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {registrations.slice(0, 2).map((reg) => (
                      <div
                        key={reg.id}
                        style={{
                          padding: 18,
                          borderRadius: 18,
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--soft-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span className="badge badge-purple">{reg.category_name}</span>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 6 }}>{reg.event_title}</h4>
                          </div>
                          <span className="badge badge-green">Confirmed</span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color="var(--primary-purple)" />
                            <span>{reg.event_start_date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} color="var(--accent-blue)" />
                            <span>{reg.venue_name}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => handleOpenTicket(reg)}
                            className="btn-primary"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                          >
                            <QrCode size={15} /> Digital Pass
                          </button>
                          <button
                            onClick={() => handleCancelRegistration(reg.id, reg.event_title)}
                            className="btn-secondary"
                            style={{
                              padding: '8px 10px',
                              fontSize: '0.8rem',
                              color: '#EF4444',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              background: 'rgba(239, 68, 68, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Unregister from event"
                          >
                            <UserMinus size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>
                Registered Events & Digital Tickets
              </h3>

              {registrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)' }}>
                  <Ticket size={48} color="var(--light-violet)" style={{ margin: '0 auto 16px auto' }} />
                  <p>No event registrations found.</p>
                  <Link to="/events" className="btn-primary" style={{ marginTop: 16 }}>Browse Events</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      style={{
                        padding: 20,
                        borderRadius: 18,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--soft-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div>
                        <span className="badge badge-purple" style={{ marginBottom: 6 }}>{reg.category_name}</span>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{reg.event_title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: 4 }}>
                          Pass ID: <strong>{reg.registration_id}</strong> • Date: {reg.event_start_date} at {reg.event_start_time}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>
                          Venue: {reg.venue_name}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {reg.has_attended && (
                          <span className="badge badge-green">
                            <CheckCircle2 size={13} /> Attended
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenTicket(reg)}
                          className="btn-primary"
                          style={{ padding: '10px 18px', fontSize: '0.88rem' }}
                        >
                          <QrCode size={16} /> Show QR Pass
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(reg.id, reg.event_title)}
                          className="btn-secondary"
                          style={{
                            padding: '10px 14px',
                            fontSize: '0.88rem',
                            color: '#EF4444',
                            borderColor: 'rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 600,
                          }}
                        >
                          <UserMinus size={15} /> Unregister
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>
                My Verified Certificates
              </h3>

              {certificates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)' }}>
                  <Award size={48} color="var(--light-violet)" style={{ margin: '0 auto 16px auto' }} />
                  <p>No certificates issued yet. Attend events or win competitions to earn verified certificates!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      style={{
                        padding: 24,
                        borderRadius: 18,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--soft-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div>
                        <span className="badge badge-amber" style={{ marginBottom: 6 }}>
                          {cert.type_display || 'Participation'}
                        </span>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{cert.title}</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginTop: 4 }}>
                          Event: <strong>{cert.event_title}</strong> • Issued on {cert.issue_date}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--primary-purple)', fontWeight: 600, marginTop: 2 }}>
                          Certificate ID: {cert.certificate_id}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <Link
                          to={`/verify-certificate/${cert.certificate_id}`}
                          className="btn-secondary"
                          style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                        >
                          Verify Publicly
                        </Link>
                        <a
                          href={`${API_BASE_URL}/certificates/${cert.id}/download/`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                        >
                          <Download size={16} /> Download PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>
                Saved Bookmarks
              </h3>
              {savedEvents.length === 0 ? (
                <p style={{ color: 'var(--muted-text)' }}>No bookmarked events.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {savedEvents.map((saved) => (
                    <div key={saved.id} style={{ padding: 18, background: 'var(--bg-primary)', borderRadius: 16 }}>
                      <h4 style={{ fontWeight: 700 }}>{saved.event_details?.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: 4 }}>
                        {saved.event_details?.start_date} • {saved.event_details?.venue_name}
                      </p>
                      <Link
                        to={`/events/${saved.event}`}
                        className="btn-primary"
                        style={{ marginTop: 12, padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          registration={selectedTicket}
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 800px) {
          .dashboard-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
