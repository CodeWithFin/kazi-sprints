import crypto from 'crypto';
import { query } from '@/lib/db';
import { decryptSecret } from '@/lib/services/github';
import { getPushQueue } from '@/lib/jobs/queue';
import { errorResponse, jsonResponse } from '@/lib/middleware';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request, { params }) {
  const { repoId } = params;
  const signature = request.headers.get('x-hub-signature-256');
  const rawBody = await request.clone().text();

  if (!rawBody) {
    return errorResponse('Expected raw body', 400);
  }

  const repoResult = await query(
    `SELECT id, webhook_secret FROM repos WHERE id = $1`,
    [repoId]
  );
  const repo = repoResult.rows[0];
  if (!repo) {
    return errorResponse('Repo not found', 404);
  }

  if (!signature) {
    return errorResponse('Missing signature', 401);
  }

  let secret;
  try {
    secret = decryptSecret(repo.webhook_secret);
  } catch {
    return errorResponse('Webhook secret unavailable', 500);
  }

  const digest = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('hex');
  const expected = `sha256=${digest}`;

  if (!timingSafeEqual(expected, signature)) {
    return errorResponse('Invalid signature', 401);
  }

  const event = request.headers.get('x-github-event');
  if (event === 'push') {
    const body = JSON.parse(rawBody);
    await getPushQueue().add(
      'process-push',
      { repoId, payload: body },
      {
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );
  }

  return jsonResponse({ received: true });
}
