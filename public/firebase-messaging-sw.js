// Firebase Service Worker v4.0.4 ULTRA FORCE - iOS Push Standards - Timestamp: 1753875000000
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ✅ ULTRA FORCE: Maximum aggressive logging
console.log('[SW] 🔥 ULTRA FORCE v4.0.4 - Service Worker Loading...');
console.log('[SW] 🔥 TIMESTAMP:', Date.now());
console.log('[SW] 🔥 USER AGENT:', navigator.userAgent);
console.log('[SW] 🔥 SCRIPT LOADED AT:', new Date().toISOString());
console.log('[SW] 🔥 VERSION: 4.0.4 ULTRA FORCE');
console.log('[SW] 🔥 SERVICE WORKER EXECUTING NOW!');

// ✅ ULTRA FORCE: Skip waiting and claim immediately
self.skipWaiting();
self.clients.claim().then(() => {
  console.log('[SW] 🔥 ULTRA FORCE: Service Worker claimed all clients!');
  console.log('[SW] 🔥 ULTRA FORCE: Service Worker is now controlling all pages!');
});

// Unified Firebase configuration
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

// ✅ ULTRA FORCE: More aggressive logging
console.log('[SW] 🔥 Firebase initialized');
console.log('[SW] 🔥 Service Worker script loaded successfully');
console.log('[SW] 🔥 VERSION: 4.0.4 ULTRA FORCE');
console.log('[SW] 🔥 SERVICE WORKER IS RUNNING!');

// ✅ FORCE UPDATE: Aggressive cache busting and logging
console.log('[SW] 🔥 FORCE UPDATE v3.0.1 - Service Worker Loading...');

// ✅ iOS DETECTION FIRST - BEFORE ANY IMPORTS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      navigator.standalone === true;

console.log('[SW] Platform detection (EARLY):', { isIOS, isPWAInstalled });

// ✅ CONDITIONAL FIREBASE LOADING - SKIP FOR iOS TO AVOID CONFLICTS
let messaging = null;
if (!isIOS) {
  // Firebase already loaded above, just initialize messaging
  messaging = firebase.messaging();

  // VAPID KEY QUE FUNCIONA 100% NO iOS
  messaging.getToken({ 
    vapidKey: 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA'
  });
  
  console.log('[SW] 🔥 Firebase loaded for non-iOS platform');
} else {
  console.log('[SW] 🍎 iOS detected - SKIPPING Firebase to avoid conflicts');
  console.log('[SW] 🍎 Using NATIVE Web Push API for iOS');
}

// Badge counter (persistent across SW restarts via IndexedDB)
let badgeCount = 0;

// ✅ CACHE BREAKER: Force complete cache cleanup
self.addEventListener('install', (event) => {
  console.log('[SW] 🔥 CACHE BREAKER v4.0.0 - iOS NATIVE PUSH FIX');
  
  // ✅ DRASTIC: Delete ALL caches and force immediate activation
  event.waitUntil(
    (async () => {
      // Delete all existing caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] 🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log('[SW] 🧹 All caches deleted');
      
      // Clear all IndexedDB stores
      try {
        const db = await openDB();
        const stores = ['badges', 'sw_data', 'heartbeat', 'wake_up_attempts'];
        for (const storeName of stores) {
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            await store.clear();
            console.log('[SW] 🗑️ Cleared store:', storeName);
          }
        }
      } catch (error) {
        console.log('[SW] IndexedDB clear error (expected):', error);
      }
    })()
  );
  
  // Force immediate activation and claim all clients
  self.skipWaiting();
  
  // Store installation timestamp
  event.waitUntil(
    (async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(['sw_data'], 'readwrite');
        const store = tx.objectStore('sw_data');
        await store.put({ 
          installed_at: Date.now(),
          version: '4.0.0', // iOS NATIVE PUSH FIX
          persistent: true,
          last_heartbeat: Date.now(),
          wake_up_attempts: 0,
          ios_native_push: isIOS
        }, 'installation');
        console.log('[SW] Installation data stored');
      } catch (error) {
        console.log('[SW] Installation storage error:', error);
      }
    })()
  );
});

