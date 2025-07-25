// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDkYP8qHGHBDDMJKlPJq5sC7KlI0k_qZHo",
  authDomain: "charlotte-english-a41cd.firebaseapp.com",
  projectId: "charlotte-english-a41cd",
  storageBucket: "charlotte-english-a41cd.firebasestorage.app",
  messagingSenderId: "844862107130",
  appId: "1:844862107130:web:b8db4a10d7bb36b6f6b8d0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

let lastNotificationTimestamp = 0;
const NOTIFICATION_DEBOUNCE = 2000;

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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 🔔 Received background message:', payload);
  
  const now = Date.now();
  if (now - lastNotificationTimestamp < NOTIFICATION_DEBOUNCE) {
    console.log('[firebase-messaging-sw.js] ⚠️ Debouncing duplicate notification');
    return;
  }
  lastNotificationTimestamp = now;

  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clientList) => {
      const isAppVisible = clientList.some(client => client.visibilityState === 'visible');
      
      if (isAppVisible) {
        console.log('[firebase-messaging-sw.js] ⚠️ App is visible, skipping background notification');
        return; // Don't show notification if app is visible
      }
      
      console.log('[firebase-messaging-sw.js] ✅ App is hidden, showing notification');

      // Extract notification info
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Charlotte';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new message from Charlotte',
        icon: payload.notification?.icon || payload.data?.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        image: payload.notification?.image || payload.data?.image,
        tag: 'charlotte-fcm-single',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'open',
            title: 'Open Charlotte',
            icon: '/icons/icon-72x72.png'
          },
          {
            action: 'close',
            title: 'Dismiss'
          }
        ],
        data: {
          url: payload.notification?.click_action || payload.data?.url || '/chat',
          timestamp: Date.now(),
          ...payload.data
        }
      };

      console.log('[firebase-messaging-sw.js] 📨 Showing notification:', notificationTitle, notificationOptions);

      // Increment badge when showing notification
      updateBadge(badgeCount + 1);

      // Close any existing Charlotte notifications first
      return self.registration.getNotifications({ tag: 'charlotte-fcm-single' })
        .then(notifications => {
          notifications.forEach(notification => notification.close());
          console.log('[firebase-messaging-sw.js] 🧹 Closed', notifications.length, 'existing notifications');
          
          // Show new notification
          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 🖱️ Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Decrement badge when notification is clicked
  updateBadge(Math.max(0, badgeCount - 1));

  if (event.action === 'close') {
    return; // Just close, don't open app
  }

  // Open/focus the app
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close (when dismissed without clicking)
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] ❌ Notification dismissed');
  
  // Decrement badge when notification is dismissed
  updateBadge(Math.max(0, badgeCount - 1));
}); 