// ClimateSim Progressive Web App (PWA) Service Worker
// Version: v1.2
const CACHE_NAME = 'climatesim-v1.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './earth_heat_trap.html',
  './advanced.html',
  './interactive_1d_atmospheric_radiative_transfer_earth_energy_balance_simulator.html',
  './we_only_have_one_pale_blue_dot.html',
  './national_emergency_briefing.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// Install Event: Pre-cache all core simulation pages and icons
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear older cache versions and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event:
// - Navigation requests (HTML pages): Network-first with cache fallback for instant offline access
// - Static assets (icons, manifest): Cache-first with network fallback
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Check if same-origin
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      // Network-First for HTML navigation: ensures latest changes are shown when online, falls back to cache offline
      event.respondWith(
        fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          return caches.match(req).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // Fallback to index or heat trap if exact navigation path isn't in cache
            if (req.url.includes('advanced')) return caches.match('./advanced.html');
            if (req.url.includes('pale_blue_dot')) return caches.match('./we_only_have_one_pale_blue_dot.html');
            return caches.match('./index.html') || caches.match('./earth_heat_trap.html');
          });
        })
      );
      return;
    }

    // Cache-First for static assets
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, responseClone));
          }
          return networkResponse;
        });
      })
    );
  }
});
