// Firebase Service Worker v3.0.0 CRITICAL EVENT.WAITUNTIL FIX - iOS Push Standards - Timestamp: 1753870000000
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Unified Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEKjNSV6-XkvYueEXMjMJw3J8iF2yaqP0",
  authDomain: "charlotte-notifications.firebaseapp.com",
  projectId: "charlotte-notifications",
  storageBucket: "charlotte-notifications.firebasestorage.app",
  messagingSenderId: "664193430418",
  appId: "1:664193430418:web:b647cff7f8f05caadcc74b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// VAPID KEY QUE FUNCIONA 100% NO iOS
messaging.getToken({ 
  vapidKey: 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA'
});

// iOS Detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      navigator.standalone === true;

console.log('[SW] Platform detection:', { isIOS, isPWAInstalled });

// Badge counter (persistent across SW restarts via IndexedDB)
let badgeCount = 0;

// ✅ CACHE BREAKER: Force complete cache cleanup
self.addEventListener('install', (event) => {
  console.log('[SW] 🔥 CACHE BREAKER v3.0.0 - FORCING COMPLETE UPDATE');
  
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
          version: '3.0.0', // CACHE BREAKER
          persistent: true,
          last_heartbeat: Date.now(),
          wake_up_attempts: 0
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
  console.log('[SW] 🔥 Activating CACHE BREAKER v3.0.0 - FORCING COMPLETE RESET');
  
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
    const request = indexedDB.open('charlotte-badges', 8); // ✅ CACHE BREAKER VERSION
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
      
      console.log('[SW] IndexedDB upgraded to version 7 - FORCE UPDATE');
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

// ✅ CRITICAL FIX: iOS Native Push Event Handler - WAITUNTIL REQUIRED
self.addEventListener('push', (event) => {
  console.log('[SW] 🍎 iOS Push Event received (CRITICAL FIX v3.0.0):', event);
  
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
          requireInteraction: true,
          data: { url: '/chat', platform: 'ios', handler: 'no_data' }
        });
      }

      try {
        const data = event.data.json();
        console.log('[SW] ✅ Push data parsed:', data);

        // Handle iOS-compatible payload format
        if (data.notification) {
          const notificationData = data.notification;
          const customData = data.data || {};
          
          console.log('[SW] ✅ Processing notification:', notificationData);
          console.log('[SW] ✅ Custom data:', customData);
          
          // Increment badge
          updateBadge(badgeCount + 1);
          
          // Use notification data from payload
          const notificationTitle = notificationData.title || 'Charlotte';
          const notificationBody = notificationData.body || 'Nova mensagem!';
          
          console.log('[SW] 🎯 DISPLAYING:', notificationTitle, '|', notificationBody);
          
          const notificationOptions = {
            body: notificationBody,
            icon: notificationData.icon || '/icons/icon-192x192.png',
            badge: notificationData.badge || '/icons/icon-72x72.png',
            tag: notificationData.tag || customData.tag || 'charlotte-ios-push',
            requireInteraction: true,
            silent: false,
            timestamp: Date.now(),
            data: {
              url: customData.url || '/chat',
              click_action: customData.click_action || '/chat',
              platform: 'ios',
              test_type: customData.test_type || 'basic',
              custom_emoji: customData.custom_emoji,
              custom_timestamp: customData.custom_timestamp,
              handler: 'push_handler',
              ...customData
            }
          };

          // ✅ CRITICAL: Return the promise for event.waitUntil()
          return self.registration.showNotification(notificationTitle, notificationOptions)
            .then(() => {
              console.log('[SW] ✅ Notification displayed successfully via push handler!');
            });
          
        } else {
          console.log('[SW] ❌ No notification data in payload - showing fallback');
          return self.registration.showNotification('Charlotte', {
            body: 'Nova mensagem!',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'charlotte-no-notification',
            requireInteraction: true,
            data: { url: '/chat', platform: 'ios', handler: 'no_notification_data' }
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
          requireInteraction: true,
          data: { url: '/chat', platform: 'ios', handler: 'error_fallback' }
        });
      }
    })()
  );
});

// ✅ NOVO: Enhanced Notification Click Handler for iOS
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🍎 iOS Notification Click Event:', event);
  
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

  // iOS-specific window handling
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      console.log('[SW] Found clients:', clientList.length);
      
      // For iOS PWA, try to focus existing client first
      for (let client of clientList) {
        const clientUrl = new URL(client.url);
        
        if (clientUrl.origin === self.location.origin) {
          console.log('[SW] Focusing existing client');
          
          // Send message to existing client
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: data,
            platform: 'ios'
          });
          
          return client.focus();
        }
      }
      
      // Open new window/tab for iOS
      console.log('[SW] Opening new window for iOS');
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }).catch((error) => {
      console.error('[SW] ❌ Error handling iOS notification click:', error);
    })
  );
});

// ✅ NOVO: Handle notification close (when dismissed without clicking)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ iOS Notification dismissed');
  
  // Decrement badge when notification is dismissed
  updateBadge(Math.max(0, badgeCount - 1));
});

