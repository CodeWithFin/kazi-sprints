import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function PATCH(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  try {
    const { name, description, sequence_order, status, planned_start, planned_end, actual_end } = await request.json();

    const milestone = await query(
      `SELECT m.*
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.id = $1 AND c.org_id = $2`,
      [id, user.orgId]
    );
    if (!milestone.rows[0]) {
      return errorResponse('Milestone not found', 404);
    }

    const current = milestone.rows[0];
    const nextStatus = status || current.status;
    const result = await query(
      `UPDATE milestones SET
         name = $1,
         description = $2,
         sequence_order = $3,
         status = $4,
         planned_start = $5,
         planned_end = $6,
         actual_end = $7
       WHERE id = $8
       RETURNING *`,
      [
        name ?? current.name,
        description !== undefined ? description : current.description,
        sequence_order ?? current.sequence_order,
        nextStatus,
        planned_start !== undefined ? planned_start : current.planned_start,
        planned_end !== undefined ? planned_end : current.planned_end,
        actual_end !== undefined
          ? actual_end
          : nextStatus === 'done' && !current.actual_end
            ? new Date().toISOString().slice(0, 10)
            : current.actual_end,
        id,
      ]
    );
    return jsonResponse(result.rows[0]);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
