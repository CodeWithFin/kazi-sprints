import dns from 'dns';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('DATABASE_URL is not set');
    return {};
  }

  try {
    const url = new URL(connectionString);
    const isLocal =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (isLocal) {
      return { connectionString, ssl: false };
    }

    const { address } = await dns.promises.lookup(url.hostname, { family: 4 });
    return {
      host: address,
      port: url.port ? Number(url.port) : 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1).split('?')[0],
      ssl: { rejectUnauthorized: false, servername: url.hostname },
      connectionTimeoutMillis: 30000,
    };
  } catch (err) {
    console.warn(
      'Could not resolve DATABASE_URL host, using connection string:',
      err.message
    );
    return {
      connectionString,
      ssl: connectionString.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    };
  }
}

const poolConfig = await buildPoolConfig();
export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Database query error:', {
      code: err?.code,
      errno: err?.errno,
      message: err?.message,
      hint: err?.hint,
      detail: err?.detail,
    });
    if (!err?.message) {
      err.message = 'Database connection failed - check your DATABASE_URL and network access';
    }
    throw err;
  }
}
