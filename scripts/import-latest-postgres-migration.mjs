import { findLatestNormalizedMigration, runSqlFile } from './postgres-utils.mjs';

const main = async () => {
  const migrationPath = await findLatestNormalizedMigration();

  if (!migrationPath) {
    throw new Error('No normalized migration SQL found. Run npm run db:migrate:normalized first.');
  }

  console.log('Importing latest E-Malla Rwanda normalized migration...');
  console.log(`Migration: ${migrationPath}`);
  await runSqlFile(migrationPath);
  console.log('Postgres migration imported successfully.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
