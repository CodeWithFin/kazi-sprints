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
import CanvasNav from '../../../lib/components/CanvasNav';

function ProgressBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="canvas-muted">Progress</span>
        <strong className="text-lg">{pct}%</strong>
      </div>
      <div className="canvas-progress">
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
    <div className="min-h-screen bg-white">
      <CanvasNav activePath={`/portal/${slug}`} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
              Progress Portal
            </h1>
            <p className="canvas-muted text-lg" style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}>
              {slug}
            </p>
          </div>
          <button
            className="canvas-btn-secondary canvas-btn"
            onClick={() => {
              clearClientSession();
              router.push(`/login?role=client&slug=${slug}`);
            }}
          >
            Log out
          </button>
        </div>

        {!!projects.length && (
          <div className="canvas-panel">
            <label className="canvas-label">
              Project
              <select
                className="canvas-select"
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
          </div>
        )}

        {selected && (
          <div className="canvas-panel canvas-stack">
            <div>
              <h2 className="text-3xl">{selected.name}</h2>
              <p className="canvas-muted mt-1">{selected.description || 'Project progress overview'}</p>
            </div>
            <ProgressBar value={selected.progress} />
          </div>
        )}

        <div className="canvas-panel">
          <h2>Milestones</h2>
          <div className="canvas-list">
            {milestones.map((milestone) => (
              <div className="canvas-list-item flex-col sm:flex-row" key={milestone.id}>
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl">{milestone.name}</h3>
                    <span className={`canvas-badge ${milestone.status} shrink-0`}>
                      {milestone.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={milestone.progress} />
                  </div>
                  <div className="canvas-muted mt-2 text-sm">
                    Last update:{' '}
                    {milestone.last_commit_at
                      ? new Date(milestone.last_commit_at).toLocaleString()
                      : 'No linked activity yet'}
                  </div>
                </div>
                <Link
                  className="canvas-btn-secondary canvas-btn shrink-0 mt-3 sm:mt-0"
                  href={`/portal/${slug}/milestones/${milestone.id}`}
                >
                  Details →
                </Link>
              </div>
            ))}
            {!milestones.length && <p className="canvas-muted py-4">No milestones yet.</p>}
          </div>
        </div>

        {error && <div className="canvas-error">{error}</div>}
      </div>
    </div>
  );
}
