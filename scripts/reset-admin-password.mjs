import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { loadEnv, getDatabaseConfig } from '../backend/env.js';
import { readDb, writeDb } from '../backend/dbProvider.js';
import { hashPassword } from '../backend/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'backend', 'data', 'db.json');
const backupDir = path.join(rootDir, 'backend', 'data', 'backups');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const values = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      values[key] = 'true';
      continue;
    }

    values[key] = next;
    index += 1;
  }

  return values;
};

const assertStrongPassword = (password) => {
  const issues = [];
  if (password.length < 12) issues.push('at least 12 characters');
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter');
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter');
  if (!/[0-9]/.test(password)) issues.push('one number');
  if (!/[^a-zA-Z0-9]/.test(password)) issues.push('one symbol');

  if (issues.length > 0) {
    throw new Error(`Admin password must include ${issues.join(', ')}.`);
  }
};

const createJsonBackupIfNeeded = async () => {
  const config = getDatabaseConfig();
  if (config.provider !== 'json') return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `db-before-admin-reset-${timestamp}.json`);

  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(dbPath, backupPath);
  return backupPath;
};

await loadEnv();

const args = parseArgs();
const email = String(args.email || process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_ALERT_EMAIL || 'admin@emalla.rw')
  .toLowerCase()
  .trim();
let password = String(args.password || process.env.ADMIN_RESET_PASSWORD || '').trim();
const mustChangePassword = args.mustChange !== 'false';

if (!password) {
  const rl = createInterface({ input, output });
  password = String(await rl.question('New admin password: ')).trim();
  rl.close();
}

assertStrongPassword(password);

const db = await readDb();
const adminIndex = (db.users || []).findIndex(
  (user) => String(user.email || '').toLowerCase().trim() === email && user.role === 'ADMIN'
);

if (adminIndex === -1) {
  throw new Error(`No admin account found for ${email}.`);
}

const backupPath = await createJsonBackupIfNeeded();
const admin = db.users[adminIndex];
const now = new Date().toISOString();

db.users[adminIndex] = {
  ...admin,
  password: hashPassword(password),
  mustChangePassword,
  passwordChangedAt: now,
  updatedAt: now,
  status: admin.status || 'active'
};

if (db.tokens && typeof db.tokens === 'object') {
  for (const [token, value] of Object.entries(db.tokens)) {
    const userId = value && typeof value === 'object' ? value.userId : value;
    if (userId === admin.id) {
      delete db.tokens[token];
    }
  }
}

if (Array.isArray(db.sessions)) {
  db.sessions = db.sessions.filter((session) => session.userId !== admin.id);
}

if (Array.isArray(db.auditLogs)) {
  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    event: 'Admin password reset by maintenance tool',
    actor: email,
    category: 'security',
    status: 'success',
    metadata: {
      userId: admin.id,
      email,
      mustChangePassword,
      existingSessionsRevoked: true
    },
    createdAt: now
  });
}

await writeDb(db);

console.log(`Admin password reset for ${email}.`);
console.log('Existing admin sessions were revoked.');
console.log(`Must change password on next login: ${mustChangePassword ? 'yes' : 'no'}`);
if (backupPath) {
  console.log(`Backup created: ${backupPath}`);
}
