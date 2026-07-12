import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, query } from './pool.js';

dotenv.config();

async function seed() {
  const orgName = process.env.SEED_ORG_NAME || 'Kazi Agency';
  const orgSlug = process.env.SEED_ORG_SLUG || 'kazi';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme';
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

  const existing = await query(`SELECT id FROM organizations WHERE slug = $1`, [
    orgSlug,
  ]);

  let orgId = existing.rows[0]?.id;
  if (!orgId) {
    const org = await query(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
      [orgName, orgSlug]
    );
    orgId = org.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await query(
    `INSERT INTO users (org_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'admin', $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name,
       org_id = EXCLUDED.org_id`,
    [orgId, adminEmail.toLowerCase(), adminName, passwordHash]
  );

  console.log('Seed complete');
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
