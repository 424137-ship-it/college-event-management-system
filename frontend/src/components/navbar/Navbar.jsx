import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import {
  Sparkles, Calendar, Users, Compass, Image as GalleryIcon,
  Bell, LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut,
  User as UserIcon, ShieldAlert, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Logo } from '../common/Logo';

export const Navbar = () => {
  const { user, logout, isAdmin, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationsAPI.getAll();
          const items = res.data.results || res.data || [];
          setNotifications(items.slice(0, 5));
          const unreadRes = await notificationsAPI.getUnreadCount();
          setUnreadCount(unreadRes.data.unread_count || 0);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotificationsOpen(false);
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Events', path: '/events' },
    { name: 'Clubs', path: '/clubs' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Gallery', path: '/gallery' },
  ];

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isOrganizer) return '/organizer';
    return '/dashboard';
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: isScrolled ? 'rgba(255, 255, 255, 0.88)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: isScrolled ? '1px solid var(--soft-border)' : '1px solid transparent',
        boxShadow: isScrolled ? '0 4px 20px rgba(23, 21, 43, 0.04)' : 'none',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo & College Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }} title="HarshaX Home">
            <Logo variant="horizontal" height={38} />
          </Link>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: 'var(--primary-purple)',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            NIT Andhra Pradesh
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'none', alignItems: 'center', gap: 32 }} className="desktop-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                fontSize: '0.95rem',
                fontWeight: 600,
                color: isActive ? 'var(--primary-purple)' : 'var(--muted-text)',
                position: 'relative',
                paddingBottom: 4,
                transition: 'color 0.2s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: 2.5,
                        background: 'linear-gradient(90deg, #A855F7, #8B9DFF)',
                        borderRadius: 9999,
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              {/* Notification Bell Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  style={{
                    position: 'relative',
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid var(--soft-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dark-navy)',
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #FFFFFF',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 52,
                      width: 320,
                      padding: 16,
                      zIndex: 100,
                      boxShadow: '0 12px 36px rgba(23, 21, 43, 0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        style={{ fontSize: '0.8rem', color: 'var(--primary-purple)', fontWeight: 600 }}
                      >
                        View All
                      </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', textAlign: 'center', padding: '16px 0' }}>
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id, notif.link)}
                            style={{
                              padding: 10,
                              borderRadius: 10,
                              background: notif.is_read ? 'transparent' : 'rgba(168, 85, 247, 0.08)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--soft-border)',
                            }}
                          >
                            <p style={{ fontSize: '0.85rem', fontWeight: notif.is_read ? 500 : 700 }}>{notif.title}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px 6px 6px',
                    borderRadius: 9999,
                    background: '#FFFFFF',
                    border: '1px solid var(--soft-border)',
                  }}
                >
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
                    alt="avatar"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-navy)' }}>
                    {user.first_name || user.username}
                  </span>
                  <ChevronDown size={16} color="var(--muted-text)" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 52,
                      width: 220,
                      padding: 12,
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--soft-border)', marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.first_name || user.username}</p>
                      <span className="badge badge-purple" style={{ marginTop: 4 }}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--dark-navy)',
                      }}
                    >
                      <LayoutDashboard size={18} color="var(--primary-purple)" />
                      Dashboard
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px',
                          borderRadius: 8,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: '#DC2626',
                        }}
                      >
                        <ShieldAlert size={18} />
                        Admin Panel
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--dark-navy)',
                      }}
                    >
                      <UserIcon size={18} color="var(--muted-text)" />
                      Profile & Settings
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#EF4444',
                        background: 'transparent',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <LogOut size={18} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                <LogIn size={16} />
                Sign In
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                <UserPlus size={16} />
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              color: 'var(--dark-navy)',
            }}
            className="mobile-hamburger"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="glass-panel"
          style={{
            margin: '0 16px 16px 16px',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--dark-navy)' }}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary" style={{ width: '100%' }}>
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary" style={{ width: '100%' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-links { display: flex !important; }
          .mobile-hamburger { display: none !important; }
        }
      `}</style>
    </nav>
  );
};
