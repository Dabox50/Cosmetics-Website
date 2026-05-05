const CACHE_NAME = 'shayors-cosmetics-v6';
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
  console.log('SW: Installing v6 (Permissive CORS Mode)...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('SW: Activated v6');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'api-cache') {
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

  // Let browser handle preflights and other complex requests directly
  if (event.request.method === 'OPTIONS' || !isApiRequest) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      }).catch(() => fetch(event.request))
    );
    return;
  }

  // API handling
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
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
        
        // Return a response that will never trigger a CORS block
        const origin = event.request.headers.get('Origin') || '*';
        return new Response(JSON.stringify({ 
          message: 'Server unreachable. Check your connection or wait for Atlas.',
          error: true,
          details: error.message
        }), {
          status: 503,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true'
          }
        });
      })
  );
});
