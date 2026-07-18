import { PUBLIC_APP_URL } from './apiConfig';

const STORAGE_KEY = 'emalla_affiliate_referral';
const ATTRIBUTION_WINDOW_DAYS = 30;

export const AFFILIATE_REFERRAL_PARAM_KEYS = ['ref', 'affiliate', 'aff'] as const;

export interface AffiliateReferral {
  code: string;
  capturedAt: string;
  expiresAt: string;
  sourcePath: string;
}

export const normalizeAffiliateCode = (value = '') => {
  const normalized = String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .toUpperCase();

  return /^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(normalized) ? normalized : '';
};

const getPublicBaseUrl = () => {
  const configuredUrl = String(PUBLIC_APP_URL || '').trim();
  return configuredUrl && configuredUrl !== '/' ? configuredUrl : 'https://www.emallarwanda.com';
};

const getExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_WINDOW_DAYS);
  return expiresAt.toISOString();
};

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export const buildAffiliateLink = (code: string, path = '/') => {
  const normalizedCode = normalizeAffiliateCode(code);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, getPublicBaseUrl());

  if (normalizedCode) {
    url.searchParams.set('ref', normalizedCode);
  }

  return url.toString();
};

export const getAffiliateCodeFromSearch = (search = '') => {
  const params = new URLSearchParams(search);

  for (const key of AFFILIATE_REFERRAL_PARAM_KEYS) {
    const code = normalizeAffiliateCode(params.get(key) || '');
    if (code) {
      return code;
    }
  }

  return '';
};

export const getStoredAffiliateReferral = (): AffiliateReferral | null => {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const referral = JSON.parse(raw) as AffiliateReferral;
    if (!referral?.code || !referral?.expiresAt) return null;
    if (new Date(referral.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return referral;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const captureAffiliateReferralFromLocation = (search = '', sourcePath = '/') => {
  const code = getAffiliateCodeFromSearch(search);
  if (!code || !canUseStorage()) return null;

  const referral: AffiliateReferral = {
    code,
    capturedAt: new Date().toISOString(),
    expiresAt: getExpiryDate(),
    sourcePath
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(referral));
    return referral;
  } catch {
    return null;
  }
};

export const clearStoredAffiliateReferral = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
};
