import { query } from '@/lib/db';
import { verifyClient, errorResponse, jsonResponse } from '@/lib/middleware';

async function assertMilestoneOwnedByClient(milestoneId, clientId) {
  const result = await query(
    `SELECT m.id, m.project_id
     FROM milestones m
     JOIN projects p ON p.id = m.project_id
     WHERE m.id = $1 AND p.client_id = $2`,
    [milestoneId, clientId]
  );
  return result.rows[0] || null;
}

export async function GET(request, { params }) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const { id } = params;

  const milestone = await assertMilestoneOwnedByClient(id, clientUser.clientId);
  if (!milestone) {
    return errorResponse('Milestone not accessible', 403);
  }

  const result = await query(
    `SELECT c.message_raw, c.committed_at, c.author_name
     FROM commits c
     JOIN tasks t ON t.id = c.task_id
     WHERE t.milestone_id = $1
     ORDER BY c.committed_at DESC
     LIMIT 100`,
    [id]
  );

  const tasks = await query(
    `SELECT title, status FROM tasks WHERE milestone_id = $1 ORDER BY task_ref ASC`,
    [id]
  );

  return jsonResponse({
    commits: result.rows,
    tasks: tasks.rows,
  });
}
