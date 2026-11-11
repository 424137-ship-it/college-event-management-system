import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  QrCode,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

export const RegisterConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  event,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fee = Number(event?.registration_fee || 0);
  const isPaid = fee > 0;
  const officialUpiId = 'payments.events@nit.ac.in';

  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      if (isPaid) {
        // Generate a suggested mock/demo reference number for convenience
        const randomRef = `UPI-NIT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;
        setTransactionRef(randomRef);
      } else {
        setTransactionRef('');
      }
    }
  }, [isOpen, isPaid]);

  if (!isOpen || !event) return null;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(officialUpiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleGenerateNewRef = () => {
    const freshRef = `TXN-NIT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setTransactionRef(freshRef);
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPaid) {
      if (!transactionRef || !transactionRef.trim()) {
        setValidationError('Please enter a valid payment transaction ID or UTR reference number.');
        return;
      }
      setValidationError('');
      onConfirm(transactionRef.trim());
    } else {
      onConfirm();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(11, 10, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#13111C',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.15)',
          color: '#F3F4F6',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isPaid
              ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 157, 255, 0.1) 100%)'
              : 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 157, 255, 0.1) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: isPaid ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isPaid ? '#C084FC' : '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isPaid ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {isPaid ? <CreditCard size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                {isPaid ? 'Confirm Paid Registration' : 'Confirm Free Registration'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                National Institute of Technology (NIT) • Event Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Event Quick Details Card */}
          <div
            style={{
              background: 'rgba(23, 21, 43, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: isPaid ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isPaid ? '#C084FC' : '#34D399',
                    border: `1px solid ${isPaid ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    marginBottom: 8,
                  }}
                >
                  {isPaid ? `Entry Fee: ₹${fee.toFixed(2)}` : 'Free Entry Pass'}
                </span>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.4 }}>
                  {event.title}
                </h4>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                fontSize: '0.82rem',
                color: '#D1D5DB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} color="#A855F7" />
                <span>{formatDate(event.start_date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} color="#8B9DFF" />
                <span>{formatTime(event.start_time)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
                <MapPin size={15} color="#EC4899" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.venue_name || 'NIT Campus Venue'}
                </span>
              </div>
            </div>
          </div>

          {/* Conditional Workflow: Free vs Paid */}
          {!isPaid ? (
            /* Free Event Confirmation View */
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <CheckCircle2 size={22} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: '#A7F3D0' }}>
                    Are you sure you want to register?
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.5 }}>
                    Registration for this event is <strong>free</strong> for all NIT students and attendees. Upon
                    confirming, your digital entry pass with an official HMAC-signed QR ticket will be issued immediately.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.78rem',
                  color: '#9CA3AF',
                }}
              >
                <ShieldCheck size={16} color="#8B9DFF" />
                <span>Auto-validates against schedule collisions and updates On-Duty (OD) roster.</span>
              </div>
            </div>
          ) : (
            /* Paid Event Breakdown & Payment Verification View */
            <div style={{ marginBottom: 20 }}>
              {/* Fee Breakdown Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9CA3AF', marginBottom: 8 }}>
                  <span>Event Delegate Registration Fee</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>₹{fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9CA3AF', marginBottom: 12 }}>
                  <span>Institutional Platform Charge</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>₹0.00 (Waived)</span>
                </div>
                <div
                  style={{
                    borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                    paddingTop: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>Total Payable</span>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ₹{fee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'Card / NetBank', icon: CreditCard },
                    { id: 'WALLET', label: 'NIT SmartCard', icon: Sparkles },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 12,
                          background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#FFFFFF' : '#9CA3AF',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Icon size={16} color={isSelected ? '#A855F7' : '#9CA3AF'} />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Instruction Banner */}
              <div
                style={{
                  background: 'rgba(139, 157, 255, 0.06)',
                  border: '1px solid rgba(139, 157, 255, 0.15)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 16,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ color: '#8B9DFF', fontWeight: 600 }}>NIT Official VPA / UPI ID:</div>
                  <div style={{ color: '#FFFFFF', fontFamily: 'monospace', fontSize: '0.85rem' }}>{officialUpiId}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  style={{
                    background: 'rgba(139, 157, 255, 0.15)',
                    border: '1px solid rgba(139, 157, 255, 0.3)',
                    color: '#8B9DFF',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {copiedUPI ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  {copiedUPI ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Transaction Reference Input */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB' }}>
                    Payment Token / Transaction Reference <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewRef}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#A855F7',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Simulate Fresh UTR
                  </button>
                </div>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="e.g. UPI-NIT-2026-987654 or Bank UTR"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: validationError ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                {validationError && (
                  <p style={{ margin: '6px 0 0 0', color: '#F87171', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} />
                    {validationError}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.76rem',
                  color: '#9CA3AF',
                }}
              >
                <ShieldCheck size={15} color="#10B981" />
                <span>Verified by NIT Accounts & Finance Office with 256-bit SSL gateway.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#D1D5DB',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px 20px',
                borderRadius: 12,
                background: isPaid
                  ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isPaid
                  ? '0 10px 25px -5px rgba(168, 85, 247, 0.4)'
                  : '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Registration...</span>
                </>
              ) : isPaid ? (
                <>
                  <span>Pay ₹{fee.toFixed(2)} & Confirm</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RegisterConfirmModal;