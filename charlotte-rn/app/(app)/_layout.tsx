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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="configuracoes"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
