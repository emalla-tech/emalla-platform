import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { getStorageConfig } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_UPLOADS_DIR = path.join(ROOT_DIR, 'public', 'uploads');
const DATA_URL_PATTERN = /^data:([^;]+);base64,/;
const DEFAULT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_DOCUMENT_MIME_TYPES = ['application/pdf'];
const DEFAULT_IMAGE_MAX_UPLOAD_MB = 8;
const DEFAULT_DOCUMENT_MAX_UPLOAD_MB = 12;

const getMimeType = (value = '') => {
  const match = String(value).match(DATA_URL_PATTERN);
  return match ? String(match[1] || '').toLowerCase() : '';
};

const getDataUrlSizeBytes = (value = '') => {
  const payload = String(value).split(',')[1] || '';
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
};

const isDataUrl = (value = '') => DATA_URL_PATTERN.test(String(value || ''));

const createUploadError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizePublicId = (fileName = 'upload') =>
  `${Date.now()}-${String(fileName)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'upload'}`;

const getImageMaxSizeMb = (config) => {
  const configured = Number(config.maxImageUploadMb);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_IMAGE_MAX_UPLOAD_MB;
};

const getDocumentMaxSizeMb = (config) => {
  const configured = Number(config.maxDocumentUploadMb);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_DOCUMENT_MAX_UPLOAD_MB;
};

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'application/pdf': 'pdf'
};

const normalizeCloudinaryFolder = (requestedFolder = 'products', baseFolder = 'e-malla') => {
  const safeBase = String(baseFolder || 'e-malla')
    .trim()
    .replace(/^\/+|\/+$/g, '') || 'e-malla';
  const safeRequested = String(requestedFolder || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');

  if (!safeRequested) return safeBase;
  if (safeRequested === safeBase) return safeBase;
  if (safeRequested.startsWith(`${safeBase}/`)) return safeRequested;

  const segments = safeRequested.split('/').filter(Boolean);
  const suffix = segments[0] === safeBase ? segments.slice(1).join('/') : segments.join('/');
  return suffix ? `${safeBase}/${suffix}` : safeBase;
};

const normalizeLocalFolderSegments = (requestedFolder = 'uploads') =>
  String(requestedFolder || 'uploads')
    .split('/')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry !== '..' && entry !== '.')
    .map((entry) => entry.replace(/[^a-zA-Z0-9-_]/g, '-'));

const ensureWithinDirectory = (targetPath, baseDir) => {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error('Resolved upload path is outside the allowed directory.');
  }
  return resolvedTarget;
};

const writeLocalAsset = async ({ dataUrl, fileName, folder, mimeType }) => {
  const extension = MIME_EXTENSION_MAP[mimeType] || 'bin';
  const safeBaseName = sanitizePublicId(fileName);
  const folderSegments = normalizeLocalFolderSegments(folder);
  const relativeDir = path.join(...folderSegments);
  const targetDir = ensureWithinDirectory(path.join(PUBLIC_UPLOADS_DIR, relativeDir), PUBLIC_UPLOADS_DIR);
  await fs.mkdir(targetDir, { recursive: true });

  const targetFileName = `${safeBaseName}.${extension}`;
  const targetPath = ensureWithinDirectory(path.join(targetDir, targetFileName), PUBLIC_UPLOADS_DIR);
  const payload = String(dataUrl).split(',')[1] || '';
  await fs.writeFile(targetPath, Buffer.from(payload, 'base64'));

  const publicPath = ['uploads', ...folderSegments, targetFileName]
    .join('/')
    .replace(/\\/g, '/');

  return {
    url: `/${publicPath}`,
    provider: 'local',
    publicId: publicPath,
    resourceType: getResourceType(mimeType),
    format: extension,
    mimeType,
    note: 'Stored as a local file because cloud storage is not configured.'
  };
};

const getCloudinaryUploadSignature = ({ folder, publicId, timestamp, apiSecret }) =>
  createHash('sha1')
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

const getAllowedMimeTypes = ({ allowedMimeTypes = [] }) => {
  const normalized = allowedMimeTypes.map((entry) => String(entry || '').toLowerCase()).filter(Boolean);
  return normalized.length ? normalized : DEFAULT_IMAGE_MIME_TYPES;
};

const getResourceType = (mimeType) => (mimeType === 'application/pdf' ? 'raw' : 'image');

const validateUpload = ({ dataUrl, allowedMimeTypes = [], maxSizeMb = DEFAULT_IMAGE_MAX_UPLOAD_MB }) => {
  const mimeType = getMimeType(dataUrl);
  const allowed = getAllowedMimeTypes({ allowedMimeTypes });

  if (!isDataUrl(dataUrl) || !mimeType) {
    throw createUploadError('Upload requires a valid base64 data URL.');
  }

  if (!allowed.includes(mimeType)) {
    throw createUploadError(
      mimeType === 'application/pdf'
        ? 'PDF upload is not allowed for this field.'
        : 'Unsupported file type. Allowed image types are JPG, JPEG, PNG, and WEBP.'
    );
  }

  if (getDataUrlSizeBytes(dataUrl) > maxSizeMb * 1024 * 1024) {
    throw createUploadError(`Upload is too large. Maximum allowed size is ${maxSizeMb}MB.`);
  }

  return mimeType;
};

