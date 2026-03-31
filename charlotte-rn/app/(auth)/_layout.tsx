import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  // Navigate authenticated users to the app group —
  // UNLESS they still need to create a first-time password.
  // Using useEffect + router.replace (instead of <Redirect>) avoids the
  // "index not found in current navigator" error that occurs when redirecting
  // from within a nested group layout.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !mustChangePassword) {
      router.replace('/(app)/index');
    }
  }, [isLoading, isAuthenticated, mustChangePassword]);

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
