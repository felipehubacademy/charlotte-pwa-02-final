import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#e94560',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Charlotte Audio Spike' }} />
        <Stack.Screen name="test1" options={{ title: 'Teste 1 — Gravação Básica' }} />
        <Stack.Screen name="test2" options={{ title: 'Teste 2 — PCM16 Conversion' }} />
        <Stack.Screen name="test3" options={{ title: 'Teste 3 — WebSocket OpenAI' }} />
        <Stack.Screen name="test4" options={{ title: 'Teste 4 — Loop Completo' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
