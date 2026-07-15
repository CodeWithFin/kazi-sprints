CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'developer')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  portal_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  UNIQUE(client_id, email)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','paused','completed')),
  start_date DATE,
  target_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_repo_full_name TEXT NOT NULL,
  repo_role TEXT CHECK (repo_role IN ('frontend','backend','mobile','infra','other')),
  github_installation_id TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  webhook_secret TEXT NOT NULL,
  UNIQUE(project_id, github_repo_full_name)
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','done','blocked')),
  planned_start DATE,
  planned_end DATE,
  actual_end DATE
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  task_ref TEXT NOT NULL,
  UNIQUE(milestone_id, task_ref)
);

CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  sha TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  message_raw TEXT NOT NULL,
  branch TEXT NOT NULL,
  is_merged_to_default BOOLEAN DEFAULT false,
  additions INT DEFAULT 0,
  deletions INT DEFAULT 0,
  files_changed_count INT DEFAULT 0,
  task_id UUID REFERENCES tasks(id),
  committed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repo_id, sha)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES client_users(id),
  user_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (client_user_id IS NOT NULL AND user_id IS NULL) OR
    (client_user_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_commits_repo ON commits(repo_id);
CREATE INDEX idx_commits_task ON commits(task_id);
CREATE INDEX idx_tasks_milestone ON tasks(milestone_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_client_users_client ON client_users(client_id);
