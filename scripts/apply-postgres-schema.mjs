import { listSchemaMigrations, runSqlFile } from './postgres-utils.mjs';

const main = async () => {
  const migrations = await listSchemaMigrations();

  if (migrations.length === 0) {
    throw new Error('No Postgres schema migrations found in backend/sql/migrations.');
  }

  console.log('Applying E-Malla Rwanda Postgres migrations...');
  for (const migrationPath of migrations) {
    console.log(`Migration: ${migrationPath}`);
    await runSqlFile(migrationPath);
  }
  console.log('Postgres migrations applied successfully.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
