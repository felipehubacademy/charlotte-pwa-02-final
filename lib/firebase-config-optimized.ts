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

// Environment variables validation
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

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);

  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missingFields.join(', ')}`);
  }

  return config as FirebaseConfig;
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

    console.log('✅ Firebase Messaging initialized successfully');
    return messaging;
  } catch (error) {
    console.error('❌ Firebase Messaging initialization failed:', error);
    return null;
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

// Setup foreground message listener
export const setupForegroundListener = async (
  callback: (payload: any) => void
): Promise<void> => {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) return;

    onMessage(messagingInstance, (payload) => {
      console.log('📨 Foreground message received:', payload);
      callback(payload);
    });

    console.log('✅ Foreground message listener setup complete');
  } catch (error) {
    console.error('❌ Error setting up foreground listener:', error);
  }
};

// Utility functions
export const isFirebaseConfigured = (): boolean => {
  try {
    validateFirebaseConfig();
    return true;
  } catch {
    return false;
  }
};

export const getFirebaseConfig = (): FirebaseConfig | null => {
  try {
    return validateFirebaseConfig();
  } catch {
    return null;
  }
};

// Export types
export type { FirebaseConfig }; 