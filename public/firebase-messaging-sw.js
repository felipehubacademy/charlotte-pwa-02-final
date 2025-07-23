// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ⚠️ IMPORTANTE: Service Workers não têm acesso a process.env
// As configurações precisam ser hardcoded ou injetadas durante o build
// Usando configuração para Charlotte v2 (replace com suas configurações reais)
const firebaseConfig = {
  apiKey: "AIzaSyCEKjNSV6-XkvYueEXMjMJw3J8iF2yaqP00",
  authDomain: "charlotte-notifications.firebaseapp.com",
  projectId: "charlotte-notifications",
  storageBucket: "charlotte-notifications.firebasestorage.app",
  messagingSenderId: "664193430418",
  appId: "1:664193430418:web:b647cff7f8f05caadcc74b"
};

// ✅ ATENÇÃO: Se as configurações acima não funcionarem,
// substitua pelos valores do seu .env.local:
// - NEXT_PUBLIC_FIREBASE_API_KEY
// - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// - NEXT_PUBLIC_FIREBASE_PROJECT_ID
// - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
// - NEXT_PUBLIC_FIREBASE_APP_ID

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Prevent duplicate notifications
let lastNotificationTimestamp = 0;
const NOTIFICATION_DEBOUNCE = 2000; // 2 seconds

// Handle background messages (quando app está fechado/minimizado)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 🔔 Received background message:', payload);
  
  // Prevent duplicates using timestamp
  const now = Date.now();
  if (now - lastNotificationTimestamp < NOTIFICATION_DEBOUNCE) {
    console.log('[firebase-messaging-sw.js] 🚫 Duplicate notification blocked (debounce)');
    return;
  }
  lastNotificationTimestamp = now;
  
  // Check if app is in foreground (visible)
  return clients.matchAll({ type: 'window', includeUncontrolled: true })
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
  console.log('[firebase-messaging-sw.js] 🖱️ Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get URL to open
  const urlToOpen = event.notification.data?.url || '/chat';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  console.log('[firebase-messaging-sw.js] 🔗 Opening URL:', fullUrl);

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// ✅ REMOVIDO: Handler duplicado de push events
// O onBackgroundMessage() do FCM já cuida de tudo
// Mantendo apenas se precisarmos de fallback no futuro

console.log('[firebase-messaging-sw.js] ✅ Firebase Messaging Service Worker loaded successfully'); 