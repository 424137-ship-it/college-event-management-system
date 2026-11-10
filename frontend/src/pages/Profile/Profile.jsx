import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, BookOpen, Sparkles, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    year_of_study: 1,
    avatar_url: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        bio: user.student_profile?.bio || '',
        year_of_study: user.student_profile?.year_of_study || 1,
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      <div className="glass-panel" style={{ padding: 36, background: '#FFFFFF', borderRadius: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--soft-border)' }}>
          <img
            src={formData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80'}
            alt="Avatar"
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--light-violet)' }}
          />
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              {formData.first_name || user?.username} {formData.last_name}
            </h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span className="badge badge-purple">{user?.role}</span>
              {user?.student_profile?.roll_number && (
                <span className="badge badge-blue">{user.student_profile.roll_number}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Avatar Image URL</label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>Bio / About Me</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: 'fit-content', padding: '12px 28px', marginTop: 10 }}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
