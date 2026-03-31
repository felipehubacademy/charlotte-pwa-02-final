import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TrialExpiredModal } from '@/components/auth/TrialExpiredModal';

export default function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Aluno institucional com senha temporária → forçar troca antes de entrar
  if (mustChangePassword) {
    return <Redirect href="/(auth)/change-password" />;
  }

  return (
    <>
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
      </Stack>
    </>
  );
}
