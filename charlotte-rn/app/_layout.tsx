import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ONBOARDING_KEY } from './(onboarding)/index';
import { soundEngine } from '@/lib/soundEngine';

// Mantém a splash screen visível enquanto carrega
SplashScreen.preventAutoHideAsync();

// Pré-gera e faz cache de todos os efeitos sonoros em background
soundEngine.preload().catch(() => {});

/**
 * Handles all auth-based navigation at the ROOT level where the full
 * route tree is visible. Avoids cross-group <Redirect> issues inside
 * nested layouts which cause "not found" errors.
 */
function AuthGuard() {
  const { isAuthenticated, isLoading, mustChangePassword, profile, refreshProfile } = useAuth();
  const lastRoute = useRef<string | null>(null);
  const retryCount = useRef(0);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Check onboarding flag once on mount
  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then((val: string | null) => setOnboardingDone(val === 'done'))
      .catch(() => setOnboardingDone(false));
  }, []);

  // If auth resolved but profile fetch failed, retry up to 5 times with backoff.
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile === null && retryCount.current < 5) {
      const attempt = retryCount.current;
      retryCount.current += 1;
      const delay = attempt * 1000; // 0ms, 1s, 2s, 3s, 4s
      console.log(`[AuthGuard] profile=null retry ${attempt + 1}/5 in ${delay}ms`);
      const t = setTimeout(() => refreshProfile(), delay);
      return () => clearTimeout(t);
    }
  }, [isLoading, isAuthenticated, profile]);

  useEffect(() => {
    if (isLoading) return;
    if (onboardingDone === null) return; // still reading AsyncStorage
    if (isAuthenticated && profile === null) return; // wait for profile

    let target: string;
    if (!isAuthenticated && !onboardingDone) {
      target = '/(onboarding)';
    } else if (!isAuthenticated) {
      target = '/(auth)/login';
    } else if (mustChangePassword) {
      target = '/(app)/first-access';
    } else if (profile && !profile.placement_test_done) {
      target = '/(app)/placement-test';
    } else if (isAuthenticated && profile) {
      // Auth is fully ready. If still on login/onboarding (edge case: INITIAL_SESSION
      // fired null, redirected to login, then TOKEN_REFRESHED brought a valid session),
      // navigate into the app. Skip if already inside (app) to avoid clobbering navigation.
      const onAuthScreen = pathname === '/' ||
        pathname.includes('login') || pathname.includes('onboarding') ||
        pathname.includes('forgot') || pathname.includes('callback');
      if (!onAuthScreen) {
        lastRoute.current = null;
        return; // already in app — don't redirect
      }
      target = '/(app)';
    } else {
      lastRoute.current = null;
      return;
    }

    if (lastRoute.current === target) return;
    lastRoute.current = target;
    router.replace(target as any);
  }, [isLoading, isAuthenticated, mustChangePassword, profile, profile?.placement_test_done, onboardingDone, pathname]);

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
          <OfflineBanner />
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
