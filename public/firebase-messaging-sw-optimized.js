// Optimized Firebase Cloud Messaging Service Worker for Production
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
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

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages with enhanced features
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  try {
    // Extract notification data with fallbacks
    const notification = payload.notification || {};
    const data = payload.data || {};
    
    // Enhanced notification options for Charlotte
    const notificationTitle = notification.title || data.title || 'Charlotte - English Assistant';
    
    const notificationOptions = {
      body: notification.body || data.body || 'You have a new message from Charlotte',
      icon: notification.icon || data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image: notification.image || data.image,
      tag: data.tag || 'charlotte-notification',
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      
      // Enhanced for Charlotte's educational context
      actions: [
        {
          action: 'open',
          title: '📚 Open Charlotte',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'practice',
          title: '🎯 Start Practice',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: '✖️ Dismiss'
        }
      ],
      
      // Custom data for Charlotte
      data: {
        url: data.url || notification.click_action || '/chat',
        type: data.type || 'general',
        userId: data.userId,
        achievementId: data.achievementId,
        xpGained: data.xpGained,
        level: data.level,
        timestamp: Date.now(),
        ...data
      },
      
      // Vibration pattern for mobile devices
      vibrate: [200, 100, 200],
      
      // Renotify for important messages
      renotify: data.important === 'true'
    };

    // Custom handling for different notification types
    if (data.type === 'achievement') {
      notificationOptions.body = `🎉 ${notificationOptions.body}`;
      notificationOptions.tag = 'charlotte-achievement';
      notificationOptions.requireInteraction = true;
      notificationOptions.vibrate = [300, 100, 300, 100, 300];
    } else if (data.type === 'reminder') {
      notificationOptions.body = `⏰ ${notificationOptions.body}`;
      notificationOptions.tag = 'charlotte-reminder';
    } else if (data.type === 'level_up') {
      notificationOptions.body = `🚀 ${notificationOptions.body}`;
      notificationOptions.tag = 'charlotte-level-up';
      notificationOptions.requireInteraction = true;
      notificationOptions.vibrate = [500, 200, 500];
    }

    console.log('[SW] Showing notification with options:', notificationOptions);

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
    
  } catch (error) {
    console.error('[SW] Error processing background message:', error);
    
    // Fallback notification
    return self.registration.showNotification('Charlotte', {
      body: 'You have a new message',
      icon: '/icons/icon-192x192.png',
      tag: 'charlotte-fallback'
    });
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle different actions
  let urlToOpen = data.url || '/chat';

  if (action === 'practice') {
    urlToOpen = '/chat?startPractice=true';
  } else if (action === 'dismiss') {
    console.log('[SW] Notification dismissed by user');
    return; // Just close, don't open anything
  } else if (action === 'open' || !action) {
    // Default action or 'open' action
    if (data.type === 'achievement' && data.achievementId) {
      urlToOpen = `/chat?achievement=${data.achievementId}`;
    } else if (data.type === 'level_up' && data.level) {
      urlToOpen = `/chat?levelUp=${data.level}`;
    }
  }

  // Focus or open Charlotte app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if Charlotte is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        
        // If Charlotte is open, focus it and navigate if needed
        if (clientUrl.origin === self.location.origin) {
          if ('focus' in client) {
            // Send message to the client to handle navigation
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: data
            });
            return client.focus();
          }
        }
      }
      
      // If Charlotte is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }).catch((error) => {
      console.error('[SW] Error handling notification click:', error);
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  const data = event.notification.data || {};
  
  // Track notification dismissal for analytics
  if (data.type) {
    console.log(`[SW] ${data.type} notification dismissed`);
  }
});

// Enhanced push event handler (backup)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Push data:', data);
      
      // This will be handled by messaging.onBackgroundMessage
      // but we keep this as a fallback
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
});

// Service worker installation and updates
self.addEventListener('install', (event) => {
  console.log('[SW] Firebase messaging service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received from main thread:', event.data);
  
  const { type, data } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Charlotte Firebase Messaging Service Worker loaded successfully'); 