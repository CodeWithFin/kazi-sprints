import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  try {
    const { client_id, name, description, status, start_date, target_end_date } = await request.json();

    if (!client_id || !name) {
      return errorResponse('client_id and name are required');
    }

    const client = await query(
      `SELECT id FROM clients WHERE id = $1 AND org_id = $2`,
      [client_id, user.orgId]
    );
    if (!client.rows[0]) {
      return errorResponse('Client not found', 404);
    }

    const result = await query(
      `INSERT INTO projects (client_id, name, description, status, start_date, target_end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        client_id,
        name,
        description || null,
        status || 'planning',
        start_date || null,
        target_end_date || null,
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
