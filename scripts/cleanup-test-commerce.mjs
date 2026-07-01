import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { loadEnv, getDatabaseConfig } from '../backend/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backupDir = path.join(rootDir, 'backend', 'data', 'backups');
const confirmationToken = 'RESET_TEST_COMMERCE';
const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const skipStockRestore = args.has('--skip-stock-restore');
const confirmation = process.argv
  .slice(2)
  .find((argument) => argument.startsWith('--confirm='))
  ?.slice('--confirm='.length);

const notificationScopeSql = `
  (
    COALESCE(notifications.metadata->>'orderId', '') IN (SELECT id FROM orders)
    OR COALESCE(notifications.metadata->>'paymentId', '') IN (SELECT id FROM payments)
    OR notifications.title IN ('Product Out of Stock', 'Low Stock Alert')
    OR notifications.title ILIKE '%payout%'
    OR EXISTS (
      SELECT 1
      FROM orders
      WHERE notifications.message ILIKE '%' || orders.order_number || '%'
    )
  )
`;

const auditScopeSql = `
  (
    audit_logs.category IN ('orders', 'payments')
    OR COALESCE(audit_logs.metadata->>'orderId', '') IN (SELECT id FROM orders)
    OR COALESCE(audit_logs.metadata->>'paymentId', '') IN (SELECT id FROM payments)
    OR EXISTS (
      SELECT 1
      FROM orders
      WHERE audit_logs.event ILIKE '%' || orders.order_number || '%'
    )
  )
`;

const emailScopeSql = `
  (
    email_logs.template IN (
      'order_confirmation',
      'seller_order_notification',
      'order_status_update',
      'rider_assignment_update',
      'rider_delivery_assignment',
      'payout_requested',
      'payout_approved',
      'payout_rejected'
    )
    OR EXISTS (
      SELECT 1
      FROM orders
      WHERE email_logs.subject ILIKE '%' || orders.order_number || '%'
    )
  )
`;

const inventoryAdjustmentSql = `
  SELECT
    products.id,
    products.name,
    products.stock::int AS current_stock,
    SUM(order_items.quantity)::int AS restore_quantity
  FROM products
  INNER JOIN order_items ON order_items.product_id = products.id
  INNER JOIN orders ON orders.id = order_items.order_id
  WHERE
    NULLIF(COALESCE(orders.metadata->>'inventoryReservedAt', ''), '') IS NOT NULL
    AND NULLIF(COALESCE(orders.metadata->>'inventoryRestockedAt', ''), '') IS NULL
    AND orders.status NOT IN ('cancelled', 'rejected')
  GROUP BY products.id, products.name, products.stock
  HAVING SUM(order_items.quantity) > 0
  ORDER BY products.name ASC
`;

const showHelp = () => {
  console.log('E-Malla Rwanda launch commerce cleanup');
  console.log('');
  console.log('Dry run (default):');
  console.log('  npm run launch:cleanup');
  console.log('');
  console.log('Execute after reviewing the dry run:');
  console.log(`  npm run launch:cleanup -- --execute --confirm=${confirmationToken}`);
  console.log('');
  console.log('Optional:');
  console.log('  --skip-stock-restore  Do not return test-order quantities to product stock.');
};

const assertSafeArguments = () => {
  if (args.has('--help') || args.has('-h')) {
    showHelp();
    process.exit(0);
  }

  if (execute && confirmation !== confirmationToken) {
    throw new Error(
      `Execution requires --confirm=${confirmationToken}. Run the dry run first and review every count.`
    );
  }

  if (!execute && confirmation) {
    throw new Error('--confirm is only valid together with --execute.');
  }
};

const getDatabaseHost = (databaseUrl) => {
  try {
    return new URL(databaseUrl).host;
  } catch {
    return 'configured-postgres';
  }
};

const createPool = async (databaseUrl) => {
  const { Pool } = await import('pg');
  return new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
};

