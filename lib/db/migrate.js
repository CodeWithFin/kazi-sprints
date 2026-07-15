import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    const exists = await client.query(
      `SELECT to_regclass('public.organizations') AS organizations`
    );
    if (exists.rows[0]?.organizations) {
      console.log('Schema already applied, skipping');
      return;
    }

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Schema applied successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
