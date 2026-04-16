import React from 'react';
import { Alert, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Question } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatBox from '@/components/chat/ChatBox';
import ChatInputBar from '@/components/chat/ChatInputBar';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { router } from 'expo-router';
import { useChat } from '@/hooks/useChat';
import { useMessageAudioPlayer } from '@/hooks/useMessageAudioPlayer';
import { usePaywallContext } from '@/lib/paywallContext';

export default function ChatScreen() {
  const { profile, signOut } = useAuth();
  const userLevel = (profile?.charlotte_level ?? 'Novice') as 'Novice' | 'Inter' | 'Advanced';
  const userName  = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const userId    = profile?.id ?? '';

  const { messages, isProcessing, isProcessingAudio, historyLoading, sessionXP, totalXP, rateLimited, sendTextMessage, sendAudioMessage } =
    useChat({ userLevel, userName, userId, mode: 'chat' });

  const { openPaywall } = usePaywallContext();

  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const { playingMessageId, toggle } = useMessageAudioPlayer();


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3FA' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F4F3FA' }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ChatHeader
          mode="chat"
          userName={userName}
          userLevel={userLevel}
          onLogout={signOut}
          totalXP={totalXP}
          sessionXP={sessionXP}
          onXPCounterClick={() => router.push({ pathname: '/(app)/stats', params: { sessionXP: String(sessionXP), totalXP: String(totalXP), userId: userId ?? '', userLevel: userLevel ?? 'Inter', userName: userName ?? '' } })}
          showBack
        />
        <View style={{ flex: 1 }}>
          <ChatBox
            messages={messages}
            transcript=""
            finalTranscript=""
            isProcessingMessage={isProcessing}
            isProcessingAudio={isProcessingAudio}
            historyLoading={historyLoading}
            userLevel={userLevel}
            onPlayAudio={toggle}
            playingMessageId={playingMessageId}
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Free Chat Mode', 'Have a real conversation with me. Type or hold the mic to send a voice message. Start a Live Voice call from the Home screen.')}
            style={floatingHelpStyle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Help"
          >
            <Question size={17} color="#4B4A72" weight="regular" />
          </TouchableOpacity>
        </View>
        <ChatInputBar
          onSendText={sendTextMessage}
          onSendAudio={sendAudioMessage}
          onUpgradePress={openPaywall}
          disabled={isProcessing || !!rateLimited}
          mode="chat"
          userLevel={userLevel}
          rateLimited={rateLimited}
        />
      </KeyboardAvoidingView>

      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
        userLevel={userLevel}
      />
    </SafeAreaView>
  );
}

const floatingHelpStyle = {
  position: 'absolute' as const,
  bottom: 14, right: 16,
  width: 34, height: 34, borderRadius: 17,
  backgroundColor: '#FFFFFF',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: 'rgba(22,21,58,0.12)',
  shadowOpacity: 1, shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};
