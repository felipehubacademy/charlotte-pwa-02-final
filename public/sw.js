// Charlotte Service Worker v2.0.1 - iOS Optimized - Timestamp: 1753878000000
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[SW] 🔥 CHARLOTTE SW v2.0.1 - Service Worker Loading...');
console.log('[SW] 🔥 TIMESTAMP:', Date.now());
console.log('[SW] 🔥 USER AGENT:', navigator.userAgent);
console.log('[SW] 🔥 SCRIPT LOADED AT:', new Date().toISOString());
console.log('[SW] 🔥 VERSION: 2.0.1 CHARLOTTE OPTIMIZED');
console.log('[SW] 🔥 SERVICE WORKER IS RUNNING!');

// Platform detection (SW context - no window)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
// Note: isPWAInstalled detection moved to client-side only

console.log('[SW] Platform detection:', { isIOS });

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxGQoB3XmXeF8X8X8X8X8X8X8X8X8X8X8",
  authDomain: "charlotte-pwa-02-final.firebaseapp.com",
  projectId: "charlotte-pwa-02-final",
  storageBucket: "charlotte-pwa-02-final.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ✅ CONDITIONAL FIREBASE LOADING - SKIP FOR iOS TO AVOID CONFLICTS
let messaging = null;
if (!isIOS) {
  messaging = firebase.messaging();
  console.log('[SW] 🔥 Firebase loaded for non-iOS platform');
} else {
  console.log('[SW] 🍎 iOS detected - SKIPPING Firebase to avoid conflicts');
  console.log('[SW] 🍎 Using NATIVE Web Push API for iOS');
}

// ✅ CHARLOTTE OPTIMIZED: Skip waiting and claim immediately
self.skipWaiting();
self.clients.claim().then(() => {
  console.log('[SW] 🔥 CHARLOTTE: Service Worker claimed all clients!');
  console.log('[SW] 🔥 CHARLOTTE: Service Worker is now controlling all pages!');
});

// Badge counter
let badgeCount = 0;

// Update badge function
async function updateBadge(count) {
  try {
    if ('setAppBadge' in navigator) {
      await navigator.setAppBadge(count);
      console.log('[SW] Badge updated to:', count);
    }
  } catch (error) {
    console.log('Badge API not supported or error:', error);
  }
}

// IndexedDB for persistent storage
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CharlotteSW', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sw_data')) {
        db.createObjectStore('sw_data', { keyPath: 'id' });
      }
    };
  });
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] 🔥 CHARLOTTE: Install event triggered');
  
  event.waitUntil(
    (async () => {
      try {
        // Store installation data
        const db = await openDB();
        const tx = db.transaction(['sw_data'], 'readwrite');
        const store = tx.objectStore('sw_data');
        
        await store.put({
          id: 'installation',
          installed_at: Date.now(),
          version: '2.0.1',
          persistent: true
        });
        
        console.log('[SW] 🔥 CHARLOTTE: Installation data stored');
      } catch (error) {
        console.log('[SW] Installation storage error:', error);
      }
    })()
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔥 CHARLOTTE: Activate event triggered');
  
  event.waitUntil(
    (async () => {
      try {
        // Get badge count from storage
        const db = await openDB();
        const tx = db.transaction(['badges'], 'readonly');
        const store = tx.objectStore('badges');
        const result = await store.get('count');
        badgeCount = result?.value || 0;
        
        // Set initial badge
        if (badgeCount > 0) {
          await updateBadge(badgeCount);
        }
      } catch (error) {
        console.log('Badge API not supported or error:', error);
      }
      
      console.log('[SW] 🔥 CHARLOTTE: Activate completed');
    })()
  );
});

