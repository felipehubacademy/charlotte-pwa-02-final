import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { TrialExpiredModal } from '@/components/auth/TrialExpiredModal';
import { XPToastProvider } from '@/components/ui/XPToastProvider';
import { AchievementsProvider } from '@/components/achievements/AchievementsProvider';

export default function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile } = useAuth();

  // AuthGuard in app/_layout.tsx handles all redirects at root level.
  // If not authenticated, render nothing — AuthGuard will redirect.
  if (!isAuthenticated) return null;

  // While loading or profile still being fetched, show spinner instead of
  // blank screen (prevents white-screen hang when fetchProfile is slow/retrying).
  if (isLoading || profile === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F3FA' }}>
        <ActivityIndicator size="large" color="#A3FF3C" />
      </View>
    );
  }

  return (
    <XPToastProvider>
      <AchievementsProvider>
      <TrialExpiredModal />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="first-access" options={{ animation: 'none' }} />
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="grammar" />
        <Stack.Screen name="pronunciation" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="configuracoes" />
        <Stack.Screen name="learn-grammar" />
        <Stack.Screen name="learn-pronunciation" />
        <Stack.Screen name="learn-trail" />
        <Stack.Screen name="learn-session" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="placement-test" options={{ animation: 'none' }} />
      </Stack>
      </AchievementsProvider>
    </XPToastProvider>
  );
}
