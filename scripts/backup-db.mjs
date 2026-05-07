import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'backend', 'data', 'db.json');
const backupDir = path.join(rootDir, 'backend', 'data', 'backups');
const retentionLimit = Math.max(1, Number.parseInt(process.env.DB_BACKUP_RETENTION || '10', 10) || 10);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `db-backup-${timestamp}.json`);

await fs.mkdir(backupDir, { recursive: true });
await fs.copyFile(dbPath, backupPath);

const backupEntries = (await fs.readdir(backupDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /^db-backup-.*\.json$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((left, right) => right.localeCompare(left));

const staleEntries = backupEntries.slice(retentionLimit);
for (const staleEntry of staleEntries) {
  await fs.unlink(path.join(backupDir, staleEntry));
}

const stats = await fs.stat(backupPath);
console.log(`Backup created: ${backupPath}`);
console.log(`Size: ${stats.size} bytes`);
console.log(`Retention: keeping latest ${retentionLimit} backup(s)`);
if (staleEntries.length > 0) {
  console.log(`Removed ${staleEntries.length} older backup(s)`);
}
