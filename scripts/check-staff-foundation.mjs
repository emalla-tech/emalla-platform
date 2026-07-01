import { loadEnv, getDatabaseConfig } from '../backend/env.js';
import { closePostgresPool, createPostgresAdapter } from '../backend/dbPostgres.js';

const STAFF_ROLES = new Set(['LOGISTICS', 'FINANCE', 'SUPPORT']);
const STAFF_LEVELS = new Set(['officer', 'manager']);

const main = async () => {
  await loadEnv();
  const config = getDatabaseConfig();
  if (config.provider !== 'postgres' || !config.databaseUrl) {
    throw new Error('Staff readiness check requires DB_PROVIDER=postgres and DATABASE_URL.');
  }

  const adapter = createPostgresAdapter();
  await adapter.ensureDb();
  const staff = await adapter.readStaffUsers();

  for (const entry of staff) {
    if (!STAFF_ROLES.has(entry.role)) {
      throw new Error(`Unexpected staff role returned for ${entry.id}.`);
    }
    if (entry.staffLevel && !STAFF_LEVELS.has(entry.staffLevel)) {
      throw new Error(`Unexpected staff access level returned for ${entry.id}.`);
    }
  }

  const summary = Object.fromEntries(
    [...STAFF_ROLES].map((role) => [role, staff.filter((entry) => entry.role === role).length])
  );

  console.log('E-Malla staff foundation readiness');
  console.log('Database connection: ok');
  console.log('Staff metadata query: ok');
  console.log(`Existing staff accounts: ${staff.length}`);
  console.log(`By department: ${JSON.stringify(summary)}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePostgresPool());
