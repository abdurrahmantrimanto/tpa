const CACHE_NAME = 'tpa-huda-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './mosque.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first strategy for static resources
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Exclude Google Apps Script API calls from being cached by SW
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version if found
      if (response) {
        // Optimistically fetch the latest from network in background
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
            }
        }).catch(() => {});
        return response;
      }
      
      // If not in cache, fallback to network
      return fetch(event.request).then(networkResponse => {
        // Cache the dynamically fetched valid HTTP GET static resources
        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Ignore offline errors as application handles it internally using localStorage
      });
    })
  );
});
