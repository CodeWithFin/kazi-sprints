'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { setAdminToken, setClientSession } from '../../lib/auth';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'client' ? 'client' : 'admin';
  const slugParam = searchParams.get('slug') || '';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalSlug, setPortalSlug] = useState(slugParam);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (role === 'admin' ? 'Admin login' : 'Client portal login'),
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
    <div className="login-wrap">
      <form className="login-card stack" onSubmit={onSubmit}>
        <div>
          <div className="brand">Client Progress Portal</div>
          <h1>{title}</h1>
          <p>Sign in with your workspace credentials.</p>
        </div>

        <div className="row">
          <button
            type="button"
            className={role === 'admin' ? '' : 'secondary'}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={role === 'client' ? '' : 'secondary'}
            onClick={() => setRole('client')}
          >
            Client
          </button>
        </div>

        {role === 'client' && (
          <label>
            Portal slug
            <input
              value={portalSlug}
              onChange={(e) => setPortalSlug(e.target.value)}
              required
              placeholder="acme-co"
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
