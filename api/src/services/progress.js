import { query } from '../db/pool.js';

export async function milestoneProgress(milestoneId) {
  const result = await query(
    `SELECT
       COUNT(*)::int AS tasks_total,
       COUNT(*) FILTER (WHERE status = 'done')::int AS tasks_done
     FROM tasks
     WHERE milestone_id = $1`,
    [milestoneId]
  );
  const { tasks_total: total, tasks_done: done } = result.rows[0];
  if (!total) return 0;
  return done / total;
}

export async function projectProgress(projectId) {
  const milestones = await query(
    `SELECT id FROM milestones WHERE project_id = $1`,
    [projectId]
  );
  if (!milestones.rows.length) return 0;

  const values = await Promise.all(
    milestones.rows.map((m) => milestoneProgress(m.id))
  );
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}
