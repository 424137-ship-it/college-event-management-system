import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, Search, Award, Calendar, User, ArrowLeft } from 'lucide-react';
import { certificatesAPI } from '../../services/api';

export const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [queryId, setQueryId] = useState(certificateId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performVerification = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await certificatesAPI.verifyPublic(idToVerify.trim());
      setResult(res.data);
    } catch (err) {
      setResult({
        valid: false,
        error: err.response?.data?.error || `Certificate ID '${idToVerify}' could not be verified in the HarshaX authentic registry.`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId && certificateId !== 'demo') {
      performVerification(certificateId);
    }
  }, [certificateId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification(queryId);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3)',
          }}
        >
          <ShieldCheck size={32} />
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
          Official Certificate Registry
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1rem', marginTop: 8, maxWidth: 520, margin: '8px auto 0 auto' }}>
          Validate genuine student certificates issued by college organizers and faculty on HarshaX.
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel"
        style={{
          padding: 16,
          background: '#FFFFFF',
          display: 'flex',
          gap: 12,
          marginBottom: 36,
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 16 }} />
          <input
            type="text"
            placeholder="Enter Certificate ID (e.g. CX-CERT-1-ABC12345)"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              borderRadius: 12,
              border: '1px solid var(--soft-border)',
              background: 'var(--bg-primary)',
              fontSize: '0.95rem',
            }}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px' }}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {/* Results View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-text)' }}>
          Verifying certificate authenticity against secure database...
        </div>
      ) : searched && result ? (
        result.valid ? (
          <div
            className="glass-panel"
            style={{
              padding: 36,
              background: '#FFFFFF',
              borderRadius: 24,
              border: '2px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 16px 40px rgba(34, 197, 94, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="badge badge-green" style={{ marginBottom: 4 }}>
                  AUTHENTIC & VERIFIED
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
                  Valid HarshaX Digital Certificate
                </h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, paddingTop: 16, borderTop: '1px solid var(--soft-border)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Recipient Name</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-purple)', marginTop: 2 }}>
                  {result.recipient_name}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Event Title</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginTop: 2 }}>
                  {result.event_title}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Award / Classification</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-navy)', marginTop: 2 }}>
                  {result.position_rank || result.certificate_type}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Issue Date</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-navy)', marginTop: 2 }}>
                  {result.issue_date}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Issuing Authority</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-navy)', marginTop: 2 }}>
                  {result.organizer}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>Certificate ID</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--muted-text)', marginTop: 2 }}>
                  {result.certificate_id}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              padding: 36,
              background: '#FFFFFF',
              borderRadius: 24,
              border: '2px solid rgba(239, 68, 68, 0.4)',
              textAlign: 'center',
            }}
          >
            <XCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
              Certificate Not Found or Invalid
            </h3>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 8, maxWidth: 500, margin: '8px auto 0 auto' }}>
              {result.error}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
};
