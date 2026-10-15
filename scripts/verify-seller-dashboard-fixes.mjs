import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

const target = new URL(process.env.DATABASE_URL || '');
assert.equal(process.env.DB_PROVIDER, 'postgres');
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '55432');
assert.equal(target.pathname, '/emalla_dev');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const identity = (await client.query(
  'SELECT current_database() AS database, inet_server_addr()::text AS host, inet_server_port() AS port'
)).rows[0];
assert.equal(identity.database, 'emalla_dev');
assert.ok(['127.0.0.1', '127.0.0.1/32'].includes(identity.host));
assert.equal(identity.port, 55432);

const marker = `seller-dashboard-${randomBytes(6).toString('hex')}`;
const ids = {
  merchant: `${marker}-merchant`, token: `${marker}-token`, session: `${marker}-session`,
  category: `${marker}-category`, product: `${marker}-product`, order: `${marker}-order`,
  notification: `${marker}-notification`
};
const email = `${marker}@example.test`;
const port = 44000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
let server;

const request = async (path, init = {}) => {
  const response = await fetch(`${base}${path}`, init);
  return { status: response.status, body: await response.json() };
};
const auth = { Authorization: `Bearer ${ids.token}` };

try {
  await client.query(
    `INSERT INTO users (id, name, email, password, role, metadata)
     VALUES ($1, 'Dashboard Test Seller', $2, 'unused', 'MERCHANT', '{}'::jsonb)`,
    [ids.merchant, email]
  );
  await client.query('INSERT INTO auth_tokens (token, user_id) VALUES ($1, $2)', [ids.token, ids.merchant]);
  await client.query(
    `INSERT INTO sessions (id, token_hash, user_id, user_agent)
     VALUES ($1, $2, $3, 'Local seller dashboard verification')`,
    [ids.session, ids.token, ids.merchant]
  );
  await client.query(
    `INSERT INTO seller_profiles (user_id, business_name, support_email, metadata)
     VALUES ($1, 'Dashboard Test Seller', $2, '{}'::jsonb)`,
    [ids.merchant, email]
  );
  await client.query('INSERT INTO categories (id, name, slug) VALUES ($1, $2, $2)', [ids.category, marker]);
  await client.query(
    `INSERT INTO products (id, merchant_id, name, category, price, stock, status, metadata)
     VALUES ($1, $2, 'Delete Test Product', $3, 1000, 2, 'pending', $4::jsonb)`,
    [ids.product, ids.merchant, ids.category, JSON.stringify({ id: ids.product, merchantId: ids.merchant, name: 'Delete Test Product' })]
  );
  const order = {
    id: ids.order, orderNumber: ids.order, merchantId: ids.merchant,
    customerId: `GST-${marker}`, customerName: 'Test Customer', customerEmail: email,
    merchantName: 'Dashboard Test Seller', status: 'paid', paymentStatus: 'SUCCESS',
    paymentMethod: 'BK_BANK_TRANSFER', totalAmount: 1000, deliveryFee: 0, items: []
  };
  await client.query(
    `INSERT INTO orders (id, order_number, merchant_id, customer_name, merchant_name, status,
      payment_status, payment_method, items, total, metadata)
     VALUES ($1, $2, $3, $4, $5, 'paid', 'SUCCESS', 'BK_BANK_TRANSFER', '[]'::jsonb, 1000, $6::jsonb)`,
    [ids.order, ids.order, ids.merchant, order.customerName, order.merchantName, JSON.stringify(order)]
  );
  await client.query(
    `INSERT INTO notifications (id, user_id, role, title, message)
     VALUES ($1, $2, 'MERCHANT', 'Dashboard test', 'Verification only')`,
    [ids.notification, ids.merchant]
  );

  server = spawn(process.execPath, ['backend/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development', PORT: String(port), EMAIL_PROVIDER: 'log', STORAGE_PROVIDER: 'log' },
    stdio: 'ignore', windowsHide: true
  });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await request('/api/health')).status === 200) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Local API did not start.');

  const sessions = await request('/api/auth/sessions', { headers: auth });
  assert.equal(sessions.status, 200, JSON.stringify(sessions.body));
  assert.equal(sessions.body.sessions[0].isCurrent, true);

  const settings = await request('/api/merchant/settings', { headers: auth });
  assert.equal(settings.status, 200, JSON.stringify(settings.body));
  const saved = await request('/api/merchant/settings', {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ payoutMethod: 'bank', momoNumber: '', bankName: 'Local Test Bank',
      bankAccountName: 'Dashboard Test Seller', bankAccountNumber: 'TEST-001',
      settlementSchedule: 'weekly', supportEmail: email, storeLogoUrl: '', storeCoverUrl: '' })
  });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.settings.bankName, 'Local Test Bank');

  const notifications = await request('/api/notifications', { headers: auth });
  assert.equal(notifications.status, 200, JSON.stringify(notifications.body));
  assert.ok(notifications.body.notifications.some((entry) => entry.id === ids.notification));
  assert.equal((await request(`/api/notifications/${ids.notification}/read`, { method: 'PUT', headers: auth })).status, 200);

  const orderUpdate = await request(`/api/orders/${ids.order}/status`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'preparing' })
  });
  assert.equal(orderUpdate.status, 200, JSON.stringify(orderUpdate.body));
  assert.equal((await client.query('SELECT status FROM orders WHERE id = $1', [ids.order])).rows[0].status, 'preparing');

  assert.equal((await request('/api/wallet/merchant', { headers: auth })).status, 200);
  assert.equal((await request('/api/wallet/merchant/payout', {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 0 })
  })).status, 400);
  assert.equal((await request(`/api/notifications/${ids.notification}`, { method: 'DELETE', headers: auth })).status, 200);
  assert.equal((await request(`/api/products/${ids.product}`, { method: 'DELETE', headers: auth })).status, 200);
  assert.equal((await request('/api/auth/logout-all', { method: 'DELETE', headers: auth })).status, 200);
  assert.equal((await client.query('SELECT count(*)::int AS count FROM auth_tokens WHERE user_id = $1', [ids.merchant])).rows[0].count, 0);

  console.log('Seller dashboard targeted persistence verification: PASS');
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await client.query("DELETE FROM audit_logs WHERE metadata->>'userId' = $1 OR metadata->>'merchantId' = $1 OR metadata->>'orderId' = $2 OR metadata->>'productId' = $3", [ids.merchant, ids.order, ids.product]);
  await client.query('DELETE FROM notifications WHERE user_id = $1 OR id = $2', [ids.merchant, ids.notification]);
  await client.query('DELETE FROM order_items WHERE order_id = $1', [ids.order]);
  await client.query('DELETE FROM orders WHERE id = $1', [ids.order]);
  await client.query('DELETE FROM products WHERE id = $1', [ids.product]);
  await client.query('DELETE FROM categories WHERE id = $1', [ids.category]);
  await client.query('DELETE FROM sessions WHERE user_id = $1', [ids.merchant]);
  await client.query('DELETE FROM auth_tokens WHERE user_id = $1', [ids.merchant]);
  await client.query('DELETE FROM users WHERE id = $1', [ids.merchant]);
  await client.end();
}
