import crypto from 'crypto';
import { query } from '@/lib/db';
import { verifyAdmin, errorResponse, jsonResponse } from '@/lib/middleware';
import { encryptSecret, registerRepoWebhook } from '@/lib/services/github';

export async function POST(request, { params }) {
  const user = await verifyAdmin(request);
  if (user.error) return errorResponse(user.error, user.status);

  const { id } = params;

  try {
    const { github_repo_full_name, repo_role, github_installation_id, default_branch, webhook_callback_url } = await request.json();

    if (!github_repo_full_name || !github_installation_id) {
      return errorResponse('github_repo_full_name and github_installation_id are required');
    }

    const project = await query(
      `SELECT p.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND c.org_id = $2`,
      [id, user.orgId]
    );
    if (!project.rows[0]) {
      return errorResponse('Project not found', 404);
    }

    const webhookSecret = crypto.randomBytes(32).toString('hex');
    const storedSecret = encryptSecret(webhookSecret);
    const result = await query(
      `INSERT INTO repos (
         project_id, github_repo_full_name, repo_role,
         github_installation_id, default_branch, webhook_secret
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, project_id, github_repo_full_name, repo_role,
                 github_installation_id, default_branch`,
      [
        id,
        github_repo_full_name,
        repo_role || 'other',
        String(github_installation_id),
        default_branch || 'main',
        storedSecret,
      ]
    );

    const repo = result.rows[0];
    const publicApiUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;
    const callbackUrl = webhook_callback_url || `${publicApiUrl}/api/webhooks/github/${repo.id}`;

    try {
      await registerRepoWebhook({
        installationId: github_installation_id,
        repoFullName: github_repo_full_name,
        webhookUrl: callbackUrl,
        webhookSecret,
      });
    } catch (err) {
      await query(`DELETE FROM repos WHERE id = $1`, [repo.id]);
      return errorResponse('Failed to register GitHub webhook: ' + err.message, 502);
    }

    return jsonResponse(repo, 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
