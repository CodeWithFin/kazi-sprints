'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

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
    <main className="shell">
      <div className="topbar">
        <div className="brand">Admin · Clients</div>
        <button
          className="secondary"
          onClick={() => {
            clearAdminToken();
            router.push('/login?role=admin');
          }}
        >
          Log out
        </button>
      </div>

      <section className="panel">
        <h2>New client</h2>
        <form className="stack" onSubmit={createClient}>
          <div className="row">
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Company
              <input
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
              />
            </label>
          </div>
          <div className="row">
            <label>
              Contact email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
                required
              />
            </label>
            <label>
              Phone
              <input
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
              />
            </label>
            <label>
              Portal slug
              <input
                value={form.portal_slug}
                onChange={(e) =>
                  setForm({ ...form, portal_slug: e.target.value })
                }
                placeholder="optional"
              />
            </label>
          </div>
          <button type="submit">Create client</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="panel">
        <h2>Clients</h2>
        <div className="list">
          {clients.map((client) => (
            <div className="list-item" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <div className="muted">
                  {client.company_name || 'No company'} · /portal/
                  {client.portal_slug}
                </div>
              </div>
              <Link className="button secondary" href={`/admin/clients/${client.id}`}>
                Open
              </Link>
            </div>
          ))}
          {!clients.length && <p>No clients yet.</p>}
        </div>
      </section>
    </main>
  );
}
