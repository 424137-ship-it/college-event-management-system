import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const user = await login({ username, password });
      if (from !== '/') {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN' || user.is_superuser) {
        navigate('/admin', { replace: true });
      } else if (user.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    try {
      const user = await login({ username: u, password: p });
      if (user.role === 'ADMIN' || user.is_superuser) {
        navigate('/admin', { replace: true });
      } else if (user.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 36,
          background: '#FFFFFF',
          borderRadius: 28,
          boxShadow: '0 20px 45px rgba(168, 85, 247, 0.1)',
        }}
      >
        {/* Logo & Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo variant="icon" height={52} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Welcome to HarshaX
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginTop: 4 }}>
            Enter your credentials to access your dashboard
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div style={{ marginBottom: 24, padding: 12, background: 'var(--bg-primary)', borderRadius: 16 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-purple)', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Demo Accounts
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('harsha', 'harsha123')}
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--soft-border)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <GraduationCap size={14} color="#A855F7" />
              Student
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('organizer', 'organizer123')}
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--soft-border)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <UserCheck size={14} color="#8B9DFF" />
              Organizer
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--soft-border)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <ShieldCheck size={14} color="#EF4444" />
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark-navy)', marginBottom: 6 }}>
              Username or College Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                required
                placeholder="e.g. harsha or harsha@student.edu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 12,
                  border: '1px solid var(--soft-border)',
                  background: 'var(--bg-primary)',
                  fontSize: '0.92rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark-navy)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 14 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: 12,
                  border: '1px solid var(--soft-border)',
                  background: 'var(--bg-primary)',
                  fontSize: '0.92rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, background: 'transparent', color: 'var(--muted-text)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--muted-text)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-purple)', fontWeight: 700 }}>
            Create Student Account
          </Link>
        </div>
      </div>
    </div>
  );
};
