import { query } from '@/lib/db';
import { verifyClient, errorResponse, jsonResponse } from '@/lib/middleware';
import { milestoneProgress } from '@/lib/services/progress';

export async function GET(request, { params }) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const { id } = params;

  const project = await query(
    `SELECT id FROM projects WHERE id = $1 AND client_id = $2`,
    [id, clientUser.clientId]
  );
  if (!project.rows[0]) {
    return errorResponse('Project not accessible', 403);
  }

  const milestones = await query(
    `SELECT * FROM milestones
     WHERE project_id = $1
     ORDER BY sequence_order ASC`,
    [id]
  );

  const withProgress = await Promise.all(
    milestones.rows.map(async (milestone) => {
      const progress = await milestoneProgress(milestone.id);
      const lastCommit = await query(
        `SELECT c.committed_at
         FROM commits c
         JOIN tasks t ON t.id = c.task_id
         WHERE t.milestone_id = $1
         ORDER BY c.committed_at DESC
         LIMIT 1`,
        [milestone.id]
      );
      return {
        ...milestone,
        progress,
        last_commit_at: lastCommit.rows[0]?.committed_at || null,
      };
    })
  );

  return jsonResponse(withProgress);
}
