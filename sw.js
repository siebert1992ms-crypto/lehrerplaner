/* Offline-Cache: App startet ohne Netz. Beim nächsten Start mit Netz werden Änderungen automatisch nachgeladen. */
const V = 'lehrerplaner-1.4.0'; // gleich halten mit APP_VERSION in app.js
const ASSETS = ['./', 'index.html', 'style.css', 'lib.js', 'crypto.js', 'store.js', 'ink.js', 'stundenplan.js', 'app.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('Offline', { status: 503 });
  }));
});
