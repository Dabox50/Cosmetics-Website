const CACHE_NAME = 'shayors-cosmetics-v12';
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

// Install Event — precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

// Activate Event — purge ALL old caches except current ones
self.addEventListener('activate', (event) => {
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
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Listen for force-update messages from the frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name !== 'api-cache') caches.delete(name);
      });
    });
  }
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith('/api/') || url.href.includes('fly.dev/api');
  const isImageRequest = /(?:\.(png|jpg|jpeg|gif|webp|avif)$|\/(?:images|uploads)\/)/i.test(url.pathname);

  // ========================================
  // IMAGES — Cache First, then Network
  // (images rarely change, performance matters)
  // ========================================
  if (isImageRequest && !isApiRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const placeholder = await caches.match('/Image/placeholder.png');
          return placeholder || new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // ========================================
  // STATIC ASSETS (HTML, CSS, JS) — Network First, Cache Fallback
  // This is the critical fix: always try the network first so
  // updates propagate to ALL devices (mobile, tablet, etc.)
  // Cache is only used when the user is offline.
  // ========================================
  if (!isApiRequest) {
    // Skip non-GET requests (OPTIONS, POST, etc.)
    if (event.request.method !== 'GET') {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Got a fresh response from the network — update the cache for same-origin assets
          if (networkResponse.ok && url.origin === location.origin) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (offline) — serve from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          // If it's a navigation request and nothing cached, show offline page
          if (event.request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
          }

          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // ========================================
  // API REQUESTS — Network First with cache fallback
  // ========================================
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
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
        
        if (event.request.method === 'GET') {
          const cached = await caches.match(event.request);
          if (cached) return cached;
        }

        const is503 = error.message.includes('503') || error.message.includes('Service Unavailable');
        
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
