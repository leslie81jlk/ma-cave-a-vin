// Service worker: aplikacja działa offline. Zapytania do API Google nigdy nie są zapisywane w pamięci podręcznej.
const VERSION = 'cave-v1.1.0';
const SHELL = [
  './', 'index.html', 'app.css', 'config.js', 'manifest.webmanifest',
  'js/app.js', 'js/db.js', 'js/logic.js', 'js/sync.js', 'js/scans.js',
  'vendor/xlsx.full.min.js', 'vendor/jszip.min.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'cave-fonts').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // Czcionki Google: zapis przy pierwszym użyciu.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open('cave-fonts').then((cache) => cache.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
        cache.put(event.request, res.clone());
        return res;
      }).catch(() => hit)))
    );
    return;
  }
  if (url.origin !== self.location.origin) return; // API Google: zawsze sieć
  // Pliki aplikacji: najpierw pamięć podręczna, w tle odświeżenie.
  event.respondWith(
    caches.open(VERSION).then((cache) => cache.match(event.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(event.request).then((res) => {
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      }).catch(() => hit || cache.match('index.html'));
      return hit || net;
    }))
  );
});
