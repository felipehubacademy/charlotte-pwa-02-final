import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { TextT, Microphone, ChatTeardropText } from 'phosphor-react-native';
import { LEVEL_CONFIG, UserLevel } from '@/lib/levelConfig';

export default function TabsLayout() {
  const { profile } = useAuth();
  const level = (profile?.user_level ?? 'Novice') as UserLevel;
  const config = LEVEL_CONFIG[level];

  const showPronunciation = config.tabs.includes('pronunciation');
  const showChat = config.tabs.includes('chat');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#16153A',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#A3FF3C',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="grammar"
        options={{
          title: 'Grammar',
          tabBarIcon: ({ color, size }) => (
            <TextT size={size} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="pronunciation"
        options={{
          title: 'Pronunciation',
          href: showPronunciation ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Microphone size={size} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: showChat ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <ChatTeardropText size={size} color={color} weight="bold" />
          ),
        }}
      />
    </Tabs>
  );
}
