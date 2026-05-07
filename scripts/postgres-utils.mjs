import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, getDatabaseConfig } from '../backend/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

export const getPostgresPool = async () => {
  await loadEnv();
  const config = getDatabaseConfig();

  if (config.provider !== 'postgres') {
    throw new Error('Set DB_PROVIDER=postgres before running this command.');
  }

  if (!config.databaseUrl) {
    throw new Error('Set DATABASE_URL before running this command.');
  }

  const pg = await import('pg');
  return new pg.Pool({
    connectionString: config.databaseUrl,
    max: 2,
    ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
};

export const runSqlFile = async (filePath) => {
  const pool = await getPostgresPool();
  const sql = await fs.readFile(filePath, 'utf8');

  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
};

export const listSchemaMigrations = async () => {
  const migrationsDir = path.join(ROOT_DIR, 'backend', 'sql', 'migrations');
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/i.test(entry.name))
    .map((entry) => path.join(migrationsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
};

export const findLatestNormalizedMigration = async () => {
  const migrationsDir = path.join(ROOT_DIR, 'backend', 'data', 'migrations');
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^json-to-postgres-normalized-.+\.sql$/i.test(entry.name))
    .map((entry) => path.join(migrationsDir, entry.name))
    .sort((left, right) => path.basename(right).localeCompare(path.basename(left)));

  return files[0] || null;
};
