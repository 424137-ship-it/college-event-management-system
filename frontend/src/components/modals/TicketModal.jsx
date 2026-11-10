import React from 'react';
import { X, Calendar, MapPin, CheckCircle2, Download, Printer } from 'lucide-react';

export const TicketModal = ({ registration, isOpen, onClose }) => {
  if (!isOpen || !registration) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(23, 21, 43, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          overflow: 'hidden',
          borderRadius: 24,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
            padding: '24px 24px 20px 24px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <X size={18} />
          </button>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, opacity: 0.9 }}>
            CampusX Official Pass
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
            {registration.event_title}
          </h2>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* QR Code */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-primary)',
              borderRadius: 20,
              border: '2px dashed #D8B4FE',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {registration.qr_code ? (
              <img
                src={registration.qr_code.startsWith('http') ? registration.qr_code : `http://127.0.0.1:8000${registration.qr_code}`}
                alt="Ticket QR Code"
                style={{ width: 170, height: 170, objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3EEFF', borderRadius: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>QR Generated</span>
              </div>
            )}
            <p style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary-purple)' }}>
              {registration.registration_id}
            </p>
          </div>

          {/* Details Table */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', borderTop: '1px solid var(--soft-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-text)' }}>Attendee:</span>
              <span style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>
                {registration.user_full_name} ({registration.user_roll_number || 'Student'})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-text)' }}>Date & Time:</span>
              <span style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>
                {registration.event_start_date} at {registration.event_start_time}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-text)' }}>Venue:</span>
              <span style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>
                {registration.venue_name || 'Campus Venue'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted-text)' }}>Status:</span>
              <span className="badge badge-green">
                <CheckCircle2 size={13} /> {registration.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 24 }}>
            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              <Printer size={16} />
              Print Ticket
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = registration.qr_code?.startsWith('http') ? registration.qr_code : `http://127.0.0.1:8000${registration.qr_code}`;
                link.download = `Ticket_${registration.registration_id}.png`;
                link.click();
              }}
              className="btn-primary"
              style={{ flex: 1, padding: '10px' }}
            >
              <Download size={16} />
              Save Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
