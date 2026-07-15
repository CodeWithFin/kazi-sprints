'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { setAdminToken, setClientSession } from '../../lib/auth';
import CanvasNav from '../../lib/components/CanvasNav';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'client' ? 'client' : 'admin';
  const slugParam = searchParams.get('slug') || '';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalSlug, setPortalSlug] = useState(slugParam);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (role === 'admin' ? 'Admin Login' : 'Client Portal Login'),
    [role]
  );

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'admin') {
        const data = await apiFetch('/auth/admin/login', {
          method: 'POST',
          body: { email, password },
        });
        setAdminToken(data.token);
        router.push('/admin');
      } else {
        const data = await apiFetch('/auth/client/login', {
          method: 'POST',
          body: { email, password, portalSlug },
        });
        setClientSession(data.token, portalSlug);
        router.push(`/portal/${portalSlug}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <CanvasNav activePath="/login" />
      <div className="canvas-login-wrap">
        <form className="canvas-login-card canvas-stack" onSubmit={onSubmit}>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
              Sprints
            </div>
            <h1 className="text-2xl mt-2" style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}>
              {title}
            </h1>
            <p className="canvas-muted mt-1 text-sm">
              Sign in with your workspace credentials.
            </p>
          </div>

          <div className="canvas-row flex justify-center gap-3">
            <button
              type="button"
              className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                role === 'admin'
                  ? 'bg-[#13a8ff] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                role === 'client'
                  ? 'bg-[#13a8ff] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}
              onClick={() => setRole('client')}
            >
              Client
            </button>
          </div>

          {role === 'client' && (
            <label className="canvas-label">
              Portal slug
              <input
                className="canvas-input"
                value={portalSlug}
                onChange={(e) => setPortalSlug(e.target.value)}
                required
                placeholder="acme-co"
              />
            </label>
          )}

          <label className="canvas-label">
            Email
            <input
              className="canvas-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="canvas-label">
            Password
            <div style={{ position: 'relative' }}>
              <input
                className="canvas-input" style={{ paddingRight: '2.8rem' }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={showPassword ? 'Password' : '••••••••'}
              />
              <button
                type="button"
                className="canvas-password-toggle"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && <div className="canvas-error">{error}</div>}

          <button className="canvas-btn w-full mt-2" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
