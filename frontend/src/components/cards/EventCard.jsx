import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Bookmark, ArrowRight, CheckCircle2 } from 'lucide-react';
import { eventsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const EventCard = ({ event, onSaveToggle }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(event.is_saved || false);
  const [saving, setSaving] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please sign in to save events.');
      return;
    }
    setSaving(true);
    try {
      const res = await eventsAPI.saveToggle(event.id);
      setIsSaved(res.data.is_saved);
      toast.success(res.data.message);
      if (onSaveToggle) onSaveToggle(event.id, res.data.is_saved);
    } catch (err) {
      toast.error('Could not bookmark event.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#FFFFFF',
      }}
    >
      {/* Poster Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={event.poster_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&fit=crop&q=80'}
          alt={event.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          className="event-card-img"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(23,21,43,0.1) 0%, rgba(23,21,43,0.65) 100%)',
          }}
        />

        {/* Category Badge */}
        <span
          className="badge badge-purple"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {event.category_name || 'General'}
        </span>

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          disabled={saving}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: isSaved ? '#A855F7' : 'rgba(255, 255, 255, 0.9)',
            color: isSaved ? '#FFFFFF' : 'var(--dark-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          title={isSaved ? 'Remove bookmark' : 'Save event'}
        >
          <Bookmark size={16} fill={isSaved ? '#FFFFFF' : 'none'} />
        </button>

        {/* Registered status indicator */}
        {event.is_registered && (
          <span
            className="badge badge-green"
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(34, 197, 94, 0.95)',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            <CheckCircle2 size={13} /> Registered
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--dark-navy)',
            marginBottom: 8,
            lineHeight: 1.35,
          }}
        >
          {event.title}
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted-text)',
            marginBottom: 16,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.short_description || event.description}
        </p>

        {/* Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--muted-text)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--primary-purple)" />
            <span>{formattedDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={15} color="var(--accent-blue)" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.venue_name || 'Auditorium'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="#10B981" />
            <span>
              {event.registered_count || 0} / {event.max_participants} registered
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <Link
            to={`/events/${event.id}`}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
          >
            Details
          </Link>
          <Link
            to={`/events/${event.id}`}
            className="btn-primary"
            style={{ flex: 1.2, padding: '10px 14px', fontSize: '0.85rem' }}
          >
            {event.is_registered ? 'View Ticket' : 'Register'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
