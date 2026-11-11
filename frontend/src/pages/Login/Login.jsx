import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Eye, EyeOff, Lock, User, ArrowRight, ArrowLeft, ShieldCheck,
  UserCheck, GraduationCap, KeyRound, Mail, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { toast } from 'react-toastify';

export const Login = () => {
  const { requestLoginOTP, verifyLoginOTP, resendLoginOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const handleRequestOTP = async (e, u = username, p = password) => {
    if (e) e.preventDefault();
    if (!u || !p) {
      toast.error('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestLoginOTP({ username: u, password: p });
      setMaskedEmail(res.email || 'your registered email');
      setDemoOtp(res.demo_otp || '');
      setEmailSent(res.email_sent || false);
      setStep('otp');
      setTimeLeft(60);
      setOtp('');
      toast.info(`Verification code sent to ${res.email || 'your email'}`);
    } catch (err) {
      // Toast displayed in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await verifyLoginOTP({ username, otp: cleanOtp });
      if (from !== '/') {
        navigate(from, { replace: true });
      } else if (loggedUser.role === 'ADMIN' || loggedUser.is_superuser) {
        navigate('/admin', { replace: true });
      } else if (loggedUser.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Toast displayed in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    setResending(true);
    try {
      const res = await resendLoginOTP(username);
      setDemoOtp(res.demo_otp || '');
      setEmailSent(res.email_sent || false);
      setTimeLeft(60);
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setResending(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    handleRequestOTP(null, u, p);
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
          position: 'relative',
        }}
      >
        {/* Logo & Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo variant="icon" height={52} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            {step === 'credentials' ? 'Welcome to HarshaX' : 'Two-Factor Verification'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginTop: 4 }}>
            {step === 'credentials'
              ? 'Enter your credentials to access your dashboard'
              : `Enter the 6-digit OTP code sent to ${maskedEmail}`}
          </p>
        </div>

        {/* STEP 1: CREDENTIALS INPUT */}
        {step === 'credentials' && (
          <>
            {/* Demo Fast Login Pills */}
            <div style={{ marginBottom: 24, padding: 12, background: 'var(--bg-primary)', borderRadius: 16 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-purple)', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ 1-Click Demo Accounts (Free OTP)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('harsha', 'harsha123')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid var(--soft-border)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--dark-navy)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <GraduationCap size={15} color="#A855F7" />
                  Student
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('organizer', 'organizer123')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid var(--soft-border)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--dark-navy)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <UserCheck size={15} color="#8B9DFF" />
                  Organizer
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid var(--soft-border)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--dark-navy)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={15} color="#EF4444" />
                  Admin
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark-navy)', marginBottom: 6 }}>
                  Username or College Email
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 14 }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. harsha or harshax000@gmail.com"
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
                    style={{ position: 'absolute', right: 14, background: 'transparent', color: 'var(--muted-text)', border: 'none', cursor: 'pointer' }}
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
                {loading ? 'Sending OTP Code...' : 'Continue to Verification'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--muted-text)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-purple)', fontWeight: 700 }}>
                Create Student Account
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Delivery Status Banner */}
            {emailSent && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: '#16A34A',
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                <CheckCircle2 size={16} />
                Live OTP email dispatched to {maskedEmail || 'your inbox'}!
              </div>
            )}

            {demoOtp && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px dashed #A855F7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--primary-purple)', letterSpacing: '0.05em' }}>
                    ⚡ Instant Code Helper
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-navy)', letterSpacing: '4px' }}>
                    {demoOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(demoOtp)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                >
                  Autofill Code
                </button>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 8, textAlign: 'center' }}>
                  6-Digit Verification Code
                </label>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 14,
                      border: '2px solid var(--primary-purple)',
                      background: 'var(--bg-primary)',
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      letterSpacing: '0.45em',
                      textAlign: 'center',
                      color: 'var(--dark-navy)',
                      fontFamily: 'monospace, Courier',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  opacity: otp.length < 6 ? 0.6 : 1,
                  cursor: otp.length < 6 ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
                <ShieldCheck size={18} />
              </button>
            </form>

            {/* Resend and Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted-text)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div>
                {timeLeft > 0 ? (
                  <span style={{ color: 'var(--muted-text)' }}>
                    Resend code in <strong style={{ color: 'var(--dark-navy)' }}>{timeLeft}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-purple)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Resending...' : 'Resend Code'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
