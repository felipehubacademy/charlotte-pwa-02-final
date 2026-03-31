import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile } = useAuth();

  // Navigate authenticated users to the app group —
  // UNLESS they still need to create a first-time password.
  // We wait for profile to be non-null before redirecting: right after login,
  // session is set but profile is still loading (null), which makes
  // mustChangePassword temporarily false — causing a premature redirect.
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile !== null && !mustChangePassword) {
      router.replace('/(app)/index');
    }
  }, [isLoading, isAuthenticated, mustChangePassword, profile]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#F4F3FA' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
