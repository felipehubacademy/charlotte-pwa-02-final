const CACHE_NAME = 'charlotte-pwa-v2.0.3';
const STATIC_CACHE = 'charlotte-static-v2.0.3';
const DYNAMIC_CACHE = 'charlotte-dynamic-v2.0.3';

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/chat',
  '/manifest.json',
  '/images/charlotte-avatar.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Estratégia de cache por tipo de recurso
const CACHE_STRATEGIES = {
  // Cache First - para assets estáticos
  static: [
    /\/_next\/static\//,
    /\/icons\//,
    /\/images\//,
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/
  ],
  
  // Network First - para APIs e conteúdo dinâmico
  dynamic: [
    /\/api\//,
    /\/chat/
  ]
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing Service Worker v2.0.3');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 [SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ [SW] Failed to cache static assets:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating Service Worker v2.0.3');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ [SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Interceptação de requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar requests de autenticação (NextAuth/Auth.js)
  if (url.pathname.startsWith('/api/auth/')) {
    return;
  }
  
  // Ignorar requests para outros domínios (exceto APIs necessárias)
  if (url.origin !== location.origin && !isAllowedExternalDomain(url.origin)) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Determinar estratégia de cache
function getCacheStrategy(url) {
  // Verificar se é asset estático
  for (const pattern of CACHE_STRATEGIES.static) {
    if (pattern.test(url)) {
      return 'static';
    }
  }
  
  // Verificar se é conteúdo dinâmico
  for (const pattern of CACHE_STRATEGIES.dynamic) {
    if (pattern.test(url)) {
      return 'dynamic';
    }
  }
  
  return 'dynamic'; // Default para network first
}

// Manipular requests baseado na estratégia
async function handleRequest(request) {
  const strategy = getCacheStrategy(request.url);
  
  try {
    switch (strategy) {
      case 'static':
        return await cacheFirst(request);
      case 'dynamic':
        return await networkFirst(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('❌ [SW] Request failed:', request.url, error);
    return await getOfflineFallback(request);
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Atualizar cache em background se necessário
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  // Só cachear requisições GET que foram bem-sucedidas
  if (networkResponse.ok && request.method === 'GET') {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Só cachear requisições GET que foram bem-sucedidas
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Só tentar buscar do cache para requisições GET
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        console.log('📱 [SW] Serving from cache (offline):', request.url);
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Atualizar cache em background
async function updateCacheInBackground(request) {
  // Só atualizar cache para requisições GET
  if (request.method !== 'GET') {
    return;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Falha silenciosa para atualizações em background
  }
}

// Fallback offline
async function getOfflineFallback(request) {
  // Para navegação, retornar página principal
  if (request.mode === 'navigate') {
    const cachedPage = await caches.match('/chat');
    if (cachedPage) {
      return cachedPage;
    }
  }
  
  // Para imagens, retornar avatar padrão
  if (request.destination === 'image') {
    const cachedAvatar = await caches.match('/images/charlotte-avatar.png');
    if (cachedAvatar) {
      return cachedAvatar;
    }
  }
  
  // Resposta offline genérica
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Verificar domínios externos permitidos
function isAllowedExternalDomain(origin) {
  const allowedDomains = [
    'https://api.openai.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    // Microsoft/Azure domains for authentication
    'https://login.microsoftonline.com',
    'https://graph.microsoft.com',
    'https://login.live.com',
    'https://account.live.com'
  ];
  
  return allowedDomains.includes(origin);
}

// Push notification event listener
self.addEventListener('push', (event) => {
  console.log('📨 [SW] Push message received');
  
  let notificationData = {
    title: 'Charlotte',
    body: 'Nova mensagem!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/chat' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      
      // Support for declarative web push (iOS 18.4+)
      if (data.web_push && data.notification) {
        notificationData = {
          title: data.notification.title,
          body: data.notification.body || '',
          icon: data.notification.icon || '/icons/icon-192x192.png',
          badge: data.notification.badge || '/icons/icon-72x72.png',
          data: { url: data.notification.navigate || '/chat' }
        };
      } else {
        // Standard push message format
        notificationData = {
          title: data.title || notificationData.title,
          body: data.body || data.message || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          data: { url: data.url || '/chat', ...data.data }
        };
      }
    } catch (error) {
      console.error('❌ [SW] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: 'charlotte-notification',
      requireInteraction: false,
      silent: false
    })
  );
});

// Notification click event listener
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a tab/window open with the app
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('❌ [SW] Error handling notification click:', error);
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🎯 [SW] Charlotte PWA Service Worker v2.0.3 loaded'); 