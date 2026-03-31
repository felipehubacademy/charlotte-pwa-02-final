import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  // Redirect authenticated users out of the auth group immediately —
  // UNLESS they need to create a first-time password (mustChangePassword).
  // In that case, /(app)/_layout redirects here, so we must not bounce back.
  if (!isLoading && isAuthenticated && !mustChangePassword) {
    return <Redirect href="/(app)" />;
  }

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
