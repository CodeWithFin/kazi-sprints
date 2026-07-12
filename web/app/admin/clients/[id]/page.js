'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { clearAdminToken, getAdminToken } from '../../../lib/auth';

export default function AdminClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning',
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'owner',
  });

  async function refresh(token) {
    const clientData = await apiFetch(`/admin/clients/${id}`, { token });
    setClient(clientData);
    setProjects(clientData.projects || []);
  }

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace('/login?role=admin');
      return;
    }
    refresh(token).catch((err) => {
      if (err.status === 401) {
        clearAdminToken();
        router.replace('/login?role=admin');
      } else {
        setError(err.message);
      }
    });
  }, [id, router]);

  async function createProject(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch('/admin/projects', {
        token,
        method: 'POST',
        body: { ...projectForm, client_id: id },
      });
      setProjectForm({ name: '', description: '', status: 'planning' });
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function inviteUser(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch(`/admin/clients/${id}/users`, {
        token,
        method: 'POST',
        body: userForm,
      });
      setUserForm({ name: '', email: '', password: '', role: 'owner' });
      alert('Client user invited');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!client) {
    return <main className="shell">Loading…</main>;
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <Link href="/admin" className="muted">
            ← Clients
          </Link>
          <h1>{client.name}</h1>
          <p>
            Portal: /portal/{client.portal_slug} · {client.contact_email}
          </p>
        </div>
      </div>

      <section className="panel">
        <h2>Invite client user</h2>
        <form className="stack" onSubmit={inviteUser}>
          <div className="row">
            <label>
              Name
              <input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                required
              />
            </label>
            <label>
              Role
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="owner">owner</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
          </div>
          <button type="submit">Invite user</button>
        </form>
      </section>

      <section className="panel">
        <h2>New project</h2>
        <form className="stack" onSubmit={createProject}>
          <div className="row">
            <label>
              Name
              <input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                required
              />
            </label>
            <label>
              Status
              <select
                value={projectForm.status}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, status: e.target.value })
                }
              >
                <option value="planning">planning</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea
              rows={3}
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
            />
          </label>
          <button type="submit">Create project</button>
        </form>
      </section>

      <section className="panel">
        <h2>Projects</h2>
        <div className="list">
          {projects.map((project) => (
            <div className="list-item" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <div className="muted">
                  <span className={`badge ${project.status}`}>{project.status}</span>
                </div>
              </div>
              <Link
                className="button secondary"
                href={`/admin/projects/${project.id}`}
              >
                Manage
              </Link>
            </div>
          ))}
          {!projects.length && <p>No projects yet.</p>}
        </div>
      </section>

      {error && <div className="error">{error}</div>}
    </main>
  );
}
