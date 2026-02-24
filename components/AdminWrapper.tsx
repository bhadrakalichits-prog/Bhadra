import React, { useState } from 'react';
import { db } from '../db';

interface Props {
  children: React.ReactNode;
  title: string;
}

const AdminWrapper: React.FC<Props> = ({ children, title }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    const settings = db.getSettings();
    if (password === settings.mastersPasswordHash) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid master password. Please try again.');
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '40px 36px', textAlign: 'center' }}>
        {/* Lock Icon */}
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #1a2540 0%, #0f1629 100%)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(15,22,41,0.2)' }}>
          <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
          Enter master password to access <strong style={{ color: 'var(--text-secondary)' }}>{title}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter master password"
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.1em' }}
          />
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleVerify}
            className="btn-primary"
            style={{ padding: '12px', fontSize: 13, fontWeight: 700 }}
          >
            Unlock Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWrapper;
