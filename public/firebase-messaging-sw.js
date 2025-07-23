// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Extract notification info
  const notificationTitle = payload.notification?.title || 'Charlotte';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: payload.notification?.image,
    tag: 'charlotte-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open Charlotte'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    data: {
      url: payload.notification?.click_action || payload.data?.url || '/chat',
      ...payload.data
    }
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/chat';
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'close') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

console.log('[firebase-messaging-sw.js] Service Worker initialized'); 