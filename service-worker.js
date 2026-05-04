const CACHE_NAME = 'shayors-cosmetics-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/cart.css',
  '/Collection/collections.html',
  '/Collection/collections.css',
  '/Collection/collections.js',
  '/Collection/menu.html',
  '/Collection/menu.css',
  '/Collection/menu.js',
  '/About/about.html',
  '/About/about.css',
  '/Contact/contact.html',
  '/Contact/contact.css',
  '/Image/Shayor\'s Cosmetics .png',
  '/Image/Shayor\'s Logo.png',
  '/Image/menus.png',
  '/Image/grocery-store.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Special handling for API requests (Cache-first, then network update)
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            // Only cache if the response is valid and has data
            if (networkResponse.ok && networkResponse.status !== 204) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((err) => {
             // If network fails, return the cached version if we have it
             if (cachedResponse) return cachedResponse;
             // Otherwise throw error so frontend catch block triggers
             throw err;
          });

          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // Standard static assets (Cache-first)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
