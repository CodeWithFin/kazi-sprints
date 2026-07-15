import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, query } from '../db.js';

dotenv.config({ path: '.env.local' });

async function seed() {
  const orgName = process.env.SEED_ORG_NAME || 'Kazi Agency';
  const orgSlug = process.env.SEED_ORG_SLUG || 'kazi';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'finley.mwachia12@gmail.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Misti@215';
  const adminName = process.env.SEED_ADMIN_NAME || 'Finley';
  const clientPortalSlug = process.env.SEED_CLIENT_PORTAL_SLUG || 'acme';
  const clientEmail = process.env.SEED_CLIENT_EMAIL || 'client@acme.com';
  const clientPassword = process.env.SEED_CLIENT_PASSWORD || 'Client@215';
  const clientName = process.env.SEED_CLIENT_NAME || 'Alex Client';

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

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await query(
    `INSERT INTO users (org_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'admin', $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name,
       org_id = EXCLUDED.org_id`,
    [orgId, adminEmail.toLowerCase(), adminName, adminHash]
  );

  const clientRow = await query(
    `SELECT id FROM clients WHERE portal_slug = $1`,
    [clientPortalSlug]
  );
  let clientId = clientRow.rows[0]?.id;
  if (!clientId) {
    const inserted = await query(
      `INSERT INTO clients (org_id, name, company_name, contact_email, portal_slug)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        orgId,
        'Acme Corp',
        'Acme Corporation',
        clientEmail.toLowerCase(),
        clientPortalSlug,
      ]
    );
    clientId = inserted.rows[0].id;
  }

  const clientHash = await bcrypt.hash(clientPassword, 10);
  await query(
    `INSERT INTO client_users (client_id, email, name, role, password_hash)
     VALUES ($1, $2, $3, 'owner', $4)
     ON CONFLICT (client_id, email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name`,
    [clientId, clientEmail.toLowerCase(), clientName, clientHash]
  );

  const projectRow = await query(
    `SELECT id FROM projects WHERE client_id = $1 AND name = $2`,
    [clientId, 'Website Redesign']
  );
  let projectId = projectRow.rows[0]?.id;
  if (!projectId) {
    const inserted = await query(
      `INSERT INTO projects (client_id, name, description, status, start_date, target_end_date)
       VALUES ($1, $2, $3, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days')
       RETURNING id`,
      [
        clientId,
        'Website Redesign',
        'Modernize the marketing site and client portal experience.',
      ]
    );
    projectId = inserted.rows[0].id;
  }

  const milestones = [
    ['Discovery', 'Requirements and design alignment', 1, 'done'],
    ['Build', 'Core pages and authentication', 2, 'in_progress'],
    ['Launch', 'QA, deploy, and handoff', 3, 'not_started'],
  ];

  for (const [name, description, sequenceOrder, status] of milestones) {
    await query(
      `INSERT INTO milestones (project_id, name, description, sequence_order, status)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM milestones WHERE project_id = $1 AND name = $2
       )`,
      [projectId, name, description, sequenceOrder, status]
    );
  }

  console.log('Seed complete');
  console.log(`Admin login:  ${adminEmail} / ${adminPassword}`);
  console.log(`Client login: ${clientEmail} / ${clientPassword} (portal slug: ${clientPortalSlug})`);
  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
