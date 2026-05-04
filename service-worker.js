const CACHE_NAME = 'shayors-cosmetics-v2';
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
  console.log('SW: Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('SW: Activated v2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'api-cache') {
            console.log('SW: Clearing old cache', cache);
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
  const isApiRequest = url.pathname.startsWith('/api/') || url.href.includes('fly.dev/api');

  // Special handling for API requests
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache only successful GET requests
          if (event.request.method === 'GET' && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open('api-cache').then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async (error) => {
          console.error('SW: API Fetch Failed:', error);
          
          // Fallback to cache for GET requests
          if (event.request.method === 'GET') {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              console.log('SW: Returning cached data for', url.pathname);
              return cachedResponse;
            }
          }
          
          // Return a proper error response instead of failing the promise
          return new Response(JSON.stringify({ 
            message: 'Network error or server unreachable. Please check your connection.',
            error: true,
            details: error.message
          }), {
            status: 503,
            statusText: 'Service Unavailable (via SW)',
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': event.request.headers.get('Origin') || '*',
              'Access-Control-Allow-Credentials': 'true'
            }
          });
        })
    );
    return;
  }

  // Standard static assets (Cache-first)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        // Fallback for static assets if fetch fails
        return new Response('Network error. Asset not found in cache.', { status: 408 });
      });
    })
  );
});
