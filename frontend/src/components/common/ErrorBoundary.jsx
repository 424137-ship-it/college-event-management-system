import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('harshax_user');
      localStorage.removeItem('harshax_access_token');
      localStorage.removeItem('harshax_refresh_token');
      localStorage.removeItem('campusx_user');
      localStorage.removeItem('campusx_access_token');
      localStorage.removeItem('campusx_refresh_token');
    } catch (e) {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'radial-gradient(circle at top, #F3EEFF 0%, #FFFFFF 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 36,
              boxShadow: '0 20px 45px rgba(23, 21, 43, 0.08)',
              border: '1px solid #E9E1F7',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#EF4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#17152B', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ color: '#77738B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
              An unexpected display glitch occurred. We've captured the error to prevent further issues.
            </p>

            {this.state.error && (
              <div style={{ textAlign: 'left', background: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 20, fontSize: '0.82rem', color: '#991B1B', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #FECACA' }}>
                <strong>Error:</strong> {this.state.error?.message || String(this.state.error)}
                {this.state.error?.stack && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', color: '#DC2626', fontWeight: 'bold' }}>Stack Trace</summary>
                    <pre style={{ marginTop: 6, fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                Clear Cache & Refresh
              </button>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 12,
                  background: '#F3EEFF',
                  color: '#9333EA',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                }}
              >
                <Home size={16} />
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
