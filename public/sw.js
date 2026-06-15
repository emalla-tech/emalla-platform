const CACHE_VERSION = 'e-malla-pwa-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/robots.txt',
  '/sitemap.xml',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-512.png',
  '/pwa/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

const isNavigationRequest = (request) => request.mode === 'navigate';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    const isStaticAsset = ['style', 'script', 'image', 'font'].includes(request.destination);

    event.respondWith(
      isStaticAsset
        ? caches.match(request).then((cached) => {
            const networkResponse = fetch(request)
              .then((response) => {
                if (response.ok) {
                  const copy = response.clone();
                  caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
              });
            return cached || networkResponse;
          })
        : fetch(request).catch(async () => (await caches.match(request)) || Response.error())
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
