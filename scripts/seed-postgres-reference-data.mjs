import { loadEnv, getDatabaseConfig } from '../backend/env.js';
import { DEFAULT_CATEGORY_SEEDS } from '../backend/databaseReference.js';
import { hashPassword } from '../backend/db.js';

const main = async () => {
  await loadEnv();
  const config = getDatabaseConfig();

  if (config.provider !== 'postgres') {
    throw new Error('Set DB_PROVIDER=postgres before running this command.');
  }

  if (!config.databaseUrl) {
    throw new Error('Set DATABASE_URL before running this command.');
  }

  const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();
  if (!adminPassword) {
    throw new Error('Set ADMIN_BOOTSTRAP_PASSWORD before seeding the demo admin.');
  }

  const pg = await import('pg');
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const category of DEFAULT_CATEGORY_SEEDS) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, icon_key, sort_order, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             icon_key = EXCLUDED.icon_key,
             sort_order = EXCLUDED.sort_order,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()`,
        [
          category.id,
          category.name,
          category.slug,
          category.description,
          category.iconKey,
          category.sortOrder,
          true
        ]
      );
    }

    const adminId = 'ADM-1001';
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@emalla.rw';
    const hashedPassword = hashPassword(adminPassword);
    const now = new Date().toISOString();

    await client.query(
      `INSERT INTO users (
        id, name, username, email, password, role, status, must_change_password,
        created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'active', true, $6, $6, $7::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          must_change_password = EXCLUDED.must_change_password,
          updated_at = EXCLUDED.updated_at,
          metadata = EXCLUDED.metadata`,
      [
        adminId,
        'Admin E-Malla',
        'admin',
        adminEmail,
        hashedPassword,
        now,
        JSON.stringify({
          seededBy: 'seed-postgres-reference-data',
          createdFor: 'supabase-production'
        })
      ]
    );

    await client.query(
      `INSERT INTO admin_settings (id, preferences, category_commission_rates, updated_at, updated_by)
       VALUES ('platform', '{}'::jsonb, '{}'::jsonb, NOW(), $1)
       ON CONFLICT (id) DO UPDATE
       SET updated_at = NOW(),
           updated_by = EXCLUDED.updated_by`,
      [adminId]
    );

    await client.query('COMMIT');
    console.log(`Seeded ${DEFAULT_CATEGORY_SEEDS.length} categories.`);
    console.log(`Seeded demo admin: ${adminEmail}`);
    console.log('Admin will be required to change password on first login.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
