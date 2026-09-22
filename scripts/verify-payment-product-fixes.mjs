import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { loadEnv } from '../backend/env.js';

await loadEnv();
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

const marker = `commerce-fix-${randomBytes(6).toString('hex')}`;
const ids = {
  admin: `${marker}-admin`,
  merchant: `${marker}-merchant`,
  category: `${marker}-category`,
  product: `${marker}-product`,
  order: `${marker}-order`,
  payment: `${marker}-payment`,
  token: `${marker}-token`,
  txRef: `${marker}-tx`,
  reference: `${marker}-bank-ref`
};
const email = `${marker}@example.test`;
const port = 42000 + Math.floor(Math.random() * 2000);
const base = `http://127.0.0.1:${port}`;
let server;

const request = async (path, init) => {
  const response = await fetch(`${base}${path}`, init);
  return { status: response.status, body: await response.json() };
};

try {
  await client.query(
    `INSERT INTO users (id, name, email, password, role) VALUES
     ($1, 'Test Admin', $3, 'unused', 'ADMIN'),
     ($2, 'Test Seller', $4, 'unused', 'MERCHANT')`,
    [ids.admin, ids.merchant, email, `merchant-${email}`]
  );
  await client.query(
    'INSERT INTO auth_tokens (token, user_id) VALUES ($1, $2)',
    [ids.token, ids.admin]
  );
  await client.query(
    'INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)',
    [ids.category, marker, marker]
  );
  await client.query(
    `INSERT INTO products
     (id, merchant_id, name, category, price, stock, status, metadata)
     VALUES ($1, $2, 'Test Product', $3, 1000, 5, 'approved', $4::jsonb)`,
    [ids.product, ids.merchant, ids.category, JSON.stringify({
      id: ids.product, merchantId: ids.merchant, merchantName: 'Test Seller',
      name: 'Test Product', category: ids.category, price: 1000, stock: 5, status: 'approved'
    })]
  );
  const order = {
    id: ids.order, orderNumber: ids.order, customerId: `GST-${marker}`,
    customerName: 'Test Customer', customerEmail: email, merchantId: ids.merchant,
    merchantName: 'Test Seller', status: 'pending_payment', paymentStatus: 'PENDING',
    paymentMethod: 'BK_EKASH', totalAmount: 1000, deliveryFee: 0,
    items: [{ productId: ids.product, productName: 'Test Product', quantity: 1, price: 1000, subtotal: 1000 }]
  };
  await client.query(
    `INSERT INTO orders
     (id, order_number, merchant_id, customer_name, merchant_name, status,
      payment_status, payment_method, items, total, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb)`,
    [
      ids.order, ids.order, ids.merchant, order.customerName, order.merchantName,
      order.status, order.paymentStatus, order.paymentMethod,
      JSON.stringify(order.items), order.totalAmount, JSON.stringify(order)
    ]
  );
  await client.query(
    `INSERT INTO payments
     (id, order_id, amount, status, method, tx_ref, metadata)
     VALUES ($1, $2, 1000, 'PENDING', 'BK_EKASH', $3, $4::jsonb)`,
    [ids.payment, ids.order, ids.txRef, JSON.stringify({
      id: ids.payment, orderId: ids.order, amount: 1000, status: 'PENDING',
      method: 'BK_EKASH', tx_ref: ids.txRef
    })]
  );

  server = spawn(process.execPath, ['backend/server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DB_PROVIDER: 'postgres',
      PORT: String(port),
      EMAIL_PROVIDER: 'log',
      STORAGE_PROVIDER: 'log',
      EGN_FINANCE_ENABLED: 'false'
    },
    stdio: 'ignore',
    windowsHide: true
  });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Local API exited before tests.');
    try {
      const health = await request('/api/health');
      if (health.status === 200) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Local API did not start.');

  const unauthorized = await request(`/api/products/${ids.product}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'draft' })
  });
  assert.equal(unauthorized.status, 401);

  const updated = await request(`/api/products/${ids.product}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ids.token}` },
    body: JSON.stringify({ status: 'draft' })
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.product.status, 'draft');
  assert.equal(Object.hasOwn(updated.body.product, 'rowVersion'), false);
  const productRow = (await client.query('SELECT status FROM products WHERE id = $1', [ids.product])).rows[0];
  assert.equal(productRow.status, 'draft');
  const publicProducts = await request('/api/products');
  assert.equal(publicProducts.status, 200);
  assert.equal(publicProducts.body.products.some((product) => product.id === ids.product), false);
  assert.equal((await client.query('SELECT count(*)::int AS count FROM orders WHERE id = $1', [ids.order])).rows[0].count, 1);

  const wrongEmail = await request('/api/payments/manual/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txRef: ids.txRef, orderId: ids.order, email: 'wrong@example.test',
      payerPhone: '0781234567', bankReference: ids.reference
    })
  });
  assert.equal(wrongEmail.status, 401);

  const submitted = await request('/api/payments/manual/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txRef: ids.txRef, orderId: ids.order, email,
      payerPhone: '0781234567', bankReference: ids.reference
    })
  });
  assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
  assert.equal(submitted.body.payment.status, 'VERIFICATION_PENDING');
  const paymentRow = (await client.query('SELECT status, metadata FROM payments WHERE id = $1', [ids.payment])).rows[0];
  assert.equal(paymentRow.status, 'VERIFICATION_PENDING');
  assert.equal(paymentRow.metadata.bankReference, ids.reference);
  assert.equal((await client.query(
    `SELECT count(*)::int AS count FROM notifications
     WHERE COALESCE(metadata->>'orderId', metadata->'metadata'->>'orderId') = $1`,
    [ids.order]
  )).rows[0].count, 2);

  const reapproved = await request(`/api/products/${ids.product}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ids.token}` },
    body: JSON.stringify({ status: 'approved' })
  });
  assert.equal(reapproved.status, 200, JSON.stringify(reapproved.body));
  const checkout = await request('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test Customer', customerEmail: email,
      phone: '0781234567', address: '1 Test Street, Kigali',
      deliveryDistrict: 'Gasabo',
      items: [{ productId: ids.product, quantity: 1 }],
      paymentMethod: 'BK_BANK_TRANSFER', initializePayment: true
    })
  });
  assert.equal(checkout.status, 201, JSON.stringify(checkout.body));
  ids.checkoutOrder = checkout.body.order.id;
  ids.checkoutTxRef = checkout.body.paymentInit.tx_ref;
  assert.equal(checkout.body.order.paymentMethod, 'BK_BANK_TRANSFER');
  assert.equal((await client.query('SELECT count(*)::int AS count FROM orders WHERE id = $1', [ids.checkoutOrder])).rows[0].count, 1);
  assert.equal((await client.query('SELECT count(*)::int AS count FROM payments WHERE order_id = $1', [ids.checkoutOrder])).rows[0].count, 1);

  const checkoutPayment = await request('/api/payments/manual/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txRef: ids.checkoutTxRef, orderId: ids.checkoutOrder, email,
      payerPhone: '0781234567', bankReference: `${ids.reference}-checkout`
    })
  });
  assert.equal(checkoutPayment.status, 200, JSON.stringify(checkoutPayment.body));
  assert.equal(checkoutPayment.body.payment.status, 'VERIFICATION_PENDING');
  console.log('Local checkout, product status, and BK payment submission: PASS');
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await client.query(
    `DELETE FROM notifications
     WHERE COALESCE(metadata->>'orderId', metadata->'metadata'->>'orderId') = ANY($1)`,
    [[ids.order, ids.checkoutOrder].filter(Boolean)]
  );
  await client.query(
    `DELETE FROM audit_logs WHERE metadata->>'orderId' = ANY($1)
     OR metadata->>'productId' = $2`,
    [[ids.order, ids.checkoutOrder].filter(Boolean), ids.product]
  );
  if (ids.checkoutOrder) {
    await client.query('DELETE FROM payments WHERE order_id = $1', [ids.checkoutOrder]);
    await client.query('DELETE FROM order_items WHERE order_id = $1', [ids.checkoutOrder]);
    await client.query('DELETE FROM orders WHERE id = $1', [ids.checkoutOrder]);
  }
  await client.query('DELETE FROM payments WHERE id = $1', [ids.payment]);
  await client.query('DELETE FROM order_items WHERE order_id = $1', [ids.order]);
  await client.query('DELETE FROM orders WHERE id = $1', [ids.order]);
  await client.query('DELETE FROM products WHERE id = $1', [ids.product]);
  await client.query('DELETE FROM categories WHERE id = $1', [ids.category]);
  await client.query('DELETE FROM auth_tokens WHERE token = $1', [ids.token]);
  await client.query('DELETE FROM users WHERE id = ANY($1)', [[ids.admin, ids.merchant]]);
  await client.end();
}
