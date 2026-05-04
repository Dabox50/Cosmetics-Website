const CACHE_NAME = 'shayors-cosmetics-v4';
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
  console.log('SW: Installing v4...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('SW: Activated v4');
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

  // Skip Service Worker for preflight OPTIONS requests to avoid CORS issues
  if (event.request.method === 'OPTIONS') {
    return;
  }

  // Special handling for API requests
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If we got a real response from the server, return it as is
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
          
          // Determine the origin to echo back for CORS
          const requestOrigin = event.request.referrer ? new URL(event.request.referrer).origin : '*';
          
          // Return a structured error response with explicit CORS headers
          return new Response(JSON.stringify({ 
            message: 'Connection failed. The server might be down or your database is not whitelisted.',
            error: true,
            details: error.message,
            tip: 'Check MongoDB Atlas IP Whitelisting (allow 0.0.0.0/0)'
          }), {
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': requestOrigin,
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
        return new Response('Network error. Asset not found in cache.', { status: 408 });
      });
    })
  );
});
