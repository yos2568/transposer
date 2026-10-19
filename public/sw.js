/*
 * Transposer service worker.
 * The build fills in the cache version and the list of built files (see vite.config.ts),
 * so every built file is available offline after the first visit.
 */
const CACHE = 'transposer-__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('transposer-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
    return;
  }
  // Same-origin assets and cross-origin fonts: serve from cache, refresh in the background.
  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstPage(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put('index.html', res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match('index.html')) || Response.error();
  }
}
