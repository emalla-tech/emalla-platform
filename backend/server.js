import http from 'http';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import zlib from 'zlib';
import { GoogleGenAI } from '@google/genai';
import {
  readDatabaseSnapshot as readDb,
  readProductRecords,
  readOrderRecords,
  readPublicInsightsRecords,
  readAdminStatsRecords,
  readAdminRiderRecords,
  readRiderDashboardRecords,
  readAuthUserRecordByIdentity,
  findLatestSellerApplicationRecordByEmail,
  findLatestRiderApplicationRecordByEmail,
  createAuthUserRecord,
  saveSellerApplicationRecord,
  saveRiderApplicationRecord,
  persistAuthLoginRecord,
  readAuthUserRecordByToken,
  touchAuthSessionByToken,
  deleteAuthTokenRecord,
  persistCheckoutBundleRecord,
  writeDatabaseSnapshot as writeDb,
  ensureDatabaseReady as ensureDb,
  getDatabaseServiceStatus as getDatabaseStatus
} from './databaseService.js';
import {
  loadEnv,
  getEmailConfig,
  getAppConfig,
  getStorageConfig,
  getRuntimeConfig,
  getAuthConfig,
  assertProductionEnv
} from './env.js';
import { createEmailHtml, deliverEmail, getEmailDeliveryStatus } from './emailService.js';
import { buildPlatformEmail } from './emailTemplates.js';
import {
  uploadAsset,
  deleteAssetByUrl,
  collectRemovedAssetUrls,
  getStorageHealth
} from './storageService.js';

const PORT = Number(process.env.PORT || getRuntimeConfig().port || 4000);
const DEFAULT_ALLOWED_ORIGINS = ['http://127.0.0.1:3000', 'http://localhost:3000'];
const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const PASSWORD_SCHEME = 'scrypt';
const MAX_JSON_BODY_BYTES = 20 * 1024 * 1024;
const ALLOWED_UPLOAD_FOLDERS = new Set([
  'e-malla/products',
  'e-malla/applications',
  'e-malla/branding',
  'e-malla/banners',
  'e-malla/profiles'
]);
const DEFAULT_SESSION_MAX_AGE_DAYS = 30;
const PRODUCTS_CACHE_TTL_MS = 60 * 1000;
const PUBLIC_INSIGHTS_CACHE_TTL_MS = 5 * 60 * 1000;
const AUTH_RATE_LIMIT_STATE = new Map();
const API_RATE_LIMIT_STATE = new Map();
const AUTH_RATE_LIMITS = {
  login: { max: 10, windowMs: 10 * 60 * 1000 },
  register: { max: 6, windowMs: 15 * 60 * 1000 },
  forgotPassword: { max: 6, windowMs: 15 * 60 * 1000 },
  resetPassword: { max: 6, windowMs: 15 * 60 * 1000 },
  changePassword: { max: 12, windowMs: 15 * 60 * 1000 }
};
const API_RATE_LIMITS = {
  general: { max: 300, windowMs: 5 * 60 * 1000 },
  mutation: { max: 120, windowMs: 5 * 60 * 1000 },
  upload: { max: 30, windowMs: 15 * 60 * 1000 }
};
const RESPONSE_COMPRESSION_THRESHOLD_BYTES = 1024;

const getSecurityHeaders = () => {
  const runtime = getRuntimeConfig();
  const app = getAppConfig();
  const isProd = runtime.isProduction;
  const connectSrc = [app.publicAppUrl, ...app.corsAllowedOrigins, 'https://api.resend.com', 'https://api.cloudinary.com']
    .filter(Boolean)
    .join(' ');

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'X-DNS-Prefetch-Control': 'off',
    'Strict-Transport-Security': isProd ? 'max-age=31536000; includeSubDomains; preload' : 'max-age=0',
    'Content-Security-Policy': [
      "default-src 'self' https: data: blob:",
      "img-src 'self' https: data: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "font-src 'self' https: data:",
      `connect-src 'self' ${connectSrc}`.trim(),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  };
};

const getAllowedOrigins = () =>
  new Set(
    (getAppConfig().corsAllowedOrigins || DEFAULT_ALLOWED_ORIGINS)
      .map((origin) => String(origin || '').trim())
      .filter(Boolean)
  );

const buildPublicHashRoute = (path = '') => {
  const base = String(getAppConfig().publicAppUrl || 'http://127.0.0.1:3000/#').replace(/\/$/, '');
  const normalizedPath = String(path || '').replace(/^#?\/?/, '');
  return normalizedPath ? `${base}/${normalizedPath}` : base;
};

const buildCustomerTrackingUrl = (order) => {
  if (!order?.id) {
    return buildPublicHashRoute('/buyer/orders');
  }

  const email = String(order.customerEmail || '').trim().toLowerCase();
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return buildPublicHashRoute(`/track-order/${order.id}${query}`);
};

const buildCorsHeaders = (origin, allowedOrigins) => {
  const headers = {
    ...BASE_CORS_HEADERS
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }

  return headers;
};

const getClientIp = (req) => {
  const runtime = getRuntimeConfig();
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)[0];
  if (runtime.trustProxy && forwarded) {
    return forwarded;
  }
  return req.socket?.remoteAddress || forwarded || 'unknown';
};

const applyRateLimit = ({ key, max, windowMs }) => {
  const now = Date.now();
  const recent = (AUTH_RATE_LIMIT_STATE.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  const limited = recent.length >= max;

  if (!limited) {
    recent.push(now);
    AUTH_RATE_LIMIT_STATE.set(key, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  AUTH_RATE_LIMIT_STATE.set(key, recent);
  const earliest = recent[0] || now;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - earliest)) / 1000));
  return { allowed: false, retryAfterSeconds };
};

const getRateLimitStore = (scope) => (scope === 'auth' ? AUTH_RATE_LIMIT_STATE : API_RATE_LIMIT_STATE);

const enforceAuthRateLimit = (req, res, action) => {
  const limit = AUTH_RATE_LIMITS[action];
  if (!limit) return true;

  const key = `${action}:${getClientIp(req)}`;
  const result = applyRateLimit({
    key,
    max: limit.max,
    windowMs: limit.windowMs
  });

  if (!result.allowed) {
    sendJson(
      res,
      429,
      {
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: result.retryAfterSeconds
      },
      {
        'Retry-After': String(result.retryAfterSeconds)
      }
    );
    return false;
  }

  return true;
};

const enforceApiRateLimit = (req, res, action = 'general') => {
  const limit = API_RATE_LIMITS[action] || API_RATE_LIMITS.general;
  const key = `${action}:${getClientIp(req)}`;
  const store = getRateLimitStore('api');
  const now = Date.now();
  const recent = (store.get(key) || []).filter((timestamp) => now - timestamp < limit.windowMs);
  const limited = recent.length >= limit.max;

  if (!limited) {
    recent.push(now);
    store.set(key, recent);
    return true;
  }

  store.set(key, recent);
  const earliest = recent[0] || now;
  const retryAfterSeconds = Math.max(1, Math.ceil((limit.windowMs - (now - earliest)) / 1000));
  sendJson(
    res,
    429,
    {
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds
    },
    {
      'Retry-After': String(retryAfterSeconds)
    }
  );
  return false;
};

const isHashedPassword = (value) => String(value || '').startsWith(`${PASSWORD_SCHEME}$`);

const hashPassword = (plainPassword) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(plainPassword || ''), salt, 64).toString('hex');
  return `${PASSWORD_SCHEME}$${salt}$${hash}`;
};

const verifyPassword = (plainPassword, storedPassword) => {
  const candidate = String(plainPassword || '');
  const stored = String(storedPassword || '');

  if (!isHashedPassword(stored)) {
    return stored === candidate;
  }

  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const hashHex = parts[2];
  if (!salt || !hashHex) return false;

  try {
    const derived = scryptSync(candidate, salt, 64);
    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
};

const createAuthToken = () => `em_tk_${randomBytes(32).toString('hex')}`;
const getSessionMaxAgeMs = () => {
  const configuredDays = Number(getAuthConfig().sessionMaxAgeDays || DEFAULT_SESSION_MAX_AGE_DAYS);
  const safeDays = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : DEFAULT_SESSION_MAX_AGE_DAYS;
  return safeDays * 24 * 60 * 60 * 1000;
};
const AI_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
let aiClient = null;
let aiClientKey = '';
let productsCache = {
  expiresAt: 0,
  items: null
};
let publicInsightsCache = {
  expiresAt: 0,
  payload: null
};

const getAiClient = () => {
  const apiKey = String(process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey) return null;

  if (!aiClient || aiClientKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    aiClientKey = apiKey;
  }

  return aiClient;
};

const enforceAiRateLimit = (req, res) => {
  const key = `ai:${getClientIp(req)}`;
  const result = applyRateLimit({
    key,
    max: AI_RATE_LIMIT.max,
    windowMs: AI_RATE_LIMIT.windowMs
  });

  if (!result.allowed) {
    sendJson(
      res,
      429,
      {
        error: 'Too many AI requests. Please try again later.',
        retryAfterSeconds: result.retryAfterSeconds
      },
      {
        'Retry-After': String(result.retryAfterSeconds)
      }
    );
    return false;
  }

  return true;
};

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
  const corsHeaders = res.__corsHeaders || BASE_CORS_HEADERS;
  const runtime = getRuntimeConfig();
  const body = JSON.stringify(payload);
  const acceptsGzip = String(res.req?.headers?.['accept-encoding'] || '').includes('gzip');
  const shouldCompress =
    acceptsGzip &&
    Buffer.byteLength(body, 'utf8') >= RESPONSE_COMPRESSION_THRESHOLD_BYTES &&
    !String(extraHeaders['Content-Encoding'] || '').toLowerCase().includes('gzip');

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': statusCode >= 400 ? 'no-store' : 'no-cache',
    ...getSecurityHeaders(),
    ...corsHeaders,
    ...extraHeaders
  };

  if (runtime.isProduction) {
    headers.Server = 'E-Malla';
  }

  if (shouldCompress) {
    const compressed = zlib.gzipSync(body);
    res.writeHead(statusCode, {
      ...headers,
      'Content-Encoding': 'gzip',
      'Content-Length': compressed.length
    });
    res.end(compressed);
    return;
  }

  res.writeHead(statusCode, {
    ...headers,
    'Content-Length': Buffer.byteLength(body, 'utf8')
  });
  res.end(body);
};

const readBody = async (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    let receivedBytes = 0;
    req.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_JSON_BODY_BYTES) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24);

const createTemporaryPassword = () => `EMA-${randomBytes(3).toString('hex').toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
const createResetToken = () => `rst_${randomBytes(24).toString('hex')}`;

const makeUniqueUsername = (db, base) => {
  const cleanBase = slugify(base) || 'seller';
  let candidate = cleanBase;
  let sequence = 1;

  while ((db.users || []).some((user) => String(user.username || '').toLowerCase() === candidate.toLowerCase())) {
    candidate = `${cleanBase}${sequence}`;
    sequence += 1;
  }

  return candidate;
};

const makeUniqueUsernameByLookup = async (base) => {
  const cleanBase = slugify(base) || 'user';
  let candidate = cleanBase;
  let sequence = 1;

  while (await readAuthUserRecordByIdentity(candidate)) {
    candidate = `${cleanBase}${sequence}`;
    sequence += 1;
  }

  return candidate;
};

const getAuthorizedUser = async (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const authRecord = await readAuthUserRecordByToken(token);
  if (!authRecord?.user) return null;

  const createdAt = authRecord.createdAt;
  if (createdAt && Date.now() - new Date(createdAt).getTime() > getSessionMaxAgeMs()) {
    await deleteAuthTokenRecord(token);
    return null;
  }

  await touchAuthSessionByToken(token, new Date().toISOString());

  return authRecord.user;
};

const requireUser = async (req, res) => {
  const user = await getAuthorizedUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }
  return user;
};

const getOptionalUser = async (req) => getAuthorizedUser(req);

const createSession = (db, user, token, req) => {
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + getSessionMaxAgeMs()).toISOString();
  db.tokens[token] = { userId: user.id, createdAt, expiresAt };
  db.sessions = db.sessions || [];
  db.sessions.unshift({
    id: `SES-${Date.now()}`,
    token,
    userId: user.id,
    createdAt,
    expiresAt,
    lastSeenAt: createdAt,
    userAgent: req.headers['user-agent'] || 'Unknown device'
  });
};

const requireRole = async (req, res, allowedRoles) => {
  const user = await requireUser(req, res);
  if (!user) return null;

  if (!allowedRoles.includes(user.role)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return null;
  }

  return user;
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EM-${year}-${rand}`;
};

const allowedTransitions = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['on_the_way'],
  on_the_way: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: ['refunded'],
  rejected: ['refunded'],
  refunded: [],
  pending: ['paid', 'cancelled'],
  processing: ['ready_for_pickup'],
  out_for_delivery: ['delivered']
};

const createNotification = (db, notification) => {
  const nextNotification = {
    id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notification
  };

  db.notifications.unshift(nextNotification);
  return nextNotification;
};

const createTransaction = (db, transaction) => {
  const nextTransaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...transaction
  };

  db.transactions.unshift(nextTransaction);
  return nextTransaction;
};

const createEmailLog = (db, email) => {
  db.emailLogs = db.emailLogs || [];
  const record = {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sentAt: new Date().toISOString(),
    status: 'queued',
    provider: 'log',
    providerMessageId: null,
    error: null,
    ...email
  };
  db.emailLogs.unshift(record);
  return record;
};

const sendPlatformEmail = async (db, email) => {
  const record = createEmailLog(db, email);

  if (!email?.to || (Array.isArray(email.to) && email.to.length === 0)) {
    record.status = 'skipped';
    record.provider = 'log';
    record.error = 'No recipient email provided.';
    return record;
  }

  try {
    const result = await deliverEmail(email);
    record.status = result.status;
    record.provider = result.provider;
    record.providerMessageId = result.providerMessageId || null;
    record.note = result.note || null;
  } catch (error) {
    record.status = 'failed';
    record.provider = getEmailConfig().provider;
    record.error = error instanceof Error ? error.message : 'Email delivery failed';
  }

  return record;
};

const sendPlatformEmailSafely = async (email) => {
  try {
    await deliverEmail(email);
  } catch {
  }
};

const createAuditLog = (db, entry) => {
  db.auditLogs = db.auditLogs || [];
  const record = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
    status: 'success',
    ...entry
  };
  db.auditLogs.unshift(record);
  return record;
};

const normalizeInquiryStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  return ['new', 'replied', 'resolved'].includes(normalized) ? normalized : 'new';
};

const formatTrend = (currentValue, previousValue) => {
  if (!previousValue) return currentValue > 0 ? 100 : 0;
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
};

const getDayLabel = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short'
  });

const buildOrderChart = (orders) => {
  const today = new Date();
  const series = [];

  for (let index = 6; index >= 0; index -= 1) {
    const bucketDate = new Date(today);
    bucketDate.setHours(0, 0, 0, 0);
    bucketDate.setDate(bucketDate.getDate() - index);

    const nextDate = new Date(bucketDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= bucketDate && createdAt < nextDate;
    });

    const revenue = dayOrders
      .filter((order) => order.paymentStatus === 'SUCCESS')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    series.push({
      name: getDayLabel(bucketDate),
      revenue,
      orders: dayOrders.length
    });
  }

  return series;
};

const buildAuditFeed = (db) => {
  if (Array.isArray(db.auditLogs) && db.auditLogs.length > 0) {
    return [...db.auditLogs]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 12);
  }

  const orderEvents = db.orders.map((order) => ({
    id: `order-${order.id}`,
    event: `Order ${order.orderNumber} status: ${String(order.status || 'pending').replaceAll('_', ' ')}`,
    actor: order.merchantName || 'Merchant',
    category: 'orders',
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      merchantId: order.merchantId,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount
    },
    status: order.status === 'cancelled' || order.status === 'rejected' ? 'error' : 'success',
    time: order.updatedAt || order.createdAt || new Date().toISOString()
  }));

  const productEvents = db.products.map((product) => ({
    id: `product-${product.id}`,
    event: `Product ${product.name} is ${String(product.status || 'pending')}`,
    actor: product.merchantName || 'Merchant',
    category: 'products',
    metadata: {
      productId: product.id,
      productName: product.name,
      merchantId: product.merchantId,
      merchantName: product.merchantName,
      status: product.status,
      price: product.price
    },
    status: product.status === 'approved' ? 'success' : 'info',
    time: product.updatedAt || product.createdAt || new Date().toISOString()
  }));

  const notificationEvents = db.notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    event: notification.title,
    actor: notification.role || 'SYSTEM',
    category: 'system',
    metadata: notification.metadata || {},
    status: notification.type === 'error' || notification.type === 'warning' ? 'error' : 'success',
    time: notification.createdAt || new Date().toISOString()
  }));

  const sessionCounts = (db.sessions || []).reduce((acc, entry) => {
    acc[entry.userId] = (acc[entry.userId] || 0) + 1;
    return acc;
  }, {});

  const sessionEvents = (db.sessions || [])
    .map((session) => {
      const owner = (db.users || []).find((entry) => entry.id === session.userId);
      const reasons = [];
      const lastSeenGap = Date.now() - new Date(session.lastSeenAt || session.createdAt || 0).getTime();

      if ((sessionCounts[session.userId] || 0) > 2) reasons.push('multiple_sessions');
      if (lastSeenGap > 1000 * 60 * 60 * 24 * 14) reasons.push('stale_session');
      if (owner?.status && owner.status !== 'active') reasons.push('inactive_account');

      if (!reasons.length) return null;

      return {
        id: `session-${session.id}`,
        event: `Suspicious session detected for ${owner?.name || 'Unknown User'}`,
        actor: owner?.email || owner?.name || 'Unknown user',
        category: 'security',
        metadata: {
          userId: session.userId,
          role: owner?.role || 'UNKNOWN',
          sessionId: session.id,
          userAgent: session.userAgent || 'Unknown device',
          reasons
        },
        status: 'error',
        time: session.lastSeenAt || session.createdAt || new Date().toISOString()
      };
    })
    .filter(Boolean);

  return [...orderEvents, ...productEvents, ...notificationEvents, ...sessionEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 12);
};