// Initialize badge count from storage
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔥 Activating v4.0.0 - iOS NATIVE PUSH FIX');
  
  event.waitUntil(
    (async () => {
      try {
        // Get badge count from IndexedDB
        const db = await openDB();
        const tx = db.transaction(['badges'], 'readonly');
        const store = tx.objectStore('badges');
        const result = await store.get('count');
        badgeCount = result?.value || 0;
        
        // Set initial badge
        if (badgeCount > 0) {
          await self.navigator.setAppBadge(badgeCount);
        }
      } catch (error) {
        console.log('Badge API not supported or error:', error);
      }
      
      // ✅ NOVO: Claim all clients immediately
      await self.clients.claim();
      
      // ✅ NOVO: Register for background sync (iOS 16.4+)
      if ('sync' in self.registration) {
        try {
          await self.registration.sync.register('background-sync');
          console.log('[SW] Background sync registered');
        } catch (error) {
          console.log('[SW] Background sync not supported:', error);
        }
      }
      
      // ✅ NOVO: Register periodic sync for iOS (if supported)
      if ('periodicSync' in self.registration) {
        try {
          await self.registration.periodicSync.register('heartbeat-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours minimum
          });
          console.log('[SW] Periodic sync registered');
        } catch (error) {
          console.log('[SW] Periodic sync not supported:', error);
        }
      }
      
      // ✅ NOVO: Register wake-up sync for iOS
      if ('sync' in self.registration) {
        try {
          await self.registration.sync.register('wake-up-sync');
          console.log('[SW] Wake-up sync registered');
        } catch (error) {
          console.log('[SW] Wake-up sync not supported:', error);
        }
      }
      
      console.log('[SW] ✅ Service Worker activated and persistent');
    })()
  );
});

// ✅ NOVO: Background sync handler for iOS
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      (async () => {
        try {
          // Keep service worker alive
          console.log('[SW] Background sync - keeping SW alive');
          
          // Update heartbeat
          const db = await openDB();
          const tx = db.transaction(['sw_data'], 'readwrite');
          const store = tx.objectStore('sw_data');
          await store.put({ 
            last_heartbeat: Date.now(),
            last_sync: Date.now()
          }, 'heartbeat');
          
          // Check if we have active subscriptions
          const registration = await self.registration;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log('[SW] ✅ Active subscription found in background');
          } else {
            console.log('[SW] ⚠️ No active subscription in background');
          }
        } catch (error) {
          console.error('[SW] Background sync error:', error);
        }
      })()
    );
  }
  
  // ✅ NOVO: Wake-up sync handler
  if (event.tag === 'wake-up-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Wake-up sync - reactivating service worker');
          
          // Update wake-up attempts
          const db = await openDB();
          const tx = db.transaction(['sw_data'], 'readwrite');
          const store = tx.objectStore('sw_data');
          const current = await store.get('wake_up_attempts');
          const attempts = (current?.value || 0) + 1;
          
          await store.put({ 
            last_wake_up: Date.now(),
            wake_up_attempts: attempts
          }, 'wake_up_attempts');
          
          // Force re-registration if needed
          const registration = await self.registration;
          const subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            console.log('[SW] ⚠️ No subscription found, attempting re-registration');
            // Try to re-register subscription
            try {
              await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA'
              });
              console.log('[SW] ✅ Subscription re-registered successfully');
            } catch (error) {
              console.error('[SW] ❌ Failed to re-register subscription:', error);
            }
          }
        } catch (error) {
          console.error('[SW] Wake-up sync error:', error);
        }
      })()
    );
  }
});

// ✅ NOVO: Periodic sync handler for iOS
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'heartbeat-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Heartbeat sync - maintaining persistence');
          
          // Update heartbeat timestamp
          const db = await openDB();
          const tx = db.transaction(['sw_data'], 'readwrite');
          const store = tx.objectStore('sw_data');
          await store.put({ 
            last_heartbeat: Date.now(),
            last_periodic_sync: Date.now()
          }, 'heartbeat');
          
          // Verify subscription is still active
          const registration = await self.registration;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log('[SW] ✅ Subscription still active in periodic sync');
          } else {
            console.log('[SW] ⚠️ Subscription lost in periodic sync');
          }
        } catch (error) {
          console.error('[SW] Periodic sync error:', error);
        }
      })()
    );
  }
});

// Open IndexedDB for badge persistence
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('charlotte-badges', 9); // ✅ iOS FIX VERSION
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create badges store
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges');
      }
      
      // ✅ NOVO: Create sw_data store for persistent data
      if (!db.objectStoreNames.contains('sw_data')) {
        db.createObjectStore('sw_data');
      }
      
      // ✅ NOVO: Create heartbeat store for persistence tracking
      if (!db.objectStoreNames.contains('heartbeat')) {
        db.createObjectStore('heartbeat');
      }
      
      // ✅ NOVO: Create wake_up_attempts store
      if (!db.objectStoreNames.contains('wake_up_attempts')) {
        db.createObjectStore('wake_up_attempts');
      }
      
      console.log('[SW] IndexedDB upgraded to version 9 - iOS FIX');
    };
  });
}

