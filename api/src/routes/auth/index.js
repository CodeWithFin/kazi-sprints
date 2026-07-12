import bcrypt from 'bcryptjs';
import { query } from '../../db/pool.js';
import { signAdminToken, signClientToken } from '../../middleware/auth.js';

export default async function authRoutes(app) {
  app.post('/auth/admin/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }

    const result = await query(
      `SELECT id, org_id, email, name, role, password_hash
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = signAdminToken({
      userId: user.id,
      orgId: user.org_id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.org_id,
      },
    };
  });

  app.post('/auth/client/login', async (request, reply) => {
    const { email, password, portalSlug } = request.body || {};
    if (!email || !password || !portalSlug) {
      return reply
        .code(400)
        .send({ error: 'email, password, and portalSlug are required' });
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
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, clientUser.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    await query(
      `UPDATE client_users SET last_login_at = now() WHERE id = $1`,
      [clientUser.id]
    );

    const token = signClientToken({
      clientUserId: clientUser.id,
      clientId: clientUser.client_id,
    });

    return {
      token,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        clientId: clientUser.client_id,
        portalSlug: clientUser.portal_slug,
      },
    };
  });
}
