const CACHE = 'time-stranger-tool-v1.4-pwa';
const ASSETS = ['./', './index.html', './sync-v14.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('time-stranger-tool-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // No cross-origin/API calls or credentials are handled or cached by the PWA.
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  const allowed = ASSETS.some(asset => new URL(asset, self.registration.scope).href === url.href);
  if (event.request.mode === 'navigate') {
    // Check for a fresh HTML version online; retain the offline copy if unavailable.
    event.respondWith(fetch(event.request, {cache: 'no-store'}).then(response => {
      if (!response.ok) throw new Error('Navigation failed');
      if (allowed) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html', copy)));
      }
      return response;
    }).catch(() => caches.match('./index.html')));
  } else if (allowed) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
