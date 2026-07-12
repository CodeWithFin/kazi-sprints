import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth/index.js';
import adminRoutes from './routes/admin/index.js';
import clientRoutes from './routes/client/index.js';
import webhookRoutes from './routes/webhooks/github.js';

dotenv.config();

const app = Fastify({
  logger: true,
});

// Preserve raw body for webhook signature verification while still parsing JSON.
app.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  (req, body, done) => {
    try {
      req.rawBody = body;
      const json = body.length ? JSON.parse(body.toString('utf8')) : {};
      done(null, json);
    } catch (err) {
      done(err);
    }
  }
);

await app.register(cors, {
  origin: true,
  credentials: true,
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(adminRoutes);
await app.register(clientRoutes);
await app.register(webhookRoutes);

const port = Number(process.env.PORT_API || 4000);
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`API listening on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