// Save badge count to storage
async function saveBadgeCount(count) {
  try {
    const db = await openDB();
    const tx = db.transaction(['badges'], 'readwrite');
    const store = tx.objectStore('badges');
    await store.put({ value: count }, 'count');
    badgeCount = count;
  } catch (error) {
    console.log('Error saving badge count:', error);
  }
}

// Update app badge
async function updateBadge(count) {
  try {
    if ('setAppBadge' in self.navigator) {
      if (count > 0) {
        await self.navigator.setAppBadge(count);
      } else {
        await self.navigator.clearAppBadge();
      }
      await saveBadgeCount(count);
      console.log(`🏷️ Badge updated: ${count}`);
    }
  } catch (error) {
    console.log('Badge API not supported:', error);
  }
}

let lastNotificationTimestamp = 0;
const NOTIFICATION_DEBOUNCE = 2000;

// ✅ CRITICAL: NATIVE PUSH HANDLER - PRIORITY FOR ALL PLATFORMS, ESPECIALLY iOS
self.addEventListener('push', (event) => {
  console.log('[SW] 🍎 NATIVE Push Event received (v4.0.0 iOS FIX):', event);
  console.log('[SW] Platform:', { isIOS, isPWAInstalled });
  
  // ✅ CRITICAL: iOS requires event.waitUntil() to prevent subscription cancellation
  event.waitUntil(
    (async () => {
      if (!event.data) {
        console.log('[SW] No data in push event - showing default notification');
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
        console.log('[SW] ✅ Push data parsed:', data);
        console.log('[SW] 🔍 FULL PAYLOAD STRUCTURE:', JSON.stringify(data, null, 2));

        // ✅ iOS NATIVE PUSH: Handle iOS-compatible payload format
        if (data.notification) {
          const notificationData = data.notification;
          const customData = data.data || {};
          
          console.log('[SW] ✅ Processing iOS native notification:', notificationData);
          console.log('[SW] ✅ Custom data:', customData);
          console.log('[SW] 🎯 NOTIFICATION TITLE:', notificationData.title);
          console.log('[SW] 🎯 NOTIFICATION BODY:', notificationData.body);
          
          // Increment badge
          updateBadge(badgeCount + 1);
          
          // ✅ CRITICAL: Use notification data from payload - THIS FIXES THE GENERIC TEXT ISSUE
          const notificationTitle = notificationData.title || 'Charlotte';
          const notificationBody = notificationData.body || 'Nova mensagem!';
          
          console.log('[SW] 🎯 DISPLAYING iOS NATIVE:', notificationTitle, '|', notificationBody);
          
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
              handler: 'native_push_handler',
              ...customData
            }
          };

          // ✅ CRITICAL: Return the promise for event.waitUntil()
          return self.registration.showNotification(notificationTitle, notificationOptions)
            .then(() => {
              console.log('[SW] ✅ iOS NATIVE notification displayed successfully!');
              console.log('[SW] 🎯 Title shown:', notificationTitle);
              console.log('[SW] 🎯 Body shown:', notificationBody);
            });
          
        } else {
          console.log('[SW] ❌ No notification wrapper in payload - showing fallback');
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
        console.error('[SW] ❌ Error processing push event:', error);
        
        // ✅ CRITICAL: Always return a promise for event.waitUntil()
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

// ✅ ENHANCED: Notification Click Handler for all platforms
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🍎 Notification Click Event:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Decrement badge when notification is clicked
  updateBadge(Math.max(0, badgeCount - 1));

  if (action === 'close') {
    console.log('[SW] Notification dismissed by user');
    return;
  }

  let urlToOpen = data.url || '/chat';
  console.log('[SW] Opening URL:', urlToOpen);

  // Universal window handling (works for iOS and others)
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      console.log('[SW] Found clients:', clientList.length);
      
      // Try to focus existing client first
      for (let client of clientList) {
        const clientUrl = new URL(client.url);
        
        if (clientUrl.origin === self.location.origin) {
          console.log('[SW] Focusing existing client');
          
          // Send message to existing client
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: data,
            platform: isIOS ? 'ios' : 'other'
          });
          
          return client.focus();
        }
      }
      
      // Open new window/tab
      console.log('[SW] Opening new window');
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }).catch((error) => {
      console.error('[SW] ❌ Error handling notification click:', error);
    })
  );
});

// ✅ ENHANCED: Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notification dismissed');
  
  // Decrement badge when notification is dismissed
  updateBadge(Math.max(0, badgeCount - 1));
});

