import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Charlotte AI',
  slug: 'charlotte-rn',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-bg.png',
    resizeMode: 'cover',
    backgroundColor: '#F4F3FA',
  },
  scheme: 'charlotte',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.hubacademy.charlotte',
    // Universal Links: iOS intercepta https://charlotte.hubacademybr.com/open e /auth/*
    // e abre direto no app sem passar pelo browser.
    // Requer AASA file em /.well-known/apple-app-site-association (ja deployado no Vercel).
    associatedDomains: ['applinks:charlotte.hubacademybr.com'],
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Charlotte uses your microphone to practice English conversation with AI.',
      NSCameraUsageDescription:
        'Charlotte uses your camera so you can set a profile photo.',
      NSPhotoLibraryUsageDescription:
        'Charlotte uses your photo library so you can set a profile photo.',
      ITSAppUsesNonExemptEncryption: false,
      // Status bar: dark icons (time, wifi, battery) on light backgrounds
      UIViewControllerBasedStatusBarAppearance: false,
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    },
  },
  android: {
    package: 'com.hubacademy.charlotte',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#16153A',
    },
    permissions: [
      'RECORD_AUDIO',
      'CAMERA',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/icon.png',
  },
  updates: {
    url: 'https://u.expo.dev/da14586b-2944-4150-b8ad-5ff7e32af6e2',
    enabled: true,
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
  },
  runtimeVersion: '1.0.0',
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-updates',
    'expo-video',
    'expo-config-plugin-incall-manager',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-bg.png',
        imageWidth: 480,
        resizeMode: 'cover',
        backgroundColor: '#F4F3FA',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#A3FF3C',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    eas: {
      projectId: 'da14586b-2944-4150-b8ad-5ff7e32af6e2',
    },
  },
});
