import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowRight, UserCheck, UserPlus } from 'lucide-react';
import { clubsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const ClubCard = ({ club, onMembershipChange }) => {
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(club.is_joined || false);
  const [membersCount, setMembersCount] = useState(club.members_count || 0);
  const [loading, setLoading] = useState(false);

  const handleJoinToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please sign in to join campus clubs.');
      return;
    }
    setLoading(true);
    try {
      if (isJoined) {
        await clubsAPI.leave(club.id);
        setIsJoined(false);
        setMembersCount((prev) => Math.max(0, prev - 1));
        toast.info(`Left ${club.name}`);
      } else {
        await clubsAPI.join(club.id);
        setIsJoined(true);
        setMembersCount((prev) => prev + 1);
        toast.success(`Joined ${club.name}!`);
      }
      if (onMembershipChange) onMembershipChange(club.id, !isJoined);
    } catch (err) {
      toast.error('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        position: 'relative',
      }}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', height: 120 }}>
        <img
          src={club.cover_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&fit=crop&q=80'}
          alt={club.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(23, 21, 43, 0.4)' }} />
        
        {/* Category badge */}
        <span
          className="badge badge-purple"
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255, 255, 255, 0.95)' }}
        >
          {club.category}
        </span>
      </div>

      {/* Logo & Content */}
      <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -30, marginBottom: 14 }}>
          <img
            src={club.logo_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&fit=crop&q=80'}
            alt="logo"
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              objectFit: 'cover',
              border: '3px solid #FFFFFF',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <button
            onClick={handleJoinToggle}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isJoined ? '#F3EEFF' : '#A855F7',
              color: isJoined ? '#9333EA' : '#FFFFFF',
              border: isJoined ? '1px solid #D8B4FE' : 'none',
            }}
          >
            {isJoined ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {isJoined ? 'Joined' : 'Join Club'}
          </button>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 4 }}>
          {club.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--primary-purple)', fontWeight: 600, marginBottom: 8 }}>
          {club.tagline}
        </p>

        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--muted-text)',
            marginBottom: 16,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {club.description}
        </p>

        {/* Counts */}
        <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--muted-text)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="var(--primary-purple)" />
            <span>{membersCount} Members</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color="var(--accent-blue)" />
            <span>{club.upcoming_events_count || 0} Events</span>
          </div>
        </div>

        {/* View Details */}
        <Link
          to={`/clubs/${club.id}`}
          className="btn-secondary"
          style={{ marginTop: 'auto', width: '100%', padding: '10px', fontSize: '0.85rem' }}
        >
          View Community
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