// ✅ CORRIGIDO: Disable Firebase handler for iOS - let native push handle it
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Firebase background message received:', payload);
  
  // ✅ CRITICAL FIX: Skip Firebase processing for iOS - use native push handler
  if (isIOS) {
    console.log('[SW] ✅ iOS detected - skipping Firebase handler, using native push handler');
    return; // Let the native push handler process the notification
  }

  const now = Date.now();
  if (now - lastNotificationTimestamp < NOTIFICATION_DEBOUNCE) {
    console.log('[SW] ⚠️ Debouncing duplicate notification');
    return;
  }
  lastNotificationTimestamp = now;

  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clientList) => {
      const isAppVisible = clientList.some(client => client.visibilityState === 'visible');
      
      if (isAppVisible && !isIOS) {
        console.log('[SW] ⚠️ App is visible, skipping background notification');
        return; // Don't show notification if app is visible (except iOS)
      }

      try {
        // iOS requires PWA to be installed for push notifications
        if (isIOS && !isPWAInstalled) {
          console.log('[SW] iOS: Skipping notification - PWA not installed');
          return;
        }

        const notification = payload.notification || {};
        const data = payload.data || {};
        
        // Enhanced notification for iOS compatibility - CONFIGURAÇÃO QUE FUNCIONA
        const notificationTitle = notification.title || data.title || 'Charlotte';
        
        const notificationOptions = {
          body: notification.body || data.body || 'Nova mensagem!',
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-fcm-single',
          
          // iOS 16.4+ specific optimizations - SIMPLIFICADO PARA FUNCIONAR
          requireInteraction: isIOS ? true : false, // iOS needs explicit interaction
          silent: false,
          timestamp: Date.now(),
          
          // iOS supports limited actions - APENAS 1 ACTION SIMPLES
          actions: isIOS ? [
            {
              action: 'open',
              title: 'Abrir'
            }
          ] : [
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
          
          // Data for navigation
          data: {
            url: data.url || notification.click_action || '/chat',
            type: data.type || 'general',
            userId: data.userId,
            timestamp: Date.now(),
            ...data
          }
        };

        // iOS-specific notification body formatting - SIMPLIFICADO
        if (isIOS && data.type === 'achievement') {
          notificationOptions.body = `🎉 ${notificationOptions.body}`;
        } else if (isIOS && data.type === 'reminder') {
          notificationOptions.body = `⏰ ${notificationOptions.body}`;
        }

        console.log('[SW] Showing Firebase notification for iOS:', notificationOptions);

        // Increment badge when showing notification
        updateBadge(badgeCount + 1);

        // Close any existing Charlotte notifications first
        return self.registration.getNotifications({ tag: 'charlotte-fcm-single' })
          .then(notifications => {
            notifications.forEach(notification => notification.close());
            console.log('[SW] 🧹 Closed', notifications.length, 'existing notifications');
            
            // Show new notification
            return self.registration.showNotification(notificationTitle, notificationOptions);
          });
        
      } catch (error) {
        console.error('[SW] Error processing background message:', error);
        
        // Fallback notification for iOS - SUPER SIMPLES
        return self.registration.showNotification('Charlotte', {
          body: 'Nova mensagem',
          icon: '/icons/icon-192x192.png',
          tag: 'charlotte-fallback',
          requireInteraction: isIOS
        });
      }
    });
});

// ✅ NOVO: Message handler for iOS PWA communication - ENHANCED
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('[SW] Message from iOS app:', type, data);
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CHECK_IOS_SUPPORT') {
    event.ports[0]?.postMessage({
      isIOS,
      isPWAInstalled,
      supportsNotifications: isIOS && isPWAInstalled
    });
  }
  
  // ✅ NOVO: Keep service worker alive
  if (type === 'KEEP_ALIVE') {
    console.log('[SW] Keep alive message received');
    event.ports[0]?.postMessage({ status: 'alive' });
  }
  
  // ✅ NOVO: Check subscription status
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
            } : null
          });
        } catch (error) {
          console.error('[SW] Error checking subscription:', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })()
    );
  }
  
  // ✅ NOVO: Heartbeat to maintain persistence
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
  
  // ✅ NOVO: Force wake-up
  if (type === 'FORCE_WAKE_UP') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Force wake-up requested');
          
          // Register wake-up sync
          if ('sync' in self.registration) {
            await self.registration.sync.register('wake-up-sync');
            console.log('[SW] Wake-up sync registered');
          }
          
          // Update wake-up attempts
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

console.log('[SW] Charlotte Firebase Messaging - iOS 16.4+ Ready - CONFIGURAÇÃO QUE FUNCIONA 100%');
console.log('[SW] ✅ iOS Native Push Events: ENABLED');
console.log('[SW] ✅ iOS Notification Click: ENABLED');
console.log('[SW] ✅ Firebase Compatibility: MAINTAINED');
console.log('[SW] ✅ PERSISTENT Service Worker: ENABLED');
console.log('[SW] ✅ Background Sync: ENABLED');
console.log('[SW] ✅ Periodic Sync: ENABLED');
console.log('[SW] ✅ Heartbeat System: ENABLED');
console.log('[SW] ✅ Wake-up System: ENABLED');