'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { clearAdminToken, getAdminToken } from '../../../../lib/auth';
import CanvasNav from '../../../../lib/components/CanvasNav';

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
    return (
      <div className="min-h-screen bg-white">
        <CanvasNav activePath="/admin" />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-lg canvas-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CanvasNav activePath="/admin" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/admin" className="canvas-muted text-sm hover:underline">
            ← Clients
          </Link>
          <h1 className="text-4xl mt-1" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
            {client.name}
          </h1>
          <p className="canvas-muted">
            Portal: /portal/{client.portal_slug} · {client.contact_email}
          </p>
        </div>

        <div className="canvas-panel">
          <h2>Invite Client User</h2>
          <form className="canvas-stack" onSubmit={inviteUser}>
            <div className="canvas-row">
              <label className="canvas-label">
                Name
                <input
                  className="canvas-input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Email
                <input
                  className="canvas-input"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Password
                <input
                  className="canvas-input"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Role
                <select
                  className="canvas-select"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="owner">owner</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
            </div>
            <button className="canvas-btn w-fit" type="submit">
              Invite user
            </button>
          </form>
        </div>

        <div className="canvas-panel">
          <h2>New Project</h2>
          <form className="canvas-stack" onSubmit={createProject}>
            <div className="canvas-row">
              <label className="canvas-label">
                Name
                <input
                  className="canvas-input"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Status
                <select
                  className="canvas-select"
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="planning">planning</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                </select>
              </label>
            </div>
            <label className="canvas-label">
              Description
              <textarea
                className="canvas-textarea"
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </label>
            <button className="canvas-btn w-fit" type="submit">
              Create project
            </button>
          </form>
        </div>

        <div className="canvas-panel">
          <h2>Projects</h2>
          <div className="canvas-list">
            {projects.map((project) => (
              <div className="canvas-list-item" key={project.id}>
                <div>
                  <strong className="text-lg">{project.name}</strong>
                  <div className="mt-1">
                    <span className={`canvas-badge ${project.status}`}>{project.status}</span>
                  </div>
                </div>
                <Link
                  className="canvas-btn-secondary canvas-btn"
                  href={`/admin/projects/${project.id}`}
                >
                  Manage →
                </Link>
              </div>
            ))}
            {!projects.length && <p className="canvas-muted">No projects yet.</p>}
          </div>
        </div>

        {error && <div className="canvas-error">{error}</div>}
      </div>
    </div>
  );
}