const readCleanupSummary = async (client) => {
  const [countsResult, inventoryResult] = await Promise.all([
    client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM orders) AS orders,
        (SELECT COUNT(*)::int FROM order_items) AS order_items,
        (SELECT COUNT(*)::int FROM deliveries) AS deliveries,
        (SELECT COUNT(*)::int FROM payments) AS payments,
        (SELECT COUNT(*)::int FROM transactions) AS transactions,
        (SELECT COUNT(*)::int FROM notifications WHERE ${notificationScopeSql}) AS notifications,
        (SELECT COUNT(*)::int FROM audit_logs WHERE ${auditScopeSql}) AS audit_logs,
        (SELECT COUNT(*)::int FROM email_logs WHERE ${emailScopeSql}) AS email_logs,
        (
          SELECT COUNT(*)::int
          FROM seller_profiles
          WHERE total_sales <> 0 OR gross_sales <> 0 OR commission_amount <> 0
        ) AS seller_profiles_to_reset,
        (
          SELECT COUNT(*)::int
          FROM rider_profiles
          WHERE total_deliveries <> 0 OR earnings <> 0
        ) AS rider_profiles_to_reset,
        (
          SELECT COUNT(*)::int
          FROM buyer_profiles
          WHERE last_order_at IS NOT NULL
        ) AS buyer_profiles_to_reset,
        (SELECT COUNT(*)::int FROM users) AS preserved_users,
        (SELECT COUNT(*)::int FROM products) AS preserved_products,
        (SELECT COUNT(*)::int FROM seller_applications) AS preserved_seller_applications,
        (SELECT COUNT(*)::int FROM rider_applications) AS preserved_rider_applications
    `),
    client.query(inventoryAdjustmentSql)
  ]);

  return {
    counts: countsResult.rows[0],
    inventoryAdjustments: inventoryResult.rows
  };
};

const printSummary = (summary, databaseHost) => {
  const { counts, inventoryAdjustments } = summary;
  console.log('E-Malla Rwanda launch commerce cleanup');
  console.log(`Database: ${databaseHost}`);
  console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN (no data will be changed)'}`);
  console.log('');
  console.log('Test commerce records in cleanup scope');
  console.log(`  Orders: ${counts.orders}`);
  console.log(`  Order items: ${counts.order_items}`);
  console.log(`  Deliveries: ${counts.deliveries}`);
  console.log(`  Payments: ${counts.payments}`);
  console.log(`  Transactions: ${counts.transactions}`);
  console.log(`  Order/payment notifications: ${counts.notifications}`);
  console.log(`  Order/payment audit logs: ${counts.audit_logs}`);
  console.log(`  Order/payout email logs: ${counts.email_logs}`);
  console.log(`  Seller profiles with financial totals: ${counts.seller_profiles_to_reset}`);
  console.log(`  Rider profiles with earnings: ${counts.rider_profiles_to_reset}`);
  console.log(`  Buyer profiles with last-order dates: ${counts.buyer_profiles_to_reset}`);
  console.log('');
  console.log('Preserved records');
  console.log(`  Users: ${counts.preserved_users}`);
  console.log(`  Products and Cloudinary URLs: ${counts.preserved_products}`);
  console.log(`  Seller applications: ${counts.preserved_seller_applications}`);
  console.log(`  Rider applications: ${counts.preserved_rider_applications}`);
  console.log('');
  console.log(`Inventory restoration: ${skipStockRestore ? 'SKIPPED by option' : 'enabled'}`);

  if (inventoryAdjustments.length === 0) {
    console.log('  No product stock adjustments detected.');
  } else {
    for (const adjustment of inventoryAdjustments) {
      const nextStock = Number(adjustment.current_stock) + Number(adjustment.restore_quantity);
      console.log(
        `  ${adjustment.name}: ${adjustment.current_stock} + ${adjustment.restore_quantity} = ${nextStock}`
      );
    }
  }
};

const readBackupRows = async (client) => {
  const queries = {
    orders: 'SELECT * FROM orders ORDER BY created_at ASC',
    orderItems: 'SELECT * FROM order_items ORDER BY order_id ASC, id ASC',
    deliveries: 'SELECT * FROM deliveries ORDER BY assigned_at ASC NULLS LAST',
    payments: 'SELECT * FROM payments ORDER BY created_at ASC',
    transactions: 'SELECT * FROM transactions ORDER BY timestamp ASC',
    notifications: `SELECT * FROM notifications WHERE ${notificationScopeSql} ORDER BY created_at ASC`,
    auditLogs: `SELECT * FROM audit_logs WHERE ${auditScopeSql} ORDER BY time ASC`,
    emailLogs: `SELECT * FROM email_logs WHERE ${emailScopeSql} ORDER BY sent_at ASC`,
    sellerFinancials: `
      SELECT user_id, total_sales, gross_sales, commission_amount, updated_at
      FROM seller_profiles
      ORDER BY user_id ASC
    `,
    riderFinancials: `
      SELECT user_id, total_deliveries, earnings, updated_at
      FROM rider_profiles
      ORDER BY user_id ASC
    `,
    buyerLastOrders: `
      SELECT user_id, last_order_at, updated_at
      FROM buyer_profiles
      WHERE last_order_at IS NOT NULL
      ORDER BY user_id ASC
    `,
    affectedProducts: `
      SELECT products.*
      FROM products
      WHERE products.id IN (${inventoryAdjustmentSql.replace(
        /SELECT[\s\S]*?FROM products/,
        'SELECT products.id FROM products'
      )})
      ORDER BY products.id ASC
    `
  };
  const backup = {};

  for (const [name, sql] of Object.entries(queries)) {
    const result = await client.query(sql);
    backup[name] = result.rows;
  }

  return backup;
};

const writeBackup = async ({ databaseHost, summary, rows }) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `launch-cleanup-${timestamp}.json`);
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    databaseHost,
    purpose: 'Pre-launch test commerce cleanup backup',
    summary,
    rows
  };

  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(backupPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return backupPath;
};

