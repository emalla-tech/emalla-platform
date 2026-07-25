const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const CANONICAL_PUBLIC_APP_URL = 'https://www.emallarwanda.com';

const normalizePublicAppUrl = (value: string) => {
  const trimmed = trimTrailingSlash(String(value || '').trim());
  if (!trimmed || trimmed === '/') return CANONICAL_PUBLIC_APP_URL;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'emallarwanda.com' || hostname.endsWith('.vercel.app')) {
      return CANONICAL_PUBLIC_APP_URL;
    }
  } catch {
    return CANONICAL_PUBLIC_APP_URL;
  }

  return trimmed;
};

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'
);

export const PUBLIC_APP_URL = normalizePublicAppUrl(
  import.meta.env.VITE_PUBLIC_APP_URL || '/'
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return `${API_BASE_URL}/api${normalizedPath}`;
};
