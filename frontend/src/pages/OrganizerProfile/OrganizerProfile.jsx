import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Award,
  Mail,
  Building2,
  Sparkles,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Share2,
  FolderCheck,
  User,
  Phone,
  Layers,
} from 'lucide-react';
import { usersAPI } from '../../services/api';
import { EventCard } from '../../components/cards/EventCard';
import { toast } from 'react-toastify';
import { FALLBACK_EVENTS } from '../../utils/fallbackData';

export const OrganizerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'past'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getPublicProfile(id);
        setProfile(res.data);
      } catch (err) {
        console.warn('Could not load organizer profile from API, loading fallback student leader profile...', err);
        // Fallback for offline/preview demo
        const fallbackEvents = FALLBACK_EVENTS;
        const now = new Date();
        const upcoming = fallbackEvents.filter((e) => new Date(e.start_date) >= now);
        const past = fallbackEvents.filter((e) => new Date(e.start_date) < now);

        setProfile({
          id: id || 2,
          username: 'organizer',
          full_name: 'V. Harsha Vardhan',
          email: 'president.coding@nit.ac.in',
          phone: '+91 9876543210',
          role: 'ORGANIZER',
          avatar_url: '',
          department: 'Department of Computer Science & Engineering, NIT',
          roll_number: '424137',
          year_of_study: 4,
          bio: 'Final year CSE undergraduate and President of the Coding Club, National Institute of Technology (NIT). Dedicated to fostering competitive programming, hackathon culture, and technical excellence across campus.',
          organization_name: 'Coding Club & Student Affairs Council',
          designation: 'Club President',
          verified: true,
          led_clubs: [
            {
              id: 1,
              name: 'Coding Club',
              category: 'Technical',
              tagline: 'Building the next generation of engineers & builders',
              members_count: 142,
              role: 'President',
            },
            {
              id: 2,
              name: 'ACM Student Chapter',
              category: 'Technical',
              tagline: 'National Institute of Technology Student Chapter',
              members_count: 98,
              role: 'President',
            },
          ],
          stats: {
            total_events: fallbackEvents.length,
            total_attendees: 384,
            upcoming_count: upcoming.length,
            past_count: past.length,
            clubs_led_count: 2,
          },
          events: fallbackEvents,
          upcoming_events: upcoming,
          past_events: past,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Leader profile link copied to clipboard!');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '60px auto', textAlign: 'center', padding: '0 24px' }}>
        <div className="skeleton-line" style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px auto' }} />
        <div className="skeleton-line" style={{ width: 280, height: 28, margin: '0 auto 12px auto' }} />
        <div className="skeleton-line" style={{ width: 420, height: 18, margin: '0 auto' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: '0 24px' }}>
        <h2>President / Organizer profile not found</h2>
        <Link to="/events" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
          Explore Campus Events
        </Link>
      </div>
    );
  }

  const displayedEvents =
    activeTab === 'upcoming'
      ? profile.upcoming_events || []
      : activeTab === 'past'
      ? profile.past_events || []
      : profile.events || [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--muted-text)',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Hero Header Card */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          marginBottom: 32,
          background: '#FFFFFF',
          boxShadow: '0 15px 45px -10px rgba(23, 21, 43, 0.1)',
        }}
      >
        {/* Banner Decorative Gradient */}
        <div
          style={{
            height: 160,
            background: 'linear-gradient(135deg, #17152B 0%, #2D2254 50%, #A855F7 100%)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              onClick={handleShareProfile}
              className="btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                border: 'none',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                fontSize: '0.8rem',
              }}
            >
              <Share2 size={14} />
              Share Profile
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 20,
              marginTop: -55,
              marginBottom: 20,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                fontWeight: 800,
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'
              )}
            </div>

            {/* Badges / Verification */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <ShieldCheck size={16} />
                Verified NIT Student Leader
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'rgba(168, 85, 247, 0.12)',
                  color: '#9333EA',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <Award size={16} />
                {profile.designation || 'Club President'}
              </span>
            </div>
          </div>

          {/* Name & Title */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)', margin: '0 0 6px 0' }}>
            {profile.full_name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.9rem', color: 'var(--muted-text)', marginBottom: 16 }}>
            {profile.department && <span>🏛️ {profile.department}</span>}
            {profile.roll_number && <span>• Roll No: <strong>{profile.roll_number}</strong></span>}
            {profile.year_of_study && <span>• Batch Year: {profile.year_of_study}th Year</span>}
          </div>

          {profile.bio && (
            <p style={{ fontSize: '0.96rem', color: '#4B5563', lineHeight: 1.65, maxWidth: 850, margin: '0 0 20px 0' }}>
              {profile.bio}
            </p>
          )}

          {/* Contact and Led Clubs preview */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderTop: '1px solid var(--soft-border)', paddingTop: 18 }}>
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Mail size={15} />
                {profile.email}
              </a>
            )}

            {/* Led Clubs Chips */}
            {profile.led_clubs && profile.led_clubs.map((c) => (
              <Link
                key={c.id}
                to={`/clubs/${c.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: 'var(--primary-purple)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Building2 size={15} />
                <span>{c.name} ({c.role})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-purple)', marginBottom: 8 }}>
            <Calendar size={20} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Events Conducted</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {profile.stats?.total_events || profile.events?.length || 0}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
            Official events successfully hosted
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10B981', marginBottom: 8 }}>
            <Users size={20} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Campus Footfall</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {profile.stats?.total_attendees || 0}+
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
            Total verified attendees engaged
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3B82F6', marginBottom: 8 }}>
            <Sparkles size={20} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming Events</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {profile.stats?.upcoming_count || profile.upcoming_events?.length || 0}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
            Scheduled for this semester
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 22, background: '#FFFFFF', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B', marginBottom: 8 }}>
            <FolderCheck size={20} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>Completed Tracks</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {profile.stats?.past_count || profile.past_events?.length || 0}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
            Historical events archived
          </p>
        </div>
      </div>

      {/* Events Showcase Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-navy)', margin: 0 }}>
              Events Conducted by {profile.full_name}
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              Explore active registrations and historical campus initiatives led by this organizer.
            </p>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#F3F4F6',
              padding: 4,
              borderRadius: 14,
              gap: 4,
            }}
          >
            {[
              { id: 'all', label: `All (${profile.events?.length || 0})` },
              { id: 'upcoming', label: `Upcoming (${profile.upcoming_events?.length || 0})` },
              { id: 'past', label: `Previous Conducted (${profile.past_events?.length || 0})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === t.id ? '#FFFFFF' : 'transparent',
                  color: activeTab === t.id ? 'var(--dark-navy)' : 'var(--muted-text)',
                  boxShadow: activeTab === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {displayedEvents.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: 60,
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: 24,
              color: 'var(--muted-text)',
            }}
          >
            <Calendar size={42} style={{ color: 'var(--muted-text)', opacity: 0.4, marginBottom: 14 }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--dark-navy)', fontSize: '1.1rem', fontWeight: 700 }}>
              No {activeTab} events found
            </h3>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              {activeTab === 'upcoming'
                ? 'There are no active upcoming events scheduled right now. Check back soon!'
                : 'No event records found in this category.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {displayedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default OrganizerProfile;
