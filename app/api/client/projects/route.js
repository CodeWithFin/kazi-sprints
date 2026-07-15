import { query } from '@/lib/db';
import { verifyClient, errorResponse, jsonResponse } from '@/lib/middleware';
import { projectProgress } from '@/lib/services/progress';

export async function GET(request) {
  const clientUser = await verifyClient(request);
  if (clientUser.error) return errorResponse(clientUser.error, clientUser.status);

  const result = await query(
    `SELECT * FROM projects
     WHERE client_id = $1
     ORDER BY created_at DESC`,
    [clientUser.clientId]
  );

  const projects = await Promise.all(
    result.rows.map(async (project) => ({
      ...project,
      progress: await projectProgress(project.id),
    }))
  );
  return jsonResponse(projects);
}
