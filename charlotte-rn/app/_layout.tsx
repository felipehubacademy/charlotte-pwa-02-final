import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { ONBOARDING_KEY } from './(onboarding)/index';

// Mantém a splash screen visível enquanto carrega
SplashScreen.preventAutoHideAsync();

/**
 * Handles all auth-based navigation at the ROOT level where the full
 * route tree is visible. Avoids cross-group <Redirect> issues inside
 * nested layouts which cause "not found" errors.
 */
function AuthGuard() {
  const { isAuthenticated, isLoading, mustChangePassword, profile } = useAuth();
  const lastRoute = useRef<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Check onboarding flag once on mount
  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then((val: string | null) => setOnboardingDone(val === 'done'))
      .catch(() => setOnboardingDone(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (onboardingDone === null) return; // still reading AsyncStorage
    if (isAuthenticated && profile === null) return;

    let target: string;
    if (!isAuthenticated && !onboardingDone) {
      target = '/(onboarding)';
    } else if (!isAuthenticated) {
      target = '/(auth)/login';
    } else if (mustChangePassword) {
      target = '/(app)/first-access';
    } else {
      lastRoute.current = null;
      return;
    }

    if (lastRoute.current === target) return;
    lastRoute.current = target;
    router.replace(target as any);
  }, [isLoading, isAuthenticated, mustChangePassword, profile, onboardingDone]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGuard />
          <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
