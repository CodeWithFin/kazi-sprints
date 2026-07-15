import { query } from '@/lib/db';
import { verifyClient, errorResponse, jsonResponse } from '@/lib/middleware';

async function assertMilestoneOwnedByClient(milestoneId, clientId) {
  const result = await query(
    `SELECT m.id, m.project_id
     FROM milestones m
     JOIN projects p ON p.id = m.project_id
     WHERE m.id = $1 AND p.client_id = $2`,
    [milestoneId, clientId]
  );
  return result.rows[0] || null;
}

export async function GET(request, { params }) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const { id } = params;

  const milestone = await assertMilestoneOwnedByClient(id, clientUser.clientId);
  if (!milestone) {
    return errorResponse('Milestone not accessible', 403);
  }

  const result = await query(
    `SELECT
       c.id,
       c.milestone_id,
       c.body,
       c.parent_comment_id,
       c.created_at,
       c.client_user_id,
       c.user_id,
       COALESCE(cu.name, u.name) AS author_name,
       CASE
         WHEN c.client_user_id IS NOT NULL THEN 'client'
         ELSE 'admin'
       END AS author_type
     FROM comments c
     LEFT JOIN client_users cu ON cu.id = c.client_user_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.milestone_id = $1
     ORDER BY c.created_at ASC`,
    [id]
  );
  return jsonResponse(result.rows);
}

export async function POST(request, { params }) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const { id } = params;

  try {
    const { body, parent_comment_id } = await request.json();
    if (!body?.trim()) {
      return errorResponse('body is required');
    }

    const milestone = await assertMilestoneOwnedByClient(id, clientUser.clientId);
    if (!milestone) {
      return errorResponse('Milestone not accessible', 403);
    }

    const result = await query(
      `INSERT INTO comments (milestone_id, client_user_id, body, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, milestone_id, client_user_id, body, parent_comment_id, created_at`,
      [
        id,
        clientUser.clientUserId,
        body.trim(),
        parent_comment_id || null,
      ]
    );
    return jsonResponse(result.rows[0], 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
