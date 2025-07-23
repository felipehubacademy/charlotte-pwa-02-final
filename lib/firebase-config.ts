// Firebase Configuration for Push Notifications
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase config (use environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize FCM
let messaging: any = null;

const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined') {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
      return messaging;
    } else {
      console.log('ℹ️ Firebase Messaging not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Messaging:', error);
    return null;
  }
};

export { app, messaging, initializeMessaging, firebaseConfig }; 