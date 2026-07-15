'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { clearAdminToken, getAdminToken } from '../../../../lib/auth';
import CanvasNav from '../../../../lib/components/CanvasNav';

export default function AdminProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    sequence_order: 0,
  });
  const [taskForms, setTaskForms] = useState({});
  const [repoForm, setRepoForm] = useState({
    github_repo_full_name: '',
    github_installation_id: '',
    repo_role: 'other',
    default_branch: 'main',
  });

  async function refresh(token) {
    const data = await apiFetch(`/admin/projects/${id}`, { token });
    setProject(data);
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

  async function addMilestone(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch(`/admin/projects/${id}/milestones`, {
        token,
        method: 'POST',
        body: milestoneForm,
      });
      setMilestoneForm({ name: '', description: '', sequence_order: 0 });
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTask(event, milestoneId) {
    event.preventDefault();
    setError('');
    const form = taskForms[milestoneId] || { title: '', task_ref: '' };
    try {
      const token = getAdminToken();
      await apiFetch(`/admin/milestones/${milestoneId}/tasks`, {
        token,
        method: 'POST',
        body: form,
      });
      setTaskForms((prev) => ({
        ...prev,
        [milestoneId]: { title: '', task_ref: '' },
      }));
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function markMilestoneDone(milestoneId) {
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch(`/admin/milestones/${milestoneId}`, {
        token,
        method: 'PATCH',
        body: { status: 'done' },
      });
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function registerRepo(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getAdminToken();
      await apiFetch(`/admin/projects/${id}/repos`, {
        token,
        method: 'POST',
        body: repoForm,
      });
      setRepoForm({
        github_repo_full_name: '',
        github_installation_id: '',
        repo_role: 'other',
        default_branch: 'main',
      });
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) {
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
          <Link href={`/admin/clients/${project.client_id}`} className="canvas-muted text-sm hover:underline">
            ← Client
          </Link>
          <h1 className="text-4xl mt-1" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
            {project.name}
          </h1>
          <span className={`canvas-badge ${project.status} mt-2`}>{project.status}</span>
        </div>

        <div className="canvas-panel">
          <h2>Register Repo + Webhook</h2>
          <form className="canvas-stack" onSubmit={registerRepo}>
            <div className="canvas-row">
              <label className="canvas-label">
                GitHub repo (owner/name)
                <input
                  className="canvas-input"
                  value={repoForm.github_repo_full_name}
                  onChange={(e) =>
                    setRepoForm({ ...repoForm, github_repo_full_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="canvas-label">
                Installation ID
                <input
                  className="canvas-input"
                  value={repoForm.github_installation_id}
                  onChange={(e) =>
                    setRepoForm({ ...repoForm, github_installation_id: e.target.value })
                  }
                  required
                />
              </label>
              <label className="canvas-label">
                Role
                <select
                  className="canvas-select"
                  value={repoForm.repo_role}
                  onChange={(e) => setRepoForm({ ...repoForm, repo_role: e.target.value })}
                >
                  <option value="frontend">frontend</option>
                  <option value="backend">backend</option>
                  <option value="mobile">mobile</option>
                  <option value="infra">infra</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label className="canvas-label">
                Default branch
                <input
                  className="canvas-input"
                  value={repoForm.default_branch}
                  onChange={(e) => setRepoForm({ ...repoForm, default_branch: e.target.value })}
                />
              </label>
            </div>
            <button className="canvas-btn w-fit" type="submit">
              Register repo
            </button>
          </form>

          {project.repos?.length > 0 && (
            <div className="canvas-list mt-4">
              {project.repos.map((repo) => (
                <div className="canvas-list-item" key={repo.id}>
                  <div>
                    <strong>{repo.github_repo_full_name}</strong>
                    <div className="canvas-muted">{repo.repo_role} · {repo.default_branch}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="canvas-panel">
          <h2>Add Milestone</h2>
          <form className="canvas-stack" onSubmit={addMilestone}>
            <div className="canvas-row">
              <label className="canvas-label">
                Name
                <input
                  className="canvas-input"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="canvas-label">
                Order
                <input
                  className="canvas-input"
                  type="number"
                  value={milestoneForm.sequence_order}
                  onChange={(e) =>
                    setMilestoneForm({ ...milestoneForm, sequence_order: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="canvas-label">
              Description
              <textarea
                className="canvas-textarea"
                rows={2}
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              />
            </label>
            <button className="canvas-btn w-fit" type="submit">
              Add milestone
            </button>
          </form>
        </div>

        {(project.milestones || []).map((milestone) => {
          const taskForm = taskForms[milestone.id] || { title: '', task_ref: '' };
          return (
            <div className="canvas-panel" key={milestone.id}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3>{milestone.name}</h3>
                  <span className={`canvas-badge ${milestone.status}`}>{milestone.status}</span>
                </div>
                {milestone.status !== 'done' && (
                  <button
                    className="canvas-btn-secondary canvas-btn"
                    onClick={() => markMilestoneDone(milestone.id)}
                  >
                    Mark done
                  </button>
                )}
              </div>

              <form
                className="canvas-row mt-4"
                onSubmit={(e) => addTask(e, milestone.id)}
              >
                <label className="canvas-label">
                  Task title
                  <input
                    className="canvas-input"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForms((prev) => ({
                        ...prev,
                        [milestone.id]: { ...taskForm, title: e.target.value },
                      }))
                    }
                    required
                  />
                </label>
                <label className="canvas-label">
                  Task ref (e.g. GH-42)
                  <input
                    className="canvas-input"
                    value={taskForm.task_ref}
                    onChange={(e) =>
                      setTaskForms((prev) => ({
                        ...prev,
                        [milestone.id]: { ...taskForm, task_ref: e.target.value },
                      }))
                    }
                    required
                  />
                </label>
                <button className="canvas-btn self-end" type="submit">
                  Add task
                </button>
              </form>

              <div className="canvas-list mt-4">
                {(milestone.tasks || []).map((task) => (
                  <div className="canvas-list-item" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <div className="canvas-muted">{task.task_ref}</div>
                    </div>
                    <span className={`canvas-badge ${task.status}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {error && <div className="canvas-error">{error}</div>}
      </div>
    </div>
  );
}
