import { query } from '@/lib/db';
import { verifyClient, errorResponse, jsonResponse } from '@/lib/middleware';
import { projectProgress } from '@/lib/services/progress';

export async function GET(request, { params }) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const { id } = params;

  const result = await query(
    `SELECT * FROM projects
     WHERE id = $1 AND client_id = $2`,
    [id, clientUser.clientId]
  );
  if (!result.rows[0]) {
    return errorResponse('Project not accessible', 403);
  }

  const project = result.rows[0];
  return jsonResponse({
    ...project,
    progress: await projectProgress(project.id),
  });
}
