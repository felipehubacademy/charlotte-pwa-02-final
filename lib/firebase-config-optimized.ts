// Optimized Firebase Configuration for Production
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Validate Firebase configuration
const validateFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Check required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);

  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase config: ${missingFields.join(', ')}`);
  }

  return config as FirebaseConfig;
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  try {
    validateFirebaseConfig();
    return true;
  } catch {
    return false;
  }
};

// Singleton Firebase app instance
let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Initialize Firebase App
export const getFirebaseApp = (): FirebaseApp => {
  if (firebaseApp) return firebaseApp;

  try {
    const config = validateFirebaseConfig();
    
    // Check if app already exists
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }

    console.log('✅ Firebase app initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase app initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase Cloud Messaging
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (messaging) return messaging;

  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      console.log('ℹ️ Firebase Messaging not available on server side');
      return null;
    }

    // Check if FCM is supported
    const supported = await isSupported();
    if (!supported) {
      console.log('ℹ️ Firebase Messaging not supported in this browser');
      return null;
    }

    const app = getFirebaseApp();
    messaging = getMessaging(app);

    // Set up foreground message listener to prevent duplicates
    setupForegroundMessageHandler(messaging);

    console.log('✅ Firebase Messaging initialized successfully');
    return messaging;
  } catch (error) {
    console.error('❌ Firebase Messaging initialization failed:', error);
    return null;
  }
};

// Debounce mechanism for foreground notifications
let lastNotificationId: string | null = null;
const DEBOUNCE_TIME = 1000; // 1 second

// Set up foreground message handler
const setupForegroundMessageHandler = (messaging: Messaging): void => {
  onMessage(messaging, (payload) => {
    console.log('📨 [FOREGROUND] FCM Message received:', payload);

    // Check for duplicate based on message ID
    const messageId = payload.messageId || (payload as any).fcmMessageId;
    if (messageId && messageId === lastNotificationId) {
      console.log('🚫 [FOREGROUND] Duplicate message, skipping');
      return;
    }

    lastNotificationId = messageId || null;

    // Clear debounce after timeout
    setTimeout(() => {
      if (lastNotificationId === messageId) {
        lastNotificationId = null;
      }
    }, DEBOUNCE_TIME);

    // Only show in-app notification for foreground messages
    // Background messages are handled by service worker
    if (document.visibilityState === 'visible') {
      console.log('✅ [FOREGROUND] Showing in-app notification');
      showInAppNotification(payload);
    } else {
      console.log('🚫 [FOREGROUND] App not visible, letting service worker handle');
    }
  });
};

// Setup foreground listener for external use
export const setupForegroundListener = (callback: (payload: any) => void): void => {
  if (typeof window === 'undefined') return;

  getFirebaseMessaging().then(messagingInstance => {
    if (messagingInstance) {
      onMessage(messagingInstance, (payload) => {
        console.log('📨 [EXTERNAL] FCM Message received:', payload);
        callback(payload);
      });
    }
  }).catch(error => {
    console.error('❌ Error setting up foreground listener:', error);
  });
};

// Show in-app notification (não push banner)
const showInAppNotification = (payload: any): void => {
  try {
    const title = payload.notification?.title || payload.data?.title || 'Charlotte';
    const body = payload.notification?.body || payload.data?.body || 'New message';

    // Create in-app toast/alert instead of push notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      border: 1px solid #374151;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${body}</div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);

    // Remove on click
    notification.addEventListener('click', () => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    });

    console.log('✅ In-app notification shown');
  } catch (error) {
    console.error('❌ Error showing in-app notification:', error);
  }
};

// Get FCM token with proper error handling
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key not configured');
    }

    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('📱 Notification permission denied');
      return null;
    }

    // Get token
    const token = await getToken(messagingInstance, { vapidKey });
    
    if (token) {
      console.log('✅ FCM token retrieved successfully');
      return token;
    } else {
      console.log('❌ Failed to retrieve FCM token');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

// Clean up function
export const cleanupFirebaseMessaging = (): void => {
  messaging = null;
  lastNotificationId = null;
  console.log('🧹 Firebase Messaging cleaned up');
};

// Configuration getter
export const getFirebaseConfig = (): FirebaseConfig | null => {
  try {
    return validateFirebaseConfig();
  } catch {
    return null;
  }
};

// Export types
export type { FirebaseConfig }; 