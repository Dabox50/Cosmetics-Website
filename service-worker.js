const CACHE_NAME = 'shayors-cosmetics-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/cart.css',
  '/Collection/collections.html',
  '/Collection/collections.css',
  '/Collection/collections.js',
  '/Collection/catalog.html',
  '/Collection/catalog.css',
  '/Collection/catalog.js',
  '/About/about.html',
  '/About/about.css',
  '/Contact/contact.html',
  '/Contact/contact.css',
  '/Image/Shayor\'s Cosmetics .png',
  '/Image/Shayor\'s Logo.png',
  '/Image/menus.png',
  '/Image/grocery-store.png'
];

const IMAGE_CACHE_NAME = 'shayors-images-v1';

// Install Event
self.addEventListener('install', (event) => {
  console.log('SW: Installing v7...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('SW: Activated v7');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'api-cache' && cache !== IMAGE_CACHE_NAME) {
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
  const isImageRequest = /\.(png|jpg|jpeg|gif|webp|avif)$|images|uploads/.test(url.href);

  // Handle Images - Cache First, then Network
  if (isImageRequest && !isApiRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(event.request);
          // Cache the response if it's valid or if it's an opaque (cross-origin) image
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // If offline and not in cache, try to return the placeholder if it exists in main cache
          const placeholder = await caches.match('/Image/placeholder.png');
          return placeholder || new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // Let browser handle preflights and other complex requests directly
  if (event.request.method === 'OPTIONS' || !isApiRequest) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // API handling
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only return the network response if it's NOT a 503
        // If it's a 503, we let the catch block handle it or pass it through
        if (networkResponse.status === 503) {
          throw new Error('Service Unavailable (503)');
        }

        if (event.request.method === 'GET' && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open('api-cache').then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async (error) => {
        console.error('SW: API Fetch Failed:', error);
        
        // If it's a GET request, try to serve from cache
        if (event.request.method === 'GET') {
          const cached = await caches.match(event.request);
          if (cached) return cached;
        }

        // For non-GET or if no cache, check if it's a 503 from our throw or network
        const is503 = error.message.includes('503') || error.message.includes('Service Unavailable');
        
        // Return a response that will never trigger a CORS block
        const origin = event.request.headers.get('Origin');
        const headers = { 'Content-Type': 'application/json' };
        
        if (origin) {
          headers['Access-Control-Allow-Origin'] = origin;
          headers['Access-Control-Allow-Credentials'] = 'true';
        } else {
          headers['Access-Control-Allow-Origin'] = '*';
        }

        return new Response(JSON.stringify({ 
          message: is503 ? 'Database warming up. Please wait...' : 'Server unreachable. Check your connection.',
          error: true,
          status: 503,
          details: error.message
        }), {
          status: 503,
          headers: headers
        });
      })
  );
});
