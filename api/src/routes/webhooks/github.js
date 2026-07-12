import { query } from '../../db/pool.js';
import { decryptSecret } from '../../services/github.js';
import { getPushQueue } from '../../jobs/queue.js';
import crypto from 'crypto';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function webhookRoutes(app) {
  app.post('/webhooks/github/:repoId', async (request, reply) => {
    const { repoId } = request.params;
    const signature = request.headers['x-hub-signature-256'];
    const rawBody = request.rawBody;

    if (!Buffer.isBuffer(rawBody)) {
      return reply.code(400).send({ error: 'Expected raw body' });
    }

    const repoResult = await query(
      `SELECT id, webhook_secret FROM repos WHERE id = $1`,
      [repoId]
    );
    const repo = repoResult.rows[0];
    if (!repo) {
      return reply.code(404).send({ error: 'Repo not found' });
    }

    if (!signature || typeof signature !== 'string') {
      return reply.code(401).send({ error: 'Missing signature' });
    }

    let secret;
    try {
      secret = decryptSecret(repo.webhook_secret);
    } catch {
      return reply.code(500).send({ error: 'Webhook secret unavailable' });
    }

    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    const expected = `sha256=${digest}`;

    if (!timingSafeEqual(expected, signature)) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    const event = request.headers['x-github-event'];
    if (event === 'push') {
      await getPushQueue().add(
        'process-push',
        { repoId, payload: request.body },
        {
          removeOnComplete: 100,
          removeOnFail: 200,
        }
      );
    }

    return reply.code(200).send({ received: true });
  });
}
