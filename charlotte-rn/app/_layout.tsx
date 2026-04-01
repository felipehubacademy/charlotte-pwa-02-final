import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';

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

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && profile === null) return;

    let target: string;
    if (!isAuthenticated) {
      target = '/(auth)/login';
    } else if (mustChangePassword) {
      target = '/first-access';
    } else if (lastRoute.current === '/first-access') {
      // mustChangePassword just cleared → navigate into the app
      target = '/(app)/index';
    } else {
      return;
    }

    if (lastRoute.current === target) return;
    lastRoute.current = target;
    console.log('[AuthGuard] →', target);
    router.replace(target as any);
  }, [isLoading, isAuthenticated, mustChangePassword, profile]);

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
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="first-access" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
