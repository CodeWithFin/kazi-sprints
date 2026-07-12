import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../../db/pool.js';
import { verifyAdminJWT } from '../../middleware/auth.js';
import {
  encryptSecret,
  registerRepoWebhook,
} from '../../services/github.js';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function adminRoutes(app) {
  app.addHook('preHandler', verifyAdminJWT);

  app.post('/admin/clients', async (request, reply) => {
    const {
      name,
      company_name,
      contact_email,
      contact_phone,
      portal_slug,
    } = request.body || {};

    if (!name || !contact_email) {
      return reply.code(400).send({ error: 'name and contact_email are required' });
    }

    const slug = portal_slug || slugify(company_name || name);
    const result = await query(
      `INSERT INTO clients (org_id, name, company_name, contact_email, contact_phone, portal_slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        request.user.orgId,
        name,
        company_name || null,
        contact_email.toLowerCase().trim(),
        contact_phone || null,
        slug,
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.get('/admin/clients', async (request) => {
    const result = await query(
      `SELECT * FROM clients WHERE org_id = $1 ORDER BY created_at DESC`,
      [request.user.orgId]
    );
    return result.rows;
  });

  app.get('/admin/clients/:id', async (request, reply) => {
    const result = await query(
      `SELECT * FROM clients WHERE id = $1 AND org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    const projects = await query(
      `SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC`,
      [request.params.id]
    );

    return {
      ...result.rows[0],
      projects: projects.rows,
    };
  });

  app.post('/admin/clients/:id/users', async (request, reply) => {
    const { email, name, password, role } = request.body || {};
    if (!email || !name || !password) {
      return reply
        .code(400)
        .send({ error: 'email, name, and password are required' });
    }

    const client = await query(
      `SELECT id FROM clients WHERE id = $1 AND org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!client.rows[0]) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO client_users (client_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, client_id, email, name, role, invited_at`,
      [
        request.params.id,
        email.toLowerCase().trim(),
        name,
        passwordHash,
        role === 'viewer' ? 'viewer' : 'owner',
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.post('/admin/projects', async (request, reply) => {
    const {
      client_id,
      name,
      description,
      status,
      start_date,
      target_end_date,
    } = request.body || {};

    if (!client_id || !name) {
      return reply.code(400).send({ error: 'client_id and name are required' });
    }

    const client = await query(
      `SELECT id FROM clients WHERE id = $1 AND org_id = $2`,
      [client_id, request.user.orgId]
    );
    if (!client.rows[0]) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    const result = await query(
      `INSERT INTO projects (client_id, name, description, status, start_date, target_end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        client_id,
        name,
        description || null,
        status || 'planning',
        start_date || null,
        target_end_date || null,
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.get('/admin/projects/:id', async (request, reply) => {
    const result = await query(
      `SELECT p.*
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND c.org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const milestones = await query(
      `SELECT * FROM milestones WHERE project_id = $1 ORDER BY sequence_order ASC`,
      [request.params.id]
    );
    const repos = await query(
      `SELECT id, project_id, github_repo_full_name, repo_role, github_installation_id, default_branch
       FROM repos WHERE project_id = $1`,
      [request.params.id]
    );

    const milestonesWithTasks = await Promise.all(
      milestones.rows.map(async (milestone) => {
        const tasks = await query(
          `SELECT * FROM tasks WHERE milestone_id = $1 ORDER BY task_ref ASC`,
          [milestone.id]
        );
        return { ...milestone, tasks: tasks.rows };
      })
    );

    return {
      ...result.rows[0],
      milestones: milestonesWithTasks,
      repos: repos.rows,
    };
  });

  app.post('/admin/projects/:id/repos', async (request, reply) => {
    const {
      github_repo_full_name,
      repo_role,
      github_installation_id,
      default_branch,
      webhook_callback_url,
    } = request.body || {};

    if (!github_repo_full_name || !github_installation_id) {
      return reply.code(400).send({
        error: 'github_repo_full_name and github_installation_id are required',
      });
    }

    const project = await query(
      `SELECT p.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND c.org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!project.rows[0]) {
      return reply.code(404).send({ error: 'Project not found' });
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
        request.params.id,
        github_repo_full_name,
        repo_role || 'other',
        String(github_installation_id),
        default_branch || 'main',
        storedSecret,
      ]
    );

    const repo = result.rows[0];
    const callbackUrl =
      webhook_callback_url ||
      `${process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT_API || 4000}`}/webhooks/github/${repo.id}`;

    try {
      await registerRepoWebhook({
        installationId: github_installation_id,
        repoFullName: github_repo_full_name,
        webhookUrl: callbackUrl,
        webhookSecret,
      });
    } catch (err) {
      await query(`DELETE FROM repos WHERE id = $1`, [repo.id]);
      return reply.code(502).send({
        error: 'Failed to register GitHub webhook',
        detail: err.message,
      });
    }

    return reply.code(201).send(repo);
  });

  app.post('/admin/projects/:id/milestones', async (request, reply) => {
    const {
      name,
      description,
      sequence_order,
      status,
      planned_start,
      planned_end,
    } = request.body || {};

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const project = await query(
      `SELECT p.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND c.org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!project.rows[0]) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const result = await query(
      `INSERT INTO milestones (
         project_id, name, description, sequence_order, status, planned_start, planned_end
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        request.params.id,
        name,
        description || null,
        sequence_order ?? 0,
        status || 'not_started',
        planned_start || null,
        planned_end || null,
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.post('/admin/milestones/:id/tasks', async (request, reply) => {
    const { title, description, status, task_ref } = request.body || {};
    if (!title || !task_ref) {
      return reply.code(400).send({ error: 'title and task_ref are required' });
    }

    const milestone = await query(
      `SELECT m.id
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.id = $1 AND c.org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!milestone.rows[0]) {
      return reply.code(404).send({ error: 'Milestone not found' });
    }

    const result = await query(
      `INSERT INTO tasks (milestone_id, title, description, status, task_ref)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        request.params.id,
        title,
        description || null,
        status || 'todo',
        task_ref.toUpperCase(),
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.patch('/admin/milestones/:id', async (request, reply) => {
    const {
      name,
      description,
      sequence_order,
      status,
      planned_start,
      planned_end,
      actual_end,
    } = request.body || {};

    const milestone = await query(
      `SELECT m.*
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.id = $1 AND c.org_id = $2`,
      [request.params.id, request.user.orgId]
    );
    if (!milestone.rows[0]) {
      return reply.code(404).send({ error: 'Milestone not found' });
    }

    const current = milestone.rows[0];
    const nextStatus = status || current.status;
    const result = await query(
      `UPDATE milestones SET
         name = $1,
         description = $2,
         sequence_order = $3,
         status = $4,
         planned_start = $5,
         planned_end = $6,
         actual_end = $7
       WHERE id = $8
       RETURNING *`,
      [
        name ?? current.name,
        description !== undefined ? description : current.description,
        sequence_order ?? current.sequence_order,
        nextStatus,
        planned_start !== undefined ? planned_start : current.planned_start,
        planned_end !== undefined ? planned_end : current.planned_end,
        actual_end !== undefined
          ? actual_end
          : nextStatus === 'done' && !current.actual_end
            ? new Date().toISOString().slice(0, 10)
            : current.actual_end,
        request.params.id,
      ]
    );
    return result.rows[0];
  });
}
