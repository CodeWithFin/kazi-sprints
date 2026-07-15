import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const installationTokenCache = new Map();

function getPrivateKey() {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) throw new Error('GITHUB_APP_PRIVATE_KEY is not set');
  if (raw.includes('BEGIN')) return raw;
  return Buffer.from(raw, 'base64').toString('utf8');
}

function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) throw new Error('GITHUB_APP_ID is not set');

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    },
    getPrivateKey(),
    { algorithm: 'RS256' }
  );
}

export async function getInstallationToken(installationId) {
  const key = String(installationId);
  const cached = installationTokenCache.get(key);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const appJwt = createAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get installation token: ${response.status} ${body}`);
  }

  const data = await response.json();
  installationTokenCache.set(key, {
    token: data.token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  });
  return data.token;
}

export async function registerRepoWebhook({
  installationId,
  repoFullName,
  webhookUrl,
  webhookSecret,
}) {
  const token = await getInstallationToken(installationId);
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) {
    throw new Error('github_repo_full_name must be owner/repo');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
          insecure_ssl: '0',
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub webhook create failed: ${response.status} ${body}`);
  }

  return response.json();
}

export function encryptSecret(plain) {
  const keyMaterial = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  if (!keyMaterial) return plain;
  const key = crypto.createHash('sha256').update(keyMaterial).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(stored) {
  if (!stored?.startsWith('enc:')) return stored;
  const keyMaterial = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  if (!keyMaterial) throw new Error('Cannot decrypt secret without key');
  const [, ivHex, tagHex, dataHex] = stored.split(':');
  const key = crypto.createHash('sha256').update(keyMaterial).digest();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
