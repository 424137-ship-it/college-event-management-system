import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, Users, Calendar, CheckCircle2, XCircle, Clock,
  Check, X, AlertTriangle, Activity, BarChart, Settings, Search, UserCheck, UserX,
  Edit3, Trash2, PlusCircle, Building2
} from 'lucide-react';
import { reportsAPI, eventsAPI, clubsAPI } from '../../services/api';
import { EditEventModal } from '../../components/modals/EditEventModal';
import { CreateClubModal } from '../../components/modals/CreateClubModal';
import { toast } from 'react-toastify';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedEventToReject, setSelectedEventToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals for Admin Editing & Club Creation
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState(null);
  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);

  const loadAdminData = async () => {
    try {
      const [adminStatsRes, usersRes, eventsRes, clubsRes] = await Promise.all([
        reportsAPI.getAdminStats(),
        reportsAPI.getAdminUsers(),
        eventsAPI.getAll({ scope: 'admin' }),
        clubsAPI.getAll(),
      ]);
      setStats(adminStatsRes.data.stats);
      setPendingEvents(adminStatsRes.data.pending_events || []);
      setPendingOrganizers(adminStatsRes.data.pending_organizers || []);
      setRecentLogs(adminStatsRes.data.recent_logs || []);
      setAllUsers(usersRes.data.results || usersRes.data || []);
      setAllEvents(eventsRes.data.results || eventsRes.data || []);
      setClubs(clubsRes.data.results || clubsRes.data || []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveEvent = async (eventId) => {
    try {
      await eventsAPI.approve(eventId);
      toast.success('Event approved and published!');
      setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      setAllEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'PUBLISHED' } : e)));
      if (stats) setStats({ ...stats, pending_approvals: Math.max(0, stats.pending_approvals - 1) });
    } catch (err) {
      toast.error('Failed to approve event.');
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await eventsAPI.delete(eventId);
      toast.success(`Event '${title}' has been removed.`);
      setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
      setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      toast.error('Failed to delete event.');
    }
  };

  const handleRejectEvent = async () => {
    if (!selectedEventToReject) return;
    try {
      await eventsAPI.reject(selectedEventToReject.id, { reason: rejectionReason });
      toast.info('Event rejected.');
      setPendingEvents((prev) => prev.filter((e) => e.id !== selectedEventToReject.id));
      setRejectModalOpen(false);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to reject event.');
    }
  };

  const handleApproveOrganizer = async (userId, username) => {
    try {
      const res = await reportsAPI.approveOrganizer(userId);
      toast.success(res.data.message || `Organizer '${username}' approved! Notification email dispatched.`);
      setPendingOrganizers((prev) => prev.filter((o) => o.id !== userId));
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_approved: true, is_active_user: true } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          pending_organizers_count: Math.max(0, (stats.pending_organizers_count || 1) - 1),
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve organizer.');
    }
  };

  const handleRejectOrganizer = async (userId, username) => {
    const reason = window.prompt(`Provide reason for rejecting registration of organizer '${username}':`, 'Incomplete club authorization');
    if (reason === null) return;
    try {
      const res = await reportsAPI.rejectOrganizer(userId, { reason });
      toast.info(res.data.message || `Organizer '${username}' registration rejected.`);
      setPendingOrganizers((prev) => prev.filter((o) => o.id !== userId));
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_approved: false, is_active_user: false } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          pending_organizers_count: Math.max(0, (stats.pending_organizers_count || 1) - 1),
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject organizer.');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await reportsAPI.toggleUserStatus(userId);
      toast.success(res.data.message);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active_user: res.data.is_active_user } : u))
      );
    } catch (err) {
      toast.error('Could not toggle user status.');
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    let matchesRole = true;
    if (userRoleFilter === 'PENDING_ORGANIZERS') {
      matchesRole = u.role === 'ORGANIZER' && !u.is_approved;
    } else if (userRoleFilter !== 'ALL') {
      matchesRole = u.role === userRoleFilter;
    }
    const matchesSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(userSearch.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          background: '#FFFFFF',
          borderRadius: 24,
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span className="badge badge-red" style={{ marginBottom: 8 }}>ADMINISTRATIVE CONSOLE</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Chief Platform Administration
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            Full governance of students, organizers, event approvals, and system audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateClubModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--primary-purple)', color: 'var(--primary-purple)', fontWeight: 700 }}
          >
            <Building2 size={16} />
            + Establish Club / Association
          </button>
          <button onClick={loadAdminData} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 28, borderBottom: '1px solid var(--soft-border)', paddingBottom: 12 }}>
        {[
          { id: 'overview', label: 'System Overview' },
          { id: 'events', label: `All Events & Master Edit (${allEvents.length})` },
          { id: 'approvals', label: `Pending Approvals (${pendingEvents.length})` },
          { id: 'clubs', label: `Clubs & Associations (${clubs.length})` },
          { id: 'users', label: 'User Management' },
          { id: 'logs', label: 'Audit Activity Logs' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === t.id ? 'var(--primary-purple)' : 'transparent',
              color: activeTab === t.id ? '#FFFFFF' : 'var(--muted-text)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Enrolled Students</span>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-purple)', marginTop: 4 }}>
                {stats.total_students}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Active Clubs</span>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
                {stats.total_clubs}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Total Events</span>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-navy)', marginTop: 4 }}>
                {stats.total_events}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Pending Approvals</span>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>
                {stats.pending_approvals}
              </p>
            </div>

            <div
              className="glass-panel"
              style={{
                padding: 22,
                background: '#FFFFFF',
                border: (stats.pending_organizers_count || 0) > 0 ? '1.5px solid #F59E0B' : '1px solid var(--soft-border)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Pending Organizers</span>
              <p
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: (stats.pending_organizers_count || 0) > 0 ? '#D97706' : '#10B981',
                  marginTop: 4,
                }}
              >
                {stats.pending_organizers_count || 0}
              </p>
            </div>
          </div>

          {/* Pending Organizer Registrations Requiring Review */}
          <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Organizer Registrations Pending Approval ({pendingOrganizers.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', margin: '4px 0 0 0' }}>
                  New organizers must be approved once. Once approved, they can log in anytime with just their email OTP.
                </p>
              </div>
            </div>

            {pendingOrganizers.length === 0 ? (
              <p style={{ color: 'var(--muted-text)', margin: 0 }}>
                All organizer registrations have been reviewed. No pending approvals.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendingOrganizers.map((org) => (
                  <div
                    key={org.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-amber" style={{ fontWeight: 800 }}>
                          PENDING ORGANIZER
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                          Registered: {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0 4px 0' }}>
                        {org.first_name || org.last_name ? `${org.first_name} ${org.last_name}` : org.username}
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--muted-text)', marginLeft: 8 }}>
                          (@{org.username})
                        </span>
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', margin: 0 }}>
                        <strong>Email:</strong> {org.email} &bull; <strong>Organization:</strong> {org.organizer_profile?.organization_name || 'N/A'} ({org.organizer_profile?.designation || 'Lead'}) &bull; <strong>Dept:</strong> {org.organizer_profile?.department_name || 'Campus Wide'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleApproveOrganizer(org.id, org.username)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Approve Organizer
                      </button>
                      <button
                        onClick={() => handleRejectOrganizer(org.id, org.username)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Pending Approvals list */}
          <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>
              Pending Event Approvals Requiring Review
            </h3>
            {pendingEvents.length === 0 ? (
              <p style={{ color: 'var(--muted-text)' }}>All events have been reviewed. No pending approvals.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div>
                      <span className="badge badge-amber">{ev.category_name}</span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>{ev.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>
                        Proposed by {ev.organizer_name} • {ev.start_date} at {ev.venue_name}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => {
                          setSelectedEventToEdit(ev);
                          setEditModalOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleApproveEvent(ev.id)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#16A34A' }}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEventToReject(ev);
                          setRejectModalOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#DC2626' }}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Master Event Management */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Master Event Management</h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>
                Full administrative authority to edit, reschedule, republish, or remove any event on the platform.
              </p>
            </div>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder="Search events by title or venue..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 12, border: '1px solid var(--soft-border)', background: '#FFFFFF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, background: '#FFFFFF', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--soft-border)', color: 'var(--muted-text)' }}>
                  <th style={{ padding: '12px 14px' }}>Event Title</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Organizer</th>
                  <th style={{ padding: '12px 14px' }}>Venue</th>
                  <th style={{ padding: '12px 14px' }}>Start Date</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {allEvents
                  .filter((ev) =>
                    ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                    (ev.venue_name && ev.venue_name.toLowerCase().includes(eventSearch.toLowerCase()))
                  )
                  .map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid var(--soft-border)' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--dark-navy)' }}>
                        {ev.title}
                      </td>
                      <td style={{ padding: '14px' }}>{ev.category_name}</td>
                      <td style={{ padding: '14px' }}>{ev.organizer_name || 'Admin'}</td>
                      <td style={{ padding: '14px' }}>{ev.venue_name || 'TBA'}</td>
                      <td style={{ padding: '14px' }}>{ev.start_date}</td>
                      <td style={{ padding: '14px' }}>
                        <span className={`badge ${
                          ev.status === 'PUBLISHED' ? 'badge-green' :
                          ev.status === 'PENDING_APPROVAL' ? 'badge-amber' :
                          ev.status === 'REJECTED' ? 'badge-red' : 'badge-purple'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Link to={`/events/${ev.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            View
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedEventToEdit(ev);
                              setEditModalOpen(true);
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#DC2626' }}
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Clubs & Associations */}
      {activeTab === 'clubs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Campus Clubs & Associations Registry</h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>
                All officially chartered student societies, technical chapters, and departmental wings.
              </p>
            </div>
            <button
              onClick={() => setCreateClubModalOpen(true)}
              className="btn-primary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <PlusCircle size={16} />
              + Establish Club / Association
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {clubs.map((c) => (
              <div
                key={c.id}
                className="glass-panel"
                style={{ padding: 22, background: '#FFFFFF', borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #A855F7, #8B9DFF)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        overflow: 'hidden',
                      }}
                    >
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        c.name[0]
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-navy)' }}>{c.name}</h4>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{c.category}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--muted-text)', lineHeight: 1.5, marginBottom: 14 }}>
                    {c.tagline || (c.description ? c.description.slice(0, 90) + '...' : '')}
                  </p>
                </div>

                <div style={{ paddingTop: 14, borderTop: '1px solid var(--soft-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 600 }}>
                    {c.members_count || 1} Members
                  </span>
                  <Link
                    to={`/clubs/${c.id}`}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    View Page →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Approvals View */}
      {activeTab === 'approvals' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>Event Approval Queue</h3>
          {pendingEvents.length === 0 ? (
            <p style={{ color: 'var(--muted-text)' }}>No events currently pending review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingEvents.map((ev) => (
                <div key={ev.id} style={{ padding: 20, borderRadius: 18, background: 'var(--bg-primary)', border: '1px solid var(--soft-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-purple">{ev.category_name}</span>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>{ev.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginTop: 4 }}>{ev.short_description}</p>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: 8, display: 'flex', gap: 16 }}>
                        <span><strong>Dates:</strong> {ev.start_date} to {ev.end_date}</span>
                        <span><strong>Venue:</strong> {ev.venue_name}</span>
                        <span><strong>Max Cap:</strong> {ev.max_participants}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleApproveEvent(ev.id)} className="btn-primary" style={{ padding: '10px 18px', background: '#16A34A' }}>
                        <Check size={16} /> Approve & Publish
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEventToReject(ev);
                          setRejectModalOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: '10px 18px', color: '#DC2626' }}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>User Accounts Management</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--soft-border)', fontWeight: 600 }}
              >
                <option value="ALL">All Roles</option>
                <option value="PENDING_ORGANIZERS">Pending Organizers ⏳</option>
                <option value="STUDENT">Students</option>
                <option value="ORGANIZER">Organizers</option>
                <option value="ADMIN">Admins</option>
              </select>

              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--soft-border)' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--soft-border)', color: 'var(--muted-text)' }}>
                  <th style={{ padding: '12px' }}>User</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Roll / Organization</th>
                  <th style={{ padding: '12px' }}>Approval</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--soft-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{u.first_name || u.username}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-purple">{u.role}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--muted-text)' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      {u.student_profile?.roll_number || u.organizer_profile?.organization_name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.role === 'ORGANIZER' ? (
                        u.is_approved ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Approved
                          </span>
                        ) : (
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Pending Approval
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--muted-text)', fontSize: '0.8rem' }}>Pre-Approved</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${u.is_active_user ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active_user ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.role === 'ORGANIZER' && !u.is_approved && (
                          <button
                            type="button"
                            onClick={() => handleApproveOrganizer(u.id, u.username)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Approve organizer registration"
                          >
                            <Check size={12} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', color: u.is_active_user ? '#DC2626' : '#16A34A' }}
                        >
                          {u.is_active_user ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>System Audit & Activity Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{log.action}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: 2 }}>{log.details}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                  <p>{log.username || 'System'}</p>
                  <p>{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(23, 21, 43, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setRejectModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 28, background: '#FFFFFF', borderRadius: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>Reject Event Proposal</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginBottom: 16 }}>
              Provide the organizer with constructive feedback explaining why revision is required.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Schedule conflicts with College Convocation; please reschedule venue."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--soft-border)', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRejectModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleRejectEvent} className="btn-primary" style={{ flex: 1.5, background: '#DC2626' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Event Modal */}
      {editModalOpen && selectedEventToEdit && (
        <EditEventModal
          event={selectedEventToEdit}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedEventToEdit(null);
          }}
          onSaved={(updated) => {
            setAllEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
            setPendingEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
          }}
        />
      )}

      {/* Admin Create Club Modal */}
      {createClubModalOpen && (
        <CreateClubModal
          isOpen={createClubModalOpen}
          onClose={() => setCreateClubModalOpen(false)}
          onClubCreated={(newClub) => {
            setClubs((prev) => [newClub, ...prev]);
            if (stats) setStats({ ...stats, total_clubs: stats.total_clubs + 1 });
          }}
        />
      )}
    </div>
  );
};
