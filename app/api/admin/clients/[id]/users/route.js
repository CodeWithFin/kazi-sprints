import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  try {
    const { email, name, password, role } = await request.json();
    if (!email || !name || !password) {
      return errorResponse('email, name, and password are required');
    }

    const client = await query(
      `SELECT id FROM clients WHERE id = $1 AND org_id = $2`,
      [id, user.orgId]
    );
    if (!client.rows[0]) {
      return errorResponse('Client not found', 404);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO client_users (client_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, client_id, email, name, role, invited_at`,
      [
        id,
        email.toLowerCase().trim(),
        name,
        passwordHash,
        role === 'viewer' ? 'viewer' : 'owner',
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
