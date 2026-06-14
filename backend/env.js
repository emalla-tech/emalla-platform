import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PUBLIC_APP_URL = 'http://127.0.0.1:3000';
const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:3000', 'http://localhost:3000'];

let envLoaded = false;

const parseEnvFile = (content) => {
  const entries = {};

  String(content || '')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex < 0) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      entries[key] = value;
    });

  return entries;
};

const normalizeNodeEnv = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'production' || normalized === 'test') {
    return normalized;
  }
  return 'development';
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const splitCsv = (value = '', fallback = []) => {
  const items = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
};

const isPlaceholderValue = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('replace_with') || normalized.includes('yourdomain.com');
};

const getNodeEnv = () => normalizeNodeEnv(process.env.NODE_ENV);
const isProduction = () => getNodeEnv() === 'production';

export const loadEnv = async () => {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.join(ROOT_DIR, '.env.local'),
    path.join(ROOT_DIR, '.env')
  ];

  for (const filePath of candidates) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = parseEnvFile(content);
      Object.entries(parsed).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
    } catch {
      // Ignore missing env files so local development keeps working.
    }
  }

  process.env.NODE_ENV = getNodeEnv();
  envLoaded = true;
};

export const getRuntimeConfig = () => ({
  nodeEnv: getNodeEnv(),
  isProduction: isProduction(),
  isDevelopment: getNodeEnv() === 'development',
  allowDevFallbacks: getNodeEnv() !== 'production',
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction()),
  port: parsePositiveNumber(process.env.PORT, 4000),
  logLevel: String(process.env.LOG_LEVEL || (isProduction() ? 'info' : 'debug')).toLowerCase()
});

export const getAuthConfig = () => ({
  jwtSecret: String(process.env.JWT_SECRET || '').trim(),
  sessionSecret: String(process.env.SESSION_SECRET || '').trim(),
  sessionMaxAgeDays: parsePositiveNumber(process.env.AUTH_SESSION_MAX_AGE_DAYS, 30)
});

export const getEmailConfig = () => ({
  provider: String(process.env.EMAIL_PROVIDER || 'log').toLowerCase(),
  fromEmail: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@emalla.rw',
  fromName: process.env.EMAIL_FROM_NAME || 'E-Malla Rwanda',
  resendApiKey: process.env.RESEND_API_KEY || '',
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'admin@emalla.rw'
});

export const getStorageConfig = () => ({
  provider: String(process.env.STORAGE_PROVIDER || 'log').toLowerCase(),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'e-malla',
  maxImageUploadMb: parsePositiveNumber(process.env.MAX_IMAGE_UPLOAD_MB, 8),
  maxDocumentUploadMb: parsePositiveNumber(process.env.MAX_DOCUMENT_UPLOAD_MB, 12)
});

export const getPaymentConfig = () => ({
  gtbankMerchantCode: String(process.env.GTBANK_MERCHANT_CODE || '551000093').trim(),
  gtbankRecipientName: String(process.env.GTBANK_RECIPIENT_NAME || 'Perfect Technologies Ltd').trim()
});

export const getDatabaseConfig = () => {
  const runtime = getRuntimeConfig();
  const requestedProvider = String(process.env.DB_PROVIDER || (runtime.isProduction ? 'postgres' : 'json')).toLowerCase();
  const provider = runtime.isProduction ? 'postgres' : requestedProvider;

  return {
    provider,
    requestedProvider,
    databaseUrl: String(process.env.DATABASE_URL || '').trim(),
    strictProduction: runtime.isProduction,
    allowJsonFallback: !runtime.isProduction && parseBoolean(process.env.ALLOW_JSON_FALLBACK, true)
  };
};

export const getAppConfig = () => ({
  publicAppUrl: process.env.PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL,
  corsAllowedOrigins: splitCsv(process.env.CORS_ALLOWED_ORIGINS, DEFAULT_CORS_ALLOWED_ORIGINS),
  frontendApiUrl: String(process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || '/api').trim(),
  frontendPublicAppUrl: String(process.env.VITE_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL).trim()
});

export const getEnvValidation = () => {
  const runtime = getRuntimeConfig();
  const database = getDatabaseConfig();
  const auth = getAuthConfig();
  const email = getEmailConfig();
  const storage = getStorageConfig();
  const app = getAppConfig();
  const issues = [];
  const warnings = [];

  if (runtime.isProduction) {
    if (database.provider !== 'postgres') {
      issues.push('Production requires DB_PROVIDER=postgres.');
    }

    if (isPlaceholderValue(database.databaseUrl)) {
      issues.push('DATABASE_URL is missing or still a placeholder.');
    }

    if (isPlaceholderValue(auth.jwtSecret)) {
      issues.push('JWT_SECRET is missing or still a placeholder.');
    }

    if (isPlaceholderValue(auth.sessionSecret)) {
      issues.push('SESSION_SECRET is missing or still a placeholder.');
    }

    if (isPlaceholderValue(app.publicAppUrl) || app.publicAppUrl.includes('127.0.0.1') || app.publicAppUrl.includes('localhost')) {
      issues.push('PUBLIC_APP_URL must point to the real public domain in production.');
    }

    if (!app.corsAllowedOrigins.length) {
      issues.push('CORS_ALLOWED_ORIGINS must include at least one trusted frontend origin.');
    }

    if (email.provider === 'resend') {
      if (isPlaceholderValue(email.resendApiKey)) {
        issues.push('RESEND_API_KEY is missing or still a placeholder.');
      }
      if (isPlaceholderValue(email.fromEmail)) {
        issues.push('RESEND_FROM_EMAIL must be a verified sender address.');
      }
    } else {
      warnings.push('EMAIL_PROVIDER is not set to resend. Production email will stay in log fallback mode.');
    }

    if (storage.provider === 'cloudinary') {
      if (isPlaceholderValue(storage.cloudinaryCloudName)) {
        issues.push('CLOUDINARY_CLOUD_NAME is missing or still a placeholder.');
      }
      if (isPlaceholderValue(storage.cloudinaryApiKey)) {
        issues.push('CLOUDINARY_API_KEY is missing or still a placeholder.');
      }
      if (isPlaceholderValue(storage.cloudinaryApiSecret)) {
        issues.push('CLOUDINARY_API_SECRET is missing or still a placeholder.');
      }
    } else {
      warnings.push('STORAGE_PROVIDER is not set to cloudinary. Production uploads will not use real cloud storage.');
    }
  }

  return {
    runtime,
    issues,
    warnings,
    ready: issues.length === 0
  };
};

export const assertProductionEnv = () => {
  const validation = getEnvValidation();
  if (!validation.runtime.isProduction || validation.ready) {
    return validation;
  }

  const error = new Error(`Production environment validation failed:\n- ${validation.issues.join('\n- ')}`);
  error.validationIssues = validation.issues;
  throw error;
};