// Push event - MAIN HANDLER
self.addEventListener('push', (event) => {
  console.log('[SW] 🔥 CHARLOTTE: Push event received');
  console.log('[SW] 🔥 CHARLOTTE: Event data:', event.data);
  
  event.waitUntil(
    (async () => {
      if (!event.data) {
        console.log('[SW] 🔥 CHARLOTTE: No data in push event - showing default notification');
        return self.registration.showNotification('Charlotte', {
          body: 'Nova mensagem recebida!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-default',
          requireInteraction: isIOS,
          data: { url: '/chat', platform: isIOS ? 'ios' : 'other', handler: 'no_data' }
        });
      }

      try {
        const data = event.data.json();
        console.log('[SW] 🔥 CHARLOTTE: Push data parsed:', data);
        
        // ✅ CHARLOTTE OPTIMIZED: Handle iOS-compatible payload format
        if (data.notification) {
          const notificationData = data.notification;
          const customData = data.data || {};
          
          console.log('[SW] 🔥 CHARLOTTE: Processing iOS native notification:', notificationData);
          console.log('[SW] 🔥 CHARLOTTE: Custom data:', customData);
          
          // Increment badge
          await updateBadge(badgeCount + 1);
          
          // ✅ CRITICAL: Use notification data from payload
          const notificationTitle = notificationData.title || 'Charlotte';
          const notificationBody = notificationData.body || 'Nova mensagem!';
          
          console.log('[SW] 🔥 CHARLOTTE: DISPLAYING iOS NATIVE:', notificationTitle, '|', notificationBody);
          
          const notificationOptions = {
            body: notificationBody,
            icon: notificationData.icon || '/icons/icon-192x192.png',
            badge: notificationData.badge || '/icons/icon-72x72.png',
            tag: notificationData.tag || customData.tag || 'charlotte-ios-native',
            requireInteraction: isIOS,
            silent: false,
            timestamp: Date.now(),
            data: {
              url: customData.url || '/chat',
              click_action: customData.click_action || '/chat',
              platform: isIOS ? 'ios' : 'other',
              test_type: customData.test_type || 'native',
              custom_emoji: customData.custom_emoji,
              custom_timestamp: customData.custom_timestamp,
              handler: 'charlotte_push_handler',
              ...customData
            }
          };

          return self.registration.showNotification(notificationTitle, notificationOptions)
            .then(() => {
              console.log('[SW] 🔥 CHARLOTTE: iOS NATIVE notification displayed successfully!');
              console.log('[SW] 🔥 CHARLOTTE: Title shown:', notificationTitle);
              console.log('[SW] 🔥 CHARLOTTE: Body shown:', notificationBody);
            });
          
        } else {
          console.log('[SW] 🔥 CHARLOTTE: No notification wrapper in payload - showing fallback');
          return self.registration.showNotification('Charlotte', {
            body: 'Nova mensagem!',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'charlotte-no-wrapper',
            requireInteraction: isIOS,
            data: { url: '/chat', platform: isIOS ? 'ios' : 'other', handler: 'no_wrapper' }
          });
        }
        
      } catch (error) {
        console.error('[SW] 🔥 CHARLOTTE: Error processing push event:', error);
        
        return self.registration.showNotification('Charlotte', {
          body: 'Erro ao processar notificação',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-error',
          requireInteraction: isIOS,
          data: { url: '/chat', platform: isIOS ? 'ios' : 'other', handler: 'error_fallback' }
        });
      }
    })()
  );
});

// Firebase background message handler (only for non-iOS)
if (messaging && !isIOS) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 🔥 CHARLOTTE: Firebase background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'Charlotte';
    const notificationOptions = {
      body: payload.notification?.body || 'Nova mensagem!',
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: payload.notification?.badge || '/icons/icon-72x72.png',
      tag: 'charlotte-firebase',
      requireInteraction: false,
      data: {
        url: payload.data?.url || '/chat',
        platform: 'firebase',
        handler: 'firebase_background'
      }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔥 CHARLOTTE: Notification clicked');
  
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
        console.error('[SW] 🔥 CHARLOTTE: Error handling notification click:', error);
      })
  );
});

// Message handler for app communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('[SW] 🔥 CHARLOTTE: Message from app:', type, data);
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CHECK_IOS_SUPPORT') {
    event.ports[0]?.postMessage({
      isIOS,
      isPWAInstalled: false, // Will be set by client
      supportsNotifications: isIOS,
      version: '2.0.1'
    });
  }
  
  if (type === 'KEEP_ALIVE') {
    console.log('[SW] 🔥 CHARLOTTE: Keep alive message received');
    event.ports[0]?.postMessage({ status: 'alive', version: '2.0.1' });
  }
  
  if (type === 'CHECK_SUBSCRIPTION') {
    event.waitUntil(
      (async () => {
        try {
          const registration = await self.registration;
          const subscription = await registration.pushManager.getSubscription();
          
          event.ports[0]?.postMessage({
            hasSubscription: !!subscription,
            subscription: subscription ? {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            } : null,
            platform: isIOS ? 'ios' : 'other'
          });
        } catch (error) {
          console.error('[SW] 🔥 CHARLOTTE: Error checking subscription:', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })()
    );
  }
  
  if (type === 'HEARTBEAT') {
    console.log('[SW] 🔥 CHARLOTTE: Heartbeat received');
    event.ports[0]?.postMessage({ status: 'heartbeat_received', version: '2.0.1' });
  }
  
  if (type === 'FORCE_WAKE_UP') {
    console.log('[SW] 🔥 CHARLOTTE: Force wake-up received');
    event.ports[0]?.postMessage({ status: 'wake_up_triggered', version: '2.0.1' });
  }
});

console.log('[SW] 🔥 CHARLOTTE: Service Worker script loaded completely!'); 