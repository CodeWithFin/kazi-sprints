import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  const result = await query(
    `SELECT p.*
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.id = $1 AND c.org_id = $2`,
    [id, user.orgId]
  );
  if (!result.rows[0]) {
    return errorResponse('Project not found', 404);
  }

  const milestones = await query(
    `SELECT * FROM milestones WHERE project_id = $1 ORDER BY sequence_order ASC`,
    [id]
  );
  const repos = await query(
    `SELECT id, project_id, github_repo_full_name, repo_role, github_installation_id, default_branch
     FROM repos WHERE project_id = $1`,
    [id]
  );

  const milestonesWithTasks = await Promise.all(
    milestones.rows.map(async (milestone) => {
      const tasks = await query(
        `SELECT * FROM tasks WHERE milestone_id = $1 ORDER BY task_ref ASC`,
        [milestone.id]
      );
      return { ...milestone, tasks: tasks.rows };
    })
  );

  return jsonResponse({
    ...result.rows[0],
    milestones: milestonesWithTasks,
    repos: repos.rows,
  });
}
