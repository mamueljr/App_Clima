/**
 * AuraWeather Service Worker for PWA
 */

const CACHE_NAME = 'aura-weather-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // Lucide Icons y Chart.js CDN (guardados en caché para uso sin conexión)
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Evento Install: Guardar recursos estáticos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Guardando shell de la aplicación en caché...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento Activate: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento Fetch: Intercepta peticiones y sirve desde caché si no hay internet
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // No cachear llamadas a las APIs del clima para garantizar datos frescos
  if (requestUrl.hostname.includes('open-meteo.com') || requestUrl.hostname.includes('bigdatacloud.net')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si falla y no hay red, podríamos retornar una respuesta vacía o un json de error amigable
          return new Response(JSON.stringify({ error: "Sin conexión a internet" }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Estrategia Cache-First con caída a red para recursos estáticos
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          // Validar respuesta correcta antes de guardar en caché
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clonar la respuesta para guardarla en la caché dinámica
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // Retorno de fallback en caso de error total (ej: offline y recurso no cacheado)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