// ✅ FIREBASE HANDLER - ONLY FOR NON-iOS PLATFORMS
if (!isIOS && messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Firebase background message (NON-iOS ONLY):', payload);

    const now = Date.now();
    if (now - lastNotificationTimestamp < NOTIFICATION_DEBOUNCE) {
      console.log('[SW] ⚠️ Debouncing duplicate notification');
      return;
    }
    lastNotificationTimestamp = now;

    return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clientList) => {
        const isAppVisible = clientList.some(client => client.visibilityState === 'visible');
        
        if (isAppVisible) {
          console.log('[SW] ⚠️ App is visible, skipping background notification');
          return;
        }

        try {
          const notification = payload.notification || {};
          const data = payload.data || {};
          
          const notificationTitle = notification.title || data.title || 'Charlotte';
          
          const notificationOptions = {
            body: notification.body || data.body || 'Nova mensagem!',
            icon: notification.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'charlotte-firebase',
            requireInteraction: false,
            silent: false,
            timestamp: Date.now(),
            actions: [
              {
                action: 'open',
                title: '📚 Abrir Charlotte',
                icon: '/icons/icon-72x72.png'
              },
              {
                action: 'close',
                title: 'Dispensar'
              }
            ],
            data: {
              url: data.url || notification.click_action || '/chat',
              type: data.type || 'firebase',
              userId: data.userId,
              timestamp: Date.now(),
              platform: 'firebase',
              ...data
            }
          };

          console.log('[SW] Showing Firebase notification (non-iOS):', notificationOptions);
          updateBadge(badgeCount + 1);

          return self.registration.getNotifications({ tag: 'charlotte-firebase' })
            .then(notifications => {
              notifications.forEach(notification => notification.close());
              return self.registration.showNotification(notificationTitle, notificationOptions);
            });
          
        } catch (error) {
          console.error('[SW] Error processing Firebase background message:', error);
          
          return self.registration.showNotification('Charlotte', {
            body: 'Nova mensagem',
            icon: '/icons/icon-192x192.png',
            tag: 'charlotte-firebase-fallback',
            requireInteraction: false
          });
        }
      });
  });
} else {
  console.log('[SW] 🍎 Firebase messaging DISABLED for iOS - using native push only');
}

// ✅ ENHANCED: Message handler for PWA communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('[SW] Message from app:', type, data);
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CHECK_IOS_SUPPORT') {
    event.ports[0]?.postMessage({
      isIOS,
      isPWAInstalled,
      supportsNotifications: isIOS && isPWAInstalled,
      version: '4.0.0'
    });
  }
  
  if (type === 'KEEP_ALIVE') {
    console.log('[SW] Keep alive message received');
    event.ports[0]?.postMessage({ status: 'alive', version: '4.0.0' });
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
          console.error('[SW] Error checking subscription:', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })()
    );
  }
  
  if (type === 'HEARTBEAT') {
    event.waitUntil(
      (async () => {
        try {
          const db = await openDB();
          const tx = db.transaction(['heartbeat'], 'readwrite');
          const store = tx.objectStore('heartbeat');
          await store.put({ 
            last_heartbeat: Date.now(),
            timestamp: Date.now()
          }, 'heartbeat');
          
          console.log('[SW] Heartbeat updated');
          event.ports[0]?.postMessage({ status: 'heartbeat_updated' });
        } catch (error) {
          console.error('[SW] Heartbeat error:', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })()
    );
  }
  
  if (type === 'FORCE_WAKE_UP') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Force wake-up requested');
          
          if ('sync' in self.registration) {
            await self.registration.sync.register('wake-up-sync');
            console.log('[SW] Wake-up sync registered');
          }
          
          const db = await openDB();
          const tx = db.transaction(['sw_data'], 'readwrite');
          const store = tx.objectStore('sw_data');
          await store.put({ 
            last_force_wake_up: Date.now(),
            force_wake_up_requested: true
          }, 'force_wake_up');
          
          event.ports[0]?.postMessage({ status: 'wake_up_triggered' });
        } catch (error) {
          console.error('[SW] Force wake-up error:', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })()
    );
  }
});

console.log('[SW] Charlotte Service Worker v4.0.0 - iOS NATIVE PUSH FIX READY');
console.log('[SW] ✅ Platform:', isIOS ? 'iOS (Native Push)' : 'Other (Firebase + Native)');
console.log('[SW] ✅ iOS Native Push Events: ENABLED');
console.log('[SW] ✅ Firebase Compatibility:', !isIOS ? 'ENABLED' : 'DISABLED (iOS uses native)');
console.log('[SW] ✅ Notification Click: ENABLED');
console.log('[SW] ✅ PERSISTENT Service Worker: ENABLED');
console.log('[SW] ✅ Background Sync: ENABLED');
console.log('[SW] ✅ Heartbeat System: ENABLED');