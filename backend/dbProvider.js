import * as jsonDb from './db.js';
import { createPostgresAdapter, getPostgresStatus } from './dbPostgres.js';
import { getDatabaseConfig, getRuntimeConfig } from './env.js';

let activeAdapter;
let fallbackAdapter;
let fallbackState = null;

const FALLBACK_ERROR_PATTERNS = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'Connection terminated due to connection timeout',
  'timeout expired',
  'connect timeout'
];

const isRecoverablePostgresError = (error) => {
  if (!error) return false;

  const rawMessage = [
    error.code,
    error.message,
    error.cause?.code,
    error.cause?.message,
    error.errors?.map((entry) => `${entry?.code || ''} ${entry?.message || ''}`).join(' ')
  ]
    .filter(Boolean)
    .join(' ');

  return FALLBACK_ERROR_PATTERNS.some((pattern) => rawMessage.includes(pattern));
};

const getFallbackDetails = (error) => ({
  active: true,
  since: new Date().toISOString(),
  reason: error instanceof Error ? error.message : 'Database connection fallback triggered.'
});

const getJsonAdapter = () => {
  if (fallbackAdapter) {
    return fallbackAdapter;
  }

  fallbackAdapter = {
    provider: 'json',
    configured: true,
    readDb: jsonDb.readDb,
    readProducts: async () => {
      const snapshot = await jsonDb.readDb();
      return snapshot.products || [];
    },
    readOrders: async () => {
      const snapshot = await jsonDb.readDb();
      return snapshot.orders || [];
    },
    readCheckoutData: async (options = {}) => {
      const snapshot = await jsonDb.readDb();
      if (!options.orderId) {
        return snapshot;
      }

      return {
        ...snapshot,
        orders: (snapshot.orders || []).filter((entry) => entry.id === options.orderId)
      };
    },
    readPublicInsightsData: async () => {
      const snapshot = await jsonDb.readDb();
      return {
        users: snapshot.users || [],
        orders: snapshot.orders || [],
        sellerApplications: snapshot.sellerApplications || []
      };
    },
    readAdminStatsData: async () => {
      const snapshot = await jsonDb.readDb();
      return {
        users: snapshot.users || [],
        sessions: snapshot.sessions || [],
        orders: snapshot.orders || [],
        sellerApplications: snapshot.sellerApplications || [],
        auditLogs: snapshot.auditLogs || [],
        products: snapshot.products || [],
        notifications: snapshot.notifications || []
      };
    },
    readAdminRidersData: async () => {
      const snapshot = await jsonDb.readDb();
      return {
        users: snapshot.users || [],
        orders: snapshot.orders || [],
        transactions: snapshot.transactions || []
      };
    },
    readRiderDashboardData: async (userId) => {
      const snapshot = await jsonDb.readDb();
      return {
        orders: (snapshot.orders || []).filter((entry) => entry.riderId === userId),
        transactions: (snapshot.transactions || []).filter((entry) => entry.userId === userId)
      };
    },
    readAuthUserByIdentity: async (identity) => {
      const snapshot = await jsonDb.readDb();
      const normalized = String(identity || '').toLowerCase().trim();
      const user = (snapshot.users || []).find(
        (entry) =>
          String(entry.email || '').toLowerCase() === normalized ||
          String(entry.username || '').toLowerCase() === normalized
      ) || null;
      return user;
    },
    findLatestSellerApplicationByEmail: async (email) => {
      const snapshot = await jsonDb.readDb();
      const normalized = String(email || '').toLowerCase().trim();
      return (snapshot.sellerApplications || [])
        .filter((entry) => String(entry.email || '').toLowerCase() === normalized)
        .sort((left, right) => new Date(right.resubmittedAt || right.updatedAt || right.createdAt || 0).getTime() - new Date(left.resubmittedAt || left.updatedAt || left.createdAt || 0).getTime())[0] || null;
    },
    findLatestRiderApplicationByEmail: async (email) => {
      const snapshot = await jsonDb.readDb();
      const normalized = String(email || '').toLowerCase().trim();
      return (snapshot.riderApplications || [])
        .filter((entry) => String(entry.email || '').toLowerCase() === normalized)
        .sort((left, right) => new Date(right.resubmittedAt || right.updatedAt || right.createdAt || 0).getTime() - new Date(left.resubmittedAt || left.updatedAt || left.createdAt || 0).getTime())[0] || null;
    },
    createAuthUser: async (user) => {
      const snapshot = await jsonDb.readDb();
      snapshot.users = snapshot.users || [];
      snapshot.users.unshift(user);
      await jsonDb.writeDb(snapshot);
      return user;
    },
    saveSellerApplication: async (application) => {
      const snapshot = await jsonDb.readDb();
      snapshot.sellerApplications = snapshot.sellerApplications || [];
      const index = snapshot.sellerApplications.findIndex((entry) => entry.id === application.id);
      if (index >= 0) {
        snapshot.sellerApplications[index] = application;
      } else {
        snapshot.sellerApplications.unshift(application);
      }
      await jsonDb.writeDb(snapshot);
      return application;
    },
    saveRiderApplication: async (application) => {
      const snapshot = await jsonDb.readDb();
      snapshot.riderApplications = snapshot.riderApplications || [];
      const index = snapshot.riderApplications.findIndex((entry) => entry.id === application.id);
      if (index >= 0) {
        snapshot.riderApplications[index] = application;
      } else {
        snapshot.riderApplications.unshift(application);
      }
      await jsonDb.writeDb(snapshot);
      return application;
    },
    persistAuthLogin: async ({ userId, token, userAgent, timestamp, passwordHash }) => {
      const snapshot = await jsonDb.readDb();
      const userIndex = (snapshot.users || []).findIndex((entry) => entry.id === userId);
      if (userIndex === -1) {
        throw new Error('User account not found.');
      }

      snapshot.tokens = snapshot.tokens || {};
      snapshot.tokens[token] = { userId, createdAt: timestamp };
      snapshot.sessions = snapshot.sessions || [];
      snapshot.sessions.unshift({
        id: `SES-${Date.now()}`,
        token,
        userId,
        createdAt: timestamp,
        expiresAt: null,
        lastSeenAt: timestamp,
        userAgent: userAgent || 'Unknown device'
      });
      snapshot.users[userIndex] = {
        ...snapshot.users[userIndex],
        password: passwordHash || snapshot.users[userIndex].password,
        lastLoginAt: timestamp,
        updatedAt: timestamp
      };

      await jsonDb.writeDb(snapshot);
      return snapshot.users[userIndex];
    },
    readAuthUserByToken: async (token) => {
      const snapshot = await jsonDb.readDb();
      const tokenRecord = snapshot.tokens?.[token];
      const userId = typeof tokenRecord === 'string' ? tokenRecord : tokenRecord?.userId;
      const user = (snapshot.users || []).find((entry) => entry.id === userId) || null;
      return {
        user,
        createdAt: typeof tokenRecord === 'object' ? tokenRecord?.createdAt : null
      };
    },
    touchSessionByToken: async (token, timestamp) => {
      const snapshot = await jsonDb.readDb();
      if (!Array.isArray(snapshot.sessions)) return;
      const index = snapshot.sessions.findIndex((entry) => entry.token === token);
      if (index === -1) return;
      snapshot.sessions[index] = {
        ...snapshot.sessions[index],
        lastSeenAt: timestamp
      };
      await jsonDb.writeDb(snapshot);
    },
    deleteAuthToken: async (token) => {
      const snapshot = await jsonDb.readDb();
      if (snapshot.tokens?.[token]) {
        delete snapshot.tokens[token];
      }
      snapshot.sessions = (snapshot.sessions || []).filter((entry) => entry.token !== token);
      await jsonDb.writeDb(snapshot);
    },
    deleteAuthSessionById: async (sessionId) => {
      const snapshot = await jsonDb.readDb();
      const session = (snapshot.sessions || []).find((entry) => entry.id === sessionId);
      if (session?.token && snapshot.tokens?.[session.token]) {
        delete snapshot.tokens[session.token];
      }
      snapshot.sessions = (snapshot.sessions || []).filter((entry) => entry.id !== sessionId);
      await jsonDb.writeDb(snapshot);
    },
    deleteAuthTokensByUserId: async (userId) => {
      const snapshot = await jsonDb.readDb();
      Object.keys(snapshot.tokens || {}).forEach((token) => {
        const tokenRecord = snapshot.tokens[token];
        const tokenUserId = typeof tokenRecord === 'string' ? tokenRecord : tokenRecord?.userId;
        if (tokenUserId === userId) {
          delete snapshot.tokens[token];
        }
      });
      snapshot.sessions = (snapshot.sessions || []).filter((entry) => entry.userId !== userId);
      await jsonDb.writeDb(snapshot);
    },
    persistCheckoutBundle: async (bundle = {}) => {
      const snapshot = await jsonDb.readDb();
      const updatedProducts = [];
      snapshot.orders = snapshot.orders || [];
      snapshot.products = snapshot.products || [];
      snapshot.payments = snapshot.payments || [];
      snapshot.transactions = snapshot.transactions || [];
      snapshot.notifications = snapshot.notifications || [];
      snapshot.auditLogs = snapshot.auditLogs || [];
      snapshot.emailLogs = snapshot.emailLogs || [];

      const upsertById = (collection, entry) => {
        const index = collection.findIndex((item) => item.id === entry.id);
        if (index >= 0) {
          collection[index] = entry;
        } else {
          collection.unshift(entry);
        }
      };

      if (bundle.inventoryReleaseOrderId) {
        const existingOrder = snapshot.orders.find((entry) => entry.id === bundle.inventoryReleaseOrderId);
        if (existingOrder?.inventoryRestockedAt) {
          const error = new Error('This order inventory has already been restored.');
          error.statusCode = 409;
          throw error;
        }
      }

      for (const adjustment of bundle.inventoryAdjustments || []) {
        const product = snapshot.products.find((entry) => entry.id === adjustment.productId);
        if (!product) {
          const error = new Error('A product in your cart is no longer available.');
          error.statusCode = 409;
          throw error;
        }

        const delta = Number(adjustment.delta || 0);
        const nextStock = Number(product.stock || 0) + delta;
        if (!Number.isInteger(delta) || nextStock < 0) {
          const error = new Error(`${product.name || 'Product'} only has ${Number(product.stock || 0)} unit(s) available.`);
          error.statusCode = 409;
          throw error;
        }

        product.stock = nextStock;
        product.updatedAt = new Date().toISOString();
        updatedProducts.push({ id: product.id, name: product.name, stock: nextStock });
      }

      (bundle.orders || []).forEach((entry) => upsertById(snapshot.orders, entry));
      (bundle.payments || []).forEach((entry) => upsertById(snapshot.payments, entry));
      (bundle.transactions || []).forEach((entry) => upsertById(snapshot.transactions, entry));
      (bundle.notifications || []).forEach((entry) => upsertById(snapshot.notifications, entry));
      (bundle.auditLogs || []).forEach((entry) => upsertById(snapshot.auditLogs, entry));
      (bundle.emailLogs || []).forEach((entry) => upsertById(snapshot.emailLogs, entry));

      await jsonDb.writeDb(snapshot);
      return { updatedProducts };
    },
    writeDb: jsonDb.writeDb,
    ensureDb: jsonDb.ensureDb
  };

  return fallbackAdapter;
};

