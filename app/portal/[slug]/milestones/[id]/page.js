'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../../lib/api';
import {
  clearClientSession,
  getClientToken,
  getStoredPortalSlug,
} from '../../../../../lib/auth';
import CanvasNav from '../../../../../lib/components/CanvasNav';

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
    <div className="min-h-screen bg-white">
      <CanvasNav activePath={`/portal/${slug}`} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/portal/${slug}`} className="canvas-muted text-sm hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-4xl mt-1" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '-0.02em' }}>
            Milestone Activity
          </h1>
          <p className="canvas-muted">Updates and conversation — no source code or file details.</p>
        </div>

        <div className="canvas-panel">
          <h2>Tasks</h2>
          <div className="canvas-list">
            {tasks.map((task, index) => (
              <div className="canvas-list-item" key={`${task.title}-${index}`}>
                <strong>{task.title}</strong>
                <span className={`canvas-badge ${task.status}`}>{task.status}</span>
              </div>
            ))}
            {!tasks.length && <p className="canvas-muted py-4">No tasks yet.</p>}
          </div>
        </div>

        <div className="canvas-panel">
          <h2>Recent Updates</h2>
          <div className="canvas-list">
            {commits.map((commit, index) => (
              <div className="canvas-list-item" key={`${commit.committed_at}-${index}`}>
                <div>
                  <strong>{commit.message_raw}</strong>
                  <div className="canvas-muted mt-1">
                    {commit.author_name || 'Team'} ·{' '}
                    {new Date(commit.committed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {!commits.length && <p className="canvas-muted py-4">No linked updates yet.</p>}
          </div>
        </div>

        <div className="canvas-panel">
          <h2>Comments</h2>
          <div className="canvas-list">
            {comments.map((comment) => (
              <div className="canvas-list-item flex-col items-start" key={comment.id}>
                <div className="w-full">
                  <div className="flex items-center gap-3">
                    <strong>{comment.author_name}</strong>
                    <span className="canvas-muted text-xs">
                      {comment.author_type} ·{' '}
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-neutral-800">{comment.body}</p>
                </div>
              </div>
            ))}
            {!comments.length && <p className="canvas-muted py-4">No comments yet.</p>}
          </div>

          <form className="canvas-stack mt-4" onSubmit={submitComment}>
            <label className="canvas-label">
              Add a comment
              <textarea
                className="canvas-textarea"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Write your comment here…"
              />
            </label>
            <button className="canvas-btn w-fit" type="submit">
              Post comment
            </button>
          </form>
        </div>

        {error && <div className="canvas-error">{error}</div>}
      </div>
    </div>
  );
}
