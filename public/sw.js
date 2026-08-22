const CACHE_NAME = 'sultan-pocket-static-v1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/favicon.ico',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Sultan Pocket shows real account balances — we never want to silently serve
// a cached (stale) page for navigations. Network-first always; cache is only
// a fallback for the rare "no connection at all" case, and only static
// assets (icons/manifest) are cache-first since those never change per-user.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (STATIC_ASSETS.some((path) => request.url.endsWith(path))) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
