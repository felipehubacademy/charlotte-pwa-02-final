import React from 'react';
import { Alert, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Question } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatBox from '@/components/chat/ChatBox';
import ChatInputBar from '@/components/chat/ChatInputBar';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import EnhancedStatsModal from '@/components/ui/EnhancedStatsModal';
import { useChat } from '@/hooks/useChat';
import { useMessageAudioPlayer } from '@/hooks/useMessageAudioPlayer';
import { Achievement } from '@/lib/types/achievement';

export default function GrammarScreen() {
  const { profile, signOut } = useAuth();
  const userLevel = (profile?.user_level ?? 'Novice') as 'Novice' | 'Inter' | 'Advanced';
  const userName  = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const userId    = profile?.id ?? '';

  const { messages, isProcessing, isProcessingAudio, sessionXP, totalXP, sendTextMessage } =
    useChat({ userLevel, userName, userId, mode: 'grammar' });

  const [showStats, setShowStats]       = React.useState(false);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);

  const { playingMessageId, toggle } = useMessageAudioPlayer();


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F4F3FA' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ChatHeader
          mode="grammar"
          userName={userName}
          userLevel={userLevel}
          onLogout={signOut}
          totalXP={totalXP}
          sessionXP={sessionXP}
          onXPCounterClick={() => setShowStats(true)}
          showBack
        />
        <View style={{ flex: 1 }}>
          <ChatBox
            messages={messages}
            transcript=""
            finalTranscript=""
            isProcessingMessage={isProcessing}
            isProcessingAudio={isProcessingAudio}
            userLevel={userLevel}
            mode="grammar"
            onPlayAudio={toggle}
            playingMessageId={playingMessageId}
          />
          <TouchableOpacity
            onPress={() => Alert.alert(
              userLevel === 'Novice' ? 'Modo Gramática' : 'Grammar Mode',
              userLevel === 'Novice'
                ? 'Digite uma frase em inglês e eu vou corrigir a gramática com uma explicação curta em português. 😊'
                : 'Type a sentence in English and I\'ll analyse your grammar, spelling and style — with detailed corrections and tips.'
            )}
            style={floatingHelpStyle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Help"
          >
            <Question size={17} color="#4B4A72" weight="regular" />
          </TouchableOpacity>
        </View>
        <ChatInputBar
          onSendText={sendTextMessage}
          onSendAudio={() => {}}
          disabled={isProcessing}
          mode="grammar"
        />
      </KeyboardAvoidingView>

      <AchievementNotification
        achievements={achievements}
        onDismiss={id => setAchievements(prev => prev.filter(a => a.id !== id))}
        isPt={userLevel === 'Novice'}
      />
      <EnhancedStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        sessionXP={sessionXP}
        totalXP={totalXP}
        userId={userId}
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
