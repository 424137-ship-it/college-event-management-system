import React, { useState, useEffect } from 'react';
import { X, Building2, PlusCircle, Check, Image, Sparkles } from 'lucide-react';
import { clubsAPI, authAPI } from '../../services/api';
import { toast } from 'react-toastify';

export const CreateClubModal = ({ isOpen, onClose, onClubCreated }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewDepartment, setIsNewDepartment] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    category: 'Technical',
    description: '',
    logo_url: '',
    cover_url: '',
    department: '',
    department_name: '',
    department_code: '',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchDepts = async () => {
        try {
          const res = await authAPI.getDepartments();
          const list = res.data.results || res.data || [];
          setDepartments(list);
          if (list.length > 0) {
            setFormData((prev) => ({ ...prev, department: list[0].id }));
          }
        } catch (err) {
          console.error('Error fetching departments:', err);
        }
      };
      fetchDepts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Club or Association name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        tagline: formData.tagline.trim(),
        category: formData.category,
        description: formData.description.trim() || `${formData.name} official campus student chapter and community.`,
        logo_url: formData.logo_url.trim() || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
        cover_url: formData.cover_url.trim() || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&fit=crop&q=80',
      };

      const res = await clubsAPI.createClub(payload);
      toast.success(`Club / Association '${res.data.name}' created successfully!`);
      if (onClubCreated) onClubCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.name?.[0] || err.response?.data?.error || 'Failed to create club.');
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
          maxWidth: 640,
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
            NEW STUDENT CHAPTER / COUNCIL
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Establish a Club or Department Association
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', marginTop: 4 }}>
            Create and lead a recognized campus society to organize authorized events and recruit members.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Club / Association Name
              </label>
              <input
                type="text"
                required
                name="name"
                placeholder="e.g. Google Developer Student Club"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Arts & Literature">Arts & Literature</option>
                <option value="Department Association">Department Association</option>
                <option value="Social & Community">Social & Community</option>
              </select>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              Motto / Tagline
            </label>
            <input
              type="text"
              name="tagline"
              placeholder="e.g. Innovate, Collaborate, Elevate"
              value={formData.tagline}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              Club Description & Objectives
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Describe the mission, activities, and purpose of your club or association..."
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', resize: 'vertical' }}
            />
          </div>

          {/* Image URLs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Logo URL (Optional)
              </label>
              <input
                type="url"
                name="logo_url"
                placeholder="https://images.unsplash.com/..."
                value={formData.logo_url}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Cover Banner URL (Optional)
              </label>
              <input
                type="url"
                name="cover_url"
                placeholder="https://images.unsplash.com/..."
                value={formData.cover_url}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '12px 22px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <PlusCircle size={18} />
              {loading ? 'Creating Club...' : 'Launch Club / Association'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
