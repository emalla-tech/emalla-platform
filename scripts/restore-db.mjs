import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'backend', 'data', 'db.json');
const backupDir = path.join(rootDir, 'backend', 'data', 'backups');

const requestedPath = process.argv[2];

if (!requestedPath) {
  console.error('Usage: node ./scripts/restore-db.mjs <backup-file>');
  process.exit(1);
}

const resolvedInput = path.isAbsolute(requestedPath)
  ? requestedPath
  : path.resolve(rootDir, requestedPath);

const relativeToBackupDir = path.relative(backupDir, resolvedInput);
const relativeToDbDir = path.relative(path.dirname(dbPath), resolvedInput);
const isInsideBackups = !relativeToBackupDir.startsWith('..') && !path.isAbsolute(relativeToBackupDir);
const isInsideDbDir = !relativeToDbDir.startsWith('..') && !path.isAbsolute(relativeToDbDir);

if (!isInsideBackups && !isInsideDbDir) {
  console.error('Restore file must be inside backend/data or backend/data/backups.');
  process.exit(1);
}

await fs.access(resolvedInput);
await fs.copyFile(resolvedInput, dbPath);

const stats = await fs.stat(dbPath);
console.log(`Database restored from: ${resolvedInput}`);
console.log(`Current DB size: ${stats.size} bytes`);
