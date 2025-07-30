// Simple Service Worker Test v1.0.0 - Timestamp: 1753876000000
console.log('[SW] 🔥 SIMPLE SW TEST v1.0.0 - Service Worker Loading...');
console.log('[SW] 🔥 TIMESTAMP:', Date.now());
console.log('[SW] 🔥 USER AGENT:', navigator.userAgent);
console.log('[SW] 🔥 SCRIPT LOADED AT:', new Date().toISOString());
console.log('[SW] 🔥 VERSION: 1.0.0 SIMPLE TEST');
console.log('[SW] 🔥 SERVICE WORKER IS RUNNING!');

// ✅ SIMPLE TEST: Skip waiting and claim immediately
self.skipWaiting();
self.clients.claim().then(() => {
  console.log('[SW] 🔥 SIMPLE TEST: Service Worker claimed all clients!');
  console.log('[SW] 🔥 SIMPLE TEST: Service Worker is now controlling all pages!');
});

// Simple install event
self.addEventListener('install', (event) => {
  console.log('[SW] 🔥 SIMPLE TEST: Install event triggered');
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] 🔥 SIMPLE TEST: Install completed');
    })
  );
});

// Simple activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔥 SIMPLE TEST: Activate event triggered');
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] 🔥 SIMPLE TEST: Activate completed');
    })
  );
});

// Simple push event
self.addEventListener('push', (event) => {
  console.log('[SW] 🔥 SIMPLE TEST: Push event received');
  console.log('[SW] 🔥 SIMPLE TEST: Event data:', event.data);
  
  event.waitUntil(
    self.registration.showNotification('🔥 SIMPLE TEST', {
      body: 'Service Worker funcionando!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'simple-test',
      requireInteraction: true,
      data: { 
        url: '/chat', 
        platform: 'ios', 
        handler: 'simple_test',
        timestamp: Date.now()
      }
    }).then(() => {
      console.log('[SW] 🔥 SIMPLE TEST: Notification displayed successfully!');
    })
  );
});

console.log('[SW] 🔥 SIMPLE TEST: Service Worker script loaded completely!'); 