// sw.js — service worker cache-first pour fonctionnement 100 % hors ligne.
// Le cache est versionné via CACHE_VERSION ; en cas de bump, on purge l'ancien.

const CACHE_VERSION = 'cmcc-v1-2026.1';
const PRECACHE = [
  './',
  './index.html',
  './config.js',
  './products.json',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/products-data.js',
  './js/catalog.js',
  './js/cart.js',
  './js/checkout.js',
  './js/admin.js',
  './js/pwa.js',
  './assets/logo-cmcc.svg',
  './assets/logo-cmcc.png',
  './assets/logo-cmcc-picto.svg',
  './assets/logo-cmcc-picto.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Network-first uniquement quand l'admin force un rafraîchissement de products.json.
  if (url.pathname.endsWith('/products.json') && url.searchParams.has('refresh')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put('./products.json', copy));
        return res;
      }).catch(() => caches.match('./products.json'))
    );
    return;
  }

  // Cache-first pour tout le reste.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // On ne met en cache que les ressources de notre origine.
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
