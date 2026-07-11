/* The Morning Alignment — service worker.
   NETWORK-FIRST for everything: always fetch the latest when online, fall back
   to cache only when offline. This prevents stale bundles from being served
   after a deploy (the old cache-first strategy hid new builds). */
const CACHE = 'tma-v4';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first: get the freshest response, cache it, fall back to cache
  // (or the app shell for navigations) only when the network is unavailable.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)),
      ),
  );
});
