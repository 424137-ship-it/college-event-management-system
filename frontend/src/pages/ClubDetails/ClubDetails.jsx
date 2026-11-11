import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Calendar, ArrowLeft, UserCheck, UserPlus, Megaphone,
  Award, ShieldCheck, Mail, MapPin
} from 'lucide-react';
import { clubsAPI, eventsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/cards/EventCard';
import { toast } from 'react-toastify';
import { FALLBACK_CLUBS, FALLBACK_EVENTS } from '../../utils/fallbackData';

export const ClubDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const [clubRes, membersRes, notifRes, eventsRes] = await Promise.all([
          clubsAPI.getById(id).catch(() => null),
          clubsAPI.getMembers(id).catch(() => ({ data: [] })),
          clubsAPI.getAnnouncements(id).catch(() => ({ data: [] })),
          eventsAPI.getAll({ club: id }).catch(() => ({ data: [] })),
        ]);
        if (clubRes?.data) {
          setClub(clubRes.data);
          setIsJoined(clubRes.data.is_joined || false);
          setMembers(membersRes?.data || []);
          setAnnouncements(notifRes?.data || []);
          setClubEvents(eventsRes?.data?.results || eventsRes?.data || []);
        } else {
          const fallback = FALLBACK_CLUBS.find((c) => String(c.id) === String(id) || c.slug === String(id)) || FALLBACK_CLUBS[0];
          setClub(fallback);
          setMembers([
            { id: 101, user_full_name: 'Harsha Vardhan (President)', role: 'PRESIDENT', department_name: 'CSE' },
            { id: 102, user_full_name: 'Kavya S. (Secretary)', role: 'SECRETARY', department_name: 'ECE' },
            { id: 103, user_full_name: 'Rohit Verma (Technical Lead)', role: 'LEAD', department_name: 'CSE' },
          ]);
          setAnnouncements([
            { id: 1, title: 'Orientation & Call for Executive Core Members', message: 'Applications are now open for core student team positions for academic year 2026-27.', created_at: new Date().toISOString() }
          ]);
          const relatedEvents = FALLBACK_EVENTS.filter((e) => e.club_name.toLowerCase().includes(fallback.name.toLowerCase().slice(0, 5)));
          setClubEvents(relatedEvents.length > 0 ? relatedEvents : [FALLBACK_EVENTS[0]]);
        }
      } catch (err) {
        console.warn('Backend connecting; using fallback club profile for NIT...', err);
        const fallback = FALLBACK_CLUBS.find((c) => String(c.id) === String(id) || c.slug === String(id)) || FALLBACK_CLUBS[0];
        setClub(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id]);

  const handleJoinToggle = async () => {
    if (!user) {
      toast.info('Please sign in to join clubs.');
      return;
    }
    setActionLoading(true);
    try {
      if (isJoined) {
        await clubsAPI.leave(id);
        setIsJoined(false);
        setClub((prev) => ({ ...prev, members_count: Math.max(0, (prev.members_count || 1) - 1) }));
        setMembers((prev) => prev.filter((m) => m.user !== user.id));
        toast.info(`Left ${club.name}`);
      } else {
        await clubsAPI.join(id);
        setIsJoined(true);
        setClub((prev) => ({ ...prev, members_count: (prev.members_count || 0) + 1 }));
        setMembers((prev) => [
          ...prev,
          {
            id: Date.now(),
            user: user.id,
            username: user.username,
            full_name: user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username,
            role: 'MEMBER',
          },
        ]);
        toast.success(`Joined ${club.name}!`);
      }
    } catch (err) {
      toast.error('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--muted-text)' }}>
        Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
        <h2>Club not found</h2>
        <Link to="/clubs" className="btn-primary" style={{ marginTop: 20 }}>
          Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Back button */}
      <Link
        to="/clubs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.9rem',
          color: 'var(--muted-text)',
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={16} /> Back to Communities
      </Link>

      {/* Club Banner Header */}
      <div
        className="glass-panel"
        style={{
          overflow: 'hidden',
          borderRadius: 28,
          marginBottom: 36,
          background: '#FFFFFF',
        }}
      >
        <div style={{ height: 220, position: 'relative' }}>
          <img
            src={club.cover_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&fit=crop&q=80'}
            alt={club.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(23, 21, 43, 0.45)' }} />
          <span
            className="badge badge-purple"
            style={{ position: 'absolute', top: 20, right: 20, background: '#FFFFFF' }}
          >
            {club.category}
          </span>
        </div>

        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginTop: -50, marginBottom: 20 }}>
            <img
              src={club.logo_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&fit=crop&q=80'}
              alt="Logo"
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                objectFit: 'cover',
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              }}
            />
            <button
              onClick={handleJoinToggle}
              disabled={actionLoading}
              className={isJoined ? 'btn-secondary' : 'btn-primary'}
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              {isJoined ? <UserCheck size={18} /> : <UserPlus size={18} />}
              {isJoined ? 'Member of Club' : 'Join This Community'}
            </button>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {club.name}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--primary-purple)', fontWeight: 600, marginTop: 4, marginBottom: 16 }}>
            {club.tagline}
          </p>

          <p style={{ fontSize: '0.95rem', color: 'var(--muted-text)', lineHeight: 1.7, maxWidth: 800 }}>
            {club.description}
          </p>

          {/* Leaders & Stats Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--soft-border)',
              fontSize: '0.9rem',
              color: 'var(--muted-text)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--primary-purple)" />
              <span><strong>{club.members_count || 0}</strong> Active Members</span>
            </div>
            {club.president_name && (
              <Link
                to={`/organizers/${club.president || 1}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '4px 10px',
                  borderRadius: 10,
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  transition: 'all 0.2s',
                }}
                title="View President Profile & Past Events"
              >
                <ShieldCheck size={18} color="var(--primary-purple)" />
                <span>
                  President: <strong style={{ color: 'var(--primary-purple)', textDecoration: 'underline' }}>{club.president_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginLeft: 6 }}>• View Events →</span>
                </span>
              </Link>
            )}
            {club.faculty_coordinator_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#10B981" />
                <span>Mentor: <strong>{club.faculty_coordinator_name}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--soft-border)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'events' ? 'var(--primary-purple)' : 'transparent',
            color: activeTab === 'events' ? '#FFFFFF' : 'var(--muted-text)',
          }}
        >
          Club Events ({clubEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'announcements' ? 'var(--primary-purple)' : 'transparent',
            color: activeTab === 'announcements' ? '#FFFFFF' : 'var(--muted-text)',
          }}
        >
          Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'members' ? 'var(--primary-purple)' : 'transparent',
            color: activeTab === 'members' ? '#FFFFFF' : 'var(--muted-text)',
          }}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        clubEvents.length === 0 ? (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center', background: '#FFFFFF' }}>
            <Calendar size={36} color="var(--light-violet)" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ color: 'var(--muted-text)' }}>No upcoming events scheduled yet for this club.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {clubEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )
      )}

      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.length === 0 ? (
            <div className="glass-panel" style={{ padding: 40, textAlign: 'center', background: '#FFFFFF' }}>
              <Megaphone size={36} color="var(--light-violet)" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--muted-text)' }}>No announcements posted yet.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="glass-panel"
                style={{ padding: 24, background: '#FFFFFF', position: 'relative' }}
              >
                {ann.is_pinned && (
                  <span
                    className="badge badge-purple"
                    style={{ position: 'absolute', top: 20, right: 20 }}
                  >
                    PINNED NOTICE
                  </span>
                )}
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 8 }}>
                  {ann.title}
                </h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--muted-text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {ann.content}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: 14 }}>
                  Posted by {ann.author_name || 'Executive Lead'} • {new Date(ann.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: 24, background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Community Members</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                    {m.full_name || m.username}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                    @{m.username}
                  </p>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