const activateJsonFallback = (error) => {
  fallbackState = getFallbackDetails(error);
  activeAdapter = getJsonAdapter();
  console.warn(`[dbProvider] Postgres unavailable, switched to JSON fallback: ${fallbackState.reason}`);
  return activeAdapter;
};

const createActiveAdapter = () => {
  const config = getDatabaseConfig();

  if (config.provider === 'postgres') {
    const postgresAdapter = createPostgresAdapter();
    const jsonAdapter = getJsonAdapter();
    const runtime = getRuntimeConfig();

    const callWithFallback = async (methodName, ...args) => {
      if (fallbackState?.active && config.allowJsonFallback) {
        return jsonAdapter[methodName](...args);
      }

      try {
        return await postgresAdapter[methodName](...args);
      } catch (error) {
        if (!config.allowJsonFallback || runtime.isProduction || !isRecoverablePostgresError(error)) {
          throw error;
        }

        activateJsonFallback(error);
        return jsonAdapter[methodName](...args);
      }
    };

    return {
      provider: 'postgres',
      configured: true,
      ensureDb: () => callWithFallback('ensureDb'),
      readDb: () => callWithFallback('readDb'),
      readProducts: () => callWithFallback('readProducts'),
      readOrders: () => callWithFallback('readOrders'),
      readCheckoutData: (options) => callWithFallback('readCheckoutData', options),
      readPublicInsightsData: () => callWithFallback('readPublicInsightsData'),
      readAdminStatsData: () => callWithFallback('readAdminStatsData'),
      readAdminRidersData: () => callWithFallback('readAdminRidersData'),
      readRiderDashboardData: (userId) => callWithFallback('readRiderDashboardData', userId),
      readAuthUserByIdentity: (identity) => callWithFallback('readAuthUserByIdentity', identity),
      findLatestSellerApplicationByEmail: (email) => callWithFallback('findLatestSellerApplicationByEmail', email),
      findLatestRiderApplicationByEmail: (email) => callWithFallback('findLatestRiderApplicationByEmail', email),
      createAuthUser: (user) => callWithFallback('createAuthUser', user),
      saveSellerApplication: (application) => callWithFallback('saveSellerApplication', application),
      saveRiderApplication: (application) => callWithFallback('saveRiderApplication', application),
      persistAuthLogin: (payload) => callWithFallback('persistAuthLogin', payload),
      readAuthUserByToken: (token) => callWithFallback('readAuthUserByToken', token),
      touchSessionByToken: (token, timestamp) => callWithFallback('touchSessionByToken', token, timestamp),
      deleteAuthToken: (token) => callWithFallback('deleteAuthToken', token),
      deleteAuthSessionById: (sessionId) => callWithFallback('deleteAuthSessionById', sessionId),
      deleteAuthTokensByUserId: (userId) => callWithFallback('deleteAuthTokensByUserId', userId),
      persistCheckoutBundle: (bundle) => callWithFallback('persistCheckoutBundle', bundle),
      writeDb: (db) => callWithFallback('writeDb', db)
    };
  }

  return getJsonAdapter();
};

