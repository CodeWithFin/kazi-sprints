import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(request) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const result = await query(
    `SELECT * FROM clients WHERE org_id = $1 ORDER BY created_at DESC`,
    [user.orgId]
  );
  return jsonResponse(result.rows);
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  try {
    const { name, company_name, contact_email, contact_phone, portal_slug } = await request.json();

    if (!name || !contact_email) {
      return errorResponse('name and contact_email are required');
    }

    const slug = portal_slug || slugify(company_name || name);
    const result = await query(
      `INSERT INTO clients (org_id, name, company_name, contact_email, contact_phone, portal_slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.orgId,
        name,
        company_name || null,
        contact_email.toLowerCase().trim(),
        contact_phone || null,
        slug,
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
