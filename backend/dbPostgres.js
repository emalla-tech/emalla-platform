import { getDatabaseConfig } from './env.js';
import { DEFAULT_CATEGORY_SEEDS, getCategorySeedMap } from './databaseReference.js';

let pool;

const READ_COLUMNS = {
  users: 'users.id, users.name, users.username, users.email, users.password, users.role, users.status, users.phone, users.avatar, users.must_change_password, users.last_login_at, users.password_changed_at, users.created_at, users.updated_at',
  categories: 'id, name, slug, description, icon_key, sort_order, is_active, created_at, updated_at',
  seller_profiles: "user_id, business_name, primary_category_id, support_email, CASE WHEN COALESCE(logo_url, '') LIKE 'data:%' THEN NULL ELSE logo_url END AS logo_url, CASE WHEN COALESCE(cover_url, '') LIKE 'data:%' THEN NULL ELSE cover_url END AS cover_url, commission_rate, total_sales, gross_sales, commission_amount, documents_verified, created_at, updated_at",
  buyer_profiles: 'user_id, preferred_language, last_order_at, created_at, updated_at',
  rider_profiles: 'user_id, vehicle_number, mobile_money_number, emergency_contact, operational_status, rating, total_deliveries, earnings, created_at, updated_at',
  auth_tokens: 'token, user_id, created_at',
  sessions: 'id, token_hash, user_id, created_at, last_seen_at, revoked_at, user_agent, reviewed_at, reviewed_by, review_notes',
  products: "id, merchant_id, name, description, specifications, category, price, stock, CASE WHEN COALESCE(image, '') LIKE 'data:%' THEN NULL ELSE image END AS image, CASE WHEN COALESCE(images::text, '') LIKE '%data:%' THEN '[]'::jsonb ELSE images END AS images, status, featured, rating, reviews, created_at, updated_at, metadata",
  product_reviews: 'id, product_id, user_id, rating, comment, created_at',
  addresses: 'id, user_id, name, district, sector, street, is_default, created_at, updated_at',
  orders: 'id, order_number, user_id, merchant_id, rider_id, customer_name, merchant_name, rider_name, status, payment_status, payment_method, items, shipping_address, address, phone, subtotal, delivery_fee, total, notes, created_at, updated_at, metadata',
  order_items: 'id, order_id, product_id, merchant_id, product_name, variant, quantity, price, subtotal',
  deliveries: 'id, order_id, rider_id, rider_name, status, pickup_notes, delivery_notes, assigned_at, picked_up_at, delivered_at, failed_at',
  seller_applications: "id, business_name, category, email, phone, CASE WHEN COALESCE(logo_url, '') LIKE 'data:%' THEN NULL ELSE logo_url END AS logo_url, CASE WHEN COALESCE(supporting_document_url, '') LIKE 'data:%' THEN NULL ELSE supporting_document_url END AS supporting_document_url, status, merchant_id, temporary_username, rejected_reason, created_at, updated_at, approved_at, approved_by, rejected_at, rejected_by",
  rider_applications: 'id, name, email, phone, vehicle_number, status, rider_id, temporary_username, rejected_reason, created_at, updated_at, approved_at, approved_by, rejected_at, rejected_by',
  transactions: 'id, user_id, amount, status, method, tx_ref, timestamp',
  payments: 'id, order_id, user_id, amount, status, method, tx_ref, created_at, updated_at',
  support_tickets: 'id, type, name, email, subject, company, message, status, assigned_to, internal_notes, replied_at, resolved_at, created_at, updated_at',
  inquiries: 'id, type, name, email, subject, company, message, status, assigned_to, internal_notes, replied_at, resolved_at, created_at, updated_at',
  notifications: 'id, user_id, role, title, message, type, read, created_at',
  audit_logs: 'id, event, actor, category, status, time, metadata',
  email_logs: 'id, to_addresses, subject, template, body, html, sent_at, status, provider, provider_message_id, error, note',
  wishlists: 'id, user_id, product_id, created_at',
  admin_settings: 'id, preferences, category_commission_rates, updated_at, updated_by',
  password_reset_tokens: 'id, token, user_id, expires_at, created_at'
};

const toIso = (value) => (value ? new Date(value).toISOString() : undefined);
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const json = (value, fallback) => value ?? fallback;
const userRef = (value, userIds) => (value && userIds.has(value) ? value : null);
const safeJsonStringify = (value, fallback = '{}') => {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === 'string' ? serialized : fallback;
  } catch {
    return fallback;
  }
};
const normalizeJsonValue = (value, fallback = '{}') => {
  if (typeof value !== 'string') {
    return safeJsonStringify(value, fallback);
  }

  try {
    JSON.parse(value);
    return value;
  } catch {
    return safeJsonStringify(value, fallback);
  }
};
const JSON_COLUMNS = {
  users: new Set(['metadata']),
  categories: new Set(['metadata']),
  seller_profiles: new Set(['metadata']),
  buyer_profiles: new Set(['metadata']),
  rider_profiles: new Set(['metadata']),
  sessions: new Set(['metadata']),
  products: new Set(['images', 'metadata']),
  product_reviews: new Set(['metadata']),
  addresses: new Set(['metadata']),
  orders: new Set(['items', 'shipping_address', 'metadata']),
  order_items: new Set(['metadata']),
  deliveries: new Set(['metadata']),
  seller_applications: new Set(['metadata']),
  rider_applications: new Set(['metadata']),
  transactions: new Set(['metadata']),
  payments: new Set(['metadata']),
  support_tickets: new Set(['metadata']),
  inquiries: new Set(['metadata']),
  notifications: new Set(['metadata']),
  audit_logs: new Set(['metadata']),
  email_logs: new Set(['to_addresses', 'metadata']),
  wishlists: new Set(['metadata']),
  admin_settings: new Set(['preferences', 'category_commission_rates', 'metadata']),
  password_reset_tokens: new Set(['metadata'])
};
const databaseUserRef = (value) => {
  const normalized = String(value || '');
  return normalized && !normalized.startsWith('GST-') && !normalized.startsWith('broadcast_')
    ? normalized
    : null;
};
const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const getPg = async () => {
  try {
    return await import('pg');
  } catch {
    throw new Error('Postgres adapter requires the "pg" package. Run npm install after adding the production database dependency.');
  }
};

const getPool = async () => {
  if (pool) return pool;

  const config = getDatabaseConfig();
  const { Pool } = await getPg();
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    maxUses: 750,
    ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
  return pool;
};

const query = async (text, params = []) => {
  const activePool = await getPool();
  return activePool.query(text, params);
};

