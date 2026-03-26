import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
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

export default function PronunciationScreen() {
  const { profile, signOut } = useAuth();
  const userLevel = (profile?.user_level ?? 'Novice') as 'Novice' | 'Inter' | 'Advanced';
  const userName  = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const userId    = profile?.id ?? '';

  const { messages, isProcessing, isProcessingAudio, sessionXP, totalXP, sendAudioMessage } =
    useChat({ userLevel, userName, userId, mode: 'pronunciation' });

  const [showStats, setShowStats] = React.useState(false);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);

  const { playingMessageId, toggle } = useMessageAudioPlayer();

  const handleTogglePlay = React.useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    const uri = msg?.audioUri ?? msg?.audioUrl;
    if (uri) toggle(id, uri);
  }, [messages, toggle]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#16153A' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ChatHeader
          userName={userName}
          userLevel={userLevel}
          onLogout={signOut}
          totalXP={totalXP}
          sessionXP={sessionXP}
          onXPCounterClick={() => setShowStats(true)}
          onHelpPress={() => {}}
        />
        <ChatBox
          messages={messages}
          transcript=""
          finalTranscript=""
          isProcessingMessage={isProcessing}
          isProcessingAudio={isProcessingAudio}
          userLevel={userLevel}
          onPlayAudio={handleTogglePlay}
          playingMessageId={playingMessageId}
        />
        <ChatInputBar
          onSendText={() => {}}
          onSendAudio={sendAudioMessage}
          onLiveVoicePress={() => {}}
          disabled={isProcessing}
          mode="pronunciation"
        />
      </KeyboardAvoidingView>

      <AchievementNotification
        achievements={achievements}
        onDismiss={id => setAchievements(prev => prev.filter(a => a.id !== id))}
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
