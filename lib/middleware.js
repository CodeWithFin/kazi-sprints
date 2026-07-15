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

export async function verifyAdmin(request) {
  try {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      return { error: 'Missing admin token', status: 401 };
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, getAdminSecret(), {
      audience: 'ppp-admin',
    });
    return {
      userId: decoded.userId,
      orgId: decoded.orgId,
      role: decoded.role,
    };
  } catch {
    return { error: 'Invalid admin token', status: 401 };
  }
}

export async function verifyClient(request) {
  try {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      return { error: 'Missing client token', status: 401 };
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, getClientSecret(), {
      audience: 'ppp-client',
    });
    return {
      clientUserId: decoded.clientUserId,
      clientId: decoded.clientId,
    };
  } catch {
    return { error: 'Invalid client token', status: 401 };
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error, status = 400) {
  return jsonResponse({ error }, status);
}
