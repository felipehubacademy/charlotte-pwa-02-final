import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TrialExpiredModal } from '@/components/auth/TrialExpiredModal';
import { XPToastProvider } from '@/components/ui/XPToastProvider';
import { AchievementsProvider } from '@/components/achievements/AchievementsProvider';

export default function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile } = useAuth();

  // AuthGuard in app/_layout.tsx handles all redirects at root level.
  // Return null while auth state is still resolving to avoid flash.
  // Return null while loading or unauthenticated.
  // first-access is registered in this Stack so that navigation from
  // first-access → index happens within the same Stack (no cross-group issues).
  // mustChangePassword users land on /(app)/first-access via AuthGuard.
  if (isLoading || !isAuthenticated || (profile === null)) return null;

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
      </Stack>
      </AchievementsProvider>
    </XPToastProvider>
  );
}
