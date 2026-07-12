# Client Progress Portal (kazi-sprints)

Monorepo MVP that shows clients real-time project progress from GitHub activity — without exposing source code, diffs, or repo access.

## Processes

| PM2 name | Role |
|----------|------|
| `ppp-api` | Fastify API on port `4000` |
| `ppp-web` | Next.js UI on port `3000` |
| `ppp-worker` | BullMQ worker for GitHub push jobs |

## Prerequisites

- Node.js 20+
- PostgreSQL via Neon (pooled connection string)
- Redis (local or remote) for BullMQ
- A GitHub App with read-only repo permissions
- PM2 (`npm i -g pm2`)

## 1. Install dependencies

```bash
cd api && npm install
cd ../web && npm install
```

## 2. Configure environment

Copy examples and fill in secrets:

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

### `api/.env`

```
DATABASE_URL=                 # Neon pooled connection string
REDIS_URL=redis://127.0.0.1:6379
ADMIN_JWT_SECRET=             # long random string
CLIENT_JWT_SECRET=            # different long random string
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=       # PEM, base64-encoded
GITHUB_APP_WEBHOOK_SECRET=
WEBHOOK_SECRET_ENCRYPTION_KEY=
PUBLIC_API_URL=https://api.example.com
PORT_API=4000
```

### `web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:4000
PORT_WEB=3000
```

`ADMIN_JWT_SECRET` and `CLIENT_JWT_SECRET` must never be the same value.

## 3. Run the database schema

```bash
cd api
npm run migrate
npm run seed
```

Default seed admin (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):

- Email: `admin@example.com`
- Password: `changeme`

## 4. Build and start with PM2

```bash
cd web && npm run build && cd ..
pm2 start ecosystem.config.js
pm2 status
```

Useful commands:

```bash
pm2 logs ppp-api
pm2 logs ppp-worker
pm2 restart all
```

## 5. Register a GitHub App

1. Open [GitHub → Settings → Developer settings → GitHub Apps → New GitHub App](https://github.com/settings/apps/new)
2. Set a webhook URL only if you also use App-level webhooks; per-repo webhooks are created by the admin API when you register a repo.
3. **Repository permissions** (read-only):
   - **Contents**: Read-only
   - **Metadata**: Read-only
   - **Deployments**: Read-only
   - **Actions**: Read-only
4. Subscribe to **Push** events (for App-level delivery) or rely on the per-repo hook created by `POST /admin/projects/:id/repos`.
5. Generate a private key, base64-encode the PEM, and put it in `GITHUB_APP_PRIVATE_KEY`.
6. Install the App on the org/account that owns client repos and note the **installation ID**.

## Admin flow (quick)

1. Log in at `/login?role=admin`
2. Create a client and invite a client user
3. Create a project, milestones, and tasks (task refs like `GH-42`)
4. Register a repo with `owner/name` + GitHub installation ID (registers the webhook)

## Client flow

1. Open `/portal/{portal_slug}` or `/login?role=client&slug={portal_slug}`
2. View project/milestone progress and leave comments
3. The UI never shows repo names, file paths, diffs, or source code

## Manual webhook smoke test

After a repo row exists (with known `webhook_secret` and `repoId`):

```bash
BODY='{"ref":"refs/heads/main","commits":[{"id":"abc123","message":"Wire login [GH-42]","timestamp":"2026-07-12T12:00:00Z","author":{"name":"Dev","email":"dev@example.com"},"added":["a.js"],"removed":[],"modified":[]}]}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')"

curl -s -X POST "http://localhost:4000/webhooks/github/$REPO_ID" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
```

Confirm the worker logs a completed job and a `commits` row appears.

## Local development (without PM2)

```bash
# terminal 1
cd api && npm run dev

# terminal 2
cd api && npm run worker

# terminal 3
cd web && npm run dev
```