const restoreInventory = async (client) => {
  if (skipStockRestore) return;

  await client.query(`
    WITH adjustments AS (
      ${inventoryAdjustmentSql}
    )
    UPDATE products
    SET
      stock = products.stock + adjustments.restore_quantity,
      metadata = jsonb_set(
        COALESCE(products.metadata, '{}'::jsonb),
        '{stock}',
        to_jsonb(products.stock + adjustments.restore_quantity),
        true
      ),
      updated_at = NOW()
    FROM adjustments
    WHERE products.id = adjustments.id
  `);
};

const executeCleanup = async (client, initialSummary, databaseHost) => {
  await client.query('BEGIN');

  try {
    await client.query("SET LOCAL statement_timeout = '120s'");
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query(`
      LOCK TABLE
        orders,
        order_items,
        deliveries,
        payments,
        transactions,
        notifications,
        audit_logs,
        email_logs,
        products,
        seller_profiles,
        rider_profiles,
        buyer_profiles
      IN ACCESS EXCLUSIVE MODE
    `);

    const lockedSummary = await readCleanupSummary(client);
    if (JSON.stringify(lockedSummary) !== JSON.stringify(initialSummary)) {
      console.log('');
      console.log('Data changed after the dry-run snapshot. Using the locked execution snapshot below:');
      printSummary(lockedSummary, databaseHost);
    }

    const backupRows = await readBackupRows(client);
    const backupPath = await writeBackup({
      databaseHost,
      summary: lockedSummary,
      rows: backupRows
    });
    console.log('');
    console.log(`Backup created before cleanup: ${backupPath}`);

    await restoreInventory(client);
    await client.query(`DELETE FROM email_logs WHERE ${emailScopeSql}`);
    await client.query(`DELETE FROM audit_logs WHERE ${auditScopeSql}`);
    await client.query(`DELETE FROM notifications WHERE ${notificationScopeSql}`);
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM deliveries');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query(`
      UPDATE seller_profiles
      SET total_sales = 0, gross_sales = 0, commission_amount = 0, updated_at = NOW()
    `);
    await client.query(`
      UPDATE rider_profiles
      SET total_deliveries = 0, earnings = 0, updated_at = NOW()
    `);
    await client.query(`
      UPDATE buyer_profiles
      SET last_order_at = NULL, updated_at = NOW()
      WHERE last_order_at IS NOT NULL
    `);
    await client.query(
      `
        INSERT INTO audit_logs (id, event, actor, category, status, time, metadata)
        VALUES ($1, $2, $3, 'system', 'success', NOW(), $4::jsonb)
      `,
      [
        `audit-launch-cleanup-${randomUUID()}`,
        'Pre-launch test commerce data cleaned',
        'E-Malla Launch Operations',
        JSON.stringify({
          source: 'cleanup-test-commerce.mjs',
          backupCreated: true,
          stockRestored: !skipStockRestore,
          removed: lockedSummary.counts
        })
      ]
    );

    await client.query('COMMIT');
    return { summary: lockedSummary, backupPath };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const verifyCleanup = async (client) => {
  const result = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM order_items) AS order_items,
      (SELECT COUNT(*)::int FROM deliveries) AS deliveries,
      (SELECT COUNT(*)::int FROM payments) AS payments,
      (SELECT COUNT(*)::int FROM transactions) AS transactions
  `);
  return result.rows[0];
};

const main = async () => {
  assertSafeArguments();
  await loadEnv();
  const config = getDatabaseConfig();

  if (config.provider !== 'postgres' || !config.databaseUrl) {
    throw new Error('Launch cleanup requires DB_PROVIDER=postgres and a configured DATABASE_URL.');
  }

  const databaseHost = getDatabaseHost(config.databaseUrl);
  const pool = await createPool(config.databaseUrl);
  const client = await pool.connect();

  try {
    const summary = await readCleanupSummary(client);
    printSummary(summary, databaseHost);

    if (!execute) {
      const backupRows = await readBackupRows(client);
      if (
        backupRows.orders.length !== summary.counts.orders ||
        backupRows.orderItems.length !== summary.counts.order_items ||
        backupRows.deliveries.length !== summary.counts.deliveries ||
        backupRows.payments.length !== summary.counts.payments ||
        backupRows.transactions.length !== summary.counts.transactions
      ) {
        throw new Error('Backup readiness validation found a count mismatch. No data was changed.');
      }
      console.log('');
      console.log('Backup readiness: verified');
      console.log('Dry run complete. No records were changed.');
      console.log(`To execute: npm run launch:cleanup -- --execute --confirm=${confirmationToken}`);
      return;
    }

    const result = await executeCleanup(client, summary, databaseHost);
    const verification = await verifyCleanup(client);
    console.log('');
    console.log('Cleanup committed successfully.');
    console.log(`Backup: ${result.backupPath}`);
    console.log(
      `Verification: orders=${verification.orders}, order_items=${verification.order_items}, deliveries=${verification.deliveries}, payments=${verification.payments}, transactions=${verification.transactions}`
    );
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
