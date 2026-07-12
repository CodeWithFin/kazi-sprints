import { query } from '../../db/pool.js';
import { verifyClientJWT } from '../../middleware/auth.js';
import {
  milestoneProgress,
  projectProgress,
} from '../../services/progress.js';

async function assertMilestoneOwnedByClient(milestoneId, clientId) {
  const result = await query(
    `SELECT m.id, m.project_id
     FROM milestones m
     JOIN projects p ON p.id = m.project_id
     WHERE m.id = $1 AND p.client_id = $2`,
    [milestoneId, clientId]
  );
  return result.rows[0] || null;
}

export default async function clientRoutes(app) {
  app.addHook('preHandler', verifyClientJWT);

  app.get('/client/projects', async (request) => {
    const result = await query(
      `SELECT * FROM projects
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [request.clientUser.clientId]
    );

    const projects = await Promise.all(
      result.rows.map(async (project) => ({
        ...project,
        progress: await projectProgress(project.id),
      }))
    );
    return projects;
  });

  app.get('/client/projects/:id', async (request, reply) => {
    const result = await query(
      `SELECT * FROM projects
       WHERE id = $1 AND client_id = $2`,
      [request.params.id, request.clientUser.clientId]
    );
    if (!result.rows[0]) {
      return reply.code(403).send({ error: 'Project not accessible' });
    }

    const project = result.rows[0];
    return {
      ...project,
      progress: await projectProgress(project.id),
    };
  });

  app.get('/client/projects/:id/milestones', async (request, reply) => {
    const project = await query(
      `SELECT id FROM projects WHERE id = $1 AND client_id = $2`,
      [request.params.id, request.clientUser.clientId]
    );
    if (!project.rows[0]) {
      return reply.code(403).send({ error: 'Project not accessible' });
    }

    const milestones = await query(
      `SELECT * FROM milestones
       WHERE project_id = $1
       ORDER BY sequence_order ASC`,
      [request.params.id]
    );

    const withProgress = await Promise.all(
      milestones.rows.map(async (milestone) => {
        const progress = await milestoneProgress(milestone.id);
        const lastCommit = await query(
          `SELECT c.committed_at
           FROM commits c
           JOIN tasks t ON t.id = c.task_id
           WHERE t.milestone_id = $1
           ORDER BY c.committed_at DESC
           LIMIT 1`,
          [milestone.id]
        );
        return {
          ...milestone,
          progress,
          last_commit_at: lastCommit.rows[0]?.committed_at || null,
        };
      })
    );

    return withProgress;
  });

  app.get('/client/milestones/:id/commits', async (request, reply) => {
    const milestone = await assertMilestoneOwnedByClient(
      request.params.id,
      request.clientUser.clientId
    );
    if (!milestone) {
      return reply.code(403).send({ error: 'Milestone not accessible' });
    }

    const result = await query(
      `SELECT c.message_raw, c.committed_at, c.author_name
       FROM commits c
       JOIN tasks t ON t.id = c.task_id
       WHERE t.milestone_id = $1
       ORDER BY c.committed_at DESC
       LIMIT 100`,
      [request.params.id]
    );
    return result.rows;
  });

  app.post('/client/milestones/:id/comments', async (request, reply) => {
    const { body, parent_comment_id } = request.body || {};
    if (!body?.trim()) {
      return reply.code(400).send({ error: 'body is required' });
    }

    const milestone = await assertMilestoneOwnedByClient(
      request.params.id,
      request.clientUser.clientId
    );
    if (!milestone) {
      return reply.code(403).send({ error: 'Milestone not accessible' });
    }

    const result = await query(
      `INSERT INTO comments (milestone_id, client_user_id, body, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, milestone_id, client_user_id, body, parent_comment_id, created_at`,
      [
        request.params.id,
        request.clientUser.clientUserId,
        body.trim(),
        parent_comment_id || null,
      ]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.get('/client/milestones/:id/comments', async (request, reply) => {
    const milestone = await assertMilestoneOwnedByClient(
      request.params.id,
      request.clientUser.clientId
    );
    if (!milestone) {
      return reply.code(403).send({ error: 'Milestone not accessible' });
    }

    const result = await query(
      `SELECT
         c.id,
         c.milestone_id,
         c.body,
         c.parent_comment_id,
         c.created_at,
         c.client_user_id,
         c.user_id,
         COALESCE(cu.name, u.name) AS author_name,
         CASE
           WHEN c.client_user_id IS NOT NULL THEN 'client'
           ELSE 'admin'
         END AS author_type
       FROM comments c
       LEFT JOIN client_users cu ON cu.id = c.client_user_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.milestone_id = $1
       ORDER BY c.created_at ASC`,
      [request.params.id]
    );
    return result.rows;
  });
}