const tryParseCloudinaryAsset = (url, configuredCloudName = '') => {
  try {
    const parsed = new URL(String(url || ''));
    if (!/cloudinary\.com$/i.test(parsed.hostname)) return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === 'upload');
    if (uploadIndex < 2 || segments[0] !== configuredCloudName) return null;

    const resourceType = segments[1] || 'image';
    const publicIdSegments = segments.slice(uploadIndex + 1);
    if (publicIdSegments[0] && /^v\d+$/i.test(publicIdSegments[0])) {
      publicIdSegments.shift();
    }

    if (!publicIdSegments.length) return null;
    const joined = decodeURIComponent(publicIdSegments.join('/'));
    const publicId = joined.replace(/\.[a-z0-9]+$/i, '');
    if (!publicId) return null;

    return {
      resourceType,
      publicId
    };
  } catch {
    return null;
  }
};

const destroyCloudinaryAsset = async ({ publicId, resourceType = 'image', config }) => {
  if (!publicId || !config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    return { deleted: false, skipped: true };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${config.cloudinaryApiSecret}`)
    .digest('hex');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', config.cloudinaryApiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/${resourceType}/destroy`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Cloudinary delete failed: ${response.status} ${message}`);
  }

  const payload = await response.json();
  return {
    deleted: payload.result === 'ok',
    skipped: payload.result === 'not found',
    result: payload.result || null
  };
};

export const uploadAsset = async ({
  dataUrl,
  fileName = 'upload',
  folder = 'products',
  allowedMimeTypes = DEFAULT_IMAGE_MIME_TYPES,
  maxSizeMb
}) => {
  const config = getStorageConfig();
  const normalizedMimeTypes = getAllowedMimeTypes({ allowedMimeTypes });
  const mimeType = validateUpload({
    dataUrl,
    allowedMimeTypes: normalizedMimeTypes,
    maxSizeMb: maxSizeMb || (normalizedMimeTypes.includes('application/pdf') ? getDocumentMaxSizeMb(config) : getImageMaxSizeMb(config))
  });

  const cloudinaryReady =
    config.provider === 'cloudinary' &&
    config.cloudinaryCloudName &&
    config.cloudinaryApiKey &&
    config.cloudinaryApiSecret;

  if (cloudinaryReady) {
    const resolvedFolder = normalizeCloudinaryFolder(folder, config.cloudinaryUploadFolder);
    const publicId = sanitizePublicId(fileName);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = getCloudinaryUploadSignature({
      folder: resolvedFolder,
      publicId,
      timestamp,
      apiSecret: config.cloudinaryApiSecret
    });

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('api_key', config.cloudinaryApiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', resolvedFolder);
    formData.append('public_id', publicId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/${getResourceType(mimeType)}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} ${message}`);
    }

    const payload = await response.json();
    return {
      url: payload.secure_url || payload.url,
      provider: 'cloudinary',
      publicId: payload.public_id || null,
      resourceType: payload.resource_type || getResourceType(mimeType),
      format: payload.format || null,
      mimeType
    };
  }

  return writeLocalAsset({ dataUrl, fileName, folder, mimeType });
};

export const uploadImageAsset = async ({ dataUrl, fileName = 'upload', folder = 'products' }) =>
  uploadAsset({
    dataUrl,
    fileName,
    folder,
    allowedMimeTypes: DEFAULT_IMAGE_MIME_TYPES
  });

export const deleteAssetByUrl = async (url) => {
  const config = getStorageConfig();
  if (String(url || '').startsWith('/uploads/')) {
    const relativePath = String(url).replace(/^\/+/, '').replace(/\//g, path.sep);
    const targetPath = ensureWithinDirectory(path.join(ROOT_DIR, 'public', relativePath), PUBLIC_UPLOADS_DIR);
    try {
      await fs.unlink(targetPath);
      return { deleted: true, skipped: false, reason: null };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return { deleted: false, skipped: true, reason: 'local_asset_missing' };
      }
      throw error;
    }
  }

  if (config.provider !== 'cloudinary') {
    return { deleted: false, skipped: true, reason: 'provider_not_cloudinary' };
  }

  const asset = tryParseCloudinaryAsset(url, config.cloudinaryCloudName);
  if (!asset) {
    return { deleted: false, skipped: true, reason: 'not_cloudinary_asset' };
  }

  return destroyCloudinaryAsset({
    publicId: asset.publicId,
    resourceType: asset.resourceType || 'image',
    config
  });
};

export const collectRemovedAssetUrls = (previousUrls = [], nextUrls = []) => {
  const nextSet = new Set((nextUrls || []).map((entry) => String(entry || '').trim()).filter(Boolean));
  return (previousUrls || [])
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .filter((entry) => !nextSet.has(entry));
};

export const getStorageHealth = () => {
  const config = getStorageConfig();
  const liveReady = Boolean(
    config.provider === 'cloudinary' &&
      config.cloudinaryCloudName &&
      config.cloudinaryApiKey &&
      config.cloudinaryApiSecret
  );

  return {
    provider: config.provider,
    liveReady,
    baseFolder: config.cloudinaryUploadFolder || 'e-malla',
    maxImageUploadMb: getImageMaxSizeMb(config),
    maxDocumentUploadMb: getDocumentMaxSizeMb(config)
  };
};
