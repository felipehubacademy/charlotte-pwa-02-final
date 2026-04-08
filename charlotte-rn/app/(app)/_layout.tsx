import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { PaywallModal } from '@/components/auth/PaywallModal';
import { XPToastProvider } from '@/components/ui/XPToastProvider';
import { AchievementsProvider } from '@/components/achievements/AchievementsProvider';
import WelcomeModal from '@/components/ui/WelcomeModal';

export default function AppLayout() {
  const { isAuthenticated, profile } = useAuth();

  // AuthGuard in app/_layout.tsx handles all redirects at root level.
  // app/index.tsx holds the branded LoadingScreen until session + profile are
  // both ready, so by the time we render here profile is always non-null.
  if (!isAuthenticated) return null;

  return (
    <XPToastProvider>
      <AchievementsProvider>
      <PaywallModal />
      {profile && (
        <WelcomeModal
          userLevel={profile.charlotte_level}
          userName={profile.name ?? profile.email?.split('@')[0] ?? 'Student'}
        />
      )}
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
        <Stack.Screen name="learn-intro" />
        <Stack.Screen name="learn-session" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="placement-test" options={{ animation: 'none' }} />
      </Stack>
      </AchievementsProvider>
    </XPToastProvider>
  );
}
