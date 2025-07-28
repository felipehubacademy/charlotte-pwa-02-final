// Firebase Service Worker - iOS 16.4+ Compatible
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

// iOS Detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      navigator.standalone === true;

console.log('[SW] Platform detection:', { isIOS, isPWAInstalled });

// Badge counter (persistent across SW restarts via IndexedDB)
let badgeCount = 0;

// Initialize badge count from storage
self.addEventListener('activate', (event) => {
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
      
      console.log('[SW] Activating for iOS compatibility');
      await self.clients.claim();
    })()
  );
});

// Open IndexedDB for badge persistence
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('charlotte-badges', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges');
      }
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

// Enhanced background message handler for iOS
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

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
        
        // Enhanced notification for iOS compatibility
        const notificationTitle = notification.title || data.title || 'Charlotte';
        
        const notificationOptions = {
          body: notification.body || data.body || 'Nova mensagem!',
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          image: notification.image,
          tag: 'charlotte-fcm-single',
          
          // iOS 16.4+ specific optimizations
          requireInteraction: isIOS ? true : false, // iOS needs explicit interaction
          silent: false,
          timestamp: Date.now(),
          vibrate: isIOS ? [200, 100, 200] : [200, 100, 200, 100, 200],
          
          // iOS supports limited actions
          actions: isIOS ? [
            {
              action: 'open',
              title: 'Abrir',
              icon: '/icons/icon-72x72.png'
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

        // iOS-specific notification body formatting
        if (isIOS && data.type === 'achievement') {
          notificationOptions.body = `🎉 ${notificationOptions.body}`;
        } else if (isIOS && data.type === 'reminder') {
          notificationOptions.body = `⏰ ${notificationOptions.body}`;
        }

        console.log('[SW] Showing notification for iOS:', notificationOptions);

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
        console.error '[SW] Error processing background message:', error);
        
        // Fallback notification for iOS
        return self.registration.showNotification('Charlotte', {
          body: 'Nova mensagem',
          icon: '/icons/icon-192x192.png',
          tag: 'charlotte-fallback',
          requireInteraction: isIOS
        });
      }
    });
});

// Enhanced notification click handler for iOS
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked on iOS:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Decrement badge when notification is clicked
  updateBadge(Math.max(0, badgeCount - 1));

  if (action === 'close') {
    return; // Just close, don't open app
  }

  let urlToOpen = data.url || '/chat';

  // Handle iOS-specific actions
  if (action === 'practice') {
    urlToOpen = '/chat?startPractice=true';
  }

  // iOS-specific window handling
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // For iOS PWA, we need to be more careful about navigation
      for (let client of clientList) {
        const clientUrl = new URL(client.url);
        
        if (clientUrl.origin === self.location.origin) {
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
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }).catch((error) => {
      console.error('[SW] Error handling iOS notification click:', error);
    })
  );
});

// Handle notification close (when dismissed without clicking)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notification dismissed');
  
  // Decrement badge when notification is dismissed
  updateBadge(Math.max(0, badgeCount - 1));
});

// iOS-specific push event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push event on iOS:', event);
  
  // iOS 16.4+ supports declarative web push
  if (event.data) {
    try {
      const data = event.data.json();
      
      // Handle iOS 18.4+ declarative format
      if (data.web_push && data.notification) {
        const notificationData = {
          title: data.notification.title || 'Charlotte',
          body: data.notification.body || 'Nova mensagem!',
          icon: data.notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: { 
            url: data.notification.navigate || '/chat',
            platform: 'ios'
          }
        };

        event.waitUntil(
          self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            tag: 'charlotte-ios-push',
            requireInteraction: true
          })
        );
        return;
      }
    } catch (error) {
      console.error('[SW] Error parsing iOS push data:', error);
    }
  }
});

// Service worker lifecycle for iOS
self.addEventListener('install', (event) => {
  console.log('[SW] Installing for iOS compatibility');
  self.skipWaiting();
});

// Message handler for iOS PWA communication
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
});

console.log('[SW] Charlotte Firebase Messaging - iOS 16.4+ Ready');