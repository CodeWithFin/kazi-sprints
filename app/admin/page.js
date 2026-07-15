'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';
import CanvasNav from '../../lib/components/CanvasNav';

export default function AdminHomePage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
    portal_slug: '',
  });

  async function loadClients(token) {
    const data = await apiFetch('/admin/clients', { token });
    setClients(data);
  }

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace('/login?role=admin');
      return;
    }
    loadClients(token).catch((err) => {
      if (err.status === 401) {
        clearAdminToken();
        router.replace('/login?role=admin');
      } else {
        setError(err.message);
      }
    });
  }, [router]);

  async function createClient(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch('/admin/clients', {
        token,
        method: 'POST',
        body: form,
      });
      setForm({
        name: '',
        company_name: '',
        contact_email: '',
        contact_phone: '',
        portal_slug: '',
      });
      await loadClients(token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <CanvasNav activePath="/admin" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
              Admin
            </h1>
            <p className="canvas-muted text-lg" style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}>
              Manage clients and projects
            </p>
          </div>
          <button
            className="canvas-btn-secondary canvas-btn px-6"
            onClick={() => {
              clearAdminToken();
              router.push('/login?role=admin');
            }}
          >
            Log out
          </button>
        </div>

        <div className="canvas-panel">
          <h2>New Client</h2>
          <form className="canvas-stack" onSubmit={createClient}>
            <div className="canvas-row">
              <label className="canvas-label">
                Name
                <input
                  className="canvas-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Company
                <input
                  className="canvas-input"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="canvas-row">
              <label className="canvas-label">
                Contact email
                <input
                  className="canvas-input"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                  required
                />
              </label>
              <label className="canvas-label">
                Phone
                <input
                  className="canvas-input"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                />
              </label>
              <label className="canvas-label">
                Portal slug
                <input
                  className="canvas-input"
                  value={form.portal_slug}
                  onChange={(e) =>
                    setForm({ ...form, portal_slug: e.target.value })
                  }
                  placeholder="optional"
                />
              </label>
            </div>
            <button className="canvas-btn w-fit" type="submit">
              Create client
            </button>
          </form>
          {error && <div className="canvas-error">{error}</div>}
        </div>

        <div className="canvas-panel">
          <h2>Clients</h2>
          <div className="canvas-list">
            {clients.map((client) => (
              <div className="canvas-list-item" key={client.id}>
                <div>
                  <strong className="text-lg">{client.name}</strong>
                  <div className="canvas-muted">
                    {client.company_name || 'No company'} · /portal/{client.portal_slug}
                  </div>
                </div>
                <Link className="canvas-btn-secondary canvas-btn" href={`/admin/clients/${client.id}`}>
                  Open →
                </Link>
              </div>
            ))}
            {!clients.length && (
              <p className="canvas-muted py-4 text-center">
                No clients yet. Create your first client above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
