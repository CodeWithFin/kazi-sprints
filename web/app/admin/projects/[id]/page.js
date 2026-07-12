'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { clearAdminToken, getAdminToken } from '../../../lib/auth';

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
    return <main className="shell">Loading…</main>;
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <Link href={`/admin/clients/${project.client_id}`} className="muted">
            ← Client
          </Link>
          <h1>{project.name}</h1>
          <p>
            <span className={`badge ${project.status}`}>{project.status}</span>
          </p>
        </div>
      </div>

      <section className="panel">
        <h2>Register repo + webhook</h2>
        <form className="stack" onSubmit={registerRepo}>
          <div className="row">
            <label>
              GitHub repo (owner/name)
              <input
                value={repoForm.github_repo_full_name}
                onChange={(e) =>
                  setRepoForm({
                    ...repoForm,
                    github_repo_full_name: e.target.value,
                  })
                }
                required
              />
            </label>
            <label>
              Installation ID
              <input
                value={repoForm.github_installation_id}
                onChange={(e) =>
                  setRepoForm({
                    ...repoForm,
                    github_installation_id: e.target.value,
                  })
                }
                required
              />
            </label>
            <label>
              Role
              <select
                value={repoForm.repo_role}
                onChange={(e) =>
                  setRepoForm({ ...repoForm, repo_role: e.target.value })
                }
              >
                <option value="frontend">frontend</option>
                <option value="backend">backend</option>
                <option value="mobile">mobile</option>
                <option value="infra">infra</option>
                <option value="other">other</option>
              </select>
            </label>
            <label>
              Default branch
              <input
                value={repoForm.default_branch}
                onChange={(e) =>
                  setRepoForm({ ...repoForm, default_branch: e.target.value })
                }
              />
            </label>
          </div>
          <button type="submit">Register repo</button>
        </form>
        <div className="list" style={{ marginTop: 16 }}>
          {(project.repos || []).map((repo) => (
            <div className="list-item" key={repo.id}>
              <div>
                <strong>{repo.github_repo_full_name}</strong>
                <div className="muted">
                  {repo.repo_role} · {repo.default_branch}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Add milestone</h2>
        <form className="stack" onSubmit={addMilestone}>
          <div className="row">
            <label>
              Name
              <input
                value={milestoneForm.name}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, name: e.target.value })
                }
                required
              />
            </label>
            <label>
              Order
              <input
                type="number"
                value={milestoneForm.sequence_order}
                onChange={(e) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    sequence_order: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              rows={2}
              value={milestoneForm.description}
              onChange={(e) =>
                setMilestoneForm({
                  ...milestoneForm,
                  description: e.target.value,
                })
              }
            />
          </label>
          <button type="submit">Add milestone</button>
        </form>
      </section>

      {(project.milestones || []).map((milestone) => {
        const taskForm = taskForms[milestone.id] || { title: '', task_ref: '' };
        return (
          <section className="panel" key={milestone.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3>{milestone.name}</h3>
                <span className={`badge ${milestone.status}`}>
                  {milestone.status}
                </span>
              </div>
              {milestone.status !== 'done' && (
                <button
                  className="secondary"
                  onClick={() => markMilestoneDone(milestone.id)}
                >
                  Mark done
                </button>
              )}
            </div>

            <form
              className="row"
              style={{ marginTop: 12 }}
              onSubmit={(e) => addTask(e, milestone.id)}
            >
              <label>
                Task title
                <input
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
              <label>
                Task ref (e.g. GH-42)
                <input
                  value={taskForm.task_ref}
                  onChange={(e) =>
                    setTaskForms((prev) => ({
                      ...prev,
                      [milestone.id]: {
                        ...taskForm,
                        task_ref: e.target.value,
                      },
                    }))
                  }
                  required
                />
              </label>
              <button type="submit">Add task</button>
            </form>

            <div className="list" style={{ marginTop: 12 }}>
              {(milestone.tasks || []).map((task) => (
                <div className="list-item" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <div className="muted">{task.task_ref}</div>
                  </div>
                  <span className={`badge ${task.status}`}>{task.status}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {error && <div className="error">{error}</div>}
    </main>
  );
}
