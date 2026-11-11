import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Calendar, Users, QrCode, DollarSign,
  Briefcase, BarChart3, Settings, ArrowRight, CheckCircle2, XCircle,
  Clock, Download, FileSpreadsheet, ShieldAlert, Sparkles, AlertCircle,
  Edit3, Building2, UserCheck, RefreshCw, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  reportsAPI, eventsAPI, attendanceAPI, budgetsAPI, clubsAPI, registrationsAPI
} from '../../services/api';
import { EditEventModal } from '../../components/modals/EditEventModal';
import { CreateClubModal } from '../../components/modals/CreateClubModal';
import { toast } from 'react-toastify';

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [eventTrends, setEventTrends] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registrations & Attendee Approvals State
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [selectedRegEvent, setSelectedRegEvent] = useState('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');
  const [approvalProcessingId, setApprovalProcessingId] = useState(null);

  // Attendance scanner state
  const [ticketInput, setTicketInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Budget & Expenses state
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'MATERIALS',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Create Event Wizard State (5 Steps)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState(null);
  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    category: '',
    club: '',
    description: '',
    poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&fit=crop&q=80',
    start_date: '',
    end_date: '',
    start_time: '10:00:00',
    end_time: '17:00:00',
    registration_deadline: '',
    venue: '',
    max_participants: 150,
    registration_fee: '0.00',
    requires_approval: false,
    eligibility: 'Open to all college students',
    rules: '',
    student_coordinator_name: '',
    student_coordinator_contact: '',
    contact_email: '',
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, eventsRes, venRes, catRes, clubsRes, budgetsRes, sponRes] = await Promise.all([
          reportsAPI.getOrganizerStats(),
          eventsAPI.getAll({ scope: 'organizer' }),
          eventsAPI.getVenues(),
          eventsAPI.getCategories(),
          clubsAPI.getAll(),
          budgetsAPI.getBudgets(),
          budgetsAPI.getSponsorships(),
        ]);

        setStats(statsRes.data.stats);
        setEventTrends(statsRes.data.event_trends || []);
        setCategoryDist(statsRes.data.category_distribution || []);
        setMyEvents(eventsRes.data.results || eventsRes.data || []);
        setVenues(venRes.data.results || venRes.data || []);
        const catList = catRes.data.results || catRes.data || [];
        setCategories(catList);
        const clubList = clubsRes.data.results || clubsRes.data || [];
        setClubs(clubList);

        const bList = budgetsRes.data.results || budgetsRes.data || [];
        setBudgets(bList);
        if (bList.length > 0) {
          setSelectedBudget(bList[0]);
          setExpenses(bList[0].expenses || []);
        }

        setSponsorships(sponRes.data.results || sponRes.data || []);

        if (catList.length > 0) {
          setEventFormData((prev) => ({ ...prev, category: catList[0].id }));
        }
        if (venRes.data.length > 0) {
          setEventFormData((prev) => ({ ...prev, venue: venRes.data[0].id }));
        }
        if (clubList.length > 0) {
          setEventFormData((prev) => ({ ...prev, club: clubList[0].id }));
        }
      } catch (err) {
        console.error('Error loading organizer data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const loadRegistrations = async () => {
    setRegLoading(true);
    try {
      const params = { scope: 'organizer' };
      if (selectedRegEvent !== 'ALL') params.event_id = selectedRegEvent;
      if (regStatusFilter !== 'ALL') params.status = regStatusFilter;
      const res = await registrationsAPI.getMyRegistrations(params);
      setRegistrations(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'registrations') {
      loadRegistrations();
    }
  }, [activeTab, selectedRegEvent, regStatusFilter]);

  const handleApproveRegistration = async (regId) => {
    setApprovalProcessingId(regId);
    try {
      const res = await registrationsAPI.approve(regId);
      toast.success(res.data.message || 'Attendee registration approved! Official pass issued.');
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: 'CONFIRMED' } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve registration.');
    } finally {
      setApprovalProcessingId(null);
    }
  };

  const handleRejectRegistration = async (regId) => {
    const reason = window.prompt('Please provide a reason for declining registration (optional):') || '';
    setApprovalProcessingId(regId);
    try {
      const res = await registrationsAPI.reject(regId, { reason });
      toast.info('Attendee registration declined.');
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: 'REJECTED' } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject registration.');
    } finally {
      setApprovalProcessingId(null);
    }
  };

  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setVerifyLoading(true);
    setVerificationResult(null);
    try {
      const res = await attendanceAPI.verifyTicket({
        ticket_code: ticketInput.trim(),
        method: 'MANUAL',
      });
      setVerificationResult(res.data);
      if (res.data.already_checked_in) {
        toast.warning(res.data.message);
      } else {
        toast.success(res.data.message);
      }
      setTicketInput('');
    } catch (err) {
      setVerificationResult({
        error: err.response?.data?.error || 'Ticket verification failed.',
      });
      toast.error(err.response?.data?.error || 'Ticket invalid.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!selectedBudget) {
      toast.error('Please select an event budget first.');
      return;
    }
    try {
      const res = await budgetsAPI.createExpense({
        ...expenseForm,
        budget: selectedBudget.id,
        amount: parseFloat(expenseForm.amount),
      });
      toast.success('Expense recorded successfully!');
      setExpenses((prev) => [res.data, ...prev]);
      setExpenseModalOpen(false);
      setExpenseForm({ title: '', category: 'MATERIALS', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) {
      toast.error('Failed to create expense.');
    }
  };

  const handleEventWizardSubmit = async (statusToSet = 'PENDING_APPROVAL') => {
    try {
      const payload = {
        ...eventFormData,
        status: statusToSet,
        registration_deadline: eventFormData.registration_deadline || `${eventFormData.start_date}T23:59:59Z`,
      };
      const res = await eventsAPI.create(payload);
      toast.success(
        statusToSet === 'PENDING_APPROVAL'
          ? 'Event submitted for administrative review!'
          : 'Event draft saved successfully!'
      );
      setMyEvents((prev) => [res.data, ...prev]);
      setActiveTab('manage');
      setWizardStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create event. Please check inputs.');
    }
  };

  const COLORS = ['#A855F7', '#8B9DFF', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Top Header */}
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
          <span className="badge badge-purple" style={{ marginBottom: 8 }}>ORGANIZER CONSOLE</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Welcome, {user?.first_name || user?.username}
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            {user?.organizer_profile?.organization_name || 'Campus Event Operations Council'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateClubModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderColor: 'var(--primary-purple)', color: 'var(--primary-purple)', fontWeight: 700 }}
          >
            <Building2 size={18} />
            + Create Club / Association
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setWizardStep(1);
            }}
            className="btn-primary"
            style={{ padding: '12px 24px' }}
          >
            <PlusCircle size={18} />
            Create New Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 28, borderBottom: '1px solid var(--soft-border)', paddingBottom: 12 }}>
        {[
          { id: 'overview', label: 'Overview Analytics', icon: <BarChart3 size={16} /> },
          { id: 'manage', label: 'Manage Events', icon: <Calendar size={16} /> },
          { id: 'registrations', label: 'Attendee Approvals', icon: <UserCheck size={16} /> },
          { id: 'clubs', label: 'My Clubs & Associations', icon: <Building2 size={16} /> },
          { id: 'attendance', label: 'QR Attendance Scanner', icon: <QrCode size={16} /> },
          { id: 'budget', label: 'Budget & Expenses (₹)', icon: <DollarSign size={16} /> },
          { id: 'sponsorships', label: 'Sponsorships', icon: <Briefcase size={16} /> },
          { id: 'create', label: 'Event Creation Wizard', icon: <PlusCircle size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              background: activeTab === t.id ? 'var(--primary-purple)' : 'transparent',
              color: activeTab === t.id ? '#FFFFFF' : 'var(--muted-text)',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview Analytics */}
      {activeTab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Total Events</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-purple)', marginTop: 4 }}>
                {stats.total_events}
              </p>
              <span className="badge badge-purple" style={{ marginTop: 8 }}>{stats.published_events} Published</span>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Total Registrations</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
                {stats.total_registrations}
              </p>
              <span className="badge badge-blue" style={{ marginTop: 8 }}>Across all events</span>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Total Attendance</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                {stats.total_attendance}
              </p>
              <span className="badge badge-green" style={{ marginTop: 8 }}>Verified check-ins</span>
            </div>

            <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 600 }}>Approved Budget</span>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)', marginTop: 4 }}>
                ₹{stats.total_budget.toLocaleString()}
              </p>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>₹{stats.total_expenses.toLocaleString()} spent</span>
            </div>
          </div>

          {/* Recharts Analytics Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }}>
            {/* Registration Trends */}
            <div className="glass-panel" style={{ padding: 24, background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
                Registration & Attendance Trends
              </h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={eventTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3EEFF" />
                    <XAxis dataKey="name" stroke="#77738B" fontSize={12} />
                    <YAxis stroke="#77738B" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#A855F7" radius={[6, 6, 0, 0]} name="Registrations" />
                    <Bar dataKey="attendance" fill="#8B9DFF" radius={[6, 6, 0, 0]} name="Attended" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-panel" style={{ padding: 24, background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
                Event Category Distribution
              </h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryDist}
                      dataKey="event_count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Events */}
      {activeTab === 'manage' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Events Created by You</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted-text)' }}>{myEvents.length} Total</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--soft-border)', color: 'var(--muted-text)' }}>
                  <th style={{ padding: '12px 14px' }}>Event Title</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                  <th style={{ padding: '12px 14px' }}>Enrolled</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myEvents.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--soft-border)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--dark-navy)' }}>
                      {ev.title}
                    </td>
                    <td style={{ padding: '14px' }}>{ev.category_name}</td>
                    <td style={{ padding: '14px' }}>{ev.start_date}</td>
                    <td style={{ padding: '14px' }}>{ev.registered_count || 0} / {ev.max_participants}</td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${
                        ev.status === 'PUBLISHED' ? 'badge-green' :
                        ev.status === 'PENDING_APPROVAL' ? 'badge-amber' :
                        ev.status === 'REJECTED' ? 'badge-red' : 'badge-purple'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Attendee Approvals & Registrations */}
      {activeTab === 'registrations' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF', borderRadius: 24 }}>
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--dark-navy)' }}>
                Attendee Registrations & Approvals
              </h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.88rem', margin: 0 }}>
                Review attendee applications for events requiring organizer clearance, check payment references, and approve digital QR tickets.
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Event filter */}
              <select
                value={selectedRegEvent}
                onChange={(e) => setSelectedRegEvent(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.85rem' }}
              >
                <option value="ALL">All My Events</option>
                {myEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review (Action Required)</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Declined</option>
              </select>

              <button
                onClick={loadRegistrations}
                disabled={regLoading}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
                title="Refresh registrations"
              >
                <RefreshCw size={14} className={regLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ padding: '14px 18px', background: '#F8F9FD', borderRadius: 16, border: '1px solid var(--soft-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 600 }}>Total Applications</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-navy)', marginTop: 4 }}>{registrations.length}</div>
            </div>
            <div style={{ padding: '14px 18px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Pending Approval</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                {registrations.filter((r) => r.status === 'PENDING').length}
              </div>
            </div>
            <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Confirmed Attendees</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {registrations.filter((r) => r.status === 'CONFIRMED').length}
              </div>
            </div>
          </div>

          {/* Registrations Table */}
          {regLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-text)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              Loading attendee records...
            </div>
          ) : registrations.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted-text)', background: 'var(--bg-primary)', borderRadius: 16 }}>
              <UserCheck size={36} style={{ color: 'var(--muted-text)', opacity: 0.5, marginBottom: 12 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>No attendee registration records found.</p>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Registrations for your organized events will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--soft-border)', color: 'var(--muted-text)' }}>
                    <th style={{ padding: '12px 14px' }}>Attendee</th>
                    <th style={{ padding: '12px 14px' }}>Event</th>
                    <th style={{ padding: '12px 14px' }}>Payment / Fee</th>
                    <th style={{ padding: '12px 14px' }}>Registered At</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--soft-border)' }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>
                          {reg.user_full_name || 'NIT Student'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                          {reg.user_roll_number ? `Roll: ${reg.user_roll_number} • ` : ''}{reg.user_email}
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>{reg.event_title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>{reg.event_start_date}</div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            background: reg.payment_status === 'PAID' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: reg.payment_status === 'PAID' ? '#A855F7' : '#059669',
                          }}
                        >
                          {reg.payment_status === 'PAID' ? 'PAID' : 'FREE'}
                        </span>
                        {reg.payment_reference && reg.payment_reference !== 'FREE_REGISTRATION' && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--muted-text)', fontFamily: 'monospace', marginTop: 4 }}>
                            {reg.payment_reference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                        {new Date(reg.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          className={`badge ${
                            reg.status === 'CONFIRMED' ? 'badge-green' :
                            reg.status === 'PENDING' ? 'badge-amber' :
                            reg.status === 'REJECTED' ? 'badge-red' : 'badge-purple'
                          }`}
                        >
                          {reg.status === 'PENDING' ? 'Pending Approval' : reg.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        {reg.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApproveRegistration(reg.id)}
                              disabled={approvalProcessingId === reg.id}
                              className="btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <CheckCircle2 size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRegistration(reg.id)}
                              disabled={approvalProcessingId === reg.id}
                              className="btn-secondary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                color: '#EF4444',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <XCircle size={13} />
                              Decline
                            </button>
                          </div>
                        ) : reg.status === 'CONFIRMED' ? (
                          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={14} /> Approved & Active
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={14} /> Declined
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Clubs & Associations */}
      {activeTab === 'clubs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Recognized Clubs & Department Associations</h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>
                Manage campus student societies, chapter details, and launch authorized student associations.
              </p>
            </div>
            <button
              onClick={() => setCreateClubModalOpen(true)}
              className="btn-primary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <PlusCircle size={16} />
              + Launch New Club / Association
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

      {/* Tab 3: QR Attendance Scanner */}
      {activeTab === 'attendance' && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: 36, background: '#FFFFFF', borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F3EEFF', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <QrCode size={28} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Digital Ticket Attendance Scanner</h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginTop: 4 }}>
                Enter the student's Registration Pass ID or scan ticket QR code to record immediate attendance.
              </p>
            </div>

            <form onSubmit={handleVerifyTicket} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 8 }}>
                  Ticket Code / Registration ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CX-1-ABC12345 or scan camera"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: '1px solid var(--soft-border)',
                    background: 'var(--bg-primary)',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                {verifyLoading ? 'Validating...' : 'Verify & Record Attendance'}
              </button>
            </form>

            {/* Verification Result Display */}
            {verificationResult && (
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  borderRadius: 16,
                  background: verificationResult.error ? '#FEF2F2' : verificationResult.already_checked_in ? '#FFFBEB' : '#ECFDF5',
                  border: `1.5px solid ${verificationResult.error ? '#FCA5A5' : verificationResult.already_checked_in ? '#FDE68A' : '#A7F3D0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {verificationResult.error ? (
                    <XCircle size={24} color="#EF4444" />
                  ) : verificationResult.already_checked_in ? (
                    <AlertCircle size={24} color="#D97706" />
                  ) : (
                    <CheckCircle2 size={24} color="#10B981" />
                  )}
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark-navy)' }}>
                    {verificationResult.error ? 'Verification Failed' : verificationResult.already_checked_in ? 'Already Checked-In' : 'Attendance Verified!'}
                  </h4>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--dark-navy)', marginTop: 8 }}>
                  {verificationResult.message || verificationResult.error}
                </p>

                {verificationResult.student_name && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: 8 }}>
                    Student: <strong>{verificationResult.student_name}</strong> • ID: {verificationResult.registration_id}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Budget & Expenses */}
      {activeTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Header & CSV export */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Budget & Financial Operations</h3>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>
                Track authorized college expenditures and sponsor funding in INR (₹).
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href={budgetsAPI.exportCSVUrl}
                download
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <FileSpreadsheet size={16} /> Export CSV
              </a>
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <PlusCircle size={16} /> Add Expense
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="glass-panel" style={{ padding: 24, background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Recorded Expenses</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--soft-border)', color: 'var(--muted-text)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Title</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Amount (₹)</th>
                    <th style={{ padding: '12px' }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--soft-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{exp.title}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-purple">{exp.category_display || exp.category}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{exp.date}</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: 'var(--dark-navy)' }}>
                        ₹{parseFloat(exp.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--muted-text)' }}>
                        {exp.created_by_name || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Sponsorships */}
      {activeTab === 'sponsorships' && (
        <div className="glass-panel" style={{ padding: 28, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>
            Event Sponsorship Partnerships
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {sponsorships.map((sp) => (
              <div
                key={sp.id}
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--soft-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="badge badge-purple">{sp.tier} Partner</span>
                  <span className="badge badge-green">{sp.status}</span>
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{sp.sponsor_name}</h4>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-purple)', margin: '8px 0' }}>
                  ₹{parseFloat(sp.amount).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>
                  Contact: {sp.contact_person}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted-text)', marginTop: 4 }}>
                  {sp.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: 5-Step Event Creation Wizard */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: 36, background: '#FFFFFF', borderRadius: 28 }}>
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, position: 'relative' }}>
              {['Basic Info', 'Schedule', 'Location & Capacity', 'Rules & Leads', 'Preview & Submit'].map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = wizardStep > stepNum;
                const isCurrent = wizardStep === stepNum;
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isDone || isCurrent ? 'var(--primary-purple)' : 'var(--bg-primary)',
                        color: isDone || isCurrent ? '#FFFFFF' : 'var(--muted-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        marginBottom: 6,
                      }}
                    >
                      {stepNum}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isCurrent ? 'var(--dark-navy)' : 'var(--muted-text)' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step 1: Basic Info */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Step 1: Basic Information</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Robotics Hackathon 2026"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Category</label>
                    <select
                      value={eventFormData.category}
                      onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Organizing Club</label>
                    <select
                      value={eventFormData.club}
                      onChange={(e) => setEventFormData({ ...eventFormData, club: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    >
                      {clubs.map((cl) => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the objective, guidelines, and highlights of this event..."
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={eventFormData.poster_url}
                    onChange={(e) => setEventFormData({ ...eventFormData, poster_url: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Step 2: Dates & Schedule</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Start Date</label>
                    <input
                      type="date"
                      required
                      value={eventFormData.start_date}
                      onChange={(e) => setEventFormData({ ...eventFormData, start_date: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>End Date</label>
                    <input
                      type="date"
                      required
                      value={eventFormData.end_date}
                      onChange={(e) => setEventFormData({ ...eventFormData, end_date: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Start Time</label>
                    <input
                      type="time"
                      value={eventFormData.start_time}
                      onChange={(e) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>End Time</label>
                    <input
                      type="time"
                      value={eventFormData.end_time}
                      onChange={(e) => setEventFormData({ ...eventFormData, end_time: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Capacity */}
            {wizardStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Step 3: Location & Participation</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Venue</label>
                  <select
                    value={eventFormData.venue}
                    onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Max Participants</label>
                    <input
                      type="number"
                      value={eventFormData.max_participants}
                      onChange={(e) => setEventFormData({ ...eventFormData, max_participants: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Registration Fee (₹)</label>
                    <input
                      type="text"
                      value={eventFormData.registration_fee}
                      onChange={(e) => setEventFormData({ ...eventFormData, registration_fee: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Rules & Coordinators */}
            {wizardStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Step 4: Rules & Coordinators</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Rules & Regulations</label>
                  <textarea
                    rows={3}
                    placeholder="Team size, equipment permitted, code of conduct..."
                    value={eventFormData.rules}
                    onChange={(e) => setEventFormData({ ...eventFormData, rules: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Student Coordinator Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Harsha Vardhan"
                      value={eventFormData.student_coordinator_name}
                      onChange={(e) => setEventFormData({ ...eventFormData, student_coordinator_name: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9123456789"
                      value={eventFormData.student_coordinator_contact}
                      onChange={(e) => setEventFormData({ ...eventFormData, student_coordinator_contact: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>

                {/* Require Organizer Approval Toggle */}
                <div style={{ padding: '14px 16px', background: 'rgba(168, 85, 247, 0.06)', borderRadius: 14, border: '1px solid rgba(168, 85, 247, 0.18)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={eventFormData.requires_approval}
                      onChange={(e) => setEventFormData({ ...eventFormData, requires_approval: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary-purple)' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                        Require Organizer Approval (Screen Attendees)
                      </span>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                        Optional: When checked, student registrations remain in 'Pending Approval' until you review and approve them.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 5: Preview & Submit */}
            {wizardStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Step 5: Event Preview</h3>
                <div style={{ padding: 20, borderRadius: 18, background: 'var(--bg-primary)', border: '1px solid var(--soft-border)' }}>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-navy)' }}>{eventFormData.title || 'Untitled Event'}</h4>
                  <p style={{ color: 'var(--muted-text)', marginTop: 6 }}>{eventFormData.description}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: '0.85rem' }}>
                    <span><strong>Dates:</strong> {eventFormData.start_date} to {eventFormData.end_date}</span>
                    <span><strong>Cap:</strong> {eventFormData.max_participants}</span>
                    <span><strong>Fee:</strong> ₹{eventFormData.registration_fee}</span>
                    <span><strong>Approval:</strong> {eventFormData.requires_approval ? 'Required' : 'Direct (Automatic)'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--soft-border)' }}>
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Previous
                </button>
              ) : <div />}

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Next Step
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleEventWizardSubmit('DRAFT')}
                    className="btn-secondary"
                    style={{ padding: '12px 20px' }}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEventWizardSubmit('PENDING_APPROVAL')}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                  >
                    Submit for Approval
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModalOpen && (
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
          onClick={() => setExpenseModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 28, background: '#FFFFFF', borderRadius: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Record New Expense</h3>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Sound Equipment"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                >
                  <option value="DECORATIONS">Decorations</option>
                  <option value="FOOD">Food & Catering</option>
                  <option value="MATERIALS">Materials</option>
                  <option value="PRINTING">Printing</option>
                  <option value="PRIZES">Prizes & Awards</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="EQUIPMENT">Equipment & Sound</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="25000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editModalOpen && selectedEventToEdit && (
        <EditEventModal
          event={selectedEventToEdit}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedEventToEdit(null);
          }}
          onSaved={(updated) => {
            setMyEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
          }}
        />
      )}

      {/* Create Club Modal */}
      {createClubModalOpen && (
        <CreateClubModal
          isOpen={createClubModalOpen}
          onClose={() => setCreateClubModalOpen(false)}
          onClubCreated={(newClub) => {
            setClubs((prev) => [newClub, ...prev]);
          }}
        />
      )}
    </div>
  );
};
