import jwt from 'jsonwebtoken';

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET is not set');
  return secret;
}

function getClientSecret() {
  const secret = process.env.CLIENT_JWT_SECRET;
  if (!secret) throw new Error('CLIENT_JWT_SECRET is not set');
  return secret;
}

export function signAdminToken(payload) {
  return jwt.sign(payload, getAdminSecret(), {
    expiresIn: '8h',
    audience: 'ppp-admin',
  });
}

export function signClientToken(payload) {
  return jwt.sign(payload, getClientSecret(), {
    expiresIn: '8h',
    audience: 'ppp-client',
  });
}

export async function verifyAdminJWT(request, reply) {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing admin token' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, getAdminSecret(), {
      audience: 'ppp-admin',
    });
    request.user = {
      userId: decoded.userId,
      orgId: decoded.orgId,
      role: decoded.role,
    };
  } catch {
    return reply.code(401).send({ error: 'Invalid admin token' });
  }
}

export async function verifyClientJWT(request, reply) {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing client token' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, getClientSecret(), {
      audience: 'ppp-client',
    });
    request.clientUser = {
      clientUserId: decoded.clientUserId,
      clientId: decoded.clientId,
    };
  } catch {
    return reply.code(401).send({ error: 'Invalid client token' });
  }
}
