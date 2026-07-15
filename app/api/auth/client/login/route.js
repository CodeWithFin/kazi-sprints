import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signClientToken, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request) {
  try {
    const { email, password, portalSlug } = await request.json();
    if (!email || !password || !portalSlug) {
      return errorResponse('email, password, and portalSlug are required', 400);
    }

    const result = await query(
      `SELECT cu.id, cu.client_id, cu.email, cu.name, cu.role, cu.password_hash,
              c.portal_slug
       FROM client_users cu
       JOIN clients c ON c.id = cu.client_id
       WHERE cu.email = $1 AND c.portal_slug = $2`,
      [email.toLowerCase().trim(), portalSlug]
    );
    const clientUser = result.rows[0];
    if (!clientUser) {
      return errorResponse('Invalid credentials', 401);
    }

    const ok = await bcrypt.compare(password, clientUser.password_hash);
    if (!ok) {
      return errorResponse('Invalid credentials', 401);
    }

    await query(
      `UPDATE client_users SET last_login_at = now() WHERE id = $1`,
      [clientUser.id]
    );

    const token = signClientToken({
      clientUserId: clientUser.id,
      clientId: clientUser.client_id,
    });

    return jsonResponse({
      token,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        clientId: clientUser.client_id,
        portalSlug: clientUser.portal_slug,
      },
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
