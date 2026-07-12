'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import {
  clearClientSession,
  getClientToken,
  getStoredPortalSlug,
} from '../../../lib/auth';

function ProgressBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Progress</span>
        <strong>{pct}%</strong>
      </div>
      <div className="progress" style={{ marginTop: 8 }}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PortalDashboardPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getClientToken();
    const storedSlug = getStoredPortalSlug();
    if (!token || storedSlug !== slug) {
      router.replace(`/login?role=client&slug=${slug}`);
      return;
    }

    apiFetch('/client/projects', { token })
      .then((data) => {
        setProjects(data);
        if (data[0]) setSelectedId(data[0].id);
      })
      .catch((err) => {
        if (err.status === 401) {
          clearClientSession();
          router.replace(`/login?role=client&slug=${slug}`);
        } else {
          setError(err.message);
        }
      });
  }, [router, slug]);

  useEffect(() => {
    if (!selectedId) return;
    const token = getClientToken();
    apiFetch(`/client/projects/${selectedId}/milestones`, { token })
      .then(setMilestones)
      .catch((err) => setError(err.message));
  }, [selectedId]);

  const selected = projects.find((p) => p.id === selectedId);

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">Progress Portal</div>
        <button
          className="secondary"
          onClick={() => {
            clearClientSession();
            router.push(`/login?role=client&slug=${slug}`);
          }}
        >
          Log out
        </button>
      </div>

      {!!projects.length && (
        <section className="panel">
          <label>
            Project
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {selected && (
        <section className="panel stack">
          <div>
            <h1>{selected.name}</h1>
            <p>{selected.description || 'Project progress overview'}</p>
          </div>
          <ProgressBar value={selected.progress} />
        </section>
      )}

      <section className="panel">
        <h2>Milestones</h2>
        <div className="list">
          {milestones.map((milestone) => (
            <div className="list-item" key={milestone.id}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{milestone.name}</strong>
                  <span className={`badge ${milestone.status}`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <ProgressBar value={milestone.progress} />
                </div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Last update:{' '}
                  {milestone.last_commit_at
                    ? new Date(milestone.last_commit_at).toLocaleString()
                    : 'No linked activity yet'}
                </div>
              </div>
              <Link
                className="button secondary"
                href={`/portal/${slug}/milestones/${milestone.id}`}
              >
                Details
              </Link>
            </div>
          ))}
          {!milestones.length && <p>No milestones yet.</p>}
        </div>
      </section>

      {error && <div className="error">{error}</div>}
    </main>
  );
}
