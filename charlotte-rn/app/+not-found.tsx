import { Link, Stack } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <AppText className="text-5xl">🤔</AppText>
          <AppText className="text-2xl font-bold">Página não encontrada</AppText>
          <Link href="/" className="mt-4">
            <AppText className="text-primary underline">Voltar para o início</AppText>
          </Link>
        </View>
      </Screen>
    </>
  );
}
