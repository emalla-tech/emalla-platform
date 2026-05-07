import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CATEGORY_SEEDS, getCategorySeedMap } from '../backend/databaseReference.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'backend', 'data', 'db.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'backend', 'data', 'migrations');

const COLLECTIONS = [
  'users',
  'products',
  'orders',
  'sellerApplications',
  'riderApplications',
  'sessions',
  'transactions',
  'inquiries',
  'auditLogs',
  'emailLogs',
  'addresses',
  'wishlists',
  'notifications',
  'payments',
  'reviews',
  'contactSubmissions',
  'passwordResetTokens'
];

const readJsonDb = async () => {
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
};

const sqlString = (value) => {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlJson = (value) => `${sqlString(JSON.stringify(value ?? null))}::jsonb`;

const timestamp = (value) => sqlString(value || new Date().toISOString());
const nullableTimestamp = (value) => (value ? sqlString(value) : 'NULL');
const bool = (value) => (value ? 'TRUE' : 'FALSE');
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : '0';
};

const jsonArray = (value) => (Array.isArray(value) ? value : []);
const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};
const getId = (prefix, fallbackIndex) => `${prefix}-${Date.now()}-${fallbackIndex}`;
const normalizeRole = (role) => {
  const normalized = String(role || 'CUSTOMER').toUpperCase();
  if (normalized === 'BUYER') return 'CUSTOMER';
  if (normalized === 'SELLER') return 'MERCHANT';
  if (normalized === 'RIDER') return 'DELIVERY';
  if (['ADMIN', 'CUSTOMER', 'MERCHANT', 'DELIVERY'].includes(normalized)) return normalized;
  return 'CUSTOMER';
};

const redactSensitiveText = (value) => {
  const text = String(value ?? '').replace(/(temporary password:\s*)[^\s.<]+/gi, '$1[redacted]');
  return /temporary password/i.test(text) ? text.replace(/EMA-[A-Z0-9-]+/g, '[redacted]') : text;
};

const scrubSensitive = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => scrubSensitive(item));
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > 200) {
      return '[large data URL omitted from migration metadata]';
    }
    return redactSensitiveText(value);
  }
  if (typeof value !== 'object') return value;
  const sensitiveKeys = new Set(['password', 'temporarypassword', 'token', 'resettoken']);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveKeys.has(key.toLowerCase()))
      .map(([key, entry]) => [key, scrubSensitive(entry)])
  );
};

const buildGenericJsonInsert = (tableName, row) =>
  `INSERT INTO json_migration_payloads (table_name, id, payload, migrated_at) VALUES (${sqlString(tableName)}, ${sqlString(row.id || `${tableName}-${Date.now()}`)}, ${sqlJson(row)}, NOW()) ON CONFLICT (table_name, id) DO UPDATE SET payload = EXCLUDED.payload, migrated_at = NOW();`;

