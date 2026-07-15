import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  try {
    const { title, description, status, task_ref } = await request.json();
    if (!title || !task_ref) {
      return errorResponse('title and task_ref are required');
    }

    const milestone = await query(
      `SELECT m.id
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.id = $1 AND c.org_id = $2`,
      [id, user.orgId]
    );
    if (!milestone.rows[0]) {
      return errorResponse('Milestone not found', 404);
    }

    const result = await query(
      `INSERT INTO tasks (milestone_id, title, description, status, task_ref)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        title,
        description || null,
        status || 'todo',
        task_ref.toUpperCase(),
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
