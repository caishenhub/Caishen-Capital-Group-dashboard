
const CACHE_NAME = 'caishen-pwa-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.ibb.co/HL7RGf9F/Chat-GPT-Image-8-ene-2026-10-46-40-p-m.png',
  'https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('PWA: Almacenando nuevos activos de marca en disco local');
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

  const url = new URL(event.request.url);
  const isApi = url.pathname.startsWith('/api/');
  const isGoogleScript = url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com';

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // API calls should ALWAYS go to network
      if (isApi) {
        return fetch(event.request);
      }
      
      // For Google Scripts, we prefer network but fallback to cache
      if (isGoogleScript) {
        return fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }

      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        if (event.request.url.includes('i.ibb.co') || event.request.url.includes('fonts.googleapis.com')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback offline
      });
    })
  );
});