const tx = async (callback) => {
  const activePool = await getPool();
  const client = await activePool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const upsert = async (client, table, values, conflictColumn = 'id') => {
  const columns = Object.keys(values);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const updates = columns
    .filter((column) => column !== conflictColumn)
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(', ');
  const jsonColumns = JSON_COLUMNS[table] || new Set();

  await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${conflictColumn}) ${
      updates ? `DO UPDATE SET ${updates}` : 'DO NOTHING'
    }`,
    columns.map((column) => {
      if (!jsonColumns.has(column)) {
        return values[column];
      }

      const value = values[column];
      return normalizeJsonValue(value, column === 'to_addresses' || column === 'images' || column === 'items' ? '[]' : '{}');
    })
  );
};

const upsertOrderRecord = async (client, order) => {
  await upsert(client, 'orders', {
    id: order.id,
    order_number: order.orderNumber || order.id,
    user_id: order.customerId && !String(order.customerId).startsWith('GST-') ? order.customerId : null,
    merchant_id: order.merchantId || null,
    rider_id: order.riderId || null,
    customer_name: order.customerName || null,
    merchant_name: order.merchantName || null,
    rider_name: order.riderName || null,
    status: order.status || 'pending',
    payment_status: order.paymentStatus || 'pending',
    payment_method: order.paymentMethod || null,
    items: order.items || [],
    shipping_address: order.shippingAddress || { address: order.address || '', phone: order.phone || '' },
    address: order.address || null,
    phone: order.phone || null,
    subtotal: toNumber(order.subtotal ?? (Number(order.totalAmount || order.total || 0) - Number(order.deliveryFee || 0))),
    delivery_fee: toNumber(order.deliveryFee),
    total: toNumber(order.total ?? order.totalAmount),
    notes: order.notes || null,
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: order.updatedAt || order.createdAt || new Date().toISOString(),
    metadata: order
  });

  for (const [index, item] of (order.items || []).entries()) {
    await upsert(client, 'order_items', {
      id: item.id || `${order.id}-item-${index + 1}`,
      order_id: order.id,
      product_id: item.productId || null,
      merchant_id: order.merchantId || null,
      product_name: item.productName || 'Order item',
      variant: item.variant || null,
      quantity: Number(item.quantity || 0),
      price: toNumber(item.price),
      subtotal: toNumber(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)),
      metadata: item
    });
  }
};

const upsertNotificationRecord = async (client, notification) =>
  upsert(client, 'notifications', {
    id: notification.id,
    user_id: databaseUserRef(notification.userId),
    role: notification.role || null,
    title: notification.title || 'Notification',
    message: notification.message || '',
    type: notification.type || 'info',
    read: Boolean(notification.read),
    created_at: notification.createdAt || new Date().toISOString(),
    metadata: databaseUserRef(notification.userId)
      ? notification.metadata || notification
      : { ...notification, metadata: notification.metadata || {} }
  });

const upsertTransactionRecord = async (client, transaction) =>
  upsert(client, 'transactions', {
    id: transaction.id,
    user_id: transaction.userId && !String(transaction.userId).startsWith('GST-') ? transaction.userId : null,
    amount: toNumber(transaction.amount),
    status: transaction.status || 'pending',
    method: transaction.method || null,
    tx_ref: transaction.tx_ref || transaction.txRef || null,
    timestamp: transaction.timestamp || transaction.createdAt || new Date().toISOString(),
    metadata: transaction
  });

const upsertPaymentRecord = async (client, payment) =>
  upsert(client, 'payments', {
    id: payment.id,
    order_id: payment.orderId || null,
    user_id: payment.userId && !String(payment.userId).startsWith('GST-') ? payment.userId : null,
    amount: toNumber(payment.amount),
    status: payment.status || 'pending',
    method: payment.method || null,
    tx_ref: payment.tx_ref || payment.txRef || null,
    created_at: payment.createdAt || payment.timestamp || new Date().toISOString(),
    updated_at: payment.updatedAt || payment.createdAt || payment.timestamp || new Date().toISOString(),
    metadata: payment
  });

const upsertAuditLogRecord = async (client, entry) =>
  upsert(client, 'audit_logs', {
    id: entry.id,
    event: entry.event || 'Audit event',
    actor: entry.actor || null,
    category: entry.category || 'system',
    status: entry.status || 'info',
    time: entry.time || entry.createdAt || new Date().toISOString(),
    metadata: entry.metadata || entry
  });

const upsertEmailLogRecord = async (client, entry) =>
  upsert(client, 'email_logs', {
    id: entry.id,
    to_addresses: entry.toAddresses || (Array.isArray(entry.to) ? entry.to : [entry.to].filter(Boolean)),
    subject: entry.subject || 'Email',
    template: entry.template || null,
    body: entry.body || null,
    html: entry.html || null,
    sent_at: entry.sentAt || entry.createdAt || new Date().toISOString(),
    status: entry.status || 'queued',
    provider: entry.provider || 'log',
    provider_message_id: entry.providerMessageId || null,
    error: entry.error || null,
    note: entry.note || null,
    metadata: entry.metadata || entry
  });

const readRows = async (table, orderBy = 'created_at DESC') => {
  try {
    const columns = READ_COLUMNS[table] || '*';
    const result = await query(`SELECT ${columns} FROM ${table} ORDER BY ${orderBy}`);
    return result.rows;
  } catch (error) {
    if (error?.code === '42P01') {
      throw new Error(`Postgres table "${table}" is missing. Apply backend/sql/migrations with npm run db:postgres:schema before starting with DB_PROVIDER=postgres.`);
    }
    throw error;
  }
};

const mapUser = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  name: row.name,
  username: row.username || undefined,
  email: row.email,
  password: row.password,
  role: row.role,
  status: row.status,
  phone: row.phone || '',
  avatar: row.avatar || '',
  mustChangePassword: row.must_change_password,
  lastLoginAt: toIso(row.last_login_at),
  passwordChangedAt: toIso(row.password_changed_at),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const mapProduct = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  merchantId: row.merchant_id || undefined,
  merchantName: row.metadata?.merchantName || '',
  name: row.name,
  description: row.description || '',
  specifications: row.specifications || '',
  category: row.category,
  price: toNumber(row.price),
  stock: toNumber(row.stock),
  image: row.image || '',
  images: json(row.images, []),
  status: row.status,
  featured: row.featured,
  rating: toNumber(row.rating),
  reviewsCount: toNumber(row.reviews),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const mapOrder = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  orderNumber: row.order_number,
  userId: row.user_id || row.metadata?.customerId || undefined,
  customerId: row.user_id || row.metadata?.customerId || undefined,
  customerName: row.customer_name || row.metadata?.customerName || '',
  customerEmail: row.metadata?.customerEmail || '',
  merchantId: row.merchant_id || undefined,
  merchantName: row.merchant_name || row.metadata?.merchantName || '',
  riderId: row.rider_id || undefined,
  riderName: row.rider_name || row.metadata?.riderName || undefined,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method || '',
  items: json(row.items, []),
  shippingAddress: json(row.shipping_address, {}),
  address: row.address || row.metadata?.address || row.shipping_address?.street || '',
  phone: row.phone || row.metadata?.phone || '',
  subtotal: toNumber(row.subtotal),
  deliveryFee: toNumber(row.delivery_fee),
  total: toNumber(row.total),
  totalAmount: toNumber(row.total),
  notes: row.notes || '',
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const mapApplication = (row, type) => ({
  ...(row.metadata || {}),
  id: row.id,
  businessName: type === 'seller' ? row.business_name : undefined,
  name: type === 'rider' ? row.name : row.business_name,
  category: row.category,
  email: row.email,
  phone: row.phone,
  logoUrl: row.logo_url || '',
  supportingDocumentUrl: row.supporting_document_url || '',
  vehicleNumber: row.vehicle_number || '',
  status: row.status,
  merchantId: row.merchant_id || undefined,
  riderId: row.rider_id || undefined,
  temporaryUsername: row.temporary_username || undefined,
  rejectedReason: row.rejected_reason || '',
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  approvedAt: toIso(row.approved_at),
  approvedBy: row.approved_by || undefined,
  rejectedAt: toIso(row.rejected_at),
  rejectedBy: row.rejected_by || undefined
});

const mapInquiry = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  type: row.type,
  name: row.name,
  email: row.email,
  subject: row.subject || '',
  company: row.company || '',
  message: row.message,
  status: row.status,
  assignedAdminId: row.assigned_to || undefined,
  internalNotes: row.internal_notes || '',
  repliedAt: toIso(row.replied_at),
  resolvedAt: toIso(row.resolved_at),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  iconKey: row.icon_key || '',
  sortOrder: Number(row.sort_order || 0),
  isActive: row.is_active !== false,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const mapSupportTicket = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  type: row.type || 'contact',
  name: row.name,
  email: row.email,
  subject: row.subject || '',
  company: row.company || '',
  message: row.message || '',
  status: row.status || 'new',
  assignedAdminId: row.assigned_to || undefined,
  internalNotes: row.internal_notes || '',
  repliedAt: toIso(row.replied_at),
  resolvedAt: toIso(row.resolved_at),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at)
});

const applyUserProfiles = (baseUser, sellerProfile, buyerProfile, riderProfile) => {
  const nextUser = { ...baseUser };

  if (sellerProfile) {
    nextUser.storeSettings = {
      ...(nextUser.storeSettings || {}),
      supportEmail: sellerProfile.support_email || nextUser.email,
      storeLogoUrl: sellerProfile.logo_url || '',
      coverUrl: sellerProfile.cover_url || ''
    };
  }

  if (buyerProfile) {
    nextUser.buyerSettings = {
      ...(nextUser.buyerSettings || {}),
      preferredLanguage: buyerProfile.preferred_language || 'en'
    };
  }

  if (riderProfile) {
    nextUser.riderSettings = {
      ...(nextUser.riderSettings || {}),
      vehicleNumber: riderProfile.vehicle_number || '',
      mobileMoneyNumber: riderProfile.mobile_money_number || '',
      emergencyContact: riderProfile.emergency_contact || '',
      operationalStatus: riderProfile.operational_status || 'offline',
      rating: toNumber(riderProfile.rating),
      totalDeliveries: Number(riderProfile.total_deliveries || 0),
      earnings: toNumber(riderProfile.earnings)
    };
  }

  return nextUser;
};

const buildTokens = (rows) =>
  Object.fromEntries(rows.map((row) => [row.token, { userId: row.user_id, createdAt: toIso(row.created_at) }]));

export const getPostgresStatus = () => {
  const config = getDatabaseConfig();
  return {
    provider: config.provider,
    configured: config.provider === 'postgres' && Boolean(config.databaseUrl),
    hasDatabaseUrl: Boolean(config.databaseUrl),
    mode: config.provider === 'postgres' ? 'postgres' : 'json'
  };
};

export const createPostgresAdapter = () => {
  const status = getPostgresStatus();

  if (!status.configured) {
    throw new Error('Postgres adapter requested, but DB_PROVIDER=postgres and DATABASE_URL are not both configured.');
  }

  return {
    async ensureDb() {
      await query('SELECT 1');
    },

    async readProducts() {
      const products = await readRows('products');
      return products.map(mapProduct);
    },

    async readOrders() {
      const orders = await readRows('orders');
      const orderItems = await readRows('order_items', 'order_id ASC, id ASC');
      const deliveries = await readRows('deliveries', 'assigned_at DESC, id ASC');
      const orderItemsMap = new Map();

      for (const row of orderItems) {
        const current = orderItemsMap.get(row.order_id) || [];
        current.push({
          ...(row.metadata || {}),
          id: row.id,
          productId: row.product_id || undefined,
          merchantId: row.merchant_id || undefined,
          productName: row.product_name || '',
          quantity: Number(row.quantity || 0),
          price: toNumber(row.price),
          subtotal: toNumber(row.subtotal),
          variant: row.variant || undefined
        });
        orderItemsMap.set(row.order_id, current);
      }

      const deliveryMap = new Map(
        deliveries.map((row) => [
          row.order_id,
          {
            ...(row.metadata || {}),
            id: row.id,
            orderId: row.order_id,
            riderId: row.rider_id || undefined,
            riderName: row.rider_name || undefined,
            status: row.status || undefined,
            assignedAt: toIso(row.assigned_at),
            pickedUpAt: toIso(row.picked_up_at),
            deliveredAt: toIso(row.delivered_at),
            failedAt: toIso(row.failed_at),
            pickupNotes: row.pickup_notes || '',
            deliveryNotes: row.delivery_notes || ''
          }
        ])
      );

      return orders.map((row) => {
        const order = mapOrder(row);
        const normalizedItems = orderItemsMap.get(row.id);
        const delivery = deliveryMap.get(row.id);
        return {
          ...order,
          customerName: row.customer_name || row.metadata?.customerName || '',
          merchantName: row.merchant_name || row.metadata?.merchantName || '',
          riderName: row.rider_name || delivery?.riderName || row.metadata?.riderName || undefined,
          items: normalizedItems && normalizedItems.length > 0 ? normalizedItems : order.items,
          address: row.address || row.metadata?.address || order.address || '',
          phone: row.phone || row.metadata?.phone || '',
          delivery: delivery || undefined
        };
      });
    },

    async readCheckoutData(options = {}) {
      const users = await readRows('users');
      const orderId = String(options.orderId || '').trim();
      const orders = orderId
        ? (await query(`SELECT ${READ_COLUMNS.orders} FROM orders WHERE id = $1 LIMIT 1`, [orderId])).rows
        : [];
      const products = orderId ? [] : await readRows('products');

      return {
        users: users.map(mapUser),
        products: products.map(mapProduct),
        orders: orders.map(mapOrder),
        payments: [],
        transactions: [],
        notifications: [],
        auditLogs: [],
        emailLogs: []
      };
    },

    async readPublicInsightsData() {
      const users = await readRows('users');
      const orders = await readRows('orders');
      const sellerApplications = await readRows('seller_applications');

      return {
        users: users.map(mapUser),
        orders: orders.map(mapOrder),
        sellerApplications: sellerApplications.map((row) => mapApplication(row, 'seller'))
      };
    },

    async readAdminStatsData() {
      const users = await readRows('users');
      const sessions = await readRows('sessions', 'created_at DESC');
      const orders = await readRows('orders');
      const sellerApplications = await readRows('seller_applications');
      const auditLogs = await readRows('audit_logs', 'time DESC');
      const fallbackProducts = auditLogs.length > 0 ? [] : await readRows('products');
      const fallbackNotifications = auditLogs.length > 0 ? [] : await readRows('notifications');

      return {
        users: users.map(mapUser),
        sessions: sessions.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          token: row.token_hash,
          userId: row.user_id,
          createdAt: toIso(row.created_at),
          lastSeenAt: toIso(row.last_seen_at),
          revokedAt: toIso(row.revoked_at),
          userAgent: row.user_agent || '',
          reviewedAt: toIso(row.reviewed_at),
          reviewedBy: row.reviewed_by || undefined,
          reviewNotes: row.review_notes || ''
        })),
        orders: orders.map(mapOrder),
        sellerApplications: sellerApplications.map((row) => mapApplication(row, 'seller')),
        auditLogs: auditLogs.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          event: row.event,
          actor: row.actor,
          category: row.category,
          status: row.status,
          time: toIso(row.time),
          metadata: row.metadata || {}
        })),
        products: fallbackProducts.map(mapProduct),
        notifications: fallbackNotifications.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          userId: row.user_id || row.metadata?.userId || undefined,
          role: row.role || '',
          title: row.title,
          message: row.message,
          type: row.type,
          read: row.read,
          createdAt: toIso(row.created_at)
        }))
      };
    },

    async readAdminRidersData() {
      const users = await query(
        `SELECT ${READ_COLUMNS.users} FROM users WHERE role = 'DELIVERY' ORDER BY created_at DESC`
      );
      const riderProfiles = await readRows('rider_profiles');
      const orders = await query(
        `SELECT ${READ_COLUMNS.orders} FROM orders WHERE rider_id IS NOT NULL ORDER BY created_at DESC`
      );
      const transactions = await query(
        `SELECT ${READ_COLUMNS.transactions} FROM transactions WHERE user_id IN (SELECT id FROM users WHERE role = 'DELIVERY') ORDER BY timestamp DESC`
      );
      const riderProfileMap = new Map(riderProfiles.map((row) => [row.user_id, row]));

      return {
        users: users.rows
          .map((row) => applyUserProfiles(mapUser(row), null, null, riderProfileMap.get(row.id)))
          .filter((user) => user.role === 'DELIVERY'),
        orders: orders.rows.map(mapOrder),
        transactions: transactions.rows.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          userId: row.user_id || undefined,
          amount: toNumber(row.amount),
          status: row.status,
          method: row.method || '',
          tx_ref: row.tx_ref || '',
          timestamp: toIso(row.timestamp),
          type: row.metadata?.type || ''
        }))
      };
    },

    async readRiderDashboardData(userId) {
      const orders = await query(
        `SELECT ${READ_COLUMNS.orders} FROM orders WHERE rider_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      const transactions = await query(
        `SELECT ${READ_COLUMNS.transactions} FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC`,
        [userId]
      );

      return {
        orders: orders.rows.map(mapOrder),
        transactions: transactions.rows.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          userId: row.user_id || undefined,
          amount: toNumber(row.amount),
          status: row.status,
          method: row.method || '',
          tx_ref: row.tx_ref || '',
          timestamp: toIso(row.timestamp),
          type: row.metadata?.type || ''
        }))
      };
    },

    async readAuthUserByIdentity(identity) {
      const normalizedIdentity = String(identity || '').toLowerCase().trim();
      const userResult = await query(
        `SELECT
          ${READ_COLUMNS.users},
          seller_profiles.user_id AS seller_profile_user_id,
          seller_profiles.business_name AS seller_business_name,
          seller_profiles.primary_category_id AS seller_primary_category_id,
          seller_profiles.support_email AS seller_support_email,
          CASE WHEN COALESCE(seller_profiles.logo_url, '') LIKE 'data:%' THEN NULL ELSE seller_profiles.logo_url END AS seller_logo_url,
          CASE WHEN COALESCE(seller_profiles.cover_url, '') LIKE 'data:%' THEN NULL ELSE seller_profiles.cover_url END AS seller_cover_url,
          seller_profiles.commission_rate AS seller_commission_rate,
          seller_profiles.total_sales AS seller_total_sales,
          seller_profiles.gross_sales AS seller_gross_sales,
          seller_profiles.commission_amount AS seller_commission_amount,
          seller_profiles.documents_verified AS seller_documents_verified,
          buyer_profiles.user_id AS buyer_profile_user_id,
          buyer_profiles.preferred_language AS buyer_preferred_language,
          buyer_profiles.last_order_at AS buyer_last_order_at,
          rider_profiles.user_id AS rider_profile_user_id,
          rider_profiles.vehicle_number AS rider_vehicle_number,
          rider_profiles.mobile_money_number AS rider_mobile_money_number,
          rider_profiles.emergency_contact AS rider_emergency_contact,
          rider_profiles.operational_status AS rider_operational_status,
          rider_profiles.rating AS rider_rating,
          rider_profiles.total_deliveries AS rider_total_deliveries,
          rider_profiles.earnings AS rider_earnings
        FROM users
        LEFT JOIN seller_profiles ON seller_profiles.user_id = users.id
        LEFT JOIN buyer_profiles ON buyer_profiles.user_id = users.id
        LEFT JOIN rider_profiles ON rider_profiles.user_id = users.id
        WHERE LOWER(COALESCE(users.email, '')) = $1 OR LOWER(COALESCE(users.username, '')) = $1
        LIMIT 1`,
        [normalizedIdentity]
      );
      const userRow = userResult.rows[0];
      if (!userRow?.id) return null;

      return applyUserProfiles(
        mapUser(userRow),
        userRow.seller_profile_user_id
          ? {
              business_name: userRow.seller_business_name,
              primary_category_id: userRow.seller_primary_category_id,
              support_email: userRow.seller_support_email,
              logo_url: userRow.seller_logo_url,
              cover_url: userRow.seller_cover_url,
              commission_rate: userRow.seller_commission_rate,
              total_sales: userRow.seller_total_sales,
              gross_sales: userRow.seller_gross_sales,
              commission_amount: userRow.seller_commission_amount,
              documents_verified: userRow.seller_documents_verified
            }
          : null,
        userRow.buyer_profile_user_id
          ? {
              preferred_language: userRow.buyer_preferred_language,
              last_order_at: userRow.buyer_last_order_at
            }
          : null,
        userRow.rider_profile_user_id
          ? {
              vehicle_number: userRow.rider_vehicle_number,
              mobile_money_number: userRow.rider_mobile_money_number,
              emergency_contact: userRow.rider_emergency_contact,
              operational_status: userRow.rider_operational_status,
              rating: userRow.rider_rating,
              total_deliveries: userRow.rider_total_deliveries,
              earnings: userRow.rider_earnings
            }
          : null
      );
    },

    async createAuthUser(user) {
      const timestamp = user.updatedAt || user.createdAt || new Date().toISOString();

      try {
        await tx(async (client) => {
          await client.query(
            `INSERT INTO users (
              id, name, username, email, password, role, status, phone, avatar,
              must_change_password, last_login_at, password_changed_at, created_at, updated_at, metadata
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14, $15::jsonb
            )`,
            [
              user.id,
              user.name || user.email || 'User',
              user.username || null,
              user.email,
              user.password || '',
              user.role || 'CUSTOMER',
              user.status || 'active',
              user.phone || null,
              user.avatar || null,
              Boolean(user.mustChangePassword),
              user.lastLoginAt || null,
              user.passwordChangedAt || null,
              user.createdAt || timestamp,
              timestamp,
              JSON.stringify(user)
            ]
          );

          if ((user.role || 'CUSTOMER') === 'CUSTOMER') {
            await client.query(
              `INSERT INTO buyer_profiles (user_id, preferred_language, last_order_at, created_at, updated_at, metadata)
               VALUES ($1, $2, $3, $4, $5, $6::jsonb)
               ON CONFLICT (user_id) DO UPDATE SET
                 preferred_language = EXCLUDED.preferred_language,
                 last_order_at = EXCLUDED.last_order_at,
                 updated_at = EXCLUDED.updated_at,
                 metadata = EXCLUDED.metadata`,
              [
                user.id,
                user.buyerSettings?.preferredLanguage || 'en',
                user.lastOrderAt || null,
                user.createdAt || timestamp,
                timestamp,
                JSON.stringify(user.buyerSettings || {})
              ]
            );
          }
        });
      } catch (error) {
        if (error?.code === '23505') {
          const duplicateError = new Error('Email already exists');
          duplicateError.statusCode = 409;
          throw duplicateError;
        }
        throw error;
      }

      return user;
    },

    async findLatestSellerApplicationByEmail(email) {
      const normalizedEmail = String(email || '').toLowerCase().trim();
      const result = await query(
        `SELECT ${READ_COLUMNS.seller_applications}
         FROM seller_applications
         WHERE LOWER(COALESCE(email, '')) = $1
         ORDER BY COALESCE(updated_at, created_at) DESC
         LIMIT 1`,
        [normalizedEmail]
      );
      const row = result.rows[0];
      return row ? mapApplication(row, 'seller') : null;
    },

    async findLatestRiderApplicationByEmail(email) {
      const normalizedEmail = String(email || '').toLowerCase().trim();
      const result = await query(
        `SELECT ${READ_COLUMNS.rider_applications}
         FROM rider_applications
         WHERE LOWER(COALESCE(email, '')) = $1
         ORDER BY COALESCE(updated_at, created_at) DESC
         LIMIT 1`,
        [normalizedEmail]
      );
      const row = result.rows[0];
      return row ? mapApplication(row, 'rider') : null;
    },

    async saveSellerApplication(application) {
      const metadata = safeJsonStringify({
        id: application.id,
        businessName: application.businessName || application.name || 'Seller application',
        category: application.category || 'General',
        email: application.email || '',
        phone: application.phone || '',
        status: application.status || 'pending',
        temporaryUsername: application.temporaryUsername || null
      });
      await query(
        `INSERT INTO seller_applications (
          id, business_name, category, email, phone, logo_url, supporting_document_url,
          status, merchant_id, temporary_username, rejected_reason, created_at, updated_at,
          approved_at, approved_by, rejected_at, rejected_by, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          category = EXCLUDED.category,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          logo_url = EXCLUDED.logo_url,
          supporting_document_url = EXCLUDED.supporting_document_url,
          status = EXCLUDED.status,
          merchant_id = EXCLUDED.merchant_id,
          temporary_username = EXCLUDED.temporary_username,
          rejected_reason = EXCLUDED.rejected_reason,
          updated_at = EXCLUDED.updated_at,
          approved_at = EXCLUDED.approved_at,
          approved_by = EXCLUDED.approved_by,
          rejected_at = EXCLUDED.rejected_at,
          rejected_by = EXCLUDED.rejected_by,
          metadata = EXCLUDED.metadata`,
        [
          application.id,
          application.businessName || application.name || 'Seller application',
          application.category || 'General',
          application.email || '',
          application.phone || '',
          application.logoUrl || null,
          application.supportingDocumentUrl || null,
          application.status || 'pending',
          application.merchantId || null,
          application.temporaryUsername || null,
          application.rejectedReason || null,
          application.createdAt || new Date().toISOString(),
          application.updatedAt || application.createdAt || new Date().toISOString(),
          application.approvedAt || null,
          application.approvedBy || null,
          application.rejectedAt || null,
          application.rejectedBy || null,
          metadata
        ]
      );
      return application;
    },

    async saveRiderApplication(application) {
      const metadata = safeJsonStringify({
        id: application.id,
        name: application.name || 'Rider application',
        email: application.email || '',
        phone: application.phone || '',
        vehicleNumber: application.vehicleNumber || '',
        status: application.status || 'pending',
        temporaryUsername: application.temporaryUsername || null
      });
      await query(
        `INSERT INTO rider_applications (
          id, name, email, phone, vehicle_number, status, rider_id, temporary_username,
          rejected_reason, created_at, updated_at, approved_at, approved_by, rejected_at,
          rejected_by, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          vehicle_number = EXCLUDED.vehicle_number,
          status = EXCLUDED.status,
          rider_id = EXCLUDED.rider_id,
          temporary_username = EXCLUDED.temporary_username,
          rejected_reason = EXCLUDED.rejected_reason,
          updated_at = EXCLUDED.updated_at,
          approved_at = EXCLUDED.approved_at,
          approved_by = EXCLUDED.approved_by,
          rejected_at = EXCLUDED.rejected_at,
          rejected_by = EXCLUDED.rejected_by,
          metadata = EXCLUDED.metadata`,
        [
          application.id,
          application.name || 'Rider application',
          application.email || '',
          application.phone || '',
          application.vehicleNumber || '',
          application.status || 'pending',
          application.riderId || null,
          application.temporaryUsername || null,
          application.rejectedReason || null,
          application.createdAt || new Date().toISOString(),
          application.updatedAt || application.createdAt || new Date().toISOString(),
          application.approvedAt || null,
          application.approvedBy || null,
          application.rejectedAt || null,
          application.rejectedBy || null,
          metadata
        ]
      );
      return application;
    },

    async persistAuthLogin({ userId, token, userAgent, timestamp, passwordHash }) {
      await tx(async (client) => {
        if (passwordHash) {
          await client.query(
            'UPDATE users SET password = $2, last_login_at = $3, updated_at = $3 WHERE id = $1',
            [userId, passwordHash, timestamp]
          );
        } else {
          await client.query(
            'UPDATE users SET last_login_at = $2, updated_at = $2 WHERE id = $1',
            [userId, timestamp]
          );
        }

        await client.query(
          'INSERT INTO auth_tokens (token, user_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, created_at = EXCLUDED.created_at',
          [token, userId, timestamp]
        );

        await client.query(
          `INSERT INTO sessions (id, token_hash, user_id, created_at, last_seen_at, user_agent)
           VALUES ($1, $2, $3, $4, $4, $5)
           ON CONFLICT (id) DO UPDATE SET token_hash = EXCLUDED.token_hash, user_id = EXCLUDED.user_id, created_at = EXCLUDED.created_at, last_seen_at = EXCLUDED.last_seen_at, user_agent = EXCLUDED.user_agent`,
          [`SES-${Date.now()}`, token, userId, timestamp, userAgent || 'Unknown device']
        );
      });
    },

    async readAuthUserByToken(token) {
      const authResult = await query(
        `SELECT
          auth_tokens.created_at AS token_created_at,
          ${READ_COLUMNS.users},
          seller_profiles.user_id AS seller_profile_user_id,
          seller_profiles.business_name AS seller_business_name,
          seller_profiles.primary_category_id AS seller_primary_category_id,
          seller_profiles.support_email AS seller_support_email,
          CASE WHEN COALESCE(seller_profiles.logo_url, '') LIKE 'data:%' THEN NULL ELSE seller_profiles.logo_url END AS seller_logo_url,
          CASE WHEN COALESCE(seller_profiles.cover_url, '') LIKE 'data:%' THEN NULL ELSE seller_profiles.cover_url END AS seller_cover_url,
          seller_profiles.commission_rate AS seller_commission_rate,
          seller_profiles.total_sales AS seller_total_sales,
          seller_profiles.gross_sales AS seller_gross_sales,
          seller_profiles.commission_amount AS seller_commission_amount,
          seller_profiles.documents_verified AS seller_documents_verified,
          buyer_profiles.user_id AS buyer_profile_user_id,
          buyer_profiles.preferred_language AS buyer_preferred_language,
          buyer_profiles.last_order_at AS buyer_last_order_at,
          rider_profiles.user_id AS rider_profile_user_id,
          rider_profiles.vehicle_number AS rider_vehicle_number,
          rider_profiles.mobile_money_number AS rider_mobile_money_number,
          rider_profiles.emergency_contact AS rider_emergency_contact,
          rider_profiles.operational_status AS rider_operational_status,
          rider_profiles.rating AS rider_rating,
          rider_profiles.total_deliveries AS rider_total_deliveries,
          rider_profiles.earnings AS rider_earnings
        FROM auth_tokens
        JOIN users ON users.id = auth_tokens.user_id
        LEFT JOIN seller_profiles ON seller_profiles.user_id = users.id
        LEFT JOIN buyer_profiles ON buyer_profiles.user_id = users.id
        LEFT JOIN rider_profiles ON rider_profiles.user_id = users.id
        WHERE auth_tokens.token = $1
        LIMIT 1`,
        [token]
      );
      const authRow = authResult.rows[0];
      if (!authRow?.id) {
        return { user: null, createdAt: null };
      }

      const user = applyUserProfiles(
        mapUser(authRow),
        authRow.seller_profile_user_id
          ? {
              business_name: authRow.seller_business_name,
              primary_category_id: authRow.seller_primary_category_id,
              support_email: authRow.seller_support_email,
              logo_url: authRow.seller_logo_url,
              cover_url: authRow.seller_cover_url,
              commission_rate: authRow.seller_commission_rate,
              total_sales: authRow.seller_total_sales,
              gross_sales: authRow.seller_gross_sales,
              commission_amount: authRow.seller_commission_amount,
              documents_verified: authRow.seller_documents_verified
            }
          : null,
        authRow.buyer_profile_user_id
          ? {
              preferred_language: authRow.buyer_preferred_language,
              last_order_at: authRow.buyer_last_order_at
            }
          : null,
        authRow.rider_profile_user_id
          ? {
              vehicle_number: authRow.rider_vehicle_number,
              mobile_money_number: authRow.rider_mobile_money_number,
              emergency_contact: authRow.rider_emergency_contact,
              operational_status: authRow.rider_operational_status,
              rating: authRow.rider_rating,
              total_deliveries: authRow.rider_total_deliveries,
              earnings: authRow.rider_earnings
            }
          : null
      );

      return {
        user,
        createdAt: toIso(authRow.token_created_at)
      };
    },

    async touchSessionByToken(token, timestamp) {
      await query(
        'UPDATE sessions SET last_seen_at = $2 WHERE token_hash = $1',
        [token, timestamp]
      );
    },

    async deleteAuthToken(token) {
      await tx(async (client) => {
        await client.query('DELETE FROM auth_tokens WHERE token = $1', [token]);
        await client.query('DELETE FROM sessions WHERE token_hash = $1', [token]);
      });
    },

    async readDb() {
      const users = await readRows('users');
      const categories = await readRows('categories', 'sort_order ASC, name ASC');
      const sellerProfiles = await readRows('seller_profiles');
      const buyerProfiles = await readRows('buyer_profiles');
      const riderProfiles = await readRows('rider_profiles');
      const tokens = await readRows('auth_tokens', 'created_at DESC');
      const sessions = await readRows('sessions', 'created_at DESC');
      const products = await readRows('products');
      const reviews = await readRows('product_reviews');
      const addresses = await readRows('addresses');
      const orders = await readRows('orders');
      const orderItems = await readRows('order_items', 'order_id ASC, id ASC');
      const deliveries = await readRows('deliveries', 'assigned_at DESC, id ASC');
      const sellerApplications = await readRows('seller_applications');
      const riderApplications = await readRows('rider_applications');
      const transactions = await readRows('transactions', 'timestamp DESC');
      const payments = await readRows('payments');
      const supportTickets = await readRows('support_tickets');
      const contactSubmissions = await readRows('inquiries');
      const notifications = await readRows('notifications');
      const auditLogs = await readRows('audit_logs', 'time DESC');
      const emailLogs = await readRows('email_logs', 'sent_at DESC');
      const wishlists = await readRows('wishlists');
      const adminSettings = await readRows('admin_settings', 'updated_at DESC');
      const passwordResetTokens = await readRows('password_reset_tokens', 'created_at DESC');

      const sellerProfileMap = new Map(sellerProfiles.map((row) => [row.user_id, row]));
      const buyerProfileMap = new Map(buyerProfiles.map((row) => [row.user_id, row]));
      const riderProfileMap = new Map(riderProfiles.map((row) => [row.user_id, row]));
      const orderItemsMap = new Map();
      for (const row of orderItems) {
        const current = orderItemsMap.get(row.order_id) || [];
        current.push({
          ...(row.metadata || {}),
          id: row.id,
          productId: row.product_id || undefined,
          merchantId: row.merchant_id || undefined,
          productName: row.product_name || '',
          quantity: Number(row.quantity || 0),
          price: toNumber(row.price),
          subtotal: toNumber(row.subtotal),
          variant: row.variant || undefined
        });
        orderItemsMap.set(row.order_id, current);
      }

      const deliveryMap = new Map(
        deliveries.map((row) => [
          row.order_id,
          {
            ...(row.metadata || {}),
            id: row.id,
            orderId: row.order_id,
            riderId: row.rider_id || undefined,
            riderName: row.rider_name || undefined,
            status: row.status || undefined,
            assignedAt: toIso(row.assigned_at),
            pickedUpAt: toIso(row.picked_up_at),
            deliveredAt: toIso(row.delivered_at),
            failedAt: toIso(row.failed_at),
            pickupNotes: row.pickup_notes || '',
            deliveryNotes: row.delivery_notes || ''
          }
        ])
      );

      const mergedTickets = dedupeById([
        ...supportTickets.map(mapSupportTicket),
        ...contactSubmissions.map(mapInquiry)
      ]);

      return {
        users: users.map((row) =>
          applyUserProfiles(
            mapUser(row),
            sellerProfileMap.get(row.id),
            buyerProfileMap.get(row.id),
            riderProfileMap.get(row.id)
          )
        ),
        categories: categories.map(mapCategory),
        tokens: buildTokens(tokens),
        sessions: sessions.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          token: row.token_hash,
          userId: row.user_id,
          createdAt: toIso(row.created_at),
          lastSeenAt: toIso(row.last_seen_at),
          revokedAt: toIso(row.revoked_at),
          userAgent: row.user_agent || '',
          reviewedAt: toIso(row.reviewed_at),
          reviewedBy: row.reviewed_by || undefined,
          reviewNotes: row.review_notes || ''
        })),
        products: products.map(mapProduct),
        reviews: reviews.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          productId: row.product_id,
          userId: row.user_id || undefined,
          rating: row.rating,
          comment: row.comment || '',
          createdAt: toIso(row.created_at)
        })),
        addresses: addresses.map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          district: row.district,
          sector: row.sector,
          street: row.street,
          isDefault: row.is_default,
          createdAt: toIso(row.created_at),
          updatedAt: toIso(row.updated_at)
        })),
        orders: orders.map((row) => {
          const order = mapOrder(row);
          const normalizedItems = orderItemsMap.get(row.id);
          const delivery = deliveryMap.get(row.id);
          return {
            ...order,
            customerName: row.customer_name || row.metadata?.customerName || '',
            merchantName: row.merchant_name || row.metadata?.merchantName || '',
            riderName: row.rider_name || delivery?.riderName || row.metadata?.riderName || undefined,
            items: normalizedItems && normalizedItems.length > 0 ? normalizedItems : order.items,
            address: row.address || row.metadata?.address || order.address || '',
            phone: row.phone || row.metadata?.phone || '',
            delivery: delivery || undefined
          };
        }),
        orderItems: Array.from(orderItemsMap.values()).flat(),
        deliveries: Array.from(deliveryMap.values()),
        sellerApplications: sellerApplications.map((row) => mapApplication(row, 'seller')),
        riderApplications: riderApplications.map((row) => mapApplication(row, 'rider')),
        transactions: transactions.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          userId: row.user_id || undefined,
          amount: toNumber(row.amount),
          status: row.status,
          method: row.method || '',
          tx_ref: row.tx_ref || '',
          timestamp: toIso(row.timestamp)
        })),
        payments: payments.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          orderId: row.order_id || undefined,
          userId: row.user_id || undefined,
          amount: toNumber(row.amount),
          status: row.status,
          method: row.method || '',
          tx_ref: row.tx_ref || '',
          createdAt: toIso(row.created_at),
          updatedAt: toIso(row.updated_at)
        })),
        supportTickets: mergedTickets,
        contactSubmissions: mergedTickets,
        inquiries: mergedTickets,
        notifications: notifications.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          userId: row.user_id || row.metadata?.userId || undefined,
          role: row.role || '',
          title: row.title,
          message: row.message,
          type: row.type,
          read: row.read,
          createdAt: toIso(row.created_at)
        })),
        auditLogs: auditLogs.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          event: row.event,
          actor: row.actor || '',
          category: row.category,
          status: row.status,
          time: toIso(row.time),
          metadata: row.metadata || {}
        })),
        emailLogs: emailLogs.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          to: Array.isArray(row.to_addresses) ? row.to_addresses[0] : undefined,
          toAddresses: json(row.to_addresses, []),
          subject: row.subject,
          template: row.template || '',
          body: row.body || '',
          html: row.html || '',
          sentAt: toIso(row.sent_at),
          status: row.status,
          provider: row.provider,
          providerMessageId: row.provider_message_id || undefined,
          error: row.error || undefined,
          note: row.note || undefined
        })),
        wishlists: wishlists.map((row) => ({
          id: row.id,
          userId: row.user_id,
          productId: row.product_id,
          createdAt: toIso(row.created_at)
        })),
        adminSettings: adminSettings[0]
          ? {
              preferences: adminSettings[0].preferences || {},
              categoryCommissionRates: adminSettings[0].category_commission_rates || {},
              updatedAt: toIso(adminSettings[0].updated_at),
              updatedBy: adminSettings[0].updated_by || undefined
            }
          : { preferences: {}, categoryCommissionRates: {} },
        passwordResetTokens: passwordResetTokens.map((row) => ({
          ...(row.metadata || {}),
          id: row.id,
          token: row.token,
          userId: row.user_id,
          expiresAt: toIso(row.expires_at),
          createdAt: toIso(row.created_at)
        }))
      };
    },

    async writeDb(db) {
      const userIds = new Set((db.users || []).map((user) => user.id));
      const productIds = new Set((db.products || []).map((product) => product.id));
      const orderIds = new Set((db.orders || []).map((order) => order.id));
      const categorySeedMap = getCategorySeedMap();
      const productCategoryIds = new Set((db.products || []).map((product) => String(product.category || '').trim()).filter(Boolean));
      const runtimeCategories = dedupeById([
        ...(Array.isArray(db.categories) ? db.categories : []),
        ...Array.from(productCategoryIds).map((categoryId) => ({
          ...(categorySeedMap.get(categoryId) || {}),
          id: categoryId,
          name: categorySeedMap.get(categoryId)?.name || `Category ${categoryId}`,
          slug: categorySeedMap.get(categoryId)?.slug || `category-${categoryId}`,
          description: categorySeedMap.get(categoryId)?.description || '',
          iconKey: categorySeedMap.get(categoryId)?.iconKey || '',
          sortOrder: categorySeedMap.get(categoryId)?.sortOrder || 99
        })),
        ...DEFAULT_CATEGORY_SEEDS
      ]);

      await tx(async (client) => {
        await client.query('DELETE FROM wishlists');
        await client.query('DELETE FROM product_reviews');
        await client.query('DELETE FROM deliveries');
        await client.query('DELETE FROM order_items');
        await client.query('DELETE FROM support_tickets');
        await client.query('DELETE FROM password_reset_tokens');
        await client.query('DELETE FROM auth_tokens');
        await client.query('DELETE FROM sessions');
        await client.query('DELETE FROM payments');
        await client.query('DELETE FROM transactions');
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM audit_logs');
        await client.query('DELETE FROM email_logs');
        await client.query('DELETE FROM inquiries');
        await client.query('DELETE FROM seller_applications');
        await client.query('DELETE FROM rider_applications');
        await client.query('DELETE FROM addresses');
        await client.query('DELETE FROM orders');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM rider_profiles');
        await client.query('DELETE FROM buyer_profiles');
        await client.query('DELETE FROM seller_profiles');
        await client.query('DELETE FROM admin_settings');
        await client.query('DELETE FROM categories');
        await client.query('DELETE FROM users');

        for (const category of runtimeCategories) {
          await upsert(client, 'categories', {
            id: category.id,
            name: category.name || `Category ${category.id}`,
            slug: category.slug || `category-${category.id}`,
            description: category.description || '',
            icon_key: category.iconKey || null,
            sort_order: Number(category.sortOrder || 0),
            is_active: category.isActive !== false,
            created_at: category.createdAt || new Date().toISOString(),
            updated_at: category.updatedAt || category.createdAt || new Date().toISOString()
          });
        }

        for (const user of db.users || []) {
          await upsert(client, 'users', {
            id: user.id,
            name: user.name || user.email || 'User',
            username: user.username || null,
            email: user.email,
            password: user.password || '',
            role: user.role || 'CUSTOMER',
            status: user.status || 'active',
            phone: user.phone || null,
            avatar: user.avatar || null,
            must_change_password: Boolean(user.mustChangePassword),
            last_login_at: user.lastLoginAt || null,
            password_changed_at: user.passwordChangedAt || null,
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: user.updatedAt || user.createdAt || new Date().toISOString(),
            metadata: user
          });
        }

        for (const user of db.users || []) {
          if (user.role === 'MERCHANT') {
            await upsert(client, 'seller_profiles', {
              user_id: user.id,
              business_name: user.name || user.email || 'Seller',
              primary_category_id: user.primaryCategoryId || null,
              support_email: user.storeSettings?.supportEmail || user.email || null,
              logo_url: user.storeSettings?.storeLogoUrl || null,
              cover_url: user.storeSettings?.coverUrl || null,
              commission_rate: toNumber(user.commissionRate),
              total_sales: toNumber(user.totalSales),
              gross_sales: toNumber(user.grossSales),
              commission_amount: toNumber(user.commissionAmount),
              documents_verified: Boolean(user.documentsVerified),
              created_at: user.createdAt || new Date().toISOString(),
              updated_at: user.updatedAt || user.createdAt || new Date().toISOString(),
              metadata: user.storeSettings || {}
            }, 'user_id');
          }

          if (user.role === 'CUSTOMER') {
            await upsert(client, 'buyer_profiles', {
              user_id: user.id,
              preferred_language: user.buyerSettings?.preferredLanguage || 'en',
              last_order_at: user.lastOrderAt || null,
              created_at: user.createdAt || new Date().toISOString(),
              updated_at: user.updatedAt || user.createdAt || new Date().toISOString(),
              metadata: user.buyerSettings || {}
            }, 'user_id');
          }

          if (user.role === 'DELIVERY') {
            await upsert(client, 'rider_profiles', {
              user_id: user.id,
              vehicle_number: user.riderSettings?.vehicleNumber || null,
              mobile_money_number: user.riderSettings?.mobileMoneyNumber || null,
              emergency_contact: user.riderSettings?.emergencyContact || null,
              operational_status: user.riderSettings?.operationalStatus || 'offline',
              rating: toNumber(user.riderSettings?.rating),
              total_deliveries: Number(user.riderSettings?.totalDeliveries || 0),
              earnings: toNumber(user.riderSettings?.earnings),
              created_at: user.createdAt || new Date().toISOString(),
              updated_at: user.updatedAt || user.createdAt || new Date().toISOString(),
              metadata: user.riderSettings || {}
            }, 'user_id');
          }
        }

        for (const [token, value] of Object.entries(db.tokens || {})) {
          const record = value && typeof value === 'object' ? value : { userId: value };
          const safeUserId = userRef(record.userId, userIds);
          if (!safeUserId) continue;
          await upsert(client, 'auth_tokens', {
            token,
            user_id: safeUserId,
            created_at: record.createdAt || new Date().toISOString(),
            metadata: record
          }, 'token');
        }

        for (const session of db.sessions || []) {
          const safeUserId = userRef(session.userId, userIds);
          if (!safeUserId) continue;
          await upsert(client, 'sessions', {
            id: session.id,
            token_hash: session.token || session.tokenHash || session.id,
            user_id: safeUserId,
            created_at: session.createdAt || new Date().toISOString(),
            last_seen_at: session.lastSeenAt || session.createdAt || new Date().toISOString(),
            revoked_at: session.revokedAt || null,
            user_agent: session.userAgent || null,
            reviewed_at: session.reviewedAt || null,
            reviewed_by: userRef(session.reviewedBy, userIds),
            review_notes: session.reviewNotes || null,
            metadata: session
          });
        }

        for (const resetToken of db.passwordResetTokens || []) {
          const safeUserId = userRef(resetToken.userId, userIds);
          if (!safeUserId) continue;
          await upsert(client, 'password_reset_tokens', {
            id: resetToken.id,
            token: resetToken.token,
            user_id: safeUserId,
            expires_at: resetToken.expiresAt || new Date().toISOString(),
            created_at: resetToken.createdAt || new Date().toISOString(),
            metadata: resetToken
          });
        }

        for (const product of db.products || []) {
          await upsert(client, 'products', {
            id: product.id,
            merchant_id: userRef(product.merchantId, userIds),
            name: product.name || 'Untitled product',
            description: product.description || '',
            specifications: product.specifications || '',
            category: product.category || 'general',
            price: toNumber(product.price),
            stock: toNumber(product.stock),
            image: product.image || null,
            images: product.images || (product.image ? [product.image] : []),
            status: product.status || 'pending',
            featured: Boolean(product.featured),
            rating: toNumber(product.rating),
            reviews: toNumber(product.reviewsCount ?? product.reviews),
            created_at: product.createdAt || new Date().toISOString(),
            updated_at: product.updatedAt || product.createdAt || new Date().toISOString(),
            metadata: product
          });
        }

        for (const review of db.reviews || []) {
          if (!productIds.has(review.productId)) continue;
          await upsert(client, 'product_reviews', {
            id: review.id,
            product_id: review.productId,
            user_id: userRef(review.userId, userIds),
            rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
            comment: review.comment || '',
            created_at: review.createdAt || new Date().toISOString(),
            metadata: review
          });
        }

        for (const address of db.addresses || []) {
          const safeUserId = userRef(address.userId, userIds);
          if (!safeUserId) continue;
          await upsert(client, 'addresses', {
            id: address.id,
            user_id: safeUserId,
            name: address.name || 'Address',
            district: address.district || '',
            sector: address.sector || '',
            street: address.street || '',
            is_default: Boolean(address.isDefault),
            created_at: address.createdAt || new Date().toISOString(),
            updated_at: address.updatedAt || address.createdAt || new Date().toISOString()
          });
        }

        for (const order of db.orders || []) {
          await upsert(client, 'orders', {
            id: order.id,
            order_number: order.orderNumber || order.id,
            user_id: userRef(order.userId || order.customerId, userIds),
            merchant_id: userRef(order.merchantId, userIds),
            rider_id: userRef(order.riderId, userIds),
            customer_name: order.customerName || null,
            merchant_name: order.merchantName || null,
            rider_name: order.riderName || null,
            status: order.status || 'pending',
            payment_status: order.paymentStatus || 'pending',
            payment_method: order.paymentMethod || null,
            items: order.items || [],
            shipping_address: order.shippingAddress || { address: order.address || '', phone: order.phone || '' },
            address: order.address || null,
            phone: order.phone || null,
            subtotal: toNumber(order.subtotal ?? (Number(order.totalAmount || order.total || 0) - Number(order.deliveryFee || 0))),
            delivery_fee: toNumber(order.deliveryFee),
            total: toNumber(order.total ?? order.totalAmount),
            notes: order.notes || null,
            created_at: order.createdAt || new Date().toISOString(),
            updated_at: order.updatedAt || order.createdAt || new Date().toISOString(),
            metadata: order
          });

          for (const [index, item] of (order.items || []).entries()) {
            await upsert(client, 'order_items', {
              id: item.id || `${order.id}-item-${index + 1}`,
              order_id: order.id,
              product_id: productIds.has(item.productId) ? item.productId : null,
              merchant_id: userRef(order.merchantId, userIds),
              product_name: item.productName || 'Order item',
              variant: item.variant || null,
              quantity: Number(item.quantity || 0),
              price: toNumber(item.price),
              subtotal: toNumber(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)),
              metadata: item
            });
          }

          if (order.riderId || order.riderName || order.status === 'assigned' || order.status === 'picked_up' || order.status === 'out_for_delivery' || order.status === 'delivered' || order.status === 'completed') {
            await upsert(client, 'deliveries', {
              id: order.delivery?.id || `DEL-${order.id}`,
              order_id: order.id,
              rider_id: userRef(order.riderId, userIds),
              rider_name: order.riderName || null,
              status: order.delivery?.status || order.status || 'assigned',
              pickup_notes: order.delivery?.pickupNotes || null,
              delivery_notes: order.delivery?.deliveryNotes || order.notes || null,
              assigned_at: order.delivery?.assignedAt || order.updatedAt || order.createdAt || new Date().toISOString(),
              picked_up_at: order.delivery?.pickedUpAt || null,
              delivered_at: order.delivery?.deliveredAt || (['delivered', 'completed'].includes(order.status) ? (order.updatedAt || order.createdAt || new Date().toISOString()) : null),
              failed_at: order.delivery?.failedAt || null,
              metadata: order.delivery || { orderId: order.id, status: order.status }
            }, 'order_id');
          }
        }

        for (const application of db.sellerApplications || []) {
          await upsert(client, 'seller_applications', {
            id: application.id,
            business_name: application.businessName || application.name || 'Seller application',
            category: application.category || 'General',
            email: application.email || '',
            phone: application.phone || '',
            logo_url: application.logoUrl || null,
            supporting_document_url: application.supportingDocumentUrl || null,
            status: application.status || 'pending',
            merchant_id: userRef(application.merchantId, userIds),
            temporary_username: application.temporaryUsername || null,
            rejected_reason: application.rejectedReason || null,
            created_at: application.createdAt || new Date().toISOString(),
            updated_at: application.updatedAt || application.createdAt || new Date().toISOString(),
            approved_at: application.approvedAt || null,
            approved_by: userRef(application.approvedBy, userIds),
            rejected_at: application.rejectedAt || null,
            rejected_by: userRef(application.rejectedBy, userIds),
            metadata: application
          });
        }

        for (const application of db.riderApplications || []) {
          await upsert(client, 'rider_applications', {
            id: application.id,
            name: application.name || 'Rider application',
            email: application.email || '',
            phone: application.phone || '',
            vehicle_number: application.vehicleNumber || application.plateNumber || '',
            status: application.status || 'pending',
            rider_id: userRef(application.riderId, userIds),
            temporary_username: application.temporaryUsername || null,
            rejected_reason: application.rejectedReason || null,
            created_at: application.createdAt || new Date().toISOString(),
            updated_at: application.updatedAt || application.createdAt || new Date().toISOString(),
            approved_at: application.approvedAt || null,
            approved_by: userRef(application.approvedBy, userIds),
            rejected_at: application.rejectedAt || null,
            rejected_by: userRef(application.rejectedBy, userIds),
            metadata: application
          });
        }

        for (const transaction of db.transactions || []) {
          await upsert(client, 'transactions', {
            id: transaction.id,
            user_id: userRef(transaction.userId, userIds),
            amount: toNumber(transaction.amount),
            status: transaction.status || 'pending',
            method: transaction.method || null,
            tx_ref: transaction.tx_ref || transaction.txRef || null,
            timestamp: transaction.timestamp || transaction.createdAt || new Date().toISOString(),
            metadata: transaction
          });
        }

        for (const payment of db.payments || []) {
          await upsert(client, 'payments', {
            id: payment.id,
            order_id: orderIds.has(payment.orderId) ? payment.orderId : null,
            user_id: userRef(payment.userId, userIds),
            amount: toNumber(payment.amount),
            status: payment.status || 'pending',
            method: payment.method || null,
            tx_ref: payment.tx_ref || payment.txRef || null,
            created_at: payment.createdAt || payment.timestamp || new Date().toISOString(),
            updated_at: payment.updatedAt || payment.createdAt || payment.timestamp || new Date().toISOString(),
            metadata: payment
          });
        }

        for (const inquiry of dedupeById([...(db.inquiries || []), ...(db.contactSubmissions || []), ...(db.supportTickets || [])])) {
          await upsert(client, 'inquiries', {
            id: inquiry.id,
            type: inquiry.type || 'contact',
            name: inquiry.name || 'Visitor',
            email: inquiry.email || '',
            subject: inquiry.subject || null,
            company: inquiry.company || null,
            message: inquiry.message || '',
            status: inquiry.status || 'new',
            assigned_to: userRef(inquiry.assignedTo || inquiry.assignedAdminId, userIds),
            internal_notes: inquiry.internalNotes || null,
            replied_at: inquiry.repliedAt || null,
            resolved_at: inquiry.resolvedAt || null,
            created_at: inquiry.createdAt || new Date().toISOString(),
            updated_at: inquiry.updatedAt || inquiry.createdAt || new Date().toISOString(),
            metadata: inquiry
          });

          await upsert(client, 'support_tickets', {
            id: inquiry.id,
            type: inquiry.type || 'contact',
            name: inquiry.name || 'Visitor',
            email: inquiry.email || '',
            subject: inquiry.subject || null,
            company: inquiry.company || null,
            message: inquiry.message || '',
            status: inquiry.status || 'new',
            assigned_to: userRef(inquiry.assignedTo || inquiry.assignedAdminId, userIds),
            internal_notes: inquiry.internalNotes || null,
            replied_at: inquiry.repliedAt || null,
            resolved_at: inquiry.resolvedAt || null,
            created_at: inquiry.createdAt || new Date().toISOString(),
            updated_at: inquiry.updatedAt || inquiry.createdAt || new Date().toISOString(),
            metadata: inquiry
          });
        }

        for (const notification of db.notifications || []) {
          await upsert(client, 'notifications', {
            id: notification.id,
            user_id: userRef(notification.userId, userIds),
            role: notification.role || null,
            title: notification.title || 'Notification',
            message: notification.message || '',
            type: notification.type || 'info',
            read: Boolean(notification.read),
            created_at: notification.createdAt || new Date().toISOString(),
            metadata: notification.metadata || notification
          });
        }

        for (const entry of db.auditLogs || []) {
          await upsert(client, 'audit_logs', {
            id: entry.id,
            event: entry.event || 'Audit event',
            actor: entry.actor || null,
            category: entry.category || 'system',
            status: entry.status || 'info',
            time: entry.time || entry.createdAt || new Date().toISOString(),
            metadata: entry.metadata || entry
          });
        }

        for (const entry of db.emailLogs || []) {
          await upsert(client, 'email_logs', {
            id: entry.id,
            to_addresses: entry.toAddresses || (Array.isArray(entry.to) ? entry.to : [entry.to].filter(Boolean)),
            subject: entry.subject || 'Email',
            template: entry.template || null,
            body: entry.body || null,
            html: entry.html || null,
            sent_at: entry.sentAt || entry.createdAt || new Date().toISOString(),
            status: entry.status || 'queued',
            provider: entry.provider || 'log',
            provider_message_id: entry.providerMessageId || null,
            error: entry.error || null,
            note: entry.note || null,
            metadata: entry.metadata || entry
          });
        }

        for (const wishlist of db.wishlists || []) {
          if (!userIds.has(wishlist.userId) || !productIds.has(wishlist.productId)) continue;
          await upsert(client, 'wishlists', {
            id: wishlist.id || `${wishlist.userId}-${wishlist.productId}`,
            user_id: wishlist.userId,
            product_id: wishlist.productId,
            created_at: wishlist.createdAt || new Date().toISOString()
          });
        }

        await upsert(client, 'admin_settings', {
          id: 'platform',
          preferences: db.adminSettings?.preferences || {},
          category_commission_rates: db.adminSettings?.categoryCommissionRates || {},
          updated_at: db.adminSettings?.updatedAt || new Date().toISOString(),
          updated_by: userRef(db.adminSettings?.updatedBy, userIds)
        });
      });
    },

    async persistCheckoutBundle(bundle = {}) {
      return tx(async (client) => {
        const updatedProducts = [];
        if (bundle.inventoryReleaseOrderId) {
          const orderResult = await client.query(
            'SELECT metadata FROM orders WHERE id = $1 FOR UPDATE',
            [bundle.inventoryReleaseOrderId]
          );
          if (orderResult.rows[0]?.metadata?.inventoryRestockedAt) {
            const error = new Error('This order inventory has already been restored.');
            error.statusCode = 409;
            throw error;
          }
        }

        const adjustments = [...(bundle.inventoryAdjustments || [])]
          .sort((left, right) => String(left.productId).localeCompare(String(right.productId)));

        for (const adjustment of adjustments) {
          const result = await client.query(
            'SELECT id, name, stock FROM products WHERE id = $1 FOR UPDATE',
            [adjustment.productId]
          );
          const product = result.rows[0];
          if (!product) {
            const error = new Error('A product in your cart is no longer available.');
            error.statusCode = 409;
            throw error;
          }

          const delta = Number(adjustment.delta || 0);
          const currentStock = Number(product.stock || 0);
          const nextStock = currentStock + delta;
          if (!Number.isInteger(delta) || nextStock < 0) {
            const error = new Error(`${product.name || 'Product'} only has ${currentStock} unit(s) available.`);
            error.statusCode = 409;
            throw error;
          }

          await client.query(
            'UPDATE products SET stock = $2, updated_at = NOW() WHERE id = $1',
            [product.id, nextStock]
          );
          updatedProducts.push({ id: product.id, name: product.name, stock: nextStock });
        }

        for (const order of bundle.orders || []) {
          await upsertOrderRecord(client, order);
        }

        for (const payment of bundle.payments || []) {
          await upsertPaymentRecord(client, payment);
        }

        for (const transaction of bundle.transactions || []) {
          await upsertTransactionRecord(client, transaction);
        }

        for (const notification of bundle.notifications || []) {
          await upsertNotificationRecord(client, notification);
        }

        for (const entry of bundle.auditLogs || []) {
          await upsertAuditLogRecord(client, entry);
        }

        for (const entry of bundle.emailLogs || []) {
          await upsertEmailLogRecord(client, entry);
        }

        return { updatedProducts };
      });
    }
  };
};
