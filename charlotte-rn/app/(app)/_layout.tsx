import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TrialExpiredModal } from '@/components/auth/TrialExpiredModal';
import { XPToastProvider } from '@/components/ui/XPToastProvider';
import { AchievementsProvider } from '@/components/achievements/AchievementsProvider';

export default function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile } = useAuth();

  // AuthGuard in app/_layout.tsx handles all redirects at root level.
  // Return null while auth state is still resolving to avoid flash.
  // mustChangePassword is intentionally NOT included here — removing it from the
  // null guard ensures the Stack (and its routes) are always mounted while
  // authenticated. AuthGuard in app/_layout.tsx redirects mustChangePassword
  // users to /first-access; if routes aren't mounted, router.replace('/(app)/index')
  // fails with "not found" when the user finishes the first-access flow.
  if (isLoading || !isAuthenticated || (profile === null)) return null;

  return (
    <XPToastProvider>
      <AchievementsProvider>
      <TrialExpiredModal />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
