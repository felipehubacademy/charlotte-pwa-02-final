import '../global.css';
import { useEffect } from 'react';
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

  useEffect(() => {
    console.log('[AuthGuard]', { isLoading, isAuthenticated, mustChangePassword, profile: profile?.email ?? null });
    if (isLoading) return;
    if (isAuthenticated && profile === null) return;

    if (!isAuthenticated) {
      console.log('[AuthGuard] → /(auth)/login');
      router.replace('/(auth)/login');
      return;
    }
    if (mustChangePassword) {
      console.log('[AuthGuard] → /(auth)/change-password');
      router.replace('/(auth)/change-password');
      return;
    }
    console.log('[AuthGuard] → sem ação');
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
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
