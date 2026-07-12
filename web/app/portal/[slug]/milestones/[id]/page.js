'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import {
  clearClientSession,
  getClientToken,
  getStoredPortalSlug,
} from '../../../../lib/auth';

export default function MilestoneDetailPage() {
  const { slug, id } = useParams();
  const router = useRouter();
  const [commits, setCommits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  async function refresh(token) {
    const [commitData, commentData] = await Promise.all([
      apiFetch(`/client/milestones/${id}/commits`, { token }),
      apiFetch(`/client/milestones/${id}/comments`, { token }),
    ]);
    setCommits(commitData.commits || commitData);
    setTasks(commitData.tasks || []);
    setComments(commentData);
  }

  useEffect(() => {
    const token = getClientToken();
    const storedSlug = getStoredPortalSlug();
    if (!token || storedSlug !== slug) {
      router.replace(`/login?role=client&slug=${slug}`);
      return;
    }
    refresh(token).catch((err) => {
      if (err.status === 401) {
        clearClientSession();
        router.replace(`/login?role=client&slug=${slug}`);
      } else {
        setError(err.message);
      }
    });
  }, [id, router, slug]);

  async function submitComment(event) {
    event.preventDefault();
    setError('');
    try {
      const token = getClientToken();
      await apiFetch(`/client/milestones/${id}/comments`, {
        token,
        method: 'POST',
        body: { body },
      });
      setBody('');
      await refresh(token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <Link href={`/portal/${slug}`} className="muted">
            ← Dashboard
          </Link>
          <h1>Milestone activity</h1>
          <p>Updates and conversation — no source code or file details.</p>
        </div>
      </div>

      <section className="panel">
        <h2>Tasks</h2>
        <div className="list">
          {tasks.map((task, index) => (
            <div className="list-item" key={`${task.title}-${index}`}>
              <strong>{task.title}</strong>
              <span className={`badge ${task.status}`}>{task.status}</span>
            </div>
          ))}
          {!tasks.length && <p>No tasks yet.</p>}
        </div>
      </section>

      <section className="panel">
        <h2>Recent updates</h2>
        <div className="list">
          {commits.map((commit, index) => (
            <div className="list-item" key={`${commit.committed_at}-${index}`}>
              <div>
                <strong>{commit.message_raw}</strong>
                <div className="muted">
                  {commit.author_name || 'Team'} ·{' '}
                  {new Date(commit.committed_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {!commits.length && <p>No linked updates yet.</p>}
        </div>
      </section>

      <section className="panel">
        <h2>Comments</h2>
        <div className="list">
          {comments.map((comment) => (
            <div className="list-item" key={comment.id}>
              <div>
                <strong>{comment.author_name}</strong>
                <div className="muted">
                  {comment.author_type} ·{' '}
                  {new Date(comment.created_at).toLocaleString()}
                </div>
                <p style={{ marginTop: 8, color: 'var(--ink)' }}>{comment.body}</p>
              </div>
            </div>
          ))}
          {!comments.length && <p>No comments yet.</p>}
        </div>

        <form className="stack" style={{ marginTop: 16 }} onSubmit={submitComment}>
          <label>
            Add a comment
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <button type="submit">Post comment</button>
        </form>
      </section>

      {error && <div className="error">{error}</div>}
    </main>
  );
}
