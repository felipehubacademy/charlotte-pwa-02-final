import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatBox from '@/components/chat/ChatBox';
import ChatInputBar from '@/components/chat/ChatInputBar';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import EnhancedStatsModal from '@/components/ui/EnhancedStatsModal';
import { useChat } from '@/hooks/useChat';
import { Achievement } from '@/lib/types/achievement';
import { Message } from '@/components/chat/ChatBox';

export default function GrammarScreen() {
  const { profile, signOut } = useAuth();
  const userLevel = (profile?.user_level ?? 'Novice') as 'Novice' | 'Inter' | 'Advanced';
  const userName = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const userId = profile?.id ?? '';

  const { messages, isProcessing, isProcessingAudio, sessionXP, totalXP, sendTextMessage } =
    useChat({ userLevel, userName, userId, mode: 'grammar' });

  const [showStats, setShowStats] = React.useState(false);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [playingMessageId, setPlayingMessageId] = React.useState<string | null>(null);

  const playingMessage = React.useMemo(
    () => messages.find(m => m.id === playingMessageId) ?? null,
    [messages, playingMessageId]
  );
  const audioSource = playingMessage?.audioUri ?? playingMessage?.audioUrl ?? undefined;
  const player = useAudioPlayer(undefined);
  const playerStatus = useAudioPlayerStatus(player);

  React.useEffect(() => {
    if (playerStatus.didJustFinish) setPlayingMessageId(null);
  }, [playerStatus.didJustFinish]);

  React.useEffect(() => {
    if (playingMessageId && audioSource) {
      player.replace(audioSource as AudioSource);
      player.volume = 0.75;
      player.play();
    } else {
      player.pause();
    }
  }, [playingMessageId, audioSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlay = (id: string) => {
    if (playingMessageId === id) {
      if (playerStatus.playing) { player.pause(); setPlayingMessageId(null); }
      else { player.play(); setPlayingMessageId(id); }
    } else {
      setPlayingMessageId(id);
    }
  };

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
          onSendText={sendTextMessage}
          onSendAudio={() => {}}
          onLiveVoicePress={() => {}}
          disabled={isProcessing}
          mode="grammar"
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