const getAdapter = () => {
  if (!activeAdapter) {
    activeAdapter = createActiveAdapter();
  }

  return activeAdapter;
};

export const getDatabaseStatus = () => {
  const config = getDatabaseConfig();
  const runtime = getRuntimeConfig();

  if (config.provider === 'postgres') {
    return {
      ...getPostgresStatus(),
      fallback: fallbackState,
      mode: fallbackState?.active ? 'json-fallback' : 'postgres',
      strictProduction: runtime.isProduction,
      fallbackAllowed: config.allowJsonFallback
    };
  }

  return {
    provider: 'json',
    configured: true,
    hasDatabaseUrl: Boolean(config.databaseUrl),
    mode: 'json',
    strictProduction: runtime.isProduction,
    fallbackAllowed: config.allowJsonFallback
  };
};

export const ensureDb = async () => getAdapter().ensureDb();

export const readDb = async () => getAdapter().readDb();

export const readProducts = async () => {
  const adapter = getAdapter();
  if (typeof adapter.readProducts === 'function') {
    return adapter.readProducts();
  }

  const snapshot = await adapter.readDb();
  return snapshot.products || [];
};

export const readOrders = async () => {
  const adapter = getAdapter();
  if (typeof adapter.readOrders === 'function') {
    return adapter.readOrders();
  }

  const snapshot = await adapter.readDb();
  return snapshot.orders || [];
};

