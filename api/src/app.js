import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth/index.js';

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes);

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
