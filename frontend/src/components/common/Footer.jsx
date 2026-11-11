import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Globe, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--soft-border)',
        padding: '60px 24px 30px 24px',
        marginTop: 80,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 50 }}>
        {/* Brand column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Link to="/" style={{ display: 'inline-block' }} title="HarshaX">
            <Logo variant="horizontal" height={38} />
          </Link>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            National Institute of Technology Andhra Pradesh
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', lineHeight: 1.6 }}>
            The centralized campus event, departmental associations (ASCII, ECEA, MESA) & clubs portal of NIT Andhra Pradesh. Empowering hackathons, Vulcanzy, and student initiatives.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>
            📍 Tadepalligudem, West Godavari District, Andhra Pradesh - 534101
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href="https://github.com/424137-ship-it/college-event-management-system"
              target="_blank"
              rel="noreferrer"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dark-navy)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--dark-navy)' }}>Explore</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: 'var(--muted-text)' }}>
            <li><Link to="/events" style={{ transition: 'color 0.2s' }}>All Events</Link></li>
            <li><Link to="/clubs" style={{ transition: 'color 0.2s' }}>Clubs & Chapters</Link></li>
            <li><Link to="/calendar" style={{ transition: 'color 0.2s' }}>Event Calendar</Link></li>
            <li><Link to="/gallery" style={{ transition: 'color 0.2s' }}>Event Gallery</Link></li>
          </ul>
        </div>

        {/* Verification & Portals */}
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--dark-navy)' }}>Portals</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem', color: 'var(--muted-text)' }}>
            <li><Link to="/dashboard">Student Dashboard</Link></li>
            <li><Link to="/organizer">Organizer Console</Link></li>
            <li><Link to="/admin">Administration</Link></li>
            <li><Link to="/verify-certificate/demo">Certificate Verifier</Link></li>
          </ul>
        </div>

        {/* Tech Stack info */}
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--dark-navy)' }}>Architecture</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', lineHeight: 1.6 }}>
            Engineered with React Vite, Python Django REST Framework, JWT Authentication, and MySQL Database.
          </p>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }} className="badge badge-purple">
            <ShieldCheck size={14} /> Production Ready
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid var(--soft-border)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontSize: '0.85rem',
          color: 'var(--muted-text)',
        }}
      >
        <p>© 2026 HarshaX. All rights reserved.</p>
        <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Designed & Built with <Heart size={14} color="#A855F7" fill="#A855F7" /> for College Event Management.
        </p>
      </div>
    </footer>
  );
};
