const CACHE_NAME = 'floratrack-v1.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/database.xlsx'
];

// Installazione: scarica gli asset fondamentali
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usiamo addAll singolarmente per evitare che un errore su un file (es. database mancante) 
      // faccia fallire l'intera installazione del Service Worker
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => cache.add(asset))
      );
    })
  );
});

// Attivazione: pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

// Fetch: gestione differenziata tra asset locali e chiamate API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICO: Non intercettare le chiamate alle API di Gemini o Google
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('google.dev')) {
    return; // Lascia che la richiesta vada direttamente al network
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Strategia: Cache-First per asset locali, Network-Fallback
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Se è un asset locale valido, lo salviamo in cache per la prossima volta
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline basilare se necessario
    })
  );
});