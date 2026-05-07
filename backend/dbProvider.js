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

export const writeDb = async (db) => getAdapter().writeDb(db);