const buildSql = (db) => {
  const lines = [
    '-- E-Malla Rwanda JSON to Postgres migration seed',
    '-- Review this SQL before applying it to a database.',
    'BEGIN;',
    '',
    '-- Generic staging tables. Use these first, then map to normalized production tables.',
    `CREATE TABLE IF NOT EXISTS json_migration_payloads (
  table_name text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL,
  migrated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (table_name, id)
);`,
    ''
  ];

  for (const collection of COLLECTIONS) {
    const rows = Array.isArray(db[collection]) ? db[collection] : [];
    lines.push(`-- ${collection}: ${rows.length} records`);
    for (const row of rows) {
      lines.push(
        `INSERT INTO json_migration_payloads (table_name, id, payload, migrated_at) VALUES (${sqlString(collection)}, ${sqlString(row.id || `${collection}-${Date.now()}`)}, ${sqlJson(row)}, ${timestamp(row.updatedAt || row.createdAt || row.sentAt || row.time || row.timestamp)}) ON CONFLICT (table_name, id) DO UPDATE SET payload = EXCLUDED.payload, migrated_at = EXCLUDED.migrated_at;`
      );
    }
    lines.push('');
  }

  if (db.adminSettings) {
    lines.push('-- adminSettings: 1 record');
    lines.push(buildGenericJsonInsert('adminSettings', { id: 'adminSettings', ...db.adminSettings }));
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  return lines.join('\n');
};

const insert = (table, columns, values, conflictColumn = 'id') => {
  const updates = columns
    .filter((column) => column !== conflictColumn)
    .map((column) => `${column} = EXCLUDED.${column}`);

  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (${conflictColumn}) ${updates.length ? `DO UPDATE SET ${updates.join(', ')}` : 'DO NOTHING'};`;
};

const buildNormalizedSql = (db) => {
  const lines = [
    '-- E-Malla Rwanda normalized JSON to Postgres seed',
    '-- Apply backend/sql/migrations before this file.',
    '-- Review this SQL before applying it to a database.',
    'BEGIN;',
    ''
  ];

  const categorySeedMap = getCategorySeedMap();
  const runtimeCategories = Array.from(
    new Map(
      [...DEFAULT_CATEGORY_SEEDS, ...jsonArray(db.categories), ...jsonArray(db.products).map((product) => ({
        ...(categorySeedMap.get(String(product.category || '').trim()) || {}),
        id: String(product.category || '').trim(),
        name: categorySeedMap.get(String(product.category || '').trim())?.name || `Category ${String(product.category || '').trim()}`,
        slug: categorySeedMap.get(String(product.category || '').trim())?.slug || `category-${String(product.category || '').trim()}`,
        description: categorySeedMap.get(String(product.category || '').trim())?.description || '',
        iconKey: categorySeedMap.get(String(product.category || '').trim())?.iconKey || '',
        sortOrder: categorySeedMap.get(String(product.category || '').trim())?.sortOrder || 99
      }))].filter((category) => category.id).map((category) => [category.id, category])
    ).values()
  );
  const validUserIds = new Set(jsonArray(db.users).map((user) => user.id).filter(Boolean));
  const validProductIds = new Set(jsonArray(db.products).map((product) => product.id).filter(Boolean));
  const validOrderIds = new Set(jsonArray(db.orders).map((order) => order.id).filter(Boolean));

  runtimeCategories.forEach((category, index) => {
    lines.push(
      insert('categories', [
        'id',
        'name',
        'slug',
        'description',
        'icon_key',
        'sort_order',
        'is_active',
        'created_at',
        'updated_at'
      ], [
        sqlString(category.id || getId('category', index)),
        sqlString(category.name || `Category ${index + 1}`),
        sqlString(category.slug || `category-${category.id || index + 1}`),
        sqlString(category.description || ''),
        sqlString(category.iconKey || null),
        String(Number(category.sortOrder || 0)),
        bool(category.isActive !== false),
        timestamp(category.createdAt),
        timestamp(category.updatedAt || category.createdAt)
      ])
    );
  });

  lines.push('');

  jsonArray(db.users).forEach((user, index) => {
    lines.push(
      insert('users', [
        'id',
        'name',
        'username',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'avatar',
        'must_change_password',
        'last_login_at',
        'password_changed_at',
        'created_at',
        'updated_at',
        'metadata'
      ], [
        sqlString(user.id || getId('user', index)),
        sqlString(user.name || user.businessName || user.email || 'User'),
        sqlString(user.username || null),
        sqlString(user.email || `missing-${index}@example.local`),
        sqlString(user.password || ''),
        sqlString(normalizeRole(user.role)),
        sqlString(user.status || 'active'),
        sqlString(user.phone || ''),
        sqlString(user.avatar || ''),
        bool(Boolean(user.mustChangePassword)),
        nullableTimestamp(user.lastLoginAt),
        nullableTimestamp(user.passwordChangedAt),
        timestamp(user.createdAt),
        timestamp(user.updatedAt || user.createdAt),
        sqlJson(scrubSensitive(user))
      ])
    );
  });

  lines.push('');

  jsonArray(db.users).forEach((user) => {
    if (normalizeRole(user.role) === 'MERCHANT') {
      lines.push(
        insert('seller_profiles', [
          'user_id',
          'business_name',
          'primary_category_id',
          'support_email',
          'logo_url',
          'cover_url',
          'commission_rate',
          'total_sales',
          'gross_sales',
          'commission_amount',
          'documents_verified',
          'created_at',
          'updated_at',
          'metadata'
        ], [
          sqlString(user.id || ''),
          sqlString(user.name || user.businessName || 'Seller'),
          sqlString(user.primaryCategoryId || null),
          sqlString(user.storeSettings?.supportEmail || user.email || ''),
          sqlString(user.storeSettings?.storeLogoUrl || ''),
          sqlString(user.storeSettings?.coverUrl || ''),
          number(user.commissionRate),
          number(user.totalSales),
          number(user.grossSales),
          number(user.commissionAmount),
          bool(Boolean(user.documentsVerified)),
          timestamp(user.createdAt),
          timestamp(user.updatedAt || user.createdAt),
          sqlJson(scrubSensitive(user.storeSettings || {}))
        ], 'user_id')
      );
    }

    if (normalizeRole(user.role) === 'CUSTOMER') {
      lines.push(
        insert('buyer_profiles', [
          'user_id',
          'preferred_language',
          'last_order_at',
          'created_at',
          'updated_at',
          'metadata'
        ], [
          sqlString(user.id || ''),
          sqlString(user.buyerSettings?.preferredLanguage || 'en'),
          nullableTimestamp(user.lastOrderAt),
          timestamp(user.createdAt),
          timestamp(user.updatedAt || user.createdAt),
          sqlJson(scrubSensitive(user.buyerSettings || {}))
        ], 'user_id')
      );
    }

    if (normalizeRole(user.role) === 'DELIVERY') {
      lines.push(
        insert('rider_profiles', [
          'user_id',
          'vehicle_number',
          'mobile_money_number',
          'emergency_contact',
          'operational_status',
          'rating',
          'total_deliveries',
          'earnings',
          'created_at',
          'updated_at',
          'metadata'
        ], [
          sqlString(user.id || ''),
          sqlString(user.riderSettings?.vehicleNumber || ''),
          sqlString(user.riderSettings?.mobileMoneyNumber || ''),
          sqlString(user.riderSettings?.emergencyContact || ''),
          sqlString(user.riderSettings?.operationalStatus || 'offline'),
          number(user.riderSettings?.rating),
          String(Number(user.riderSettings?.totalDeliveries || 0)),
          number(user.riderSettings?.earnings),
          timestamp(user.createdAt),
          timestamp(user.updatedAt || user.createdAt),
          sqlJson(scrubSensitive(user.riderSettings || {}))
        ], 'user_id')
      );
    }
  });

  lines.push('');

  jsonArray(db.sessions).filter((session) => validUserIds.has(session.userId)).forEach((session, index) => {
    const sessionId = session.id || getId('session', index);
    lines.push(
      insert('sessions', [
        'id',
        'token_hash',
        'user_id',
        'created_at',
        'last_seen_at',
        'revoked_at',
        'user_agent',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'metadata'
      ], [
        sqlString(sessionId),
        sqlString(session.tokenHash || `legacy-session-${sessionId}`),
        sqlString(session.userId || ''),
        timestamp(session.createdAt),
        timestamp(session.lastSeenAt || session.createdAt),
        nullableTimestamp(session.revokedAt),
        sqlString(session.userAgent || ''),
        nullableTimestamp(session.reviewedAt),
        sqlString(session.reviewedBy || null),
        sqlString(session.reviewNotes || ''),
        sqlJson(scrubSensitive(session))
      ])
    );
  });

  lines.push('');

  Object.entries(db.tokens || {}).forEach(([token, value]) => {
    const tokenRecord = value && typeof value === 'object' ? value : { userId: value };
    if (!validUserIds.has(tokenRecord.userId)) return;
    lines.push(
      insert('auth_tokens', ['token', 'user_id', 'created_at', 'metadata'], [
        sqlString(token),
        sqlString(tokenRecord.userId || ''),
        timestamp(tokenRecord.createdAt),
        sqlJson(scrubSensitive(tokenRecord))
      ], 'token')
    );
  });

  jsonArray(db.passwordResetTokens).filter((resetToken) => validUserIds.has(resetToken.userId)).forEach((resetToken, index) => {
    lines.push(
      insert('password_reset_tokens', ['id', 'token', 'user_id', 'expires_at', 'created_at', 'metadata'], [
        sqlString(resetToken.id || getId('password-reset', index)),
        sqlString(resetToken.token || getId('reset-token', index)),
        sqlString(resetToken.userId || ''),
        timestamp(resetToken.expiresAt),
        timestamp(resetToken.createdAt),
        sqlJson(scrubSensitive(resetToken))
      ])
    );
  });

  lines.push('');

  jsonArray(db.products).forEach((product, index) => {
    lines.push(
      insert('products', [
        'id',
        'merchant_id',
        'name',
        'description',
        'specifications',
        'category',
        'price',
        'stock',
        'image',
        'images',
        'status',
        'featured',
        'rating',
        'reviews',
        'created_at',
        'updated_at',
        'metadata'
      ], [
        sqlString(product.id || getId('product', index)),
        sqlString(validUserIds.has(product.merchantId || product.sellerId) ? (product.merchantId || product.sellerId) : null),
        sqlString(product.name || 'Untitled product'),
        sqlString(product.description || ''),
        sqlString(product.specifications || ''),
        sqlString(product.category || 'general'),
        number(product.price),
        number(product.stock),
        sqlString(product.image || ''),
        sqlJson(product.images || (product.image ? [product.image] : [])),
        sqlString(product.status || 'pending'),
        bool(Boolean(product.featured)),
        number(product.rating),
        number(product.reviews ?? product.reviewsCount),
        timestamp(product.createdAt),
        timestamp(product.updatedAt || product.createdAt),
        sqlJson(scrubSensitive(product))
      ])
    );
  });

  lines.push('');

  jsonArray(db.reviews).filter((review) => validProductIds.has(review.productId)).forEach((review, index) => {
    lines.push(
      insert('product_reviews', ['id', 'product_id', 'user_id', 'rating', 'comment', 'created_at', 'metadata'], [
        sqlString(review.id || getId('review', index)),
        sqlString(review.productId || ''),
        sqlString(review.userId || null),
        number(review.rating || 5),
        sqlString(review.comment || ''),
        timestamp(review.createdAt),
        sqlJson(scrubSensitive(review))
      ])
    );
  });

  lines.push('');

  jsonArray(db.orders).forEach((order, index) => {
    lines.push(
      insert('orders', [
        'id',
        'order_number',
        'user_id',
        'merchant_id',
        'rider_id',
        'customer_name',
        'merchant_name',
        'rider_name',
        'status',
        'payment_status',
        'payment_method',
        'items',
        'shipping_address',
        'address',
        'phone',
        'subtotal',
        'delivery_fee',
        'total',
        'notes',
        'created_at',
        'updated_at',
        'metadata'
      ], [
        sqlString(order.id || getId('order', index)),
        sqlString(order.orderNumber || order.order_number || order.id || getId('order-number', index)),
        sqlString(validUserIds.has(order.userId || order.customerId) ? (order.userId || order.customerId) : null),
        sqlString(validUserIds.has(order.merchantId) ? order.merchantId : null),
        sqlString(validUserIds.has(order.riderId) ? order.riderId : null),
        sqlString(order.customerName || ''),
        sqlString(order.merchantName || ''),
        sqlString(order.riderName || null),
        sqlString(order.status || 'pending'),
        sqlString(order.paymentStatus || order.payment_status || 'pending'),
        sqlString(order.paymentMethod || order.payment_method || ''),
        sqlJson(order.items || []),
        sqlJson(order.shippingAddress || order.address || {}),
        sqlString(typeof order.address === 'string' ? order.address : ''),
        sqlString(order.phone || ''),
        number(order.subtotal ?? (Number(order.totalAmount || order.total || 0) - Number(order.deliveryFee || order.delivery_fee || 0))),
        number(order.deliveryFee || order.delivery_fee),
        number(order.total ?? order.totalAmount),
        sqlString(order.notes || ''),
        timestamp(order.createdAt),
        timestamp(order.updatedAt || order.createdAt),
        sqlJson(scrubSensitive(order))
      ])
    );

    jsonArray(order.items).forEach((item, itemIndex) => {
      lines.push(
        insert('order_items', [
          'id',
          'order_id',
          'product_id',
          'merchant_id',
          'product_name',
          'variant',
          'quantity',
          'price',
          'subtotal',
          'metadata'
        ], [
          sqlString(item.id || `${order.id || getId('order', index)}-item-${itemIndex + 1}`),
          sqlString(order.id || getId('order', index)),
          sqlString(validProductIds.has(item.productId) ? item.productId : null),
          sqlString(validUserIds.has(order.merchantId) ? order.merchantId : null),
          sqlString(item.productName || 'Order item'),
          sqlString(item.variant || null),
          String(Number(item.quantity || 0)),
          number(item.price),
          number(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)),
          sqlJson(scrubSensitive(item))
        ])
      );
    });

    if (order.riderId || order.riderName || ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'completed'].includes(order.status)) {
      lines.push(
        insert('deliveries', [
          'id',
          'order_id',
          'rider_id',
          'rider_name',
          'status',
          'pickup_notes',
          'delivery_notes',
          'assigned_at',
          'picked_up_at',
          'delivered_at',
          'failed_at',
          'metadata'
        ], [
          sqlString(order.delivery?.id || `DEL-${order.id || getId('order', index)}`),
          sqlString(order.id || getId('order', index)),
          sqlString(validUserIds.has(order.riderId) ? order.riderId : null),
          sqlString(order.riderName || null),
          sqlString(order.delivery?.status || order.status || 'assigned'),
          sqlString(order.delivery?.pickupNotes || ''),
          sqlString(order.delivery?.deliveryNotes || order.notes || ''),
          nullableTimestamp(order.delivery?.assignedAt || order.updatedAt || order.createdAt),
          nullableTimestamp(order.delivery?.pickedUpAt),
          nullableTimestamp(order.delivery?.deliveredAt || (['delivered', 'completed'].includes(order.status) ? (order.updatedAt || order.createdAt) : null)),
          nullableTimestamp(order.delivery?.failedAt),
          sqlJson(scrubSensitive(order.delivery || { orderId: order.id, status: order.status }))
        ], 'order_id')
      );
    }
  });

  lines.push('');

  jsonArray(db.sellerApplications).forEach((application, index) => {
    lines.push(
      insert('seller_applications', [
        'id',
        'business_name',
        'category',
        'email',
        'phone',
        'logo_url',
        'supporting_document_url',
        'status',
        'merchant_id',
        'temporary_username',
        'rejected_reason',
        'created_at',
        'updated_at',
        'approved_at',
        'approved_by',
        'rejected_at',
        'metadata'
      ], [
        sqlString(application.id || getId('seller-application', index)),
        sqlString(application.businessName || application.name || 'Seller application'),
        sqlString(application.category || 'General'),
        sqlString(application.email || ''),
        sqlString(application.phone || ''),
        sqlString(application.logoUrl || ''),
        sqlString(application.supportingDocumentUrl || ''),
        sqlString(application.status || 'pending'),
        sqlString(validUserIds.has(application.merchantId) ? application.merchantId : null),
        sqlString(application.temporaryUsername || null),
        sqlString(application.rejectedReason || ''),
        timestamp(application.createdAt),
        timestamp(application.updatedAt || application.createdAt),
        nullableTimestamp(application.approvedAt),
        sqlString(validUserIds.has(application.approvedBy) ? application.approvedBy : null),
        nullableTimestamp(application.rejectedAt),
        sqlJson(scrubSensitive(application))
      ])
    );
  });

  lines.push('');

  jsonArray(db.riderApplications).forEach((application, index) => {
    lines.push(
      insert('rider_applications', [
        'id',
        'name',
        'email',
        'phone',
        'vehicle_number',
        'status',
        'rider_id',
        'temporary_username',
        'rejected_reason',
        'created_at',
        'updated_at',
        'approved_at',
        'approved_by',
        'rejected_at',
        'metadata'
      ], [
        sqlString(application.id || getId('rider-application', index)),
        sqlString(application.name || 'Rider application'),
        sqlString(application.email || ''),
        sqlString(application.phone || ''),
        sqlString(application.vehicleNumber || application.plateNumber || ''),
        sqlString(application.status || 'pending'),
        sqlString(validUserIds.has(application.riderId) ? application.riderId : null),
        sqlString(application.temporaryUsername || null),
        sqlString(application.rejectedReason || ''),
        timestamp(application.createdAt),
        timestamp(application.updatedAt || application.createdAt),
        nullableTimestamp(application.approvedAt),
        sqlString(validUserIds.has(application.approvedBy) ? application.approvedBy : null),
        nullableTimestamp(application.rejectedAt),
        sqlJson(scrubSensitive(application))
      ])
    );
  });

  lines.push('');

  jsonArray(db.addresses).filter((address) => validUserIds.has(address.userId)).forEach((address, index) => {
    lines.push(
      insert('addresses', ['id', 'user_id', 'name', 'district', 'sector', 'street', 'is_default', 'created_at', 'updated_at'], [
        sqlString(address.id || getId('address', index)),
        sqlString(address.userId || null),
        sqlString(address.name || 'Address'),
        sqlString(address.district || ''),
        sqlString(address.sector || ''),
        sqlString(address.street || ''),
        bool(Boolean(address.isDefault || address.default)),
        timestamp(address.createdAt),
        timestamp(address.updatedAt || address.createdAt)
      ])
    );
  });

  jsonArray(db.transactions).forEach((transaction, index) => {
    lines.push(
      insert('transactions', ['id', 'user_id', 'amount', 'status', 'method', 'tx_ref', 'timestamp', 'metadata'], [
        sqlString(transaction.id || getId('transaction', index)),
        sqlString(validUserIds.has(transaction.userId) ? transaction.userId : null),
        number(transaction.amount),
        sqlString(transaction.status || 'pending'),
        sqlString(transaction.method || ''),
        sqlString(transaction.tx_ref || transaction.txRef || ''),
        timestamp(transaction.timestamp || transaction.createdAt),
        sqlJson(scrubSensitive(transaction))
      ])
    );
  });

  jsonArray(db.payments).forEach((payment, index) => {
    lines.push(
      insert('payments', ['id', 'order_id', 'user_id', 'amount', 'status', 'method', 'tx_ref', 'created_at', 'updated_at', 'metadata'], [
        sqlString(payment.id || getId('payment', index)),
        sqlString(validOrderIds.has(payment.orderId) ? payment.orderId : null),
        sqlString(validUserIds.has(payment.userId) ? payment.userId : null),
        number(payment.amount),
        sqlString(payment.status || 'pending'),
        sqlString(payment.method || ''),
        sqlString(payment.tx_ref || payment.txRef || ''),
        timestamp(payment.createdAt || payment.timestamp),
        timestamp(payment.updatedAt || payment.createdAt || payment.timestamp),
        sqlJson(scrubSensitive(payment))
      ])
    );
  });

  dedupeById([...jsonArray(db.inquiries), ...jsonArray(db.contactSubmissions), ...jsonArray(db.supportTickets)]).forEach((inquiry, index) => {
    lines.push(
      insert('inquiries', ['id', 'type', 'name', 'email', 'subject', 'company', 'message', 'status', 'assigned_to', 'internal_notes', 'replied_at', 'resolved_at', 'created_at', 'updated_at', 'metadata'], [
        sqlString(inquiry.id || getId('inquiry', index)),
        sqlString(inquiry.type || 'contact'),
        sqlString(inquiry.name || 'Visitor'),
        sqlString(inquiry.email || ''),
        sqlString(inquiry.subject || ''),
        sqlString(inquiry.company || ''),
        sqlString(inquiry.message || ''),
        sqlString(inquiry.status || 'new'),
        sqlString(inquiry.assignedTo || inquiry.assigned_to || inquiry.assignedAdminId || null),
        sqlString(inquiry.internalNotes || inquiry.internal_notes || ''),
        nullableTimestamp(inquiry.repliedAt),
        nullableTimestamp(inquiry.resolvedAt),
        timestamp(inquiry.createdAt),
        timestamp(inquiry.updatedAt || inquiry.createdAt),
        sqlJson(scrubSensitive(inquiry))
      ])
    );

    lines.push(
      insert('support_tickets', ['id', 'type', 'name', 'email', 'subject', 'company', 'message', 'status', 'assigned_to', 'internal_notes', 'replied_at', 'resolved_at', 'created_at', 'updated_at', 'metadata'], [
        sqlString(inquiry.id || getId('support-ticket', index)),
        sqlString(inquiry.type || 'contact'),
        sqlString(inquiry.name || 'Visitor'),
        sqlString(inquiry.email || ''),
        sqlString(inquiry.subject || ''),
        sqlString(inquiry.company || ''),
        sqlString(inquiry.message || ''),
        sqlString(inquiry.status || 'new'),
        sqlString(inquiry.assignedTo || inquiry.assigned_to || inquiry.assignedAdminId || null),
        sqlString(inquiry.internalNotes || inquiry.internal_notes || ''),
        nullableTimestamp(inquiry.repliedAt),
        nullableTimestamp(inquiry.resolvedAt),
        timestamp(inquiry.createdAt),
        timestamp(inquiry.updatedAt || inquiry.createdAt),
        sqlJson(scrubSensitive(inquiry))
      ])
    );
  });

  jsonArray(db.notifications).forEach((notification, index) => {
    lines.push(
      insert('notifications', ['id', 'user_id', 'role', 'title', 'message', 'type', 'read', 'created_at', 'metadata'], [
        sqlString(notification.id || getId('notification', index)),
        sqlString(validUserIds.has(notification.userId) ? notification.userId : null),
        sqlString(notification.role || ''),
        sqlString(notification.title || 'Notification'),
        sqlString(notification.message || ''),
        sqlString(notification.type || 'info'),
        bool(Boolean(notification.read)),
        timestamp(notification.createdAt),
        sqlJson(scrubSensitive(notification.metadata || notification))
      ])
    );
  });

  jsonArray(db.auditLogs).forEach((entry, index) => {
    lines.push(
      insert('audit_logs', ['id', 'event', 'actor', 'category', 'status', 'time', 'metadata'], [
        sqlString(entry.id || getId('audit', index)),
        sqlString(entry.event || 'Audit event'),
        sqlString(entry.actor || ''),
        sqlString(entry.category || 'system'),
        sqlString(entry.status || 'info'),
        timestamp(entry.time || entry.createdAt),
        sqlJson(scrubSensitive(entry.metadata || entry))
      ])
    );
  });

  jsonArray(db.emailLogs).forEach((entry, index) => {
    lines.push(
      insert('email_logs', ['id', 'to_addresses', 'subject', 'template', 'body', 'html', 'sent_at', 'status', 'provider', 'provider_message_id', 'error', 'note', 'metadata'], [
        sqlString(entry.id || getId('email', index)),
        sqlJson(Array.isArray(entry.to) ? entry.to : [entry.to].filter(Boolean)),
        sqlString(entry.subject || 'Email'),
        sqlString(entry.template || ''),
        sqlString(redactSensitiveText(entry.body || '')),
        sqlString(redactSensitiveText(entry.html || '')),
        timestamp(entry.sentAt || entry.createdAt),
        sqlString(entry.status || 'queued'),
        sqlString(entry.provider || 'log'),
        sqlString(entry.providerMessageId || null),
        sqlString(entry.error || null),
        sqlString(entry.note || null),
        sqlJson(scrubSensitive(entry.metadata || entry))
      ])
    );
  });

  jsonArray(db.wishlists).filter((wishlist) => validUserIds.has(wishlist.userId) && validProductIds.has(wishlist.productId)).forEach((wishlist, index) => {
    const productIds = wishlist.productId
      ? [wishlist.productId]
      : jsonArray(wishlist.productIds || wishlist.products);
    productIds.forEach((productId, productIndex) => {
      lines.push(
        insert('wishlists', ['id', 'user_id', 'product_id', 'created_at'], [
          sqlString(`${wishlist.id || wishlist.userId || 'wishlist'}-${productId}-${productIndex}`),
          sqlString(wishlist.userId || null),
          sqlString(productId),
          timestamp(wishlist.createdAt)
        ])
      );
    });
  });

  if (db.adminSettings) {
    lines.push(
      insert('admin_settings', ['id', 'preferences', 'category_commission_rates', 'updated_at', 'updated_by'], [
        sqlString('platform'),
        sqlJson(db.adminSettings.preferences || {}),
        sqlJson(db.adminSettings.categoryCommissionRates || {}),
        timestamp(db.adminSettings.updatedAt),
        sqlString(db.adminSettings.updatedBy || null)
      ])
    );
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  return lines.join('\n');
};

const printPlan = (db) => {
  console.log('E-Malla Rwanda JSON database migration plan');
  console.log(`Source: ${DB_PATH}`);
  console.log('');

  for (const collection of COLLECTIONS) {
    const rows = Array.isArray(db[collection]) ? db[collection] : [];
    console.log(`${collection}: ${rows.length}`);
  }

  console.log(`adminSettings: ${db.adminSettings ? 1 : 0}`);
  console.log('');
  console.log('Next: run npm run db:migrate:sql to generate a reviewable SQL seed file.');
};

const main = async () => {
  const mode = process.argv[2] || 'plan';
  const db = await readJsonDb();

  if (mode === 'plan') {
    printPlan(db);
    return;
  }

  if (mode === 'sql') {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const fileName = `json-to-postgres-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    await fs.writeFile(outputPath, buildSql(db), 'utf8');
    console.log(`Migration SQL generated: ${outputPath}`);
    console.log('Review this file before applying it to Postgres.');
    return;
  }

  if (mode === 'normalized-sql') {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const fileName = `json-to-postgres-normalized-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    await fs.writeFile(outputPath, buildNormalizedSql(db), 'utf8');
    console.log(`Normalized migration SQL generated: ${outputPath}`);
    console.log('Apply backend/sql/migrations before this file, and review before applying it to Postgres.');
    return;
  }

  console.error(`Unknown mode: ${mode}`);
  console.error('Use: plan, sql, or normalized-sql');
  process.exit(1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
