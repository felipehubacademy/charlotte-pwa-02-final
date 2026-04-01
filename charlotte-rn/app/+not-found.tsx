import { Link, Stack } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { View } from 'react-native';
import { Question } from 'phosphor-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function NotFoundScreen() {
  const { profile } = useAuth();
  const isPt = (profile?.user_level ?? 'Novice') === 'Novice';

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Question size={64} color="#A3FF3C" weight="fill" />
          <AppText className="text-2xl font-bold">
            {isPt ? 'Página não encontrada' : 'Page not found'}
          </AppText>
          <Link href="/" className="mt-4">
            <AppText className="text-primary underline">
              {isPt ? 'Voltar para o início' : 'Back to home'}
            </AppText>
          </Link>
        </View>
      </Screen>
    </>
  );
}
