import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set');
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (!err?.message) {
      err.message = 'Database connection failed - check your DATABASE_URL and network access';
    }
    throw err;
  }
}
