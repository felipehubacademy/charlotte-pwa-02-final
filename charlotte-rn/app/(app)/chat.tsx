import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatBox from '@/components/chat/ChatBox';
import ChatInputBar from '@/components/chat/ChatInputBar';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import EnhancedStatsModal from '@/components/ui/EnhancedStatsModal';
import { useChat } from '@/hooks/useChat';
import { Achievement } from '@/lib/types/achievement';
import { Message } from '@/components/chat/ChatBox';

export default function ChatScreen() {
  const { profile, signOut } = useAuth();

  const userLevel = (profile?.user_level ?? 'Novice') as 'Novice' | 'Inter' | 'Advanced';
  const userName = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const userId = profile?.id ?? '';

  const { messages, isProcessing, isProcessingAudio, sessionXP, totalXP, sendTextMessage, sendAudioMessage } =
    useChat({ userLevel, userName, userId });

  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showLiveVoice, setShowLiveVoice] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [playingMessageId, setPlayingMessageId] = React.useState<string | null>(null);

  // ── Audio player for message bubbles ──────────────────────────────────
  // Source is derived from the currently-playing message (local uri or remote url)
  const playingMessage = React.useMemo(
    () => messages.find(m => m.id === playingMessageId) ?? null,
    [messages, playingMessageId]
  );
  const audioSource = playingMessage?.audioUri ?? playingMessage?.audioUrl ?? undefined;
  const player = useAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(player);

  // Keep TTS playback at a comfortable level (avoids post-recording "shouting" effect)
  React.useEffect(() => {
    player.volume = 0.75;
  }, [player]);

  // Auto-clear playingMessageId when audio finishes
  React.useEffect(() => {
    if (playerStatus.didJustFinish) {
      setPlayingMessageId(null);
    }
  }, [playerStatus.didJustFinish]);

  // Play / pause when playingMessageId changes
  React.useEffect(() => {
    if (playingMessageId && audioSource) {
      player.play();
    } else {
      player.pause();
    }
  }, [playingMessageId, audioSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlay = (id: string) => {
    if (playingMessageId === id) {
      // Same message — toggle pause/play
      if (playerStatus.playing) {
        player.pause();
        setPlayingMessageId(null);
      } else {
        player.play();
        setPlayingMessageId(id);
      }
    } else {
      // Different message — switch
      setPlayingMessageId(id);
    }
  };

  const handleDismissAchievement = (id: string) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }} edges={['top', 'left', 'right', 'bottom']}>
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
          onHelpPress={() => setShowOnboarding(true)}
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
          onSendAudio={sendAudioMessage}
          onLiveVoicePress={() => setShowLiveVoice(true)}
          disabled={isProcessing}
        />
      </KeyboardAvoidingView>

      <AchievementNotification
        achievements={achievements}
        onDismiss={handleDismissAchievement}
      />

      <EnhancedStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        sessionXP={sessionXP}
        totalXP={totalXP}
        userId={userId}
        userLevel={userLevel}
      />

      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
        userLevel={userLevel}
      />

      <LiveVoiceModal
        isOpen={showLiveVoice}
        onClose={() => setShowLiveVoice(false)}
        userLevel={userLevel}
        userName={userName}
      />
    </SafeAreaView>
  );
}