const buildRiderSnapshot = (db) =>
  (db.users || [])
    .filter((user) => user.role === 'DELIVERY')
    .map((rider) => {
      const deliveries = (db.orders || []).filter((order) => order.riderId === rider.id);
      const completedDeliveries = deliveries.filter((order) => ['delivered', 'completed'].includes(order.status)).length;
      const activeDeliveries = deliveries.filter((order) => ['assigned', 'picked_up', 'on_the_way', 'out_for_delivery'].includes(order.status)).length;
      const earnings = (db.transactions || [])
        .filter((transaction) => transaction.userId === rider.id && transaction.type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      return {
        ...sanitizeUser(rider),
        totalDeliveries: completedDeliveries,
        assignedDeliveries: deliveries.length,
        activeDeliveries,
        earnings,
        operationalStatus: rider.status === 'active' ? 'available' : rider.status
      };
    });

const getCategoryCommissionRate = (db, categoryId) => {
  const rawRate = db.adminSettings?.categoryCommissionRates?.[String(categoryId)];
  const normalized = Number(rawRate);
  return Number.isFinite(normalized) ? normalized : 10;
};

const getCategoryFallbackImage = (categoryId) => {
  const map = {
    '1': '/catalog/electronics.svg',
    '2': '/catalog/fashion.svg',
    '3': '/catalog/home.svg',
    '4': '/catalog/groceries.svg',
    '5': '/catalog/beauty.svg',
    '6': '/catalog/books.svg'
  };
  return map[String(categoryId || '1')] || map['1'];
};

const normalizeProductMedia = (product) => {
  const sanitizeMediaUrl = (value) => {
    const normalized = String(value || '').trim();
    return normalized.startsWith('data:') ? '' : normalized;
  };
  const images = Array.isArray(product.images)
    ? product.images.map((entry) => sanitizeMediaUrl(entry)).filter(Boolean)
    : [];
  const primaryImage = sanitizeMediaUrl(product.image);
  const safePrimary = primaryImage || images[0] || getCategoryFallbackImage(product.category);
  const safeImages = Array.from(new Set([safePrimary, ...images])).filter(Boolean);

  return {
    ...product,
    image: safePrimary,
    images: safeImages
  };
};

const invalidateProductsCache = () => {
  productsCache = {
    expiresAt: 0,
    items: null
  };
};

const invalidatePublicInsightsCache = () => {
  publicInsightsCache = {
    expiresAt: 0,
    payload: null
  };
};

const getCachedProducts = async () => {
  if (productsCache.items && productsCache.expiresAt > Date.now()) {
    return productsCache.items;
  }

  const products = (await readProductRecords()).map(normalizeProductMedia);
  productsCache = {
    items: products,
    expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS
  };
  return products;
};

const getCachedPublicInsights = async () => {
  if (publicInsightsCache.payload && publicInsightsCache.expiresAt > Date.now()) {
    return publicInsightsCache.payload;
  }

  const db = await readPublicInsightsRecords();
  const payload = buildPublicInsights(db);
  publicInsightsCache = {
    payload,
    expiresAt: Date.now() + PUBLIC_INSIGHTS_CACHE_TTL_MS
  };
  return payload;
};

const warmPublicReadCaches = async () => {
  try {
    await Promise.all([getCachedProducts(), getCachedPublicInsights()]);
  } catch (error) {
    console.warn(
      'Unable to pre-warm public caches:',
      error instanceof Error ? error.message : error
    );
  }
};

const getProductMediaUrls = (product) =>
  Array.from(
    new Set(
      [product?.image, ...(Array.isArray(product?.images) ? product.images : [])]
        .map((entry) => String(entry || '').trim())
        .filter((entry) => !entry.startsWith('data:'))
        .filter(Boolean)
    )
  );

const purgeAssetUrls = async (urls = []) => {
  for (const url of urls) {
    try {
      await deleteAssetByUrl(url);
    } catch (error) {
      console.warn(`Unable to delete storage asset ${url}:`, error instanceof Error ? error.message : error);
    }
  }
};

const buildMerchantCommissionSummary = (db, merchantId) => {
  const orders = (db.orders || []).filter((order) => order.merchantId === merchantId && order.paymentStatus === 'SUCCESS');
  const productMap = new Map((db.products || []).map((product) => [product.id, product]));

  let grossSales = 0;
  let commissionAmount = 0;
  let merchandiseValue = 0;

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const subtotal = Number(item.subtotal || item.price * item.quantity || 0);
      const product = productMap.get(item.productId);
      const categoryId = product?.category || '1';
      const rate = getCategoryCommissionRate(db, categoryId);

      merchandiseValue += subtotal;
      grossSales += subtotal;
      commissionAmount += subtotal * (rate / 100);
    });
  });

  const averageCommissionRate = merchandiseValue > 0
    ? Number(((commissionAmount / merchandiseValue) * 100).toFixed(2))
    : 0;
  const netRevenue = Math.max(0, Math.round(grossSales - commissionAmount));

  return {
    grossSales: Math.round(grossSales),
    commissionAmount: Math.round(commissionAmount),
    netRevenue,
    averageCommissionRate,
    successfulOrders: orders.length
  };
};

const CATEGORY_LABELS = {
  '1': 'Electronics',
  '2': 'Fashion',
  '3': 'Home & Living',
  '4': 'Groceries',
  '5': 'Beauty',
  '6': 'Books'
};

const buildAdminFinanceSummary = (db) => {
  const orders = db.orders || [];
  const successfulOrders = orders.filter((order) => order.paymentStatus === 'SUCCESS');
  const productMap = new Map((db.products || []).map((product) => [product.id, product]));
  const merchantPayouts = (db.transactions || []).filter((transaction) => transaction.type === 'payout');
  const categorySummaryMap = new Map();

  successfulOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const subtotal = Number(item.subtotal || item.price * item.quantity || 0);
      const product = productMap.get(item.productId);
      const categoryId = String(product?.category || '1');
      const commissionRate = getCategoryCommissionRate(db, categoryId);
      const commissionAmount = subtotal * (commissionRate / 100);
      const merchantNet = subtotal - commissionAmount;
      const existing = categorySummaryMap.get(categoryId) || {
        categoryId,
        categoryName: CATEGORY_LABELS[categoryId] || `Category ${categoryId}`,
        rate: commissionRate,
        grossSales: 0,
        commissionEarned: 0,
        merchantNet: 0,
        successfulOrders: 0
      };

      existing.grossSales += subtotal;
      existing.commissionEarned += commissionAmount;
      existing.merchantNet += merchantNet;
      existing.successfulOrders += 1;
      existing.rate = commissionRate;

      categorySummaryMap.set(categoryId, existing);
    });
  });

  const categoryCommission = Array.from(categorySummaryMap.values())
    .map((entry) => ({
      ...entry,
      grossSales: Math.round(entry.grossSales),
      commissionEarned: Math.round(entry.commissionEarned),
      merchantNet: Math.round(entry.merchantNet)
    }))
    .sort((left, right) => right.commissionEarned - left.commissionEarned);

  const onlineRevenue = successfulOrders
    .filter((order) => order.paymentMethod !== 'CASH_ON_DELIVERY')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const grossRevenue = successfulOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const deliveryFeesCollected = successfulOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0);
  const totalCommissionEarned = categoryCommission.reduce((sum, entry) => sum + entry.commissionEarned, 0);
  const merchantNetRevenue = categoryCommission.reduce((sum, entry) => sum + entry.merchantNet, 0);
  const pendingCodValue = orders
    .filter((order) => order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus !== 'SUCCESS')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const completedPayouts = merchantPayouts
    .filter((transaction) => transaction.status === 'success')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const pendingPayouts = merchantPayouts
    .filter((transaction) => transaction.status === 'pending')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return {
    overview: {
      grossRevenue: Math.round(grossRevenue),
      onlineRevenue: Math.round(onlineRevenue),
      pendingCodValue: Math.round(pendingCodValue),
      deliveryFeesCollected: Math.round(deliveryFeesCollected),
      totalCommissionEarned: Math.round(totalCommissionEarned),
      merchantNetRevenue: Math.round(merchantNetRevenue),
      platformNetRevenue: Math.round(totalCommissionEarned + deliveryFeesCollected),
      completedPayouts: Math.round(completedPayouts),
      pendingPayouts: Math.round(pendingPayouts),
      successfulOrders: successfulOrders.length
    },
    categoryCommission,
    paymentBreakdown: [
      { label: 'MoMo', method: 'MOMO' },
      { label: 'Airtel', method: 'AIRTEL' },
      { label: 'Cards', method: 'CARD' },
      { label: 'Bank Transfer', method: 'BANK_TRANSFER' },
      { label: 'Cash on Delivery', method: 'CASH_ON_DELIVERY' }
    ].map((entry) => ({
      ...entry,
      count: orders.filter((order) => order.paymentMethod === entry.method).length,
      value: orders
        .filter((order) => order.paymentMethod === entry.method)
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    })),
    payoutSummary: {
      totalRequests: merchantPayouts.length,
      completedCount: merchantPayouts.filter((transaction) => transaction.status === 'success').length,
      pendingCount: merchantPayouts.filter((transaction) => transaction.status === 'pending').length,
      rejectedCount: merchantPayouts.filter((transaction) => transaction.status === 'failed').length
    }
  };
};

const buildPublicInsights = (db) => {
  const users = db.users || [];
  const orders = db.orders || [];
  const merchants = users.filter((user) => user.role === 'MERCHANT');
  const activeMerchants = merchants.filter((user) => user.status === 'active').length;
  const riders = users.filter((user) => user.role === 'DELIVERY');
  const activeRiders = riders.filter((user) => user.status === 'active').length;
  const customers = users.filter((user) => user.role === 'CUSTOMER');
  const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status)).length;
  const successfulOrders = orders.filter((order) => order.paymentStatus === 'SUCCESS');
  const grossRevenue = successfulOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const averageDeliveryFee = successfulOrders.length > 0
    ? Math.round(successfulOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0) / successfulOrders.length)
    : 0;
  const districtsCovered = 30;
  const pendingSellerApplications = (db.sellerApplications || []).filter((application) => application.status === 'pending').length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthOrders = orders.filter((order) => new Date(order.createdAt) >= monthStart);
  const previousMonthOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= previousMonthStart && createdAt < monthStart;
  });
  const orderGrowth = formatTrend(currentMonthOrders.length, previousMonthOrders.length);

  return {
    metrics: {
      verifiedMerchants: activeMerchants,
      totalMerchants: merchants.length,
      activeRiders,
      customerAccounts: customers.length,
      successfulOrders: successfulOrders.length,
      completedOrders,
      grossRevenue: Math.round(grossRevenue),
      averageDeliveryFee,
      districtsCovered,
      pendingSellerApplications,
      orderGrowth
    }
  };
};

const buildSellerSnapshot = (db) => {
  const merchantOrders = db.orders.filter((order) => order.merchantId);
  return db.users
    .filter((user) => user.role === 'MERCHANT')
    .map((merchant) => {
      const orders = merchantOrders.filter((order) => order.merchantId === merchant.id);
      const commissionSummary = buildMerchantCommissionSummary(db, merchant.id);

      return {
        id: merchant.id,
        businessName: merchant.name,
        email: merchant.email,
        phone: merchant.phone || '',
        status: merchant.status || 'pending',
        commissionRate: commissionSummary.averageCommissionRate,
        totalSales: commissionSummary.netRevenue,
        grossSales: commissionSummary.grossSales,
        commissionAmount: commissionSummary.commissionAmount,
        balance: commissionSummary.netRevenue,
        joinedAt: merchant.createdAt,
        documentsVerified: merchant.status === 'active'
      };
    });
};

const buildCustomerSnapshot = (db) =>
  db.users
    .filter((user) => user.role === 'CUSTOMER')
    .map((customer) => {
      const orders = (db.orders || []).filter((order) => order.customerId === customer.id);
      const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status)).length;
      const lifetimeSpend = orders
        .filter((order) => order.paymentStatus === 'SUCCESS')
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
      const lastOrder = orders
        .slice()
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];

      return {
        ...sanitizeUser(customer),
        totalOrders: orders.length,
        completedOrders,
        lifetimeSpend,
        lastOrderAt: lastOrder?.updatedAt || lastOrder?.createdAt || null
      };
    });

const buildPayoutSnapshot = (db) => {
  const userMap = new Map((db.users || []).map((user) => [user.id, user]));

  return (db.transactions || [])
    .filter((transaction) => transaction.type === 'payout')
    .map((transaction) => {
      const merchant = userMap.get(transaction.userId);
      return {
        ...transaction,
        merchantName: merchant?.name || 'Merchant',
        merchantEmail: merchant?.email || '',
        payoutMethod: merchant?.storeSettings?.payoutMethod || 'momo',
        payoutDestination:
          merchant?.storeSettings?.payoutMethod === 'bank'
            ? [merchant?.storeSettings?.bankName, merchant?.storeSettings?.bankAccountNumber].filter(Boolean).join(' • ')
            : merchant?.storeSettings?.momoNumber || ''
      };
    })
    .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime());
};