export const readCheckoutData = async (options = {}) => {
  const adapter = getAdapter();
  if (typeof adapter.readCheckoutData === 'function') {
    return adapter.readCheckoutData(options);
  }

  return adapter.readDb();
};

export const readPublicInsightsData = async () => {
  const adapter = getAdapter();
  if (typeof adapter.readPublicInsightsData === 'function') {
    return adapter.readPublicInsightsData();
  }

  const snapshot = await adapter.readDb();
  return {
    users: snapshot.users || [],
    orders: snapshot.orders || [],
    sellerApplications: snapshot.sellerApplications || []
  };
};

export const readAdminStatsData = async () => {
  const adapter = getAdapter();
  if (typeof adapter.readAdminStatsData === 'function') {
    return adapter.readAdminStatsData();
  }

  const snapshot = await adapter.readDb();
  return {
    users: snapshot.users || [],
    sessions: snapshot.sessions || [],
    orders: snapshot.orders || [],
    sellerApplications: snapshot.sellerApplications || [],
    auditLogs: snapshot.auditLogs || [],
    products: snapshot.products || [],
    notifications: snapshot.notifications || []
  };
};

export const readAdminRidersData = async () => {
  const adapter = getAdapter();
  if (typeof adapter.readAdminRidersData === 'function') {
    return adapter.readAdminRidersData();
  }

  const snapshot = await adapter.readDb();
  return {
    users: snapshot.users || [],
    orders: snapshot.orders || [],
    transactions: snapshot.transactions || []
  };
};

