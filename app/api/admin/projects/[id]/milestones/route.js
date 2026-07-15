import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  try {
    const { name, description, sequence_order, status, planned_start, planned_end } = await request.json();

    if (!name) {
      return errorResponse('name is required');
    }

    const project = await query(
      `SELECT p.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND c.org_id = $2`,
      [id, user.orgId]
    );
    if (!project.rows[0]) {
      return errorResponse('Project not found', 404);
    }

    const result = await query(
      `INSERT INTO milestones (
         project_id, name, description, sequence_order, status, planned_start, planned_end
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        name,
        description || null,
        sequence_order ?? 0,
        status || 'not_started',
        planned_start || null,
        planned_end || null,
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
