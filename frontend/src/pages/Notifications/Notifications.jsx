import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2, Ticket, Award, Calendar, Sparkles } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { toast } from 'react-toastify';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkRead = async (id, link) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'REGISTRATION':
        return <Ticket size={20} color="#8B9DFF" />;
      case 'CERTIFICATE':
        return <Award size={20} color="#F59E0B" />;
      case 'EVENT':
        return <Calendar size={20} color="#A855F7" />;
      default:
        return <Bell size={20} color="#10B981" />;
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: 8 }}>ACTIVITY INBOX</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Notifications
          </h1>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-secondary"
          style={{ padding: '10px 18px', fontSize: '0.88rem' }}
        >
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 24, background: '#FFFFFF', borderRadius: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)' }}>
            <Bell size={44} color="var(--light-violet)" style={{ margin: '0 auto 14px auto' }} />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id, n.link)}
                style={{
                  padding: 18,
                  borderRadius: 16,
                  background: n.is_read ? '#FAFAFC' : 'var(--bg-primary)',
                  border: n.is_read ? '1px solid var(--soft-border)' : '1.5px solid var(--light-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  {getCategoryIcon(n.category)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: n.is_read ? 600 : 800, color: 'var(--dark-navy)' }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', marginTop: 4 }}>
                    {n.message}
                  </p>
                </div>

                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-purple)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