export const readRiderDashboardData = async (userId) => {
  const adapter = getAdapter();
  if (typeof adapter.readRiderDashboardData === 'function') {
    return adapter.readRiderDashboardData(userId);
  }

  const snapshot = await adapter.readDb();
  return {
    orders: (snapshot.orders || []).filter((entry) => entry.riderId === userId),
    transactions: (snapshot.transactions || []).filter((entry) => entry.userId === userId)
  };
};

export const readAuthUserByIdentity = async (identity) => {
  const adapter = getAdapter();
  if (typeof adapter.readAuthUserByIdentity === 'function') {
    return adapter.readAuthUserByIdentity(identity);
  }

  const snapshot = await adapter.readDb();
  const normalized = String(identity || '').toLowerCase().trim();
  return (snapshot.users || []).find(
    (entry) =>
      String(entry.email || '').toLowerCase() === normalized ||
      String(entry.username || '').toLowerCase() === normalized
  ) || null;
};

export const persistAuthLogin = async (payload) => {
  const adapter = getAdapter();
  if (typeof adapter.persistAuthLogin === 'function') {
    return adapter.persistAuthLogin(payload);
  }
};

export const findLatestSellerApplicationByEmail = async (email) => {
  const adapter = getAdapter();
  if (typeof adapter.findLatestSellerApplicationByEmail === 'function') {
    return adapter.findLatestSellerApplicationByEmail(email);
  }
};

export const findLatestRiderApplicationByEmail = async (email) => {
  const adapter = getAdapter();
  if (typeof adapter.findLatestRiderApplicationByEmail === 'function') {
    return adapter.findLatestRiderApplicationByEmail(email);
  }
};

export const createAuthUser = async (user) => {
  const adapter = getAdapter();
  if (typeof adapter.createAuthUser === 'function') {
    return adapter.createAuthUser(user);
  }
};

export const saveSellerApplication = async (application) => {
  const adapter = getAdapter();
  if (typeof adapter.saveSellerApplication === 'function') {
    return adapter.saveSellerApplication(application);
  }
};

export const saveRiderApplication = async (application) => {
  const adapter = getAdapter();
  if (typeof adapter.saveRiderApplication === 'function') {
    return adapter.saveRiderApplication(application);
  }
};

export const readAuthUserByToken = async (token) => {
  const adapter = getAdapter();
  if (typeof adapter.readAuthUserByToken === 'function') {
    return adapter.readAuthUserByToken(token);
  }

  const snapshot = await adapter.readDb();
  const tokenRecord = snapshot.tokens?.[token];
  const userId = typeof tokenRecord === 'string' ? tokenRecord : tokenRecord?.userId;
  const user = (snapshot.users || []).find((entry) => entry.id === userId) || null;
  return {
    user,
    createdAt: typeof tokenRecord === 'object' ? tokenRecord?.createdAt : null
  };
};

export const touchSessionByToken = async (token, timestamp) => {
  const adapter = getAdapter();
  if (typeof adapter.touchSessionByToken === 'function') {
    return adapter.touchSessionByToken(token, timestamp);
  }
};

export const deleteAuthToken = async (token) => {
  const adapter = getAdapter();
  if (typeof adapter.deleteAuthToken === 'function') {
    return adapter.deleteAuthToken(token);
  }
};

export const deleteAuthSessionById = async (sessionId) => {
  const adapter = getAdapter();
  if (typeof adapter.deleteAuthSessionById === 'function') {
    return adapter.deleteAuthSessionById(sessionId);
  }
};

export const deleteAuthTokensByUserId = async (userId) => {
  const adapter = getAdapter();
  if (typeof adapter.deleteAuthTokensByUserId === 'function') {
    return adapter.deleteAuthTokensByUserId(userId);
  }
};

export const persistCheckoutBundle = async (bundle) => {
  const adapter = getAdapter();
  if (typeof adapter.persistCheckoutBundle === 'function') {
    return adapter.persistCheckoutBundle(bundle);
  }

  const snapshot = await adapter.readDb();
  snapshot.orders = snapshot.orders || [];
  snapshot.payments = snapshot.payments || [];
  snapshot.transactions = snapshot.transactions || [];
  snapshot.notifications = snapshot.notifications || [];
  snapshot.auditLogs = snapshot.auditLogs || [];
  await adapter.writeDb(snapshot);
};

export const writeDb = async (db) => getAdapter().writeDb(db);
