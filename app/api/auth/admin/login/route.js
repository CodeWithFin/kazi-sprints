import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signAdminToken, errorResponse, jsonResponse } from '@/lib/middleware';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return errorResponse('email and password are required', 400);
    }

    const result = await query(
      `SELECT id, org_id, email, name, role, password_hash
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = signAdminToken({
      userId: user.id,
      orgId: user.org_id,
      role: user.role,
    });

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.org_id,
      },
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
