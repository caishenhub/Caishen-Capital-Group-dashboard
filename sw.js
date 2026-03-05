
const CACHE_NAME = 'caishen-pwa-v8';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  'https://i.ibb.co/LzqxpgRh/cropped-CAISHEN-22-300x300.png',
  'https://i.ibb.co/HL7RGf9F/Chat-GPT-Image-8-ene-2026-10-46-40-p-m.png',
  'https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('PWA: Almacenando activos en disco local');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Estrategia Network First para el HTML principal y archivos locales
  if (event.request.mode === 'navigate' || event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Estrategia Cache First para otros activos (imágenes externas)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        if (event.request.url.includes('i.ibb.co')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
