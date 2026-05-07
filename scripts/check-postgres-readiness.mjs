import { loadEnv, getDatabaseConfig } from '../backend/env.js';
import { getPostgresStatus } from '../backend/dbPostgres.js';

const REQUIRED_TABLES = [
  'categories',
  'users',
  'seller_profiles',
  'buyer_profiles',
  'rider_profiles',
  'auth_tokens',
  'password_reset_tokens',
  'sessions',
  'products',
  'product_reviews',
  'addresses',
  'orders',
  'order_items',
  'deliveries',
  'seller_applications',
  'rider_applications',
  'transactions',
  'payments',
  'support_tickets',
  'inquiries',
  'notifications',
  'audit_logs',
  'email_logs',
  'wishlists',
  'admin_settings'
];

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const TABLE_COUNT_QUERIES = [
  ['users', 'SELECT COUNT(*)::int AS count FROM users'],
  ['categories', 'SELECT COUNT(*)::int AS count FROM categories'],
  ['products', 'SELECT COUNT(*)::int AS count FROM products'],
  ['orders', 'SELECT COUNT(*)::int AS count FROM orders'],
  ['orderItems', 'SELECT COUNT(*)::int AS count FROM order_items'],
  ['deliveries', 'SELECT COUNT(*)::int AS count FROM deliveries'],
  ['sellerApplications', 'SELECT COUNT(*)::int AS count FROM seller_applications'],
  ['riderApplications', 'SELECT COUNT(*)::int AS count FROM rider_applications'],
  ['supportTickets', 'SELECT COUNT(*)::int AS count FROM support_tickets'],
  ['sessions', 'SELECT COUNT(*)::int AS count FROM sessions'],
  ['transactions', 'SELECT COUNT(*)::int AS count FROM transactions'],
  ['payments', 'SELECT COUNT(*)::int AS count FROM payments'],
  ['notifications', 'SELECT COUNT(*)::int AS count FROM notifications'],
  ['auditLogs', 'SELECT COUNT(*)::int AS count FROM audit_logs'],
  ['emailLogs', 'SELECT COUNT(*)::int AS count FROM email_logs'],
  ['wishlists', 'SELECT COUNT(*)::int AS count FROM wishlists'],
  ['passwordResetTokens', 'SELECT COUNT(*)::int AS count FROM password_reset_tokens']
];

const printCollectionCounts = async (pool) => {
  for (const [label, sql] of TABLE_COUNT_QUERIES) {
    const result = await pool.query(sql);
    console.log(`${label}: ${result.rows[0]?.count ?? 0}`);
  }
};

const main = async () => {
  await loadEnv();
  const config = getDatabaseConfig();
  const status = getPostgresStatus();

  console.log('E-Malla Rwanda Postgres readiness check');
  console.log(`Provider: ${status.provider}`);
  console.log(`DATABASE_URL configured: ${status.hasDatabaseUrl ? 'yes' : 'no'}`);
  console.log('');

  assert(config.provider === 'postgres', 'Set DB_PROVIDER=postgres before running this check.');
  assert(status.configured, 'Set DATABASE_URL before running this check.');

  const pg = await import('pg');
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 1,
    ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

  try {
    await pool.query('SELECT 1');
    console.log('Connection: ok');

    const tableResult = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [REQUIRED_TABLES]
    );
    const foundTables = new Set(tableResult.rows.map((row) => row.table_name));
    const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.has(table));

    assert(
      missingTables.length === 0,
      `Missing required tables: ${missingTables.join(', ')}. Apply backend/sql/migrations first with npm run db:postgres:schema.`
    );
    console.log(`Tables: ok (${REQUIRED_TABLES.length}/${REQUIRED_TABLES.length})`);
    console.log('');
    console.log('Adapter-facing table counts: ok');
    await printCollectionCounts(pool);
    console.log('');
    console.log('Postgres readiness check passed.');
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
