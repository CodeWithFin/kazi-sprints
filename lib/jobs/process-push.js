import { query } from '../db';

const TASK_REF_PATTERN = /[A-Z]+-\d+/;

export async function processPushJob(job) {
  const { repoId, payload } = job.data;
  if (!repoId || !payload) {
    throw new Error('process-push job missing repoId or payload');
  }

  const repoResult = await query(
    `SELECT id, project_id, default_branch FROM repos WHERE id = $1`,
    [repoId]
  );
  const repo = repoResult.rows[0];
  if (!repo) {
    throw new Error(`Repo not found: ${repoId}`);
  }

  const branch = (payload.ref || '').replace(/^refs\/heads\//, '');
  const commits = payload.commits || [];

  for (const commit of commits) {
    const messageRaw = commit.message || '';
    const match = messageRaw.match(TASK_REF_PATTERN);
    const taskRef = match ? match[0] : null;

    let taskId = null;
    if (taskRef) {
      const taskResult = await query(
        `SELECT t.id
         FROM tasks t
         JOIN milestones m ON m.id = t.milestone_id
         WHERE m.project_id = $1 AND t.task_ref = $2`,
        [repo.project_id, taskRef]
      );
      taskId = taskResult.rows[0]?.id || null;
    }

    const isDefaultBranch = branch === (repo.default_branch || 'main');
    const isMergedToDefault = Boolean(taskId && isDefaultBranch);

    const additions = commit.added?.length || 0;
    const deletions = commit.removed?.length || 0;
    const modified = commit.modified?.length || 0;
    const filesChanged = additions + deletions + modified;

    await query(
      `INSERT INTO commits (
         repo_id, sha, author_name, author_email, message_raw, branch,
         is_merged_to_default, additions, deletions, files_changed_count,
         task_id, committed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (repo_id, sha) DO UPDATE SET
         author_name = EXCLUDED.author_name,
         author_email = EXCLUDED.author_email,
         message_raw = EXCLUDED.message_raw,
         branch = EXCLUDED.branch,
         is_merged_to_default = commits.is_merged_to_default OR EXCLUDED.is_merged_to_default,
         additions = EXCLUDED.additions,
         deletions = EXCLUDED.deletions,
         files_changed_count = EXCLUDED.files_changed_count,
         task_id = COALESCE(EXCLUDED.task_id, commits.task_id)`,
      [
        repo.id,
        commit.id,
        commit.author?.name || null,
        commit.author?.email || null,
        messageRaw,
        branch,
        isMergedToDefault,
        additions,
        deletions,
        filesChanged,
        taskId,
        commit.timestamp || new Date().toISOString(),
      ]
    );

    if (taskId && isDefaultBranch) {
      await query(
        `UPDATE tasks
         SET status = 'in_progress'
         WHERE id = $1 AND status = 'todo'`,
        [taskId]
      );
    }
  }

  return { processed: commits.length };
}
