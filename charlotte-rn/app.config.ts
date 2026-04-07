import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Charlotte AI',
  slug: 'charlotte-rn',
  version: '1.0.0',
  orientation: 'portrait',
  // Fallback: o repositório atual só inclui `charlotte-avatar.png` em `assets/`.
  // Se você adicionar `icon.png`, trocamos de volta.
  icon: './assets/charlotte-avatar.png',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#F4F3FA',
  },
  scheme: 'charlotte',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.hubacademy.charlotte',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Charlotte usa o microfone para praticar conversação em inglês com IA.',
      NSCameraUsageDescription:
        'Charlotte usa a câmera para criar flashcards de vocabulário com fotos.',
      ITSAppUsesNonExemptEncryption: false,
      // Status bar: dark icons (time, wifi, battery) on light backgrounds
      UIViewControllerBasedStatusBarAppearance: false,
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    },
  },
  android: {
    package: 'com.hubacademy.charlotte',
    adaptiveIcon: {
      foregroundImage: './assets/charlotte-avatar.png',
      backgroundColor: '#F4F3FA',
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
    favicon: './assets/charlotte-avatar.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-config-plugin-incall-manager',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F4F3FA',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/charlotte-avatar.png',
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
