const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'
);

export const PUBLIC_APP_URL = trimTrailingSlash(
  import.meta.env.VITE_PUBLIC_APP_URL || '/'
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return `${API_BASE_URL}/api${normalizedPath}`;
};