const recalculateProductReviewMetrics = (db, productId) => {
  const productIndex = (db.products || []).findIndex((product) => product.id === productId);
  if (productIndex === -1) return;

  const reviews = (db.reviews || []).filter((review) => review.productId === productId);
  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0
    ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewsCount).toFixed(1))
    : 0;

  db.products[productIndex] = {
    ...db.products[productIndex],
    reviewsCount,
    rating
  };
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const requestOrigin = String(req.headers.origin || '').trim();
  const allowedOrigins = getAllowedOrigins();
  const originAllowed = !requestOrigin || allowedOrigins.has(requestOrigin);
  res.__corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins);
  res.req = req;

  if (!originAllowed) {
    sendJson(res, 403, { error: 'CORS origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const runtime = getRuntimeConfig();
  const protocol = runtime.trustProxy
    ? String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http'
    : 'http';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `127.0.0.1:${PORT}`)
    .split(',')[0]
    .trim();
  const url = new URL(req.url, `${protocol}://${host}`);
  const pathname = url.pathname;

  try {
    if (!enforceApiRateLimit(req, res, pathname === '/api/uploads/image' ? 'upload' : req.method === 'GET' ? 'general' : 'mutation')) {
      return;
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        environment: {
          nodeEnv: runtime.nodeEnv,
          trustProxy: runtime.trustProxy
        },
        database: getDatabaseStatus(),
        email: getEmailDeliveryStatus(),
        storage: getStorageHealth()
      });
      return;
    }

    if (pathname === '/api/ai/generate-description' && req.method === 'POST') {
      if (!enforceAiRateLimit(req, res)) return;
      const body = await readBody(req);
      const productName = String(body.productName || '').trim();
      const category = String(body.category || '').trim() || 'General';

      if (!productName) {
        sendJson(res, 400, { error: 'productName is required.' });
        return;
      }

      const client = getAiClient();
      if (!client) {
        sendJson(res, 503, { error: 'AI service is not configured.' });
        return;
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a compelling, SEO-friendly e-commerce description for a product named "${productName}" in the category "${category}". Keep it concise and professional. Highlight features that would appeal to Rwandan customers.`,
        config: {
          temperature: 0.7,
          topP: 0.9
        }
      });

      sendJson(res, 200, { text: String(response.text || '') });
      return;
    }

    if (pathname === '/api/ai/summarize-reviews' && req.method === 'POST') {
      if (!enforceAiRateLimit(req, res)) return;
      const body = await readBody(req);
      const reviews = Array.isArray(body.reviews)
        ? body.reviews.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [];

      if (reviews.length === 0) {
        sendJson(res, 400, { error: 'reviews array is required.' });
        return;
      }

      const client = getAiClient();
      if (!client) {
        sendJson(res, 503, { error: 'AI service is not configured.' });
        return;
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following customer reviews into a single paragraph highlighting the pros and cons: ${reviews.join(' | ')}`,
        config: {
          temperature: 0.5
        }
      });

      sendJson(res, 200, { text: String(response.text || '') });
      return;
    }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
      if (!enforceAuthRateLimit(req, res, 'login')) return;
      const body = await readBody(req);
      const identity = String(body.email || body.username || '').toLowerCase().trim();
      const user = await readAuthUserRecordByIdentity(identity);

      if (!user || !verifyPassword(String(body.password || ''), user.password)) {
        sendJson(res, 401, { error: 'Invalid credentials' });
        return;
      }

      const nextPasswordHash = !isHashedPassword(user.password)
        ? hashPassword(String(body.password || ''))
        : null;
      if (!isHashedPassword(user.password)) {
        user.password = nextPasswordHash;
      }

      const timestamp = new Date().toISOString();
      const token = createAuthToken();
      await persistAuthLoginRecord({
        userId: user.id,
        token,
        userAgent: req.headers['user-agent'] || 'Unknown device',
        timestamp,
        passwordHash: nextPasswordHash
      });

      const safeUser = sanitizeUser({
        ...user,
        password: nextPasswordHash || user.password,
        lastLoginAt: timestamp,
        updatedAt: timestamp
      });
      sendJson(res, 200, { token, user: safeUser });
      return;
      }

      if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
        if (!enforceAuthRateLimit(req, res, 'forgotPassword')) return;
        const body = await readBody(req);
        const db = await readDb();
        const email = String(body.email || '').toLowerCase().trim();
        const user = (db.users || []).find((entry) => String(entry.email || '').toLowerCase() === email);

        if (user) {
          db.passwordResetTokens = (db.passwordResetTokens || []).filter((entry) => entry.userId !== user.id);
          const resetToken = createResetToken();
          const resetUrl = `${String(getAppConfig().publicAppUrl || 'http://127.0.0.1:3000/#').replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
          db.passwordResetTokens.unshift({
            id: `PRT-${Date.now()}`,
            token: resetToken,
            userId: user.id,
            email: user.email,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
            usedAt: null
          });

          await sendPlatformEmail(db, {
            to: user.email,
            template: 'password_reset',
            ...buildPlatformEmail('password_reset', {
              name: user.name,
              email: user.email,
              role: user.role,
              resetUrl
            })
          });

          createAuditLog(db, {
            event: 'Password reset requested',
            actor: user.email,
            category: 'users',
            status: 'info',
            metadata: {
              userId: user.id,
              role: user.role
            }
          });

          await writeDb(db);
        }

        sendJson(res, 200, { success: true });
        return;
      }

      if (pathname === '/api/auth/change-password' && req.method === 'PUT') {
        if (!enforceAuthRateLimit(req, res, 'changePassword')) return;
        const user = await requireUser(req, res);
        if (!user) return;

        const body = await readBody(req);
        const currentPassword = String(body.currentPassword || '');
        const newPassword = String(body.newPassword || '');

        if (!verifyPassword(currentPassword, user.password)) {
          sendJson(res, 400, { error: 'Current password is incorrect.' });
          return;
        }

        if (newPassword.length < 8) {
          sendJson(res, 400, { error: 'New password must be at least 8 characters long.' });
          return;
        }

        const db = await readDb();
        const userIndex = (db.users || []).findIndex((entry) => entry.id === user.id);
        if (userIndex === -1) {
          sendJson(res, 404, { error: 'User account not found.' });
          return;
        }

        db.users[userIndex] = {
          ...db.users[userIndex],
          password: hashPassword(newPassword),
          mustChangePassword: false,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        createAuditLog(db, {
          event: 'Password changed',
          actor: user.name || user.email,
          category: 'users',
          status: 'success',
          metadata: {
            userId: user.id,
            role: user.role
          }
        });

        await writeDb(db);
        sendJson(res, 200, { user: sanitizeUser(db.users[userIndex]) });
        return;
      }

      if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
        if (!enforceAuthRateLimit(req, res, 'resetPassword')) return;
        const body = await readBody(req);
        const db = await readDb();
        const token = String(body.token || '').trim();
        const password = String(body.password || '');

        const resetRecord = (db.passwordResetTokens || []).find((entry) => entry.token === token);
        if (!resetRecord) {
          sendJson(res, 400, { error: 'Reset link is invalid or has expired.' });
          return;
        }

        if (resetRecord.usedAt || new Date(resetRecord.expiresAt).getTime() < Date.now()) {
          sendJson(res, 400, { error: 'Reset link is invalid or has expired.' });
          return;
        }

        if (password.length < 8) {
          sendJson(res, 400, { error: 'New password must be at least 8 characters long.' });
          return;
        }

        const userIndex = (db.users || []).findIndex((entry) => entry.id === resetRecord.userId);
        if (userIndex === -1) {
          sendJson(res, 404, { error: 'Account not found for this reset request.' });
          return;
        }

        db.users[userIndex] = {
          ...db.users[userIndex],
          password: hashPassword(password),
          mustChangePassword: false,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        resetRecord.usedAt = new Date().toISOString();

        createAuditLog(db, {
          event: 'Password reset completed',
          actor: db.users[userIndex].email,
          category: 'users',
          status: 'success',
          metadata: {
            userId: db.users[userIndex].id,
            role: db.users[userIndex].role
          }
        });

        await writeDb(db);
        sendJson(res, 200, { user: sanitizeUser(db.users[userIndex]) });
        return;
      }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      if (!enforceAuthRateLimit(req, res, 'register')) return;
      const body = await readBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      const existingUser = await readAuthUserRecordByIdentity(email);

      if (existingUser) {
        sendJson(res, 409, { error: 'Email already exists' });
        return;
      }

      const role = body.role || 'CUSTOMER';
      if (role !== 'CUSTOMER') {
        sendJson(res, 400, { error: 'Seller and rider accounts must be reviewed by admin before activation. Please use the application form for that role.' });
        return;
      }

      const password = String(body.password || '');
      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
        return;
      }

      const user = {
        id: role === 'MERCHANT' ? `MCH-${Date.now()}` : `USR-${Date.now()}`,
        name: body.name,
        username: await makeUniqueUsernameByLookup(body.name || email.split('@')[0] || role),
        email,
        password: hashPassword(password),
        role,
        status: 'active',
        createdAt: new Date().toISOString(),
        orderCount: 0,
        buyerSettings: {
          preferredLanguage: 'en'
        }
      };

      const savedUser = await createAuthUserRecord(user);
      const token = createAuthToken();
      const timestamp = new Date().toISOString();
      await persistAuthLoginRecord({
        userId: savedUser.id,
        token,
        userAgent: req.headers['user-agent'] || 'Unknown device',
        timestamp,
        passwordHash: null
      });

      void sendPlatformEmailSafely({
        to: savedUser.email,
        template: 'account_verification',
        ...buildPlatformEmail('account_verification', {
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          username: savedUser.username
        })
      });
      void sendPlatformEmailSafely({
        to: savedUser.email,
        template: 'welcome_email',
        ...buildPlatformEmail('welcome_email', {
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          username: savedUser.username
        })
      });

      sendJson(res, 201, {
        token,
        user: sanitizeUser({
          ...savedUser,
          lastLoginAt: timestamp,
          updatedAt: timestamp
        })
      });
      return;
    }

      if (pathname === '/api/seller/applications' && req.method === 'POST') {
        const body = await readBody(req);

        const application = {
          id: `APP-${Date.now()}`,
          businessName: String(body.businessName || '').trim(),
          category: String(body.category || '').trim() || 'General',
          email: String(body.email || '').toLowerCase().trim(),
          phone: String(body.phone || '').trim(),
          logoUrl: String(body.logoUrl || '').trim(),
          supportingDocumentUrl: String(body.supportingDocumentUrl || '').trim(),
          status: 'pending',
          createdByUserId: null,
          createdAt: new Date().toISOString()
        };

        if (!application.businessName || !application.phone || !application.email) {
          sendJson(res, 400, { error: 'Business name, email, and phone are required' });
          return;
        }

        const existingMerchant = await readAuthUserRecordByIdentity(application.email);
        if (existingMerchant?.role === 'MERCHANT' && existingMerchant?.status === 'active') {
          sendJson(res, 409, { error: 'A seller account already exists for this business email. Please log in to Seller Hub.' });
          return;
        }

        const latestApplication = await findLatestSellerApplicationRecordByEmail(application.email);
        if (latestApplication?.status === 'pending') {
          sendJson(res, 409, { error: 'A pending seller application already exists for this email.' });
          return;
        }

        const isResubmission = latestApplication?.status === 'rejected';
        const savedApplication = isResubmission
          ? {
              ...latestApplication,
              businessName: application.businessName,
              category: application.category,
              email: application.email,
              phone: application.phone,
              logoUrl: application.logoUrl,
              supportingDocumentUrl: application.supportingDocumentUrl,
              status: 'pending',
              resubmittedAt: new Date().toISOString(),
              rejectedAt: null,
              rejectedBy: null,
              rejectedReason: '',
              approvedAt: null,
              approvedBy: null,
              updatedAt: new Date().toISOString()
            }
          : application;

        invalidatePublicInsightsCache();

        void sendPlatformEmailSafely({
          to: application.email,
          subject: isResubmission ? 'Your E-Malla Seller Application Was Resubmitted' : 'E-Malla Seller Application Received',
          template: isResubmission ? 'seller_application_resubmitted' : 'seller_application_submitted',
          body: `Hello ${application.businessName}, your seller application was ${isResubmission ? 'resubmitted' : 'submitted'} successfully and is pending admin review.`,
          html: createEmailHtml({
            title: isResubmission ? 'Seller application resubmitted' : 'Seller application received',
            intro: isResubmission
              ? `Murakoze ${application.businessName}. Twakiriye update za seller application yawe kandi yasubijwe mu isuzuma rya admin team.`
              : `Murakoze ${application.businessName}. Twakiriye seller application yawe kandi iri mu isuzuma rya admin team.`,
            sections: [
              { label: 'Business', value: application.businessName },
              { label: 'Email', value: application.email },
              { label: 'Phone', value: application.phone || 'Not provided' },
              { label: 'Status', value: 'Pending review' },
              { label: 'Logo uploaded', value: application.logoUrl ? 'Yes' : 'No' },
              { label: 'Supporting file', value: application.supportingDocumentUrl ? 'Attached' : 'Not attached' }
            ],
            closing: 'Tuzakumenyesha vuba iyo application yawe yemerewe cyangwa niba hakenewe andi makuru.'
          })
        });

        await saveSellerApplicationRecord(savedApplication);
        sendJson(res, 201, { application: savedApplication, action: isResubmission ? 'resubmitted' : 'submitted' });
        return;
      }

      if (pathname === '/api/seller/applications/status-check' && req.method === 'POST') {
        const body = await readBody(req);
        const db = await readDb();
        const email = String(body.email || '').toLowerCase().trim();
        const phone = String(body.phone || '').trim();

        if (!email || !phone) {
          sendJson(res, 400, { error: 'Business email and phone number are required.' });
          return;
        }

        const application = (db.sellerApplications || [])
          .filter((entry) => String(entry.email || '').toLowerCase() === email && String(entry.phone || '').trim() === phone)
          .sort((left, right) => {
            const leftTime = new Date(left.resubmittedAt || left.updatedAt || left.createdAt || 0).getTime();
            const rightTime = new Date(right.resubmittedAt || right.updatedAt || right.createdAt || 0).getTime();
            return rightTime - leftTime;
          })[0];

        if (!application) {
          sendJson(res, 404, { error: 'No seller application was found for that email and phone number.' });
          return;
        }

        sendJson(res, 200, {
          application: {
            id: application.id,
            businessName: application.businessName,
            category: application.category,
            status: application.status,
            createdAt: application.createdAt,
            approvedAt: application.approvedAt || null,
            rejectedAt: application.rejectedAt || null,
            rejectedReason: application.rejectedReason || '',
            temporaryUsername: application.temporaryUsername || ''
          }
        });
        return;
      }

      if (pathname === '/api/rider/applications' && req.method === 'POST') {
        const body = await readBody(req);

        const application = {
          id: `RAPP-${Date.now()}`,
          name: String(body.name || '').trim(),
          email: String(body.email || '').toLowerCase().trim(),
          phone: String(body.phone || '').trim(),
          vehicleNumber: String(body.vehicleNumber || '').trim().toUpperCase(),
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        if (!application.name || !application.email || !application.phone || !application.vehicleNumber) {
          sendJson(res, 400, { error: 'Name, email, contact, and plate number are required.' });
          return;
        }

        const existingRider = await readAuthUserRecordByIdentity(application.email);

        if (existingRider?.role === 'DELIVERY' && existingRider?.status === 'active') {
          sendJson(res, 409, { error: 'A rider account already exists for this email. Please log in to Rider Hub.' });
          return;
        }

        const latestApplication = await findLatestRiderApplicationRecordByEmail(application.email);
        if (latestApplication?.status === 'pending') {
          sendJson(res, 409, { error: 'A pending rider application already exists for this email.' });
          return;
        }

        const isResubmission = latestApplication?.status === 'rejected';
        const savedApplication = isResubmission
          ? {
              ...latestApplication,
              name: application.name,
              email: application.email,
              phone: application.phone,
              vehicleNumber: application.vehicleNumber,
              status: 'pending',
              resubmittedAt: new Date().toISOString(),
              rejectedAt: null,
              rejectedBy: null,
              rejectedReason: '',
              approvedAt: null,
              approvedBy: null,
              updatedAt: new Date().toISOString()
            }
          : application;

        void sendPlatformEmailSafely({
          to: application.email,
          subject: isResubmission ? 'Your E-Malla Rider Application Was Resubmitted' : 'E-Malla Rider Application Received',
          template: isResubmission ? 'rider_application_resubmitted' : 'rider_application_submitted',
          body: `Hello ${application.name}, your rider application was ${isResubmission ? 'resubmitted' : 'submitted'} successfully and is pending admin review.`,
          html: createEmailHtml({
            title: isResubmission ? 'Rider application resubmitted' : 'Rider application received',
            intro: isResubmission
              ? `Murakoze ${application.name}. Twakiriye update za rider application yawe kandi yasubijwe mu isuzuma rya admin team.`
              : `Murakoze ${application.name}. Twakiriye rider application yawe kandi iri mu isuzuma rya admin team.`,
            sections: [
              { label: 'Applicant', value: application.name },
              { label: 'Email', value: application.email },
              { label: 'Contact', value: application.phone },
              { label: 'Plate Number', value: application.vehicleNumber },
              { label: 'Status', value: 'Pending review' }
            ],
            closing: 'Tuzakumenyesha vuba iyo rider application yawe yemerewe cyangwa niba hakenewe andi makuru.'
          })
        });

        await saveRiderApplicationRecord(savedApplication);
        sendJson(res, 201, { application: savedApplication, action: isResubmission ? 'resubmitted' : 'submitted' });
        return;
      }

      if (pathname === '/api/rider/applications/status-check' && req.method === 'POST') {
        const body = await readBody(req);
        const db = await readDb();
        const email = String(body.email || '').toLowerCase().trim();
        const phone = String(body.phone || '').trim();

        if (!email || !phone) {
          sendJson(res, 400, { error: 'Rider email and phone number are required.' });
          return;
        }

        const application = (db.riderApplications || [])
          .filter((entry) => String(entry.email || '').toLowerCase() === email && String(entry.phone || '').trim() === phone)
          .sort((left, right) => {
            const leftTime = new Date(left.resubmittedAt || left.updatedAt || left.createdAt || 0).getTime();
            const rightTime = new Date(right.resubmittedAt || right.updatedAt || right.createdAt || 0).getTime();
            return rightTime - leftTime;
          })[0];

        if (!application) {
          sendJson(res, 404, { error: 'No rider application was found for that email and phone number.' });
          return;
        }

        sendJson(res, 200, {
          application: {
            id: application.id,
            name: application.name,
            email: application.email,
            phone: application.phone,
            vehicleNumber: application.vehicleNumber,
            status: application.status,
            createdAt: application.createdAt,
            approvedAt: application.approvedAt || null,
            rejectedAt: application.rejectedAt || null,
            rejectedReason: application.rejectedReason || '',
            temporaryUsername: application.temporaryUsername || ''
          }
        });
        return;
      }

      if (pathname === '/api/auth/verify' && req.method === 'GET') {
        const user = await getAuthorizedUser(req);
        if (!user) {
          sendJson(res, 401, { error: 'Invalid token' });
          return;
        }
        sendJson(res, 200, { user: sanitizeUser(user) });
        return;
      }

      if (pathname === '/api/auth/sessions' && req.method === 'GET') {
        const user = await requireUser(req, res);
        if (!user) return;

        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const db = await readDb();
        const sessions = (db.sessions || [])
          .filter((entry) => entry.userId === user.id)
          .map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt,
            lastSeenAt: entry.lastSeenAt || entry.createdAt,
            userAgent: entry.userAgent || 'Unknown device',
            isCurrent: entry.token === token
          }))
          .sort((left, right) => new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime());

        sendJson(res, 200, { sessions });
        return;
      }

      if (pathname === '/api/auth/logout' && req.method === 'DELETE') {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
          sendJson(res, 200, { success: true });
          return;
        }

        const db = await readDb();
        delete db.tokens[token];
        db.sessions = (db.sessions || []).filter((entry) => entry.token !== token);
        await saveRiderApplicationRecord(savedApplication);
        sendJson(res, 200, { success: true });
        return;
      }

      if (pathname === '/api/auth/logout-all' && req.method === 'DELETE') {
        const user = await requireUser(req, res);
        if (!user) return;

        const db = await readDb();
        Object.keys(db.tokens || {}).forEach((token) => {
          const tokenRecord = db.tokens[token];
          const userId = typeof tokenRecord === 'string' ? tokenRecord : tokenRecord?.userId;
          if (userId === user.id) {
            delete db.tokens[token];
          }
        });
        db.sessions = (db.sessions || []).filter((entry) => entry.userId !== user.id);

        createAuditLog(db, {
          event: 'All sessions logged out',
          actor: user.name || user.email,
          category: 'users',
          status: 'success',
          metadata: {
            userId: user.id,
            role: user.role
          }
        });

        await writeDb(db);
        sendJson(res, 200, { success: true });
        return;
      }

      if (pathname === '/api/admin/sessions' && req.method === 'GET') {
        const user = await requireRole(req, res, ['ADMIN']);
        if (!user) return;

        const db = await readDb();
        const roleFilter = String(url.searchParams.get('role') || 'all').toUpperCase();
        const suspiciousOnly = url.searchParams.get('suspicious') === 'true';
        const sessionCounts = (db.sessions || []).reduce((acc, entry) => {
          acc[entry.userId] = (acc[entry.userId] || 0) + 1;
          return acc;
        }, {});

        let sessions = (db.sessions || []).map((session) => {
          const owner = (db.users || []).find((entry) => entry.id === session.userId);
          const reasons = [];
          const lastSeenGap = Date.now() - new Date(session.lastSeenAt || session.createdAt || 0).getTime();
          if ((sessionCounts[session.userId] || 0) > 2) reasons.push('multiple_sessions');
          if (lastSeenGap > 1000 * 60 * 60 * 24 * 14) reasons.push('stale_session');
          if (owner?.status && owner.status !== 'active') reasons.push('inactive_account');

          return {
            id: session.id,
            userId: session.userId,
            userName: owner?.name || 'Unknown User',
            email: owner?.email || '',
            role: owner?.role || 'UNKNOWN',
            createdAt: session.createdAt,
            lastSeenAt: session.lastSeenAt || session.createdAt,
            userAgent: session.userAgent || 'Unknown device',
            isSuspicious: reasons.length > 0,
            reasons
          };
        });

        if (roleFilter !== 'ALL') {
          sessions = sessions.filter((entry) => entry.role === roleFilter);
        }

        if (suspiciousOnly) {
          sessions = sessions.filter((entry) => entry.isSuspicious);
        }

        sessions = sessions.sort((left, right) => new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime());
        sendJson(res, 200, { sessions });
        return;
      }

      if (pathname.startsWith('/api/admin/sessions/') && req.method === 'DELETE') {
        const user = await requireRole(req, res, ['ADMIN']);
        if (!user) return;

        const sessionId = pathname.split('/')[4];
        const db = await readDb();
        const session = (db.sessions || []).find((entry) => entry.id === sessionId);

        if (!session) {
          sendJson(res, 404, { error: 'Session not found.' });
          return;
        }

        delete db.tokens[session.token];
        db.sessions = (db.sessions || []).filter((entry) => entry.id !== sessionId);

        createAuditLog(db, {
          event: 'Admin revoked session',
          actor: user.name || user.email,
          category: 'users',
          status: 'success',
          metadata: {
            sessionId,
            revokedUserId: session.userId
          }
        });

        await writeDb(db);
        sendJson(res, 200, { success: true });
        return;
      }

      if (pathname.startsWith('/api/admin/sessions/user/') && req.method === 'DELETE') {
        const user = await requireRole(req, res, ['ADMIN']);
        if (!user) return;

        const userId = pathname.split('/')[5];
        const db = await readDb();
        const targetUser = (db.users || []).find((entry) => entry.id === userId);

        if (!targetUser) {
          sendJson(res, 404, { error: 'User not found.' });
          return;
        }

        const targetTokens = new Set(
          Object.keys(db.tokens || {}).filter((token) => {
            const tokenRecord = db.tokens[token];
            const tokenUserId = typeof tokenRecord === 'string' ? tokenRecord : tokenRecord?.userId;
            return tokenUserId === userId;
          })
        );

        targetTokens.forEach((token) => {
          delete db.tokens[token];
        });
        db.sessions = (db.sessions || []).filter((entry) => entry.userId !== userId);

        createAuditLog(db, {
          event: 'Admin revoked all user sessions',
          actor: user.name || user.email,
          category: 'users',
          status: 'success',
          metadata: {
            revokedUserId: userId,
            revokedUserEmail: targetUser.email,
            revokedRole: targetUser.role
          }
        });

        await writeDb(db);
        sendJson(res, 200, { success: true });
        return;
      }

    if (pathname === '/api/public/insights' && req.method === 'GET') {
      sendJson(res, 200, await getCachedPublicInsights());
      return;
    }

    if (pathname === '/api/contact' && req.method === 'POST') {
      const body = await readBody(req);
      const db = await readDb();
      const submission = {
        id: `ct-${Date.now()}`,
        type: 'contact',
        name: String(body.name || '').trim(),
        email: String(body.email || '').trim(),
        subject: String(body.subject || '').trim(),
        company: '',
        message: String(body.message || '').trim(),
        status: 'new',
        assignedAdminId: null,
        assignedAdminName: null,
        internalNotes: '',
        repliedAt: null,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM',
        createdAt: new Date().toISOString()
      };

      if (!submission.name || !submission.email || !submission.subject || submission.message.length < 8) {
        sendJson(res, 400, { error: 'Please complete all required contact fields.' });
        return;
      }

      db.contactSubmissions.unshift(submission);
      await sendPlatformEmail(db, {
        to: submission.email,
        template: 'support_ticket_confirmation',
        replyTo: submission.email,
        ...buildPlatformEmail('support_ticket_confirmation', {
          name: submission.name,
          email: submission.email,
          subject: submission.subject
        })
      });
      await sendPlatformEmail(db, {
        to: getEmailConfig().adminAlertEmail,
        subject: `New Contact Inquiry: ${submission.subject}`,
        template: 'contact_admin_alert',
        body: `New contact inquiry from ${submission.name} (${submission.email}). Subject: ${submission.subject}.`,
        replyTo: submission.email,
        html: createEmailHtml({
          title: 'New contact inquiry',
          intro: 'A new contact inquiry has been submitted from the public website.',
          sections: [
            { label: 'Name', value: submission.name },
            { label: 'Email', value: submission.email },
            { label: 'Subject', value: submission.subject }
          ],
          closing: 'Review this inquiry from the admin inbox to continue follow-up.'
        })
      });
      createAuditLog(db, {
        event: `Contact inquiry received from ${submission.name}`,
        actor: submission.email,
        category: 'system',
        status: 'info',
        metadata: {
          inquiryId: submission.id,
          inquiryType: submission.type,
          subject: submission.subject
        }
      });

      await writeDb(db);
      sendJson(res, 201, { submission });
      return;
    }

    if (pathname === '/api/investor-inquiries' && req.method === 'POST') {
      const body = await readBody(req);
      const db = await readDb();
      const submission = {
        id: `ir-${Date.now()}`,
        type: 'investor',
        name: String(body.name || '').trim(),
        email: String(body.email || '').trim(),
        subject: 'Investor Inquiry',
        company: String(body.company || '').trim(),
        message: String(body.message || '').trim(),
        status: 'new',
        assignedAdminId: null,
        assignedAdminName: null,
        internalNotes: '',
        repliedAt: null,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM',
        createdAt: new Date().toISOString()
      };

      if (!submission.name || !submission.email || !submission.company || submission.message.length < 8) {
        sendJson(res, 400, { error: 'Please complete all required investor inquiry fields.' });
        return;
      }

      db.contactSubmissions.unshift(submission);
      await sendPlatformEmail(db, {
        to: submission.email,
        subject: 'E-Malla Investor Inquiry Received',
        template: 'investor_inquiry_received',
        body: `Hello ${submission.name}, we received your investor inquiry and our team will contact you soon.`,
        replyTo: submission.email,
        html: createEmailHtml({
          title: 'Investor inquiry received',
          intro: `Muraho ${submission.name}, twakiriye investor inquiry yawe kandi team yacu izaguhamagara cyangwa ikwandikire vuba.`,
          sections: [
            { label: 'Company', value: submission.company },
            { label: 'Email', value: submission.email },
            { label: 'Status', value: 'Received' }
          ],
          closing: 'Murakoze ku nyungu mwagaragaje muri E-Malla Rwanda.'
        })
      });
      await sendPlatformEmail(db, {
        to: getEmailConfig().adminAlertEmail,
        subject: `New Investor Inquiry: ${submission.company}`,
        template: 'investor_admin_alert',
        body: `New investor inquiry from ${submission.name} (${submission.email}) for ${submission.company}.`,
        replyTo: submission.email,
        html: createEmailHtml({
          title: 'New investor inquiry',
          intro: 'A new investor inquiry has been submitted from the public website.',
          sections: [
            { label: 'Name', value: submission.name },
            { label: 'Company', value: submission.company },
            { label: 'Email', value: submission.email }
          ],
          closing: 'Open the admin inquiries desk to review and assign this inquiry.'
        })
      });
      createAuditLog(db, {
        event: `Investor inquiry received from ${submission.name}`,
        actor: submission.email,
        category: 'system',
        status: 'info',
        metadata: {
          inquiryId: submission.id,
          inquiryType: submission.type,
          company: submission.company
        }
      });

      await writeDb(db);
      sendJson(res, 201, { submission });
      return;
    }

    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const orders = db.orders || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const activeUsers = (db.users || []).filter((entry) => entry.status === 'active').length;
      const sessionCounts = (db.sessions || []).reduce((acc, entry) => {
        acc[entry.userId] = (acc[entry.userId] || 0) + 1;
        return acc;
      }, {});
      const suspiciousSessions = (db.sessions || []).filter((session) => {
        const owner = (db.users || []).find((entry) => entry.id === session.userId);
        const lastSeenGap = Date.now() - new Date(session.lastSeenAt || session.createdAt || 0).getTime();
        return (sessionCounts[session.userId] || 0) > 2 || lastSeenGap > 1000 * 60 * 60 * 24 * 14 || (owner?.status && owner.status !== 'active');
      }).length;
      const pendingSellersFromUsers = (db.users || []).filter(
        (entry) => entry.role === 'MERCHANT' && entry.status !== 'active'
      ).length;
      const pendingSellerApplications = (db.sellerApplications || []).filter(
        (entry) => entry.status === 'pending'
      ).length;
      const pendingSellers = pendingSellersFromUsers + pendingSellerApplications;
      const pendingOrders = orders.filter((entry) =>
        [
          'pending',
          'pending_payment',
          'paid',
          'confirmed',
          'preparing',
          'processing',
          'ready_for_pickup',
          'assigned',
          'picked_up',
          'on_the_way',
          'out_for_delivery'
        ].includes(entry.status)
      ).length;

      const totalSales = orders
        .filter((entry) => entry.paymentStatus === 'SUCCESS')
        .reduce((sum, entry) => sum + Number(entry.totalAmount || 0), 0);

      const currentMonthOrders = orders.filter(
        (entry) => new Date(entry.createdAt) >= monthStart
      );
      const previousMonthOrders = orders.filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt >= previousMonthStart && createdAt < monthStart;
      });

      const currentMonthRevenue = currentMonthOrders
        .filter((entry) => entry.paymentStatus === 'SUCCESS')
        .reduce((sum, entry) => sum + Number(entry.totalAmount || 0), 0);
      const previousMonthRevenue = previousMonthOrders
        .filter((entry) => entry.paymentStatus === 'SUCCESS')
        .reduce((sum, entry) => sum + Number(entry.totalAmount || 0), 0);

      const revenueGrowth = formatTrend(currentMonthRevenue, previousMonthRevenue);
      const salesGrowth = formatTrend(currentMonthOrders.length, previousMonthOrders.length);
      const systemLoad = Number(
        Math.min(99, Math.max(10, ((pendingOrders / Math.max(orders.length, 1)) * 100).toFixed(1)))
      );

      sendJson(res, 200, {
        stats: {
          totalSales,
          totalOrders: orders.length,
          activeUsers,
          pendingOrders,
          pendingSellers,
          suspiciousSessions,
          revenueGrowth,
          salesGrowth,
          systemLoad
        },
        chart: buildOrderChart(orders),
        audit: buildAuditFeed(db)
      });
      return;
    }

    if (pathname === '/api/admin/sellers' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const requestedStatus = url.searchParams.get('status');
      let sellers = buildSellerSnapshot(db);

      if (requestedStatus && requestedStatus !== 'all') {
        sellers = sellers.filter((seller) => seller.status === requestedStatus);
      }

      sendJson(res, 200, { sellers });
      return;
    }

    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const requestedStatus = (url.searchParams.get('status') || 'all').toLowerCase();
      let customers = buildCustomerSnapshot(db);

      if (requestedStatus !== 'all') {
        customers = customers.filter((customer) => String(customer.status || '').toLowerCase() === requestedStatus);
      }

      sendJson(res, 200, { users: customers });
      return;
    }

    if (pathname === '/api/admin/payouts' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      sendJson(res, 200, { payouts: buildPayoutSnapshot(db) });
      return;
    }

    if (pathname.startsWith('/api/admin/payouts/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const payoutId = pathname.split('/')[4];
      const body = await readBody(req);
      const nextStatus = String(body.status || '').trim().toLowerCase();
      const db = await readDb();
      const transactionIndex = (db.transactions || []).findIndex((transaction) => transaction.id === payoutId && transaction.type === 'payout');

      if (transactionIndex === -1) {
        sendJson(res, 404, { error: 'Payout request not found.' });
        return;
      }

      if (!['success', 'failed'].includes(nextStatus)) {
        sendJson(res, 400, { error: 'Unsupported payout status.' });
        return;
      }

      const currentTransaction = db.transactions[transactionIndex];
      if (currentTransaction.status !== 'pending') {
        sendJson(res, 400, { error: 'Only pending payouts can be reviewed.' });
        return;
      }

      db.transactions[transactionIndex] = {
        ...currentTransaction,
        status: nextStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id
      };

      createNotification(db, {
        userId: currentTransaction.userId,
        role: 'MERCHANT',
        title: nextStatus === 'success' ? 'Payout Approved' : 'Payout Rejected',
        message:
          nextStatus === 'success'
            ? `Your payout request for RWF ${Number(currentTransaction.amount || 0).toLocaleString()} has been approved.`
            : `Your payout request for RWF ${Number(currentTransaction.amount || 0).toLocaleString()} was rejected. Please review your payout settings.`,
        type: nextStatus === 'success' ? 'success' : 'warning',
        metadata: { payoutId: currentTransaction.id }
      });
      await sendPlatformEmail(db, {
        to: merchant?.email,
        subject: nextStatus === 'success' ? 'Your E-Malla Payout Was Approved' : 'Your E-Malla Payout Was Rejected',
        template: nextStatus === 'success' ? 'payout_approved' : 'payout_rejected',
        body:
          nextStatus === 'success'
            ? `Your payout request for RWF ${Number(currentTransaction.amount || 0).toLocaleString()} has been approved.`
            : `Your payout request for RWF ${Number(currentTransaction.amount || 0).toLocaleString()} was rejected. Please review your payout settings.`,
        html: createEmailHtml({
          title: nextStatus === 'success' ? 'Payout approved' : 'Payout rejected',
          intro:
            nextStatus === 'success'
              ? 'Your payout request has been approved by the finance team.'
              : 'Your payout request was rejected by the finance team and may need correction before resubmission.',
          sections: [
            { label: 'Merchant', value: merchant?.name || 'Seller' },
            { label: 'Amount', value: `RWF ${Number(currentTransaction.amount || 0).toLocaleString()}` },
            { label: 'Reference', value: currentTransaction.tx_ref || currentTransaction.id },
            { label: 'Status', value: nextStatus === 'success' ? 'Approved' : 'Rejected' }
          ],
          closing:
            nextStatus === 'success'
              ? 'The payout will continue through the configured payout channel.'
              : 'Please update payout settings if needed, then submit a fresh payout request.'
        })
      });

      createAuditLog(db, {
        event: `Payout ${nextStatus === 'success' ? 'approved' : 'rejected'}: ${currentTransaction.id}`,
        actor: user.name || user.email,
        category: 'payments',
        status: nextStatus === 'success' ? 'success' : 'error',
        metadata: {
          payoutId: currentTransaction.id,
          merchantId: currentTransaction.userId,
          amount: currentTransaction.amount,
          nextStatus
        }
      });

      await writeDb(db);
      sendJson(res, 200, { payout: buildPayoutSnapshot(db).find((entry) => entry.id === payoutId) });
      return;
    }

    if (pathname === '/api/admin/inquiries' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const requestedType = (url.searchParams.get('type') || 'all').toLowerCase();
      let inquiries = db.contactSubmissions || [];

      if (requestedType !== 'all') {
        inquiries = inquiries.filter((entry) => String(entry.type || '').toLowerCase() === requestedType);
      }

      inquiries = inquiries
        .slice()
        .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());

      sendJson(res, 200, { inquiries });
      return;
    }

    if (pathname === '/api/admin/email-logs' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      let logs = (db.emailLogs || []).slice();
      const status = String(url.searchParams.get('status') || 'all').toLowerCase();

      if (status !== 'all') {
        logs = logs.filter((entry) => String(entry.status || '').toLowerCase() === status);
      }

      logs.sort((left, right) => new Date(right.sentAt || 0).getTime() - new Date(left.sentAt || 0).getTime());
      sendJson(res, 200, { emailLogs: logs });
      return;
    }

    if (pathname === '/api/admin/email-status' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      sendJson(res, 200, { email: getEmailDeliveryStatus() });
      return;
    }

    if (pathname.startsWith('/api/admin/inquiries/') && req.method === 'PUT' && !pathname.endsWith('/status')) {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const inquiryId = pathname.split('/')[4];
      const body = await readBody(req);
      const db = await readDb();
      const index = (db.contactSubmissions || []).findIndex((entry) => entry.id === inquiryId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Inquiry not found' });
        return;
      }

      const currentInquiry = db.contactSubmissions[index];
      const nextStatus = body.status !== undefined ? normalizeInquiryStatus(body.status) : currentInquiry.status;
      const shouldAssignToSelf = Boolean(body.assignToSelf);
      const nextNotes = body.internalNotes !== undefined ? String(body.internalNotes || '').trim() : currentInquiry.internalNotes || '';
      const now = new Date().toISOString();

      const updatedInquiry = {
        ...currentInquiry,
        status: nextStatus,
        assignedAdminId: shouldAssignToSelf ? user.id : currentInquiry.assignedAdminId || null,
        assignedAdminName: shouldAssignToSelf ? (user.name || user.email) : currentInquiry.assignedAdminName || null,
        internalNotes: nextNotes,
        repliedAt: nextStatus === 'replied' ? currentInquiry.repliedAt || now : nextStatus === 'new' ? null : currentInquiry.repliedAt || null,
        updatedAt: now,
        updatedBy: user.id
      };

      db.contactSubmissions[index] = updatedInquiry;

      if (shouldAssignToSelf && currentInquiry.assignedAdminId !== user.id) {
        createAuditLog(db, {
          event: `Inquiry assigned: ${updatedInquiry.name}`,
          actor: user.name || user.email,
          category: 'system',
          status: 'info',
          metadata: {
            inquiryId: updatedInquiry.id,
            inquiryType: updatedInquiry.type,
            assignedAdminId: user.id,
            assignedAdminName: user.name || user.email
          }
        });
      }

      if (body.internalNotes !== undefined && nextNotes !== (currentInquiry.internalNotes || '')) {
        createAuditLog(db, {
          event: `Inquiry notes updated: ${updatedInquiry.name}`,
          actor: user.name || user.email,
          category: 'system',
          status: 'info',
          metadata: {
            inquiryId: updatedInquiry.id,
            inquiryType: updatedInquiry.type,
            notesLength: nextNotes.length
          }
        });
      }

      if (nextStatus !== currentInquiry.status) {
        createAuditLog(db, {
          event: `Inquiry status updated to ${nextStatus}: ${updatedInquiry.name}`,
          actor: user.name || user.email,
          category: 'system',
          status: nextStatus === 'resolved' ? 'success' : 'info',
          metadata: {
            inquiryId: updatedInquiry.id,
            inquiryType: updatedInquiry.type,
            email: updatedInquiry.email,
            previousStatus: currentInquiry.status,
            status: nextStatus,
            repliedAt: updatedInquiry.repliedAt
          }
        });
        if (nextStatus === 'replied' || nextStatus === 'resolved') {
          await sendPlatformEmail(db, {
            to: updatedInquiry.email,
            subject: nextStatus === 'resolved' ? 'Your E-Malla Inquiry Was Resolved' : 'Update on Your E-Malla Inquiry',
            template: nextStatus === 'resolved' ? 'inquiry_resolved' : 'inquiry_replied',
            body:
              nextStatus === 'resolved'
                ? `Hello ${updatedInquiry.name}, your inquiry has been resolved by the E-Malla team.`
                : `Hello ${updatedInquiry.name}, there is an update on your inquiry from the E-Malla team.`,
            html: createEmailHtml({
              title: nextStatus === 'resolved' ? 'Inquiry resolved' : 'Inquiry updated',
              intro:
                nextStatus === 'resolved'
                  ? `Muraho ${updatedInquiry.name}, ikibazo cyangwa request mwaduhaye cyamaze gukemurwa.`
                  : `Muraho ${updatedInquiry.name}, support team yacu yashyizeho update kuri inquiry yanyu.`,
              sections: [
                { label: 'Inquiry Type', value: updatedInquiry.type },
                { label: 'Email', value: updatedInquiry.email },
                { label: 'Status', value: nextStatus },
                { label: 'Assigned Admin', value: updatedInquiry.assignedAdminName || 'E-Malla Team' }
              ],
              closing: nextNotes || 'Murakoze gukoresha E-Malla Rwanda.'
            })
          });
        }
      }

      await writeDb(db);
      sendJson(res, 200, { inquiry: updatedInquiry });
      return;
    }

    if (pathname.startsWith('/api/admin/inquiries/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const inquiryId = pathname.split('/')[4];
      const body = await readBody(req);
      const db = await readDb();
      const index = (db.contactSubmissions || []).findIndex((entry) => entry.id === inquiryId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Inquiry not found' });
        return;
      }

      const nextStatus = normalizeInquiryStatus(body.status);
      if (!['new', 'replied', 'resolved'].includes(nextStatus)) {
        sendJson(res, 400, { error: 'Unsupported inquiry status' });
        return;
      }

      db.contactSubmissions[index] = {
        ...db.contactSubmissions[index],
        status: nextStatus,
        repliedAt:
          nextStatus === 'replied'
            ? db.contactSubmissions[index].repliedAt || new Date().toISOString()
            : nextStatus === 'new'
              ? null
              : db.contactSubmissions[index].repliedAt || null,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id
      };

      createAuditLog(db, {
        event: `Inquiry status updated to ${nextStatus}: ${db.contactSubmissions[index].name}`,
        actor: user.name || user.email,
        category: 'system',
        status: nextStatus === 'resolved' ? 'success' : 'info',
        metadata: {
          inquiryId: db.contactSubmissions[index].id,
          inquiryType: db.contactSubmissions[index].type,
          email: db.contactSubmissions[index].email,
          status: nextStatus
        }
      });

      await writeDb(db);
      sendJson(res, 200, { inquiry: db.contactSubmissions[index] });
      return;
    }

    if (pathname === '/api/admin/settings' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      sendJson(res, 200, {
        settings: db.adminSettings || {}
      });
      return;
    }

    if (pathname === '/api/admin/settings' && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const nextPreferences = {
        ...(db.adminSettings?.preferences || {}),
        ...(body.preferences || {})
      };
      const nextCommissionRates = {
        ...(db.adminSettings?.categoryCommissionRates || {}),
        ...(body.categoryCommissionRates || {})
      };

      db.adminSettings = {
        preferences: nextPreferences,
        categoryCommissionRates: nextCommissionRates,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id
      };

      createAuditLog(db, {
        event: 'Admin settings updated',
        actor: user.name || user.email,
        category: 'system',
        status: 'success',
        metadata: {
          updatedSections: [
            body.preferences ? 'preferences' : null,
            body.categoryCommissionRates ? 'category commissions' : null
          ].filter(Boolean)
        }
      });

      await writeDb(db);
      sendJson(res, 200, { settings: db.adminSettings });
      return;
    }

    if (pathname === '/api/admin/finance' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      sendJson(res, 200, buildAdminFinanceSummary(db));
      return;
    }

    if (pathname === '/api/admin/seller-applications' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const requestedStatus = (url.searchParams.get('status') || 'all').toLowerCase();
      let applications = db.sellerApplications || [];

      if (requestedStatus !== 'all') {
        applications = applications.filter((entry) => String(entry.status || '').toLowerCase() === requestedStatus);
      }

      applications = applications.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      sendJson(res, 200, { applications });
      return;
    }

      if (
        pathname.startsWith('/api/admin/seller-applications/') &&
        pathname.endsWith('/approve') &&
        req.method === 'PUT'
      ) {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const applicationId = pathname.split('/')[4];
      const db = await readDb();
      const index = (db.sellerApplications || []).findIndex((entry) => entry.id === applicationId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Seller application not found' });
        return;
      }

      const application = db.sellerApplications[index];
      if (application.status === 'approved') {
        sendJson(res, 409, { error: 'Application is already approved' });
        return;
      }

      const temporaryPassword = createTemporaryPassword();
      const usernameBase = `${application.businessName || 'seller'}`.split(' ')[0] || application.email.split('@')[0];
      const username = makeUniqueUsername(db, usernameBase);

      const existingUserIndex = (db.users || []).findIndex(
        (entry) => String(entry.email || '').toLowerCase() === String(application.email || '').toLowerCase()
      );

      let merchantUser;
        if (existingUserIndex >= 0) {
          const existing = db.users[existingUserIndex];
              merchantUser = {
                ...existing,
                name: application.businessName,
                username: existing.username || username,
                password: hashPassword(temporaryPassword),
                mustChangePassword: true,
                role: 'MERCHANT',
                status: 'active',
              phone: application.phone,
            storeSettings: {
              ...(existing.storeSettings || {}),
              supportEmail: application.email,
              storeLogoUrl: application.logoUrl || existing.storeSettings?.storeLogoUrl || ''
            },
            updatedAt: new Date().toISOString()
          };
          db.users[existingUserIndex] = merchantUser;
        } else {
            merchantUser = {
              id: `MCH-${Date.now()}`,
              name: application.businessName,
              username,
              email: application.email,
              password: hashPassword(temporaryPassword),
              mustChangePassword: true,
              role: 'MERCHANT',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orderCount: 0,
            phone: application.phone,
            storeSettings: {
              supportEmail: application.email,
              storeLogoUrl: application.logoUrl || ''
            }
          };
          db.users.unshift(merchantUser);
        }

      db.sellerApplications[index] = {
        ...application,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user.id,
        merchantId: merchantUser.id,
        temporaryUsername: merchantUser.username
      };
      invalidatePublicInsightsCache();

      createNotification(db, {
        userId: merchantUser.id,
        role: 'MERCHANT',
        title: 'Seller Application Approved',
        message: 'Your seller account is approved. Check your email for login credentials.',
        type: 'success'
      });

      await sendPlatformEmail(db, {
        to: application.email,
        subject: 'Welcome to E-Malla Seller Hub',
        template: 'seller_application_approved',
        body: `Congratulations ${application.businessName}. Your seller application has been approved. Temporary username: ${merchantUser.username}. Temporary password: ${temporaryPassword}.`,
        html: createEmailHtml({
          title: 'Seller application approved',
          intro: `Congratulations ${application.businessName}. Seller account yawe yemerewe kandi ushobora guhita winjira muri Seller Hub.`,
          sections: [
            { label: 'Username', value: merchantUser.username },
            { label: 'Temporary Password', value: temporaryPassword },
            { label: 'Business Email', value: application.email },
            { label: 'Status', value: 'Approved' }
          ],
          closing: 'Turagusaba guhita winjira kandi ugahindura password ya temporary mu ntambwe ikurikiraho.'
        })
      });
      createAuditLog(db, {
        event: `Seller application approved: ${application.businessName}`,
        actor: user.name || user.email,
        category: 'sellers',
        status: 'success',
        metadata: {
            applicationId: application.id,
            merchantId: merchantUser.id,
            sellerEmail: application.email,
            sellerPhone: application.phone,
            temporaryUsername: merchantUser.username,
            logoUrl: application.logoUrl,
            supportingDocumentUrl: application.supportingDocumentUrl
          }
        });

      await writeDb(db);
        sendJson(res, 200, {
          application: db.sellerApplications[index],
          merchant: sanitizeUser(merchantUser)
        });
        return;
      }

      if (
        pathname.startsWith('/api/admin/seller-applications/') &&
        pathname.endsWith('/reject') &&
        req.method === 'PUT'
      ) {
        const user = await requireRole(req, res, ['ADMIN']);
        if (!user) return;

        const applicationId = pathname.split('/')[4];
        const body = await readBody(req);
        const db = await readDb();
        const index = (db.sellerApplications || []).findIndex((entry) => entry.id === applicationId);

        if (index === -1) {
          sendJson(res, 404, { error: 'Seller application not found' });
          return;
        }

        const application = db.sellerApplications[index];
        if (application.status === 'approved') {
          sendJson(res, 409, { error: 'Approved applications cannot be rejected.' });
          return;
        }

        const reason = String(body.reason || '').trim();
        if (!reason) {
          sendJson(res, 400, { error: 'Rejection reason is required.' });
          return;
        }

        db.sellerApplications[index] = {
          ...application,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: user.id,
          rejectedReason: reason
        };
        invalidatePublicInsightsCache();

        await sendPlatformEmail(db, {
          to: application.email,
          subject: 'Update on Your E-Malla Seller Application',
          template: 'seller_application_rejected',
          body: `Hello ${application.businessName}. Your seller application was not approved. Reason: ${reason}`,
          html: createEmailHtml({
            title: 'Seller application update',
            intro: `Muraho ${application.businessName}. Seller application yawe ntiyemejwe muri iyi phase.`,
            sections: [
              { label: 'Business', value: application.businessName },
              { label: 'Business Email', value: application.email },
              { label: 'Decision', value: 'Not approved' },
              { label: 'Reason', value: reason }
            ],
            closing: 'Nyamuneka kosora ibisabwa hanyuma wongere usabe seller access igihe witeguye.'
          })
        });

        createAuditLog(db, {
          event: `Seller application rejected: ${application.businessName}`,
          actor: user.name || user.email,
          category: 'sellers',
          status: 'error',
          metadata: {
            applicationId: application.id,
            sellerEmail: application.email,
            sellerPhone: application.phone,
            rejectedReason: reason,
            logoUrl: application.logoUrl,
            supportingDocumentUrl: application.supportingDocumentUrl
          }
        });

        await writeDb(db);
        sendJson(res, 200, {
          application: db.sellerApplications[index]
        });
        return;
      }

    if (pathname.startsWith('/api/admin/sellers/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const sellerId = pathname.split('/')[4];
      const body = await readBody(req);
      const db = await readDb();
      const index = db.users.findIndex((entry) => entry.id === sellerId && entry.role === 'MERCHANT');

      if (index === -1) {
        sendJson(res, 404, { error: 'Seller not found' });
        return;
      }

      const allowedStatuses = ['active', 'pending', 'suspended'];
      const nextStatus = String(body.status || '').toLowerCase();
      if (!allowedStatuses.includes(nextStatus)) {
        sendJson(res, 400, { error: 'Invalid seller status' });
        return;
      }

      db.users[index] = {
        ...db.users[index],
        status: nextStatus
      };

      createNotification(db, {
        userId: db.users[index].id,
        role: 'MERCHANT',
        title: 'Account Status Updated',
        message: `Your seller profile status is now ${nextStatus}.`,
        type: nextStatus === 'active' ? 'success' : 'warning'
      });
      createAuditLog(db, {
        event: `Seller status updated to ${nextStatus}: ${db.users[index].name}`,
        actor: user.name || user.email,
        category: 'sellers',
        status: nextStatus === 'suspended' ? 'error' : 'success',
        metadata: {
          sellerId: db.users[index].id,
          sellerEmail: db.users[index].email,
          sellerName: db.users[index].name,
          status: nextStatus
        }
      });

      await writeDb(db);
      sendJson(res, 200, { seller: db.users[index] });
      return;
    }

    if (pathname === '/api/admin/rider-applications' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readDb();
      const requestedStatus = (url.searchParams.get('status') || 'all').toLowerCase();
      let applications = db.riderApplications || [];

      if (requestedStatus !== 'all') {
        applications = applications.filter((entry) => String(entry.status || '').toLowerCase() === requestedStatus);
      }

      applications = applications.sort(
        (a, b) => new Date(b.resubmittedAt || b.updatedAt || b.createdAt || 0).getTime() - new Date(a.resubmittedAt || a.updatedAt || a.createdAt || 0).getTime()
      );

      sendJson(res, 200, { applications });
      return;
    }

    if (pathname.startsWith('/api/admin/rider-applications/') && pathname.endsWith('/approve') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const applicationId = pathname.split('/')[4];
      const db = await readDb();
      const index = (db.riderApplications || []).findIndex((entry) => entry.id === applicationId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Rider application not found' });
        return;
      }

      const application = db.riderApplications[index];
      if (application.status === 'approved') {
        sendJson(res, 409, { error: 'Application is already approved' });
        return;
      }

      const temporaryPassword = createTemporaryPassword();
      const usernameBase = `${application.name || 'rider'}`.split(' ')[0] || application.email.split('@')[0];
      const username = makeUniqueUsername(db, usernameBase);

      const existingUserIndex = (db.users || []).findIndex(
        (entry) => String(entry.email || '').toLowerCase() === String(application.email || '').toLowerCase()
      );

      let riderUser;
      if (existingUserIndex >= 0) {
        const existing = db.users[existingUserIndex];
        riderUser = {
          ...existing,
          name: application.name,
          username: existing.username || username,
          password: hashPassword(temporaryPassword),
          mustChangePassword: true,
          role: 'DELIVERY',
          status: 'active',
          phone: application.phone,
          riderSettings: {
            ...(existing.riderSettings || {}),
            vehicleNumber: application.vehicleNumber,
            mobileMoneyNumber: existing.riderSettings?.mobileMoneyNumber || application.phone,
            emergencyContact: existing.riderSettings?.emergencyContact || ''
          },
          updatedAt: new Date().toISOString()
        };
        db.users[existingUserIndex] = riderUser;
      } else {
        riderUser = {
          id: `RID-${Date.now()}`,
          name: application.name,
          username,
          email: application.email,
          password: hashPassword(temporaryPassword),
          mustChangePassword: true,
          role: 'DELIVERY',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          orderCount: 0,
          phone: application.phone,
          riderSettings: {
            vehicleNumber: application.vehicleNumber,
            mobileMoneyNumber: application.phone,
            emergencyContact: ''
          }
        };
        db.users.unshift(riderUser);
      }

      db.riderApplications[index] = {
        ...application,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user.id,
        riderId: riderUser.id,
        temporaryUsername: riderUser.username
      };

      createNotification(db, {
        userId: riderUser.id,
        role: 'DELIVERY',
        title: 'Rider Application Approved',
        message: 'Your rider account is approved. Check your email for login credentials.',
        type: 'success'
      });

      await sendPlatformEmail(db, {
        to: application.email,
        subject: 'Welcome to E-Malla Rider Hub',
        template: 'rider_application_approved',
        body: `Congratulations ${application.name}. Your rider application has been approved. Temporary username: ${riderUser.username}. Temporary password: ${temporaryPassword}.`,
        html: createEmailHtml({
          title: 'Rider application approved',
          intro: `Congratulations ${application.name}. Rider account yawe yemerewe kandi ushobora guhita winjira muri Rider Hub.`,
          sections: [
            { label: 'Username', value: riderUser.username },
            { label: 'Temporary Password', value: temporaryPassword },
            { label: 'Email', value: application.email },
            { label: 'Plate Number', value: application.vehicleNumber },
            { label: 'Status', value: 'Approved' }
          ],
          closing: 'Turagusaba guhita winjira kandi ugahindura password ya temporary mu ntambwe ikurikiraho.'
        })
      });

      createAuditLog(db, {
        event: `Rider application approved: ${application.name}`,
        actor: user.name || user.email,
        category: 'riders',
        status: 'success',
        metadata: {
          applicationId: application.id,
          riderId: riderUser.id,
          riderEmail: application.email,
          riderPhone: application.phone,
          temporaryUsername: riderUser.username,
          vehicleNumber: application.vehicleNumber
        }
      });

      await writeDb(db);
      sendJson(res, 200, {
        application: db.riderApplications[index],
        rider: sanitizeUser(riderUser)
      });
      return;
    }

    if (pathname.startsWith('/api/admin/rider-applications/') && pathname.endsWith('/reject') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const applicationId = pathname.split('/')[4];
      const body = await readBody(req);
      const db = await readDb();
      const index = (db.riderApplications || []).findIndex((entry) => entry.id === applicationId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Rider application not found' });
        return;
      }

      const application = db.riderApplications[index];
      if (application.status === 'approved') {
        sendJson(res, 409, { error: 'Approved applications cannot be rejected.' });
        return;
      }

      const reason = String(body.reason || '').trim();
      if (!reason) {
        sendJson(res, 400, { error: 'Rejection reason is required.' });
        return;
      }

      db.riderApplications[index] = {
        ...application,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: user.id,
        rejectedReason: reason
      };

      await sendPlatformEmail(db, {
        to: application.email,
        subject: 'Update on Your E-Malla Rider Application',
        template: 'rider_application_rejected',
        body: `Hello ${application.name}. Your rider application was not approved. Reason: ${reason}`,
        html: createEmailHtml({
          title: 'Rider application update',
          intro: `Muraho ${application.name}. Rider application yawe ntiyemejwe muri iyi phase.`,
          sections: [
            { label: 'Applicant', value: application.name },
            { label: 'Email', value: application.email },
            { label: 'Plate Number', value: application.vehicleNumber },
            { label: 'Decision', value: 'Not approved' },
            { label: 'Reason', value: reason }
          ],
          closing: 'Nyamuneka kosora ibisabwa hanyuma wongere usabe rider access igihe witeguye.'
        })
      });

      createAuditLog(db, {
        event: `Rider application rejected: ${application.name}`,
        actor: user.name || user.email,
        category: 'riders',
        status: 'error',
        metadata: {
          applicationId: application.id,
          riderEmail: application.email,
          riderPhone: application.phone,
          vehicleNumber: application.vehicleNumber,
          rejectedReason: reason
        }
      });

      await writeDb(db);
      sendJson(res, 200, {
        application: db.riderApplications[index]
      });
      return;
    }

    if (pathname === '/api/admin/products' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const requestedStatus = url.searchParams.get('status');
      let products = await readProductRecords();

      if (requestedStatus && requestedStatus !== 'all') {
        products = products.filter((product) => (product.status || 'pending') === requestedStatus);
      }

      sendJson(res, 200, { products });
      return;
    }

    if (pathname === '/api/admin/riders' && req.method === 'GET') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const db = await readAdminRiderRecords();
      const requestedStatus = (url.searchParams.get('status') || 'all').toLowerCase();
      let riders = buildRiderSnapshot(db);

      if (requestedStatus !== 'all') {
        riders = riders.filter((rider) => String(rider.status || '').toLowerCase() === requestedStatus);
      }

      sendJson(res, 200, { riders });
      return;
    }

    if (pathname.startsWith('/api/admin/riders/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['ADMIN']);
      if (!user) return;

      const riderId = pathname.split('/')[4];
      const body = await readBody(req);
      const db = await readDb();
      const index = db.users.findIndex((entry) => entry.id === riderId && entry.role === 'DELIVERY');

      if (index === -1) {
        sendJson(res, 404, { error: 'Rider not found' });
        return;
      }

      const allowedStatuses = ['active', 'offline', 'suspended'];
      const nextStatus = String(body.status || '').toLowerCase();
      if (!allowedStatuses.includes(nextStatus)) {
        sendJson(res, 400, { error: 'Invalid rider status' });
        return;
      }

      db.users[index] = {
        ...db.users[index],
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };

      createNotification(db, {
        userId: db.users[index].id,
        role: 'DELIVERY',
        title: 'Rider Account Updated',
        message: `Your rider account status is now ${nextStatus}.`,
        type: nextStatus === 'active' ? 'success' : 'warning'
      });
      createAuditLog(db, {
        event: `Rider status updated to ${nextStatus}: ${db.users[index].name}`,
        actor: user.name || user.email,
        category: 'riders',
        status: nextStatus === 'suspended' ? 'error' : 'success',
        metadata: {
          riderId: db.users[index].id,
          riderEmail: db.users[index].email,
          riderName: db.users[index].name,
          status: nextStatus
        }
      });

      await writeDb(db);
      sendJson(res, 200, {
        rider: {
          ...sanitizeUser(db.users[index]),
          operationalStatus: nextStatus === 'active' ? 'available' : nextStatus
        }
      });
      return;
    }

    if (pathname === '/api/products' && req.method === 'GET') {
      const user = await getOptionalUser(req);
      const products = await getCachedProducts();
      let visibleProducts = products;

      if (user?.role === 'ADMIN') {
        visibleProducts = products;
      } else if (user?.role === 'MERCHANT') {
        visibleProducts = products.filter((product) =>
          (product.status || 'pending') === 'approved' || product.merchantId === user.id
        );
      } else {
        visibleProducts = products.filter((product) => (product.status || 'pending') === 'approved');
      }

      sendJson(res, 200, { products: visibleProducts });
      return;
    }

    if (pathname === '/api/uploads/image' && req.method === 'POST') {
      const body = await readBody(req);
      const db = await readDb();
      const storageConfig = getStorageConfig();
      const uploadFolder = body.folder || 'e-malla/products';
      if (!ALLOWED_UPLOAD_FOLDERS.has(uploadFolder)) {
        sendJson(res, 400, { error: 'Upload folder is not allowed.' });
        return;
      }

      const isApplicationUpload = uploadFolder === 'e-malla/applications';
      let user = null;

      if (!isApplicationUpload) {
        user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
        if (!user) return;
      }

      if (!body.dataUrl) {
        sendJson(res, 400, { error: 'File data is required.' });
        return;
      }

      const uploaded = await uploadAsset({
        dataUrl: body.dataUrl,
        fileName: body.fileName || 'product-image',
        folder: uploadFolder,
        allowedMimeTypes: isApplicationUpload
          ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
          : ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeMb: isApplicationUpload
          ? storageConfig.maxDocumentUploadMb
          : storageConfig.maxImageUploadMb
      });

      createAuditLog(db, {
        event: isApplicationUpload
          ? `Application file uploaded: ${body.fileName || 'application-file'}`
          : `Product image uploaded by ${user.name || user.email}`,
        actor: user ? user.name || user.email : 'Public applicant',
        category: isApplicationUpload ? 'sellers' : 'products',
        status: uploaded.provider === 'cloudinary' ? 'success' : 'info',
        metadata: {
          provider: uploaded.provider,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          format: uploaded.format,
          folder: uploadFolder,
          fileName: body.fileName || 'product-image'
        }
      });

      await writeDb(db);
      sendJson(res, 201, { upload: uploaded });
      return;
    }

    if (pathname.startsWith('/api/products/') && pathname.endsWith('/reviews') && req.method === 'GET') {
      const productId = pathname.split('/')[3];
      const db = await readDb();
      const product = (db.products || []).find((entry) => entry.id === productId);

      if (!product) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      const reviews = (db.reviews || [])
        .filter((review) => review.productId === productId)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

      sendJson(res, 200, { reviews });
      return;
    }

    if (pathname.startsWith('/api/products/') && pathname.endsWith('/reviews') && req.method === 'POST') {
      const user = await requireRole(req, res, ['CUSTOMER', 'ADMIN']);
      if (!user) return;

      const productId = pathname.split('/')[3];
      const body = await readBody(req);
      const db = await readDb();
      const product = (db.products || []).find((entry) => entry.id === productId);

      if (!product) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      const rating = Number(body.rating || 0);
      const comment = String(body.comment || '').trim();

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        sendJson(res, 400, { error: 'Rating must be between 1 and 5' });
        return;
      }

      if (comment.length < 8) {
        sendJson(res, 400, { error: 'Review comment is too short' });
        return;
      }

      const hasPurchased = (db.orders || []).some((order) =>
        order.customerId === user.id &&
        order.paymentStatus === 'SUCCESS' &&
        (order.items || []).some((item) => item.productId === productId)
      );

      if (!hasPurchased && user.role !== 'ADMIN') {
        sendJson(res, 403, { error: 'Only verified buyers can review this product' });
        return;
      }

      const existingReviewIndex = (db.reviews || []).findIndex(
        (review) => review.productId === productId && review.userId === user.id
      );

      const review = {
        id: existingReviewIndex >= 0 ? db.reviews[existingReviewIndex].id : `rev-${Date.now()}`,
        productId,
        userId: user.id,
        userName: user.name,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        verifiedPurchase: hasPurchased
      };

      if (existingReviewIndex >= 0) {
        db.reviews[existingReviewIndex] = review;
      } else {
        db.reviews.unshift(review);
      }

      recalculateProductReviewMetrics(db, productId);
      createAuditLog(db, {
        event: `Review submitted for ${product.name}`,
        actor: user.name || user.email,
        category: 'products',
        status: 'success',
        metadata: {
          productId,
          productName: product.name,
          reviewId: review.id,
          rating
        }
      });

      await writeDb(db);
      sendJson(res, 201, { review });
      return;
    }

    if (pathname === '/api/products' && req.method === 'POST') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const canControlApproval = user.role === 'ADMIN';
      const product = normalizeProductMedia({
        id: `p${Date.now()}`,
        name: body.name || 'Unnamed Product',
        price: body.price || 0,
        category: body.category || '1',
        image: body.image || '/catalog/electronics.svg',
        images: body.images || [],
        stock: body.stock || 0,
        rating: body.rating || 0,
        description: body.description || '',
        specifications: body.specifications || '',
        merchantId: canControlApproval ? body.merchantId || user.id : user.id,
        merchantName: canControlApproval ? body.merchantName || user.name : user.name,
        status: canControlApproval ? body.status || 'pending' : 'pending',
        featured: canControlApproval ? body.featured ?? true : false,
        reviewsCount: body.reviewsCount || 0,
        variants: body.variants
      });

      db.products.unshift(product);
      invalidateProductsCache();
      createAuditLog(db, {
        event: `Product created: ${product.name}`,
        actor: user.name || user.email,
        category: 'products',
        status: product.status === 'approved' ? 'success' : 'info',
        metadata: {
          productId: product.id,
          productName: product.name,
          merchantId: product.merchantId,
          merchantName: product.merchantName,
          price: product.price,
          status: product.status
        }
      });
      await writeDb(db);
      sendJson(res, 201, { product });
      return;
    }

    if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const productId = pathname.split('/').pop();
      const body = await readBody(req);
      const db = await readDb();
      const index = db.products.findIndex((product) => product.id === productId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      const existing = db.products[index];
      if (user.role !== 'ADMIN' && existing.merchantId !== user.id) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      const previousMediaUrls = getProductMediaUrls(existing);
      const canControlApproval = user.role === 'ADMIN';
      const safeUpdates = canControlApproval
        ? body
        : {
            ...body,
            merchantId: existing.merchantId,
            merchantName: existing.merchantName,
            status: existing.status,
            featured: existing.featured,
            rating: existing.rating,
            reviewsCount: existing.reviewsCount
          };

      db.products[index] = normalizeProductMedia({ ...existing, ...safeUpdates });
      invalidateProductsCache();
      const nextMediaUrls = getProductMediaUrls(db.products[index]);
      const removedMediaUrls = collectRemovedAssetUrls(previousMediaUrls, nextMediaUrls);
      createAuditLog(db, {
        event: `Product updated: ${db.products[index].name}`,
        actor: user.name || user.email,
        category: 'products',
        status: body.status === 'rejected' ? 'error' : 'success',
        metadata: {
          productId: db.products[index].id,
          productName: db.products[index].name,
          merchantId: db.products[index].merchantId,
          merchantName: db.products[index].merchantName,
          status: db.products[index].status,
          removedAssets: removedMediaUrls.length
        }
      });
      await writeDb(db);
      await purgeAssetUrls(removedMediaUrls);
      sendJson(res, 200, { product: db.products[index] });
      return;
    }

    if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const productId = pathname.split('/').pop();
      const db = await readDb();
      const product = db.products.find((entry) => entry.id === productId);
      if (!product) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      if (user.role !== 'ADMIN' && product.merchantId !== user.id) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      const removedMediaUrls = getProductMediaUrls(product);
      db.products = db.products.filter((entry) => entry.id !== productId);
      invalidateProductsCache();
      createAuditLog(db, {
        event: `Product removed: ${product.name}`,
        actor: user.name || user.email,
        category: 'products',
        status: 'error',
        metadata: {
          productId: product.id,
          productName: product.name,
          merchantId: product.merchantId,
          merchantName: product.merchantName,
          removedAssets: removedMediaUrls.length
        }
      });
      await writeDb(db);
      await purgeAssetUrls(removedMediaUrls);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/addresses' && req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;

      const db = await readDb();
      sendJson(res, 200, { addresses: db.addresses.filter((address) => address.userId === user.id) });
      return;
    }

    if (pathname === '/api/addresses' && req.method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const existing = db.addresses.filter((address) => address.userId === user.id);
      const address = {
        id: `addr-${Date.now()}`,
        userId: user.id,
        name: body.name || 'Address',
        district: body.district || '',
        sector: body.sector || '',
        street: body.street || '',
        isDefault: existing.length === 0
      };

      if (address.isDefault) {
        db.addresses = db.addresses.map((entry) =>
          entry.userId === user.id ? { ...entry, isDefault: false } : entry
        );
      }

      db.addresses.unshift(address);
      await writeDb(db);
      sendJson(res, 201, { address });
      return;
    }

    if (pathname.startsWith('/api/addresses/') && req.method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;

      const addressId = pathname.split('/').pop();
      const db = await readDb();
      const current = db.addresses.find((entry) => entry.id === addressId && entry.userId === user.id);
      if (!current) {
        sendJson(res, 404, { error: 'Address not found' });
        return;
      }

      db.addresses = db.addresses.filter((entry) => entry.id !== addressId);
      const remaining = db.addresses.filter((entry) => entry.userId === user.id);
      if (remaining.length > 0 && !remaining.some((entry) => entry.isDefault)) {
        remaining[0].isDefault = true;
      }

      await writeDb(db);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname.startsWith('/api/addresses/') && !pathname.endsWith('/default') && req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;

      const addressId = pathname.split('/').pop();
      const body = await readBody(req);
      const db = await readDb();
      const existingAddress = db.addresses.find((entry) => entry.id === addressId && entry.userId === user.id);

      if (!existingAddress) {
        sendJson(res, 404, { error: 'Address not found' });
        return;
      }

      db.addresses = db.addresses.map((entry) =>
        entry.id === addressId
          ? {
              ...entry,
              name: body.name || entry.name,
              district: body.district || entry.district,
              sector: body.sector || entry.sector,
              street: body.street || entry.street,
              updatedAt: new Date().toISOString()
            }
          : entry
      );

      await writeDb(db);
      sendJson(res, 200, { address: db.addresses.find((entry) => entry.id === addressId) });
      return;
    }

    if (pathname.startsWith('/api/addresses/') && pathname.endsWith('/default') && req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;

      const addressId = pathname.split('/')[3];
      const db = await readDb();
      const exists = db.addresses.some((entry) => entry.id === addressId && entry.userId === user.id);

      if (!exists) {
        sendJson(res, 404, { error: 'Address not found' });
        return;
      }

      db.addresses = db.addresses.map((entry) => {
        if (entry.userId !== user.id) return entry;
        return { ...entry, isDefault: entry.id === addressId };
      });

      await writeDb(db);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/wishlist' && req.method === 'GET') {
      const user = await requireRole(req, res, ['CUSTOMER', 'ADMIN']);
      if (!user) return;

      const db = await readDb();
      const wishlistItems = (db.wishlists || []).filter((entry) => entry.userId === user.id);
      sendJson(res, 200, { wishlist: wishlistItems });
      return;
    }

    if (pathname === '/api/wishlist' && req.method === 'POST') {
      const user = await requireRole(req, res, ['CUSTOMER', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const productId = String(body.productId || '').trim();
      const db = await readDb();

      if (!productId) {
        sendJson(res, 400, { error: 'Product is required.' });
        return;
      }

      const product = (db.products || []).find((entry) => entry.id === productId);
      if (!product) {
        sendJson(res, 404, { error: 'Product not found.' });
        return;
      }

      db.wishlists = db.wishlists || [];
      const existing = db.wishlists.find((entry) => entry.userId === user.id && entry.productId === productId);
      if (!existing) {
        db.wishlists.unshift({
          id: `wish-${Date.now()}`,
          userId: user.id,
          productId,
          createdAt: new Date().toISOString()
        });
        createAuditLog(db, {
          event: `Product wishlisted: ${product.name}`,
          actor: user.name || user.email,
          category: 'products',
          status: 'info',
          metadata: {
            productId,
            productName: product.name,
            userId: user.id
          }
        });
        await writeDb(db);
      }

      sendJson(res, 201, { success: true });
      return;
    }

    if (pathname.startsWith('/api/wishlist/') && req.method === 'DELETE') {
      const user = await requireRole(req, res, ['CUSTOMER', 'ADMIN']);
      if (!user) return;

      const productId = pathname.split('/').pop();
      const db = await readDb();
      const beforeCount = (db.wishlists || []).length;
      db.wishlists = (db.wishlists || []).filter((entry) => !(entry.userId === user.id && entry.productId === productId));

      if (db.wishlists.length !== beforeCount) {
        createAuditLog(db, {
          event: 'Product removed from wishlist',
          actor: user.name || user.email,
          category: 'products',
          status: 'info',
          metadata: {
            productId,
            userId: user.id
          }
        });
        await writeDb(db);
      }

      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/merchant/settings' && req.method === 'GET') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      sendJson(res, 200, { settings: user.storeSettings || {} });
      return;
    }

    if (pathname === '/api/merchant/settings' && req.method === 'PUT') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const userIndex = (db.users || []).findIndex((entry) => entry.id === user.id);

      if (userIndex === -1) {
        sendJson(res, 404, { error: 'Merchant account not found.' });
        return;
      }

      const nextSettings = {
        ...(db.users[userIndex].storeSettings || {}),
        ...(body || {})
      };

      db.users[userIndex] = {
        ...db.users[userIndex],
        storeSettings: nextSettings,
        updatedAt: new Date().toISOString()
      };

      createAuditLog(db, {
        event: 'Merchant settings updated',
        actor: user.name || user.email,
        category: 'sellers',
        status: 'success',
        metadata: {
          merchantId: user.id,
          settingsKeys: Object.keys(body || {})
        }
      });

      await writeDb(db);
      sendJson(res, 200, { settings: nextSettings, user: sanitizeUser(db.users[userIndex]) });
      return;
    }

    if (pathname === '/api/orders' && req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;

      const dbOrders = await readOrderRecords();
      const scope = url.searchParams.get('scope');
      let orders = dbOrders;

      if (scope === 'pool' && ['DELIVERY', 'ADMIN'].includes(user.role)) {
        orders = orders.filter((order) => order.status === 'ready_for_pickup' && !order.riderId);
      } else if (user.role === 'CUSTOMER') {
        orders = orders.filter((order) => order.customerId === user.id);
      } else if (user.role === 'MERCHANT') {
        orders = orders.filter((order) => order.merchantId === user.id);
      } else if (user.role === 'DELIVERY') {
        orders = orders.filter((order) => order.riderId === user.id);
      }

      sendJson(res, 200, { orders });
      return;
    }

    if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
      const orderId = pathname.split('/').pop();
      const dbOrders = await readOrderRecords();
      const order = dbOrders.find((entry) => entry.id === orderId || entry.orderNumber === orderId);
      const user = await getOptionalUser(req);
      const guestEmail = String(url.searchParams.get('email') || '').trim().toLowerCase();
      const guestPhone = String(url.searchParams.get('phone') || '').trim();

      if (!order) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }

      const canView =
        !!user && (
          user.role === 'ADMIN' ||
          order.customerId === user.id ||
          order.merchantId === user.id ||
          order.riderId === user.id
        );
      const guestMatches =
        (!user || String(order.customerId || '').startsWith('GST-')) &&
        (
          (guestEmail && guestEmail === String(order.customerEmail || '').trim().toLowerCase()) ||
          (guestPhone && guestPhone === String(order.phone || '').trim())
        );

      if (!canView && !guestMatches) {
        sendJson(res, user ? 403 : 401, { error: user ? 'Forbidden' : 'Unauthorized' });
        return;
      }

      sendJson(res, 200, { order });
      return;
    }

    if (pathname === '/api/orders' && req.method === 'POST') {
      const user = await getOptionalUser(req);

      const body = await readBody(req);
      const db = await readDb();
      const items = Array.isArray(body.items) ? body.items : [];
      const customerName = String(body.customerName || user?.name || '').trim();
      const customerEmail = String(body.customerEmail || user?.email || '').trim().toLowerCase();
      const customerPhone = String(body.phone || user?.phone || '').trim();
      const customerAddress = String(body.address || '').trim();

      if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
        sendJson(res, 400, { error: 'Customer name, email, phone, and address are required.' });
        return;
      }

      const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const deliveryFee = body.deliveryFee || 0;
      const totalAmount = subtotal + deliveryFee;
      const firstProduct = db.products.find((product) => product.id === items[0]?.productId);
      const merchantId = body.merchantId || firstProduct?.merchantId;
      const merchantUser = merchantId
        ? db.users.find((entry) => entry.id === merchantId && entry.role === 'MERCHANT')
        : null;
      const merchantName = body.merchantName || firstProduct?.merchantName || merchantUser?.name;

      if (!merchantId || !merchantName) {
        sendJson(res, 400, { error: 'Merchant information is required to create this order.' });
        return;
      }

      const order = {
        id: `o-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        customerId: user?.id || `GST-${Date.now()}`,
        customerName,
        customerEmail,
        merchantId,
        merchantName,
        items: items.map((item) => ({ ...item, subtotal: item.price * item.quantity })),
        status: 'pending_payment',
        paymentStatus: 'PENDING',
        paymentMethod: body.paymentMethod || 'MOMO',
        deliveryFee,
        totalAmount,
        tx_ref: body.tx_ref || `TX-${Date.now()}`,
        address: customerAddress,
        phone: customerPhone,
        notes: body.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.orders.unshift(order);
      invalidatePublicInsightsCache();
      createNotification(db, {
        userId: order.customerId,
        role: 'CUSTOMER',
        title: 'Order Placed!',
        message: `Your order ${order.orderNumber} is awaiting payment.`,
        type: 'info',
        metadata: { orderId: order.id }
      });
      createNotification(db, {
        userId: order.merchantId,
        role: 'MERCHANT',
        title: 'New Incoming Order!',
        message: `Order ${order.orderNumber} has been placed for RWF ${order.totalAmount.toLocaleString()}.`,
        type: 'success',
        metadata: { orderId: order.id }
      });
      createAuditLog(db, {
        event: `Order placed: ${order.orderNumber}`,
        actor: user?.name || user?.email || order.customerEmail || order.customerName,
        category: 'orders',
        status: 'success',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          merchantId: order.merchantId,
          merchantName: order.merchantName,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount
        }
      });
      await persistCheckoutBundleRecord({
        orders: [order],
        notifications: db.notifications.slice(0, 2),
        auditLogs: db.auditLogs.slice(0, 1)
      });
      sendJson(res, 201, { order });
      return;
    }

    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN', 'DELIVERY']);
      if (!user) return;

      const orderId = pathname.split('/')[3];
      const body = await readBody(req);
      const db = await readDb();
      const index = db.orders.findIndex((order) => order.id === orderId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }

      const current = db.orders[index];
      const allowed = allowedTransitions[current.status] || [];
      if (!allowed.includes(body.status)) {
        sendJson(res, 400, { error: 'Illegal status transition' });
        return;
      }

      if (user.role === 'MERCHANT' && current.merchantId !== user.id) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      if (user.role === 'DELIVERY' && current.riderId && current.riderId !== user.id) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      db.orders[index] = {
        ...current,
        status: body.status,
        paymentStatus: body.status === 'paid' ? 'SUCCESS' : current.paymentStatus,
        updatedAt: new Date().toISOString()
      };

      createNotification(db, {
        userId: current.customerId,
        role: 'CUSTOMER',
        title: 'Order Updated',
        message: `Your order ${current.orderNumber} is now ${body.status.replaceAll('_', ' ')}.`,
        type: body.status === 'cancelled' ? 'warning' : 'info',
        metadata: { orderId: current.id }
      });
      createAuditLog(db, {
        event: `Order ${current.orderNumber} updated to ${body.status.replaceAll('_', ' ')}`,
        actor: user.name || user.email,
        category: 'orders',
        status: body.status === 'cancelled' ? 'error' : 'success',
        metadata: {
          orderId: current.id,
          orderNumber: current.orderNumber,
          previousStatus: current.status,
          nextStatus: body.status,
          merchantId: current.merchantId
        }
      });

      await writeDb(db);
      sendJson(res, 200, { order: db.orders[index] });
      return;
    }

    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/assign-rider') && req.method === 'PUT') {
      const user = await requireRole(req, res, ['DELIVERY', 'ADMIN']);
      if (!user) return;

      const orderId = pathname.split('/')[3];
      const body = await readBody(req);
      const db = await readDb();
      const index = db.orders.findIndex((order) => order.id === orderId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }

      const current = db.orders[index];
      if (current.status !== 'ready_for_pickup') {
        sendJson(res, 400, { error: 'Order is not ready for pickup' });
        return;
      }

      db.orders[index] = {
        ...current,
        riderId: body.riderId || user.id,
        riderName: body.riderName || user.name,
        status: 'assigned',
        updatedAt: new Date().toISOString()
      };

      createNotification(db, {
        userId: db.orders[index].riderId,
        role: 'DELIVERY',
        title: 'New Delivery Assigned',
        message: `You have been assigned ${db.orders[index].orderNumber}.`,
        type: 'success',
        metadata: { orderId: db.orders[index].id }
      });
      const assignedOrder = db.orders[index];
      const riderRecipient = (db.users || []).find((entry) => entry.id === assignedOrder.riderId && entry.role === 'DELIVERY');
      await sendPlatformEmail(db, {
        to: riderRecipient?.email,
        template: 'rider_delivery_assignment',
        ...buildPlatformEmail('rider_delivery_assignment', {
          riderName: assignedOrder.riderName || riderRecipient?.name,
          orderNumber: assignedOrder.orderNumber,
          customerName: assignedOrder.customerName,
          address: assignedOrder.address,
          phone: assignedOrder.phone
        })
      });
      createAuditLog(db, {
        event: `Rider assigned to ${db.orders[index].orderNumber}`,
        actor: body.riderName || user.name || user.email,
        category: 'riders',
        status: 'success',
        metadata: {
          orderId: db.orders[index].id,
          orderNumber: db.orders[index].orderNumber,
          riderId: db.orders[index].riderId,
          riderName: db.orders[index].riderName
        }
      });

      await writeDb(db);
      sendJson(res, 200, { order: db.orders[index] });
      return;
    }

    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/cancel') && req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;

      const orderId = pathname.split('/')[3];
      const db = await readDb();
      const index = db.orders.findIndex((order) => order.id === orderId);

      if (index === -1) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }

      const current = db.orders[index];
      const canCancel =
        user.role === 'ADMIN' ||
        current.customerId === user.id ||
        current.merchantId === user.id;

      if (!canCancel) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      const allowed = allowedTransitions[current.status] || [];
      if (!allowed.includes('cancelled')) {
        sendJson(res, 400, { error: 'Order cannot be cancelled at this stage' });
        return;
      }

      db.orders[index] = {
        ...current,
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      };

      createNotification(db, {
        userId: current.merchantId,
        role: 'MERCHANT',
        title: 'Order Cancelled',
        message: `Order ${current.orderNumber} has been cancelled.`,
        type: 'warning',
        metadata: { orderId: current.id }
      });
      createAuditLog(db, {
        event: `Order cancelled: ${current.orderNumber}`,
        actor: user.name || user.email,
        category: 'orders',
        status: 'error',
        metadata: {
          orderId: current.id,
          orderNumber: current.orderNumber,
          merchantId: current.merchantId,
          customerId: current.customerId
        }
      });

      await writeDb(db);
      sendJson(res, 200, { order: db.orders[index] });
      return;
    }

    if (pathname === '/api/payments/initiate' && req.method === 'POST') {
      const user = await getOptionalUser(req);

      const body = await readBody(req);
      const db = await readDb();
      const orderIndex = db.orders.findIndex((order) => order.id === body.orderId);

      if (orderIndex === -1) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }

      const txRef = `EMALLA-TX-${body.orderId}-${Date.now()}`;
      const isCashOnDelivery = body.method === 'CASH_ON_DELIVERY';
      const payment = {
        id: `pay-${Date.now()}`,
        orderId: body.orderId,
        userId: user?.id || db.orders[orderIndex].customerId,
        amount: body.amount,
        method: body.method,
        status: isCashOnDelivery ? 'PENDING' : 'SUCCESS',
        tx_ref: txRef,
        currency: 'RWF',
        createdAt: new Date().toISOString()
      };

      db.payments.unshift(payment);
      db.orders[orderIndex] = {
        ...db.orders[orderIndex],
        tx_ref: txRef,
        paymentMethod: body.method,
        paymentStatus: isCashOnDelivery ? 'PENDING' : db.orders[orderIndex].paymentStatus,
        status: isCashOnDelivery ? 'confirmed' : db.orders[orderIndex].status,
        updatedAt: new Date().toISOString()
      };

      if (!isCashOnDelivery) {
        createTransaction(db, {
          userId: db.orders[orderIndex].customerId,
          orderId: body.orderId,
          amount: body.amount,
          type: 'payment',
          status: 'success',
          method: body.method,
          tx_ref: txRef
        });
      }

      if (isCashOnDelivery) {
        const order = db.orders[orderIndex];
        const merchant = (db.users || []).find((entry) => entry.id === order.merchantId && entry.role === 'MERCHANT');
        createNotification(db, {
          userId: order.customerId,
          role: 'CUSTOMER',
          title: 'Cash on Delivery Confirmed',
          message: `Your order ${order.orderNumber} is confirmed. Please prepare cash for delivery.`,
          type: 'success',
          metadata: { orderId: order.id }
        });
        createNotification(db, {
          userId: order.merchantId,
          role: 'MERCHANT',
          title: 'New Cash on Delivery Order',
          message: `${order.orderNumber} was placed with Cash on Delivery. Start preparing the package.`,
          type: 'info',
          metadata: { orderId: order.id }
        });
        await Promise.allSettled([
          sendPlatformEmail(db, {
            to: body.customerEmail || order.customerEmail || user?.email,
            template: 'order_confirmation',
            ...buildPlatformEmail('order_confirmation', {
              customerName: order.customerName || user?.name,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              address: order.address,
              phone: order.phone,
              txRef: order.tx_ref,
              merchantName: order.merchantName,
              itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
              trackingUrl: buildCustomerTrackingUrl(order)
            })
          }),
          sendPlatformEmail(db, {
            to: merchant?.email,
            template: 'seller_order_notification',
            ...buildPlatformEmail('seller_order_notification', {
              merchantName: order.merchantName || merchant?.name,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              customerName: order.customerName
            })
          })
        ]);
      }

      createAuditLog(db, {
        event: isCashOnDelivery
          ? `Cash on delivery confirmed for ${db.orders[orderIndex].orderNumber}`
          : `Payment initiated for ${db.orders[orderIndex].orderNumber}`,
        actor: user?.name || user?.email || body.customerEmail || db.orders[orderIndex].customerEmail || db.orders[orderIndex].customerName,
        category: 'payments',
        status: 'success',
        metadata: {
          orderId: db.orders[orderIndex].id,
          orderNumber: db.orders[orderIndex].orderNumber,
          paymentId: payment.id,
          txRef,
          method: body.method,
          amount: body.amount
        }
      });
      await persistCheckoutBundleRecord({
        orders: [db.orders[orderIndex]],
        payments: [payment],
        transactions: isCashOnDelivery ? [] : db.transactions.slice(0, 1),
        notifications: isCashOnDelivery ? db.notifications.slice(0, 2) : [],
        auditLogs: db.auditLogs.slice(0, 1)
      });
      sendJson(res, 200, {
        status: 'success',
        link: isCashOnDelivery ? null : `https://checkout.flutterwave.com/v3/hosted/pay/${txRef}`,
        tx_ref: txRef,
        paymentStatus: isCashOnDelivery ? 'PENDING' : 'SUCCESS',
        mode: isCashOnDelivery ? 'cod' : 'gateway'
      });
      return;
    }

    if (pathname.startsWith('/api/payments/verify/') && req.method === 'GET') {
      const user = await getOptionalUser(req);
      const txRef = decodeURIComponent(pathname.split('/').pop());
      const db = await readDb();
      const payment = db.payments.find((entry) => entry.tx_ref === txRef);

      if (!payment) {
        sendJson(res, 404, { error: 'Payment not found' });
        return;
      }

      const orderIndex = db.orders.findIndex((order) => order.id === payment.orderId);
      const order = orderIndex !== -1 ? db.orders[orderIndex] : null;
      const guestEmail = String(url.searchParams.get('email') || '').trim().toLowerCase();
      const canVerify =
        !!user && !!order && (
          user.role === 'ADMIN' ||
          order.customerId === user.id ||
          order.merchantId === user.id
        );
      const guestMatches = !user && !!order && guestEmail && guestEmail === String(order.customerEmail || '').trim().toLowerCase();

      if (!canVerify && !guestMatches) {
        sendJson(res, user ? 403 : 401, { error: user ? 'Forbidden' : 'Unauthorized' });
        return;
      }

      if (orderIndex !== -1) {
        db.orders[orderIndex] = {
          ...db.orders[orderIndex],
          paymentStatus: 'SUCCESS',
          status: db.orders[orderIndex].status === 'pending_payment' ? 'paid' : db.orders[orderIndex].status,
          tx_ref: txRef,
          updatedAt: new Date().toISOString()
        };

        const order = db.orders[orderIndex];
        createNotification(db, {
          userId: order.customerId,
          role: 'CUSTOMER',
          title: 'Payment Success!',
          message: `We have received your payment for ${order.orderNumber}.`,
          type: 'success',
          metadata: { orderId: order.id }
        });
        createNotification(db, {
          userId: order.merchantId,
          role: 'MERCHANT',
          title: 'Payment Confirmed',
          message: `Payment confirmed for ${order.orderNumber}. Start preparing the package.`,
          type: 'success',
          metadata: { orderId: order.id }
        });
        const merchant = (db.users || []).find((entry) => entry.id === order.merchantId && entry.role === 'MERCHANT');
        await Promise.allSettled([
          sendPlatformEmail(db, {
            to: order.customerEmail || user?.email,
            template: 'order_confirmation',
            ...buildPlatformEmail('order_confirmation', {
              customerName: order.customerName || user?.name,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              address: order.address,
              phone: order.phone,
              txRef: order.tx_ref,
              merchantName: order.merchantName,
              itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
              trackingUrl: buildCustomerTrackingUrl(order)
            })
          }),
          sendPlatformEmail(db, {
            to: merchant?.email,
            template: 'seller_order_notification',
            ...buildPlatformEmail('seller_order_notification', {
              merchantName: order.merchantName || merchant?.name,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              customerName: order.customerName
            })
          })
        ]);
        createTransaction(db, {
          userId: order.merchantId,
          orderId: order.id,
          amount: buildMerchantCommissionSummary(db, order.merchantId).netRevenue >= 0
            ? Math.max(
                Math.round(
                  (order.items || []).reduce((sum, item) => {
                    const product = (db.products || []).find((entry) => entry.id === item.productId);
                    const rate = getCategoryCommissionRate(db, product?.category || '1');
                    const subtotal = Number(item.subtotal || item.price * item.quantity || 0);
                    return sum + subtotal - (subtotal * rate) / 100;
                  }, 0)
                ),
                0
              )
            : 0,
          type: 'payment',
          status: 'success',
          method: 'Sale Proceeds (Category Commission Applied)',
          tx_ref: txRef
        });
        createAuditLog(db, {
          event: `Payment verified for ${order.orderNumber}`,
          actor: user?.name || user?.email || order.customerEmail || order.customerName,
          category: 'payments',
          status: 'success',
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentId: payment.id,
            txRef,
            amount: payment.amount,
            currency: payment.currency || 'RWF'
          }
        });
      }
      await persistCheckoutBundleRecord({
        orders: orderIndex !== -1 ? [db.orders[orderIndex]] : [],
        payments: [payment],
        transactions: db.transactions.slice(0, 1),
        notifications: orderIndex !== -1 ? db.notifications.slice(0, 2) : [],
        auditLogs: orderIndex !== -1 ? db.auditLogs.slice(0, 1) : []
      });
      sendJson(res, 200, {
        status: 'SUCCESS',
        amount: payment.amount,
        currency: payment.currency || 'RWF',
        id: payment.id,
        tx_ref: payment.tx_ref,
        orderId: payment.orderId
      });
      return;
    }

    if (pathname === '/api/notifications' && req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;

      const db = await readDb();
      const notifications = db.notifications.filter(
        (notification) =>
          notification.userId === user.id || notification.userId === `broadcast_${notification.role}`
      );
      sendJson(res, 200, { notifications });
      return;
    }

    if (pathname === '/api/notifications' && req.method === 'POST') {
      const user = await requireRole(req, res, ['ADMIN', 'MERCHANT']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const notification = createNotification(db, {
        userId: body.userId,
        role: body.role,
        title: body.title,
        message: body.message,
        type: body.type || 'info',
        metadata: body.metadata
      });

      await writeDb(db);
      sendJson(res, 201, { notification });
      return;
    }

    if (pathname.startsWith('/api/notifications/') && pathname.endsWith('/read') && req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;

      const notificationId = pathname.split('/')[3];
      const db = await readDb();
      db.notifications = db.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      );
      await writeDb(db);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/notifications/read-all' && req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;

      const db = await readDb();
      db.notifications = db.notifications.map((notification) =>
        notification.userId === user.id ? { ...notification, read: true } : notification
      );
      await writeDb(db);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname.startsWith('/api/notifications/') && req.method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;

      const notificationId = pathname.split('/').pop();
      const db = await readDb();
      db.notifications = db.notifications.filter(
        (notification) => !(notification.id === notificationId && notification.userId === user.id)
      );
      await writeDb(db);
      sendJson(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/wallet/merchant' && req.method === 'GET') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const db = await readRiderDashboardRecords(user.id);
      const transactions = db.transactions.filter((transaction) => transaction.userId === user.id);
      const commissionSummary = buildMerchantCommissionSummary(db, user.id);
      const currentBalance = transactions
        .filter((transaction) => ['payment', 'income'].includes(transaction.type))
        .reduce((sum, transaction) => sum + transaction.amount, 0) -
        transactions
          .filter((transaction) => transaction.type === 'payout' && ['pending', 'success'].includes(transaction.status))
          .reduce((sum, transaction) => sum + transaction.amount, 0);
      const pendingPayouts = transactions
        .filter((transaction) => transaction.type === 'payout' && transaction.status === 'pending')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalWithdrawn = transactions
        .filter((transaction) => transaction.type === 'payout' && transaction.status === 'success')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      sendJson(res, 200, {
        wallet: {
          currentBalance,
          pendingPayouts,
          totalWithdrawn,
          grossSales: commissionSummary.grossSales,
          commissionAmount: commissionSummary.commissionAmount,
          netRevenue: commissionSummary.netRevenue,
          averageCommissionRate: commissionSummary.averageCommissionRate
        },
        transactions
      });
      return;
    }

    if (pathname === '/api/wallet/merchant/payout' && req.method === 'POST') {
      const user = await requireRole(req, res, ['MERCHANT', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const existingTransactions = db.transactions.filter((transaction) => transaction.userId === user.id);
      const currentBalance = existingTransactions
        .filter((transaction) => ['payment', 'income'].includes(transaction.type))
        .reduce((sum, transaction) => sum + transaction.amount, 0) -
        existingTransactions
          .filter((transaction) => transaction.type === 'payout' && ['pending', 'success'].includes(transaction.status))
          .reduce((sum, transaction) => sum + transaction.amount, 0);
      const requestedAmount = Number(body.amount || 0);

      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        sendJson(res, 400, { error: 'Invalid payout amount.' });
        return;
      }

      if (requestedAmount > currentBalance) {
        sendJson(res, 400, { error: 'Payout amount exceeds available balance.' });
        return;
      }

      const transaction = createTransaction(db, {
        userId: user.id,
        orderId: 'N/A',
        amount: requestedAmount,
        type: 'payout',
        status: 'pending',
        method: 'MTN MoMo Transfer',
        tx_ref: `PAYOUT-${Date.now()}`
      });
      createNotification(db, {
        userId: user.id,
        role: 'MERCHANT',
        title: 'Payout Requested',
        message: `Your payout request for RWF ${transaction.amount.toLocaleString()} is pending review.`,
        type: 'info'
      });
      await sendPlatformEmail(db, {
        to: user.email,
        subject: 'Your E-Malla Payout Request Was Submitted',
        template: 'payout_requested',
        body: `Your payout request for RWF ${transaction.amount.toLocaleString()} is pending review.`,
        html: createEmailHtml({
          title: 'Payout request submitted',
          intro: 'Finance team yacu yakiriye payout request yawe kandi iri mu isuzuma.',
          sections: [
            { label: 'Amount', value: `RWF ${transaction.amount.toLocaleString()}` },
            { label: 'Reference', value: transaction.tx_ref },
            { label: 'Status', value: 'Pending review' }
          ],
          closing: 'Uzoherezwa email yongeyeho iyo payout yawe yemerewe cyangwa yanze.'
        })
      });
      await writeDb(db);
      sendJson(res, 201, { transaction });
      return;
    }

    if (pathname === '/api/wallet/rider' && req.method === 'GET') {
      const user = await requireRole(req, res, ['DELIVERY', 'ADMIN']);
      if (!user) return;

      const db = await readDb();
      const transactions = db.transactions.filter((transaction) => transaction.userId === user.id);
      const week = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const today = week;
      const pendingClearance = transactions
        .filter((transaction) => transaction.status === 'pending')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const walletBalance = transactions
        .filter((transaction) => ['income', 'payment'].includes(transaction.type))
        .reduce((sum, transaction) => sum + transaction.amount, 0) -
        transactions
          .filter((transaction) => transaction.type === 'payout')
          .reduce((sum, transaction) => sum + transaction.amount, 0);

      sendJson(res, 200, {
        summary: { today, week, walletBalance, pendingClearance },
        transactions
      });
      return;
    }

    if (pathname === '/api/rider/status' && req.method === 'PUT') {
      const user = await requireRole(req, res, ['DELIVERY', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const index = db.users.findIndex((entry) => entry.id === user.id);

      if (index === -1) {
        sendJson(res, 404, { error: 'Rider not found' });
        return;
      }

      const requestedStatus = body.isOnline ? 'active' : 'offline';
      db.users[index] = {
        ...db.users[index],
        status: requestedStatus,
        updatedAt: new Date().toISOString()
      };
      createAuditLog(db, {
        event: `Rider availability changed to ${requestedStatus}`,
        actor: user.name || user.email,
        category: 'riders',
        status: requestedStatus === 'offline' ? 'info' : 'success',
        metadata: {
          riderId: user.id,
          riderName: user.name,
          status: requestedStatus
        }
      });

      await writeDb(db);
      sendJson(res, 200, {
        rider: {
          ...sanitizeUser(db.users[index]),
          operationalStatus: body.isOnline ? 'available' : 'offline'
        }
      });
      return;
    }

    if (pathname === '/api/rider/profile' && req.method === 'GET') {
      const user = await requireRole(req, res, ['DELIVERY', 'ADMIN']);
      if (!user) return;

      const db = await readRiderDashboardRecords(user.id);
      const deliveries = db.orders.filter((order) => order.riderId === user.id);
      const riderSettings = user.riderSettings || {};
      sendJson(res, 200, {
        rider: {
          id: user.id,
          name: user.name,
          phone: user.phone || '078111222',
          status: user.status === 'active' ? 'available' : 'offline',
          vehicleNumber: riderSettings.vehicleNumber || 'RE 123 A',
          rating: 4.8,
          totalDeliveries: deliveries.length,
          mobileMoneyNumber: riderSettings.mobileMoneyNumber || user.phone || '',
          emergencyContact: riderSettings.emergencyContact || '',
          earnings: db.transactions
            .filter((transaction) => transaction.userId === user.id)
            .reduce((sum, transaction) => sum + transaction.amount, 0)
        }
      });
      return;
    }

    if (pathname === '/api/rider/profile' && req.method === 'PUT') {
      const user = await requireRole(req, res, ['DELIVERY', 'ADMIN']);
      if (!user) return;

      const body = await readBody(req);
      const db = await readDb();
      const index = db.users.findIndex((entry) => entry.id === user.id);

      if (index === -1) {
        sendJson(res, 404, { error: 'Rider account not found.' });
        return;
      }

      const nextPhone = String(body.phone || '').trim();
      if (!nextPhone) {
        sendJson(res, 400, { error: 'Phone number is required.' });
        return;
      }

      const current = db.users[index];
      const updatedUser = {
        ...current,
        phone: nextPhone,
        riderSettings: {
          ...(current.riderSettings || {}),
          mobileMoneyNumber: String(body.mobileMoneyNumber || '').trim(),
          vehicleNumber: String(body.vehicleNumber || '').trim(),
          emergencyContact: String(body.emergencyContact || '').trim()
        }
      };

      db.users[index] = updatedUser;
      createAuditLog(db, {
        event: `Rider settings updated: ${updatedUser.name}`,
        actor: updatedUser.name || updatedUser.email,
        category: 'riders',
        status: 'success',
        metadata: {
          riderId: updatedUser.id,
          riderEmail: updatedUser.email
        }
      });
      await writeDb(db);

      const deliveries = db.orders.filter((order) => order.riderId === updatedUser.id);
      sendJson(res, 200, {
        user: sanitizeUser(updatedUser),
        rider: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone || '',
          status: updatedUser.status === 'active' ? 'available' : 'offline',
          vehicleNumber: updatedUser.riderSettings?.vehicleNumber || '',
          rating: Number(updatedUser.rating || 0),
          totalDeliveries: deliveries.length,
          mobileMoneyNumber: updatedUser.riderSettings?.mobileMoneyNumber || updatedUser.phone || '',
          emergencyContact: updatedUser.riderSettings?.emergencyContact || '',
          earnings: db.transactions
            .filter((transaction) => transaction.userId === updatedUser.id)
            .reduce((sum, transaction) => sum + transaction.amount, 0)
        }
      });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    sendJson(res, statusCode, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

const shutdownServer = (signal) => {
  const runtime = getRuntimeConfig();
  const message = runtime.isProduction
    ? `E-Malla backend received ${signal}, shutting down gracefully.`
    : `[dev] E-Malla backend received ${signal}, shutting down gracefully.`;
  console.log(message);
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdownServer(signal));
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error instanceof Error ? error.message : error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error instanceof Error ? error.message : error);
  shutdownServer('uncaughtException');
});

loadEnv()
  .then(() => {
    assertProductionEnv();
    return ensureDb();
  })
  .then(() => {
    server.listen(PORT, () => {
      const runtime = getRuntimeConfig();
      const bindMessage = runtime.isProduction
        ? `E-Malla backend listening on port ${PORT}`
        : `E-Malla backend running on http://localhost:${PORT}`;
      console.log(bindMessage);
      setTimeout(() => {
        warmPublicReadCaches();
      }, 1000);
    });
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
