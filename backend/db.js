import fs from 'fs/promises';
import path from 'path';
import { randomBytes, scryptSync } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'db.json');
let writeQueue = Promise.resolve();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripTrailingJsonNoise = (raw) => {
  const input = String(raw || '').replace(/^\uFEFF/, '');
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      depth += 1;
      continue;
    }

    if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        return input.slice(0, index + 1);
      }
    }
  }

  return input;
};

const parseDbJson = (raw) => JSON.parse(stripTrailingJsonNoise(raw));

const readDbFile = async (attempt = 0) => {
  if (attempt === 0) {
    await writeQueue.catch(() => {});
  }

  const raw = await fs.readFile(DB_PATH, 'utf8');

  try {
    return parseDbJson(raw);
  } catch (error) {
    if (attempt >= 2) {
      throw error;
    }

    await delay(80 * (attempt + 1));
    return readDbFile(attempt + 1);
  }
};

const commitDbWrite = async (payload, attempt = 0) => {
  const tempPath = `${DB_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;

  try {
    await fs.writeFile(tempPath, payload, 'utf8');
    await fs.rename(tempPath, DB_PATH);
  } catch (error) {
    const code = error?.code;

    if ((code === 'EPERM' || code === 'ENOENT') && attempt < 3) {
      await delay(120 * (attempt + 1));
      try {
        await fs.rename(tempPath, DB_PATH);
        return;
      } catch (retryError) {
        try {
          await fs.unlink(tempPath);
        } catch {
          // Ignore cleanup failures.
        }
        return commitDbWrite(payload, attempt + 1);
      }
    }

    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup failures.
    }

    throw error;
  }
};

const writeDbFile = async (db) => {
  const payload = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.catch(() => {}).then(() => commitDbWrite(payload));
  return writeQueue;
};

const LEGACY_ID_MAP = {
  'ADM-001': 'ADM-1001',
  'USR-DEV-001': 'USR-1001',
  'MCH-05': 'MER-1001',
  'RID-001': 'RID-1001'
};

const remapId = (value) => LEGACY_ID_MAP[value] || value;

const remapTokenStore = (tokens = {}) =>
  Object.fromEntries(
    Object.entries(tokens).map(([token, value]) => {
      if (value && typeof value === 'object') {
        return [
          token,
          {
            ...value,
            userId: remapId(value.userId)
          }
        ];
      }

      return [token, remapId(value)];
    })
  );

const PASSWORD_SCHEME = 'scrypt';
const isHashedPassword = (value) => String(value || '').startsWith(`${PASSWORD_SCHEME}$`);
export const hashPassword = (plainPassword) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(plainPassword || ''), salt, 64).toString('hex');
  return `${PASSWORD_SCHEME}$${salt}$${hash}`;
};

const getBootstrapPassword = (key, fallback) => {
  const value = String(process.env[key] || '').trim();
  return value || fallback;
};

const BOOTSTRAP_PASSWORDS = {
  admin: () => getBootstrapPassword('ADMIN_BOOTSTRAP_PASSWORD', 'Admin!2026#Secure'),
  buyer: () => getBootstrapPassword('BUYER_BOOTSTRAP_PASSWORD', 'Buyer!2026#Secure'),
  merchant: () => getBootstrapPassword('MERCHANT_BOOTSTRAP_PASSWORD', 'Merchant!2026#Secure'),
  rider: () => getBootstrapPassword('RIDER_BOOTSTRAP_PASSWORD', 'Rider!2026#Secure')
};

const DEMO_PASSWORD_ROTATIONS = [
  { email: 'admin@emalla.rw', legacy: ['admin123'], next: () => BOOTSTRAP_PASSWORDS.admin() },
  { email: 'buyer@emalla.rw', legacy: ['buyer123'], next: () => BOOTSTRAP_PASSWORDS.buyer() },
  { email: 'merchant@emalla.rw', legacy: ['merchant123'], next: () => BOOTSTRAP_PASSWORDS.merchant() },
  { email: 'rider@emalla.rw', legacy: ['rider123'], next: () => BOOTSTRAP_PASSWORDS.rider() }
];

const migrateLegacySeedIds = (db) => {
  let changed = false;

  if (Array.isArray(db.users)) {
    db.users = db.users.map((user) => {
      const nextId = remapId(user.id);
      if (nextId !== user.id) {
        changed = true;
        return { ...user, id: nextId };
      }
      return user;
    });
  }

  if (db.tokens && typeof db.tokens === 'object') {
    const nextTokens = remapTokenStore(db.tokens);
    if (JSON.stringify(nextTokens) !== JSON.stringify(db.tokens)) {
      db.tokens = nextTokens;
      changed = true;
    }
  }

  const remapKeys = ['userId', 'customerId', 'merchantId', 'riderId'];
  const remapCollection = (items) =>
    items.map((item) => {
      let itemChanged = false;
      const next = { ...item };
      remapKeys.forEach((key) => {
        if (next[key]) {
          const remapped = remapId(next[key]);
          if (remapped !== next[key]) {
            next[key] = remapped;
            itemChanged = true;
          }
        }
      });
      if (next.metadata && typeof next.metadata === 'object') {
        const nextMetadata = { ...next.metadata };
        let metadataChanged = false;
        remapKeys.forEach((key) => {
          if (nextMetadata[key]) {
            const remapped = remapId(nextMetadata[key]);
            if (remapped !== nextMetadata[key]) {
              nextMetadata[key] = remapped;
              metadataChanged = true;
            }
          }
        });
        if (metadataChanged) {
          next.metadata = nextMetadata;
          itemChanged = true;
        }
      }
      if (next.storeSettings && typeof next.storeSettings === 'object') {
        const ownerId = next.storeSettings.ownerId ? remapId(next.storeSettings.ownerId) : next.storeSettings.ownerId;
        if (ownerId !== next.storeSettings.ownerId) {
          next.storeSettings = { ...next.storeSettings, ownerId };
          itemChanged = true;
        }
      }
      if (itemChanged) {
        changed = true;
      }
      return next;
    });

  ['notifications', 'addresses', 'orders', 'transactions', 'products', 'sellerApplications', 'wishlists', 'auditLogs', 'payments'].forEach((key) => {
    if (Array.isArray(db[key])) {
      db[key] = remapCollection(db[key]);
    }
  });

  return changed;
};

const migrateUserPasswords = (db) => {
  let changed = false;

  if (!Array.isArray(db.users)) return changed;

  db.users = db.users.map((user) => {
    const nextUser = { ...user };
    const email = String(user.email || '').toLowerCase().trim();
    const rotation = DEMO_PASSWORD_ROTATIONS.find((entry) => entry.email === email);

    if (rotation && rotation.legacy.includes(String(user.password || '').trim())) {
      nextUser.password = hashPassword(rotation.next());
      nextUser.updatedAt = new Date().toISOString();
      changed = true;
      return nextUser;
    }

    if (!isHashedPassword(user.password)) {
      nextUser.password = hashPassword(String(user.password || '').trim());
      nextUser.updatedAt = new Date().toISOString();
      changed = true;
    }

    return nextUser;
  });

  return changed;
};

const seedDb = () => ({
  users: [
    {
      id: 'ADM-1001',
      name: 'E-Malla Platform Admin',
      username: 'admin',
      email: 'admin@emalla.rw',
      password: hashPassword(BOOTSTRAP_PASSWORDS.admin()),
      role: 'ADMIN',
      status: 'active',
      createdAt: new Date().toISOString(),
      orderCount: 0
    },
    {
      id: 'USR-1001',
      name: 'Claudine Uwera',
      username: 'buyer',
      email: 'buyer@emalla.rw',
      password: hashPassword(BOOTSTRAP_PASSWORDS.buyer()),
      role: 'CUSTOMER',
      status: 'active',
      createdAt: new Date().toISOString(),
      orderCount: 3
    },
    {
      id: 'MER-1001',
      name: 'Akagera Style House',
      username: 'merchant',
      email: 'merchant@emalla.rw',
      password: hashPassword(BOOTSTRAP_PASSWORDS.merchant()),
      role: 'MERCHANT',
      status: 'active',
      createdAt: new Date().toISOString(),
      orderCount: 18
    },
    {
      id: 'RID-1001',
      name: 'Eric Nshimiyimana',
      username: 'rider',
      email: 'rider@emalla.rw',
      password: hashPassword(BOOTSTRAP_PASSWORDS.rider()),
      role: 'DELIVERY',
      status: 'active',
      createdAt: new Date().toISOString(),
      orderCount: 0
    }
  ],
  sellerApplications: [],
  riderApplications: [],
  wishlists: [],
  contactSubmissions: [],
  emailLogs: [],
  auditLogs: [],
  reviews: [],
  passwordResetTokens: [],
  sessions: [],
  adminSettings: {
    preferences: {
      emailAlerts: true,
      auditDigest: true,
      codAlerts: true,
      logisticsAlerts: true
    },
    categoryCommissionRates: {
      '1': 10,
      '2': 12,
      '3': 11,
      '4': 8,
      '5': 13,
      '6': 9
    }
  },
  tokens: {},
  notifications: [
    {
      id: 'nt-001',
      userId: 'USR-1001',
      role: 'CUSTOMER',
      title: 'Order Placed!',
      message: 'Your order EM-2026-0892 is awaiting payment.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { orderId: 'o-001' }
    },
    {
      id: 'nt-002',
      userId: 'MER-1001',
      role: 'MERCHANT',
      title: 'New Incoming Order!',
      message: 'Order EM-2026-0892 has been placed.',
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { orderId: 'o-001' }
    }
  ],
  addresses: [
    {
      id: 'addr-1',
      userId: 'USR-1001',
      name: 'Home',
      district: 'Gasabo',
      sector: 'Kimironko',
      street: 'KG 123 St, House 10',
      isDefault: true
    },
    {
      id: 'addr-2',
      userId: 'USR-1001',
      name: 'Work',
      district: 'Nyarugenge',
      sector: 'Kigali City Tower',
      street: 'KN 2 Rd, Level 5',
      isDefault: false
    }
  ],
  orders: [
    {
      id: 'o-001',
      orderNumber: 'EM-2026-0892',
      customerId: 'USR-1001',
      customerName: 'Claudine Uwera',
      merchantId: 'MER-1001',
      merchantName: 'Akagera Style House',
      items: [{ productId: 'p3', productName: 'Cotton Linen Summer Shirt', quantity: 1, price: 15000, subtotal: 15000 }],
      status: 'on_the_way',
      paymentStatus: 'SUCCESS',
      paymentMethod: 'MOMO',
      deliveryFee: 3500,
      totalAmount: 18500,
      tx_ref: 'EM-TX-892',
      address: 'Gasabo, Kimironko, KG 123 St',
      phone: '0780000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  payments: [],
  transactions: [
    {
      id: 'txn-001',
      userId: 'MER-1001',
      orderId: 'o-001',
      amount: 13500,
      type: 'payment',
      status: 'success',
      method: 'Sale Proceeds (90%)',
      tx_ref: 'EM-TX-892',
      timestamp: new Date().toISOString()
    },
    {
      id: 'txn-002',
      userId: 'RID-1001',
      orderId: 'o-001',
      amount: 3500,
      type: 'income',
      status: 'success',
      method: 'Delivery Fee',
      tx_ref: 'EM-TX-892',
      timestamp: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'p1',
      name: 'Smart Watch Series 7',
      price: 120000,
      category: '1',
      rating: 4.8,
      reviewsCount: 124,
      stock: 15,
      image: '/catalog/electronics.svg',
      images: [
        '/catalog/electronics.svg',
        '/catalog/electronics.svg',
        '/catalog/electronics.svg'
      ],
      description: 'Experience the next level of connectivity with the Smart Watch Series 7.',
      merchantId: 'MCH-01',
      merchantName: 'Kigali Digital Hub',
      status: 'approved',
      featured: true
    },
    {
      id: 'p2',
      name: 'Wireless Noise Cancelling Headphones',
      price: 85000,
      category: '1',
      rating: 4.5,
      reviewsCount: 89,
      stock: 22,
      image: '/catalog/electronics.svg',
      images: [
        '/catalog/electronics.svg',
        '/catalog/electronics.svg'
      ],
      description: 'Immerse yourself in music without distractions.',
      merchantId: 'MCH-01',
      merchantName: 'Kigali Digital Hub',
      status: 'approved',
      featured: true
    },
    {
      id: 'p3',
      name: 'Cotton Linen Summer Shirt',
      price: 15000,
      category: '2',
      rating: 4.2,
      reviewsCount: 45,
      stock: 45,
      image: '/catalog/fashion.svg',
      images: [
        '/catalog/fashion.svg',
        '/catalog/fashion.svg',
        '/catalog/fashion.svg'
      ],
      description: 'Breathable, lightweight cotton linen fabric perfect for the Rwandan climate.',
      merchantId: 'MER-1001',
      merchantName: 'Akagera Style House',
      status: 'approved',
      featured: true
    },
    {
      id: 'p4',
      name: 'Leather Weekend Bag',
      price: 45000,
      category: '2',
      rating: 4.9,
      reviewsCount: 32,
      stock: 8,
      image: '/catalog/fashion.svg',
      description: 'Premium handcrafted leather bag.',
      merchantId: 'MER-1001',
      merchantName: 'Akagera Style House',
      status: 'approved',
      featured: false
    }
  ]
});

export const ensureDb = async () => {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(seedDb(), null, 2), 'utf8');
    return;
  }

  const rawDb = await fs.readFile(DB_PATH, 'utf8');
  const db = parseDbJson(rawDb);
  let changed = false;

  if (migrateLegacySeedIds(db)) {
    changed = true;
  }

  if (migrateUserPasswords(db)) {
    changed = true;
  }

  if (!Array.isArray(db.addresses)) {
    db.addresses = seedDb().addresses;
    changed = true;
  }

  if (!Array.isArray(db.orders)) {
    db.orders = seedDb().orders;
    changed = true;
  }

  if (!Array.isArray(db.payments)) {
    db.payments = [];
    changed = true;
  }

  if (!Array.isArray(db.notifications)) {
    db.notifications = seedDb().notifications;
    changed = true;
  }

  if (!Array.isArray(db.sellerApplications)) {
    db.sellerApplications = [];
    changed = true;
  }

  if (!Array.isArray(db.riderApplications)) {
    db.riderApplications = [];
    changed = true;
  }

  if (!Array.isArray(db.contactSubmissions)) {
    db.contactSubmissions = [];
    changed = true;
  }

  if (!Array.isArray(db.wishlists)) {
    db.wishlists = [];
    changed = true;
  }

  if (!Array.isArray(db.emailLogs)) {
    db.emailLogs = [];
    changed = true;
  }

  if (!Array.isArray(db.passwordResetTokens)) {
    db.passwordResetTokens = [];
    changed = true;
  }

  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
    changed = true;
  }

  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
    changed = true;
  }

  if (!Array.isArray(db.reviews)) {
    db.reviews = [];
    changed = true;
  }

  if (!db.adminSettings || typeof db.adminSettings !== 'object') {
    db.adminSettings = seedDb().adminSettings;
    changed = true;
  } else {
    const mergedPreferences = {
      ...seedDb().adminSettings.preferences,
      ...(db.adminSettings.preferences || {})
    };
    const mergedCategoryCommissionRates = {
      ...seedDb().adminSettings.categoryCommissionRates,
      ...(db.adminSettings.categoryCommissionRates || {})
    };
    if (JSON.stringify(db.adminSettings.preferences || {}) !== JSON.stringify(mergedPreferences)) {
      db.adminSettings.preferences = mergedPreferences;
      changed = true;
    }
    if (JSON.stringify(db.adminSettings.categoryCommissionRates || {}) !== JSON.stringify(mergedCategoryCommissionRates)) {
      db.adminSettings.categoryCommissionRates = mergedCategoryCommissionRates;
      changed = true;
    }
  }

  if (!Array.isArray(db.transactions)) {
    db.transactions = seedDb().transactions;
    changed = true;
  }

  if (changed) {
    await writeDbFile(db);
  }
};

export const readDb = async () => {
  await ensureDb();
  return readDbFile();
};

export const writeDb = async (db) => {
  await writeDbFile(db);
};
