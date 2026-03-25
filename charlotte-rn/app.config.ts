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
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/charlotte-avatar.png',
    resizeMode: 'contain',
    backgroundColor: '#16153A',
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
    },
  },
  android: {
    package: 'com.hubacademy.charlotte',
    adaptiveIcon: {
      foregroundImage: './assets/charlotte-avatar.png',
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
    favicon: './assets/charlotte-avatar.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#16153A',
        image: './assets/charlotte-avatar.png',
        resizeMode: 'contain',
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
