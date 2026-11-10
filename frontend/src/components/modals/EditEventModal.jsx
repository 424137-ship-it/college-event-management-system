import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, MapPin, Users, DollarSign, Image, Check, AlertCircle } from 'lucide-react';
import { eventsAPI, clubsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const EditEventModal = ({ event, isOpen, onClose, onSaved }) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    club: '',
    venue: '',
    short_description: '',
    description: '',
    poster_url: '',
    start_date: '',
    end_date: '',
    start_time: '10:00:00',
    end_time: '17:00:00',
    registration_deadline: '',
    max_participants: 150,
    registration_fee: '0.00',
    eligibility: 'Open to all students',
    rules: '',
    status: 'PUBLISHED',
    is_featured: false,
    contact_email: '',
    student_coordinator_name: '',
    student_coordinator_contact: '',
  });

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        try {
          const [venRes, catRes, clbRes] = await Promise.all([
            eventsAPI.getVenues(),
            eventsAPI.getCategories(),
            clubsAPI.getAll(),
          ]);
          setVenues(venRes.data.results || venRes.data || []);
          setCategories(catRes.data.results || catRes.data || []);
          setClubs(clbRes.data.results || clbRes.data || []);
        } catch (err) {
          console.error('Error fetching edit options:', err);
        }
      };
      loadOptions();

      if (event) {
        setFormData({
          title: event.title || '',
          category: event.category || '',
          club: event.club || '',
          venue: event.venue || '',
          short_description: event.short_description || '',
          description: event.description || '',
          poster_url: event.poster_url || '',
          start_date: event.start_date || '',
          end_date: event.end_date || '',
          start_time: event.start_time || '10:00:00',
          end_time: event.end_time || '17:00:00',
          registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : '',
          max_participants: event.max_participants || 100,
          registration_fee: event.registration_fee || '0.00',
          eligibility: event.eligibility || 'Open to all students',
          rules: event.rules || '',
          status: event.status || 'PUBLISHED',
          is_featured: !!event.is_featured,
          contact_email: event.contact_email || '',
          student_coordinator_name: event.student_coordinator_name || '',
          student_coordinator_contact: event.student_coordinator_contact || '',
        });
      }
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        category: formData.category || null,
        club: formData.club || null,
        venue: formData.venue || null,
        registration_deadline: formData.registration_deadline
          ? (formData.registration_deadline.includes('T') ? formData.registration_deadline : `${formData.registration_deadline}T23:59:59Z`)
          : `${formData.start_date}T23:59:59Z`,
      };

      const res = await eventsAPI.update(event.id, payload);
      toast.success(`Event '${formData.title}' updated successfully!`);
      if (onSaved) onSaved(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(23, 21, 43, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--muted-text)',
            cursor: 'pointer',
          }}
        >
          <X size={24} />
        </button>

        <div style={{ marginBottom: 24 }}>
          <span className="badge badge-purple" style={{ marginBottom: 8 }}>
            {isAdmin ? 'ADMINISTRATIVE OVERRIDE' : 'EVENT EDITOR'}
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Edit Event: {event.title}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', marginTop: 4 }}>
            Update event information, timings, venue scheduling, fee, and publishing status.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              Event Title
            </label>
            <input
              type="text"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
            />
          </div>

          {/* Category, Club, Venue */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Host Club / Council</label>
              <select
                name="club"
                value={formData.club}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              >
                <option value="">Independent / Department Event</option>
                {clubs.map((cl) => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Venue Location</label>
              <select
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              >
                <option value="">Select Venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Times */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Start Date</label>
              <input
                type="date"
                required
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>End Date</label>
              <input
                type="date"
                required
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Start Time</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>End Time</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
          </div>

          {/* Capacity, Fee & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Max Participants</label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Fee (₹ 0 for free)</label>
              <input
                type="text"
                name="registration_fee"
                value={formData.registration_fee}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontWeight: 700 }}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="PUBLISHED">PUBLISHED (Live)</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Poster URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Poster Banner Image URL</label>
            <input
              type="url"
              name="poster_url"
              placeholder="https://..."
              value={formData.poster_url}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Full Description</label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', resize: 'vertical' }}
            />
          </div>

          {/* Rules & Eligibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Eligibility</label>
              <input
                type="text"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Rules</label>
              <input
                type="text"
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
          </div>

          {/* Admin Featured Toggle */}
          {isAdmin && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-purple)' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-navy)' }}>
                Feature this event on Homepage Carousel & Top Highlights
              </span>
            </label>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '12px 24px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={18} />
              {loading ? 'Saving Changes...' : 'Save & Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
