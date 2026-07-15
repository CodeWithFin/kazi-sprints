import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  const result = await query(
    `SELECT * FROM clients WHERE id = $1 AND org_id = $2`,
    [id, user.orgId]
  );
  if (!result.rows[0]) {
    return errorResponse('Client not found', 404);
  }

  const projects = await query(
    `SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return jsonResponse({
    ...result.rows[0],
    projects: projects.rows,
  });
}
