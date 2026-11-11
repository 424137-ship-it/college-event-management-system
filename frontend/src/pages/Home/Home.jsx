import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Calendar, Users, Trophy, Rocket, ArrowRight,
  ShieldCheck, QrCode, Award, CheckCircle2, ChevronRight
} from 'lucide-react';
import { eventsAPI, clubsAPI, reportsAPI } from '../../services/api';
import { EventCard } from '../../components/cards/EventCard';
import { ClubCard } from '../../components/cards/ClubCard';

export const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [popularClubs, setPopularClubs] = useState([]);
  const [stats, setStats] = useState({
    total_events: 0,
    total_clubs: 0,
    total_students: 0,
    total_competitions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [eventsRes, clubsRes, statsRes] = await Promise.all([
          eventsAPI.getFeatured(),
          clubsAPI.getAll(),
          reportsAPI.getPublicStats(),
        ]);
        setFeaturedEvents(eventsRes.data.results || eventsRes.data || []);
        const clubsData = clubsRes.data.results || clubsRes.data || [];
        setPopularClubs(clubsData.slice(0, 4));
        if (statsRes.data) {
          setStats({
            total_events: statsRes.data.total_events,
            total_clubs: statsRes.data.total_clubs,
            total_students: statsRes.data.total_students,
            total_competitions: statsRes.data.total_competitions,
          });
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="gradient-hero-bg" style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hero Section */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="badge badge-purple"
              style={{ marginBottom: 20, padding: '6px 16px', fontSize: '0.85rem' }}
            >
              <Sparkles size={16} /> HarshaX 2.0 • Digital Event Management
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: 'var(--dark-navy)',
                marginBottom: 20,
              }}
            >
              Where Campus Ideas Become{' '}
              <span className="gradient-text">Unforgettable Events</span>
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--muted-text)',
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 540,
              }}
            >
              Discover, organize, and experience every campus event in one place. Connect with clubs, explore opportunities, and make your college life memorable.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <Link to="/events" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <Rocket size={18} />
                Explore Events
              </Link>
              <Link to="/organizer" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                Organize an Event
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>

          {/* Right Visual: 3D Floating Sculpture Simulation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {/* Glowing Orb */}
            <div
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(139,157,255,0.15) 60%, transparent 80%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Central 3D Glass Prism */}
            <motion.div
              animate={{
                y: [-12, 12, -12],
                rotateZ: [-2, 2, -2],
              }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="glass-panel"
              style={{
                width: 320,
                padding: 24,
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1.5px solid rgba(216, 180, 254, 0.7)',
                boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25)',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="badge badge-purple">LIVE REGISTRATION</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 600 }}>CodeSphere '26</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&fit=crop&q=80"
                alt="Hackathon"
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 16, marginBottom: 14 }}
              />
              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--dark-navy)' }}>
                National Hackathon 2026
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: 4 }}>
                Dr. APJ Abdul Kalam Auditorium • 36h Sprint
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--soft-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-purple)' }}>₹1,50,000 Prizes</span>
                <span className="badge badge-green">Open</span>
              </div>
            </motion.div>

            {/* Floating Mini Card 1 */}
            <motion.div
              animate={{
                y: [10, -10, 10],
                x: [-6, 6, -6],
              }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 20,
                left: -10,
                padding: '12px 18px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                zIndex: 3,
                background: '#FFFFFF',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
                <QrCode size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Instant QR Ticket</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted-text)' }}>Fast Check-in</p>
              </div>
            </motion.div>

            {/* Floating Mini Card 2 */}
            <motion.div
              animate={{
                y: [-8, 8, -8],
                x: [8, -8, 8],
              }}
              transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 1 }}
              className="glass-panel"
              style={{
                position: 'absolute',
                bottom: 20,
                right: -10,
                padding: '12px 18px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                zIndex: 3,
                background: '#FFFFFF',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Award size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Verified Certificates</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted-text)' }}>Direct PDF Download</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Statistics Bar */}
        <div
          className="glass-panel"
          style={{
            marginTop: 60,
            padding: '30px 40px',
            background: '#FFFFFF',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 24,
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-purple)', fontFamily: 'var(--font-heading)' }}>
              {stats.total_events}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600, marginTop: 4 }}>
              Events Hosted
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>
              {stats.total_clubs}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600, marginTop: 4 }}>
              Active Clubs & Chapters
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-heading)' }}>
              {stats.total_students}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600, marginTop: 4 }}>
              Enrolled Students
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-heading)' }}>
              {stats.total_competitions}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600, marginTop: 4 }}>
              Competitions & Contests
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: 8 }}>FEATURED HAPPENINGS</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              Explore What's Happening
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '1rem', marginTop: 4 }}>
              Discover the events that bring our campus to life.
            </p>
          </div>
          <Link to="/events" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            View All Events
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-text)' }}>
            Loading featured campus events...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* How HarshaX Works */}
      <section style={{ maxWidth: 1280, margin: '60px auto 40px auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px auto' }}>
          <span className="badge badge-blue" style={{ marginBottom: 10 }}>SEAMLESS WORKFLOW</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            How HarshaX Works
          </h2>
          <p style={{ color: 'var(--muted-text)', fontSize: '1rem', marginTop: 8 }}>
            From discovery to digital certification, everything is unified on one platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            {
              step: '01',
              title: 'Discover & Filter',
              desc: 'Browse technical hackathons, cultural festivals, and workshops tailored to your interests.',
              icon: <Calendar size={24} color="#A855F7" />,
            },
            {
              step: '02',
              title: 'Instant QR Pass',
              desc: 'Register in one click. Receive an encrypted digital QR ticket directly in your dashboard.',
              icon: <QrCode size={24} color="#8B9DFF" />,
            },
            {
              step: '03',
              title: 'On-Spot Attendance',
              desc: 'Organizers scan your pass seamlessly at the auditorium door with zero paperwork.',
              icon: <CheckCircle2 size={24} color="#10B981" />,
            },
            {
              step: '04',
              title: 'Verified Certificates',
              desc: 'Earn authentic, tamper-proof participation or winner certificates with verifiable IDs.',
              icon: <Award size={24} color="#F59E0B" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass-panel"
              style={{ padding: 28, background: '#FFFFFF', position: 'relative' }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'rgba(216, 180, 254, 0.4)', position: 'absolute', top: 16, right: 20 }}>
                {item.step}
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 8 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Clubs Section */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: 8 }}>CAMPUS COMMUNITIES</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              Find Your Community
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '1rem', marginTop: 4 }}>
              Connect with passionate students and faculty who share your ambitions.
            </p>
          </div>
          <Link to="/clubs" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Explore All Clubs
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {popularClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ maxWidth: 1280, margin: '60px auto 20px auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #17152B 0%, #2A2552 100%)',
            borderRadius: 32,
            padding: '60px 40px',
            color: '#FFFFFF',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
            <span className="badge badge-purple" style={{ marginBottom: 16, background: 'rgba(168, 85, 247, 0.25)', color: '#D8B4FE' }}>
              GET STARTED TODAY
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16, color: '#FFFFFF' }}>
              Ready to Experience Campus Events Like Never Before?
            </h2>
            <p style={{ color: '#D8B4FE', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 32 }}>
              Create your free student account now to register for competitions, join technical clubs, and receive verified certificates.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                Join HarshaX Now
              </Link>
              <Link to="/events" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem', background: 'transparent', color: '#FFFFFF', borderColor: 'rgba(216,180,254,0.4)' }}>
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
