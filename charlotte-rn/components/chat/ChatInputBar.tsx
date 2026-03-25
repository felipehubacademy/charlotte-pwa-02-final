import React from 'react';
import { View, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ArrowUp, Microphone, X, Play, Pause, Hourglass, Phone } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface ChatInputBarProps {
  onSendText: (text: string) => void;
  onSendAudio: (uri: string, duration: number) => void;
  onLiveVoicePress: () => void;
  disabled?: boolean;
  mode?: 'grammar' | 'pronunciation' | 'chat';
}

const BAR_COUNT = 20;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChatInputBar({
  onSendText,
  onSendAudio,
  onLiveVoicePress,
  disabled = false,
  mode = 'chat',
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = React.useState(0);

  const player       = useAudioPlayer(previewUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const isPlaying    = playerStatus.playing;

  const barAnims = React.useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const waveIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const { state, duration, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder();

  const isRecording       = state === 'recording';
  const isProcessingAudio = state === 'processing';
  const isInPreview       = !!previewUri;
  const hasText           = text.trim().length > 0;

  // Fix: race condition between async startRecording and onPressOut
  // If onPressOut fires before startRecording completes, we cancel immediately after start
  const pressReleasedRef = React.useRef(false);

  // Wave animation while recording
  React.useEffect(() => {
    if (isRecording) {
      const animate = () => {
        barAnims.forEach(anim => {
          Animated.timing(anim, {
            toValue: 0.1 + Math.random() * 0.9,
            duration: 100,
            useNativeDriver: true,
          }).start();
        });
      };
      animate();
      waveIntervalRef.current = setInterval(animate, 120);
      return () => {
        if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
        barAnims.forEach(a => a.setValue(0.15));
      };
    }
  }, [isRecording]);

  const handleSendText = () => {
    if (!text.trim() || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSendText(text.trim());
    setText('');
  };

  const handleMicPressIn = async () => {
    if (disabled || isProcessingAudio || isInPreview) return;
    pressReleasedRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startRecording();
    // onPressOut arrived before startRecording completed → cancel immediately
    if (pressReleasedRef.current) {
      await cancelRecording();
    }
  };

  const handleMicPressOut = async () => {
    pressReleasedRef.current = true;
    if (!isRecording) return; // not started yet; handleMicPressIn will cancel via the ref
    const result = await stopRecording();
    if (result && result.duration >= 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreviewUri(result.uri);
      setPreviewDuration(result.duration);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleCancelRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelRecording();
  };

  const handleCancelPreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.pause();
    setPreviewUri(null);
    setPreviewDuration(0);
  };

  const handleSendPreview = () => {
    if (!previewUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = previewUri;
    const dur = previewDuration;
    player.pause();
    setPreviewUri(null);
    setPreviewDuration(0);
    onSendAudio(uri, dur);
  };

  const handlePlayPause = () => {
    if (!previewUri) return;
    if (isPlaying) player.pause();
    else player.play();
  };

  const wrapperStyle = {
    backgroundColor: '#16153A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Math.max(insets.bottom, 10),
  };

  // ── SINGLE RENDER — no early returns; Phone + hint text always mounted ──
  return (
    <View style={wrapperStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>

        {/* ── PILL ── */}
        <View style={[styles.pill, { flex: 1, paddingRight: 6, paddingVertical: 6, paddingLeft: 16 }]}>

          {/* ── PREVIEW content ── */}
          {isInPreview && (
            <>
              <TouchableOpacity onPress={handlePlayPause} style={styles.iconBtn}>
                {isPlaying
                  ? <Pause size={18} color="#A3FF3C" weight="fill" />
                  : <Play  size={18} color="#A3FF3C" weight="fill" />
                }
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 32, gap: 2, marginHorizontal: 4 }}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 6 + ((i * 5) % 18),
                      borderRadius: 2,
                      backgroundColor: '#A3FF3C',
                      opacity: isPlaying ? 0.9 : (0.3 + (i % 4) * 0.15),
                    }}
                  />
                ))}
              </View>
              <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontVariant: ['tabular-nums'], marginRight: 6 }}>
                {formatDuration(previewDuration)}
              </AppText>
              <TouchableOpacity onPress={handleCancelPreview} style={styles.iconBtn}>
                <X size={20} color="#ef4444" weight="bold" />
              </TouchableOpacity>
            </>
          )}

          {/* ── DEFAULT + RECORDING content ──
              TextInput always mounted for grammar/chat so keyboard stays open if it was open.
              For pronunciation mode, show mic hint or recording state instead. */}
          {!isInPreview && (mode === 'grammar' || mode === 'chat') && (
            <View style={{ flex: 1, position: 'relative', minHeight: 36, justifyContent: 'center' }}>

              {/* TextInput — hidden via opacity when recording, never unmounted */}
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type in English..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={{
                  color: '#fff',
                  fontSize: 15,
                  lineHeight: 22,
                  paddingTop: 6,
                  paddingBottom: 6,
                  maxHeight: 112,
                  opacity: isRecording ? 0 : 1,
                }}
                multiline
                returnKeyType="default"
                editable={!disabled && !isRecording}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={hasText ? handleSendText : undefined}
              />

              {/* Recording overlay — sits on top of hidden TextInput */}
              {isRecording && (
                <View style={{
                  position: 'absolute',
                  left: -4, right: 0, top: 0, bottom: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 10 }} />
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 32, gap: 2 }}>
                    {barAnims.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={{
                          flex: 1, height: 24, borderRadius: 2,
                          backgroundColor: '#A3FF3C',
                          transform: [{ scaleY: anim }],
                        }}
                      />
                    ))}
                  </View>
                  <AppText style={{
                    color: '#fff', fontSize: 13, marginLeft: 10, minWidth: 36,
                    ...(Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }),
                  }}>
                    {formatDuration(duration)}
                  </AppText>
                  <TouchableOpacity onPress={handleCancelRecording} style={styles.iconBtn}>
                    <X size={20} color="#ef4444" weight="bold" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── PRONUNCIATION MODE content ── */}
          {!isInPreview && mode === 'pronunciation' && !isRecording && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
              <AppText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Hold to record</AppText>
            </View>
          )}

          {!isInPreview && mode === 'pronunciation' && isRecording && (
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 36,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 10 }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 32, gap: 2 }}>
                {barAnims.map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={{
                      flex: 1, height: 24, borderRadius: 2,
                      backgroundColor: '#A3FF3C',
                      transform: [{ scaleY: anim }],
                    }}
                  />
                ))}
              </View>
              <AppText style={{
                color: '#fff', fontSize: 13, marginLeft: 10, minWidth: 36,
                ...(Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }),
              }}>
                {formatDuration(duration)}
              </AppText>
              <TouchableOpacity onPress={handleCancelRecording} style={styles.iconBtn}>
                <X size={20} color="#ef4444" weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── ACTION BUTTON — always at same position/size ── */}
          <View style={{ paddingBottom: 3, paddingRight: 2 }}>
            {isInPreview ? (
              // Preview: send audio
              <TouchableOpacity onPress={handleSendPreview} style={styles.actionBtn}>
                <ArrowUp size={18} color="#16153A" weight="bold" />
              </TouchableOpacity>
            ) : mode === 'grammar' && hasText ? (
              // Grammar + has text: send text button
              <TouchableOpacity
                onPress={handleSendText}
                disabled={disabled}
                style={[styles.actionBtn, { opacity: disabled ? 0.4 : 1 }]}
              >
                <ArrowUp size={18} color="#16153A" weight="bold" />
              </TouchableOpacity>
            ) : mode === 'grammar' ? (
              // Grammar + no text: invisible spacer (no mic)
              <View style={{ width: 36, height: 36 }} />
            ) : hasText && mode === 'chat' ? (
              // Chat + has text: send text button
              <TouchableOpacity
                onPress={handleSendText}
                disabled={disabled}
                style={[styles.actionBtn, { opacity: disabled ? 0.4 : 1 }]}
              >
                <ArrowUp size={18} color="#16153A" weight="bold" />
              </TouchableOpacity>
            ) : isFocused && !isRecording && mode === 'chat' ? (
              // Chat + keyboard open, no text: invisible spacer — mic hidden to avoid
              // press-and-hold breaking when keyboard dismisses and bar shifts
              <View style={{ width: 36, height: 36 }} />
            ) : (
              // Pronunciation (always) or Chat keyboard closed: mic / stop button
              // Stays mounted during recording so onPressOut always fires
              <TouchableOpacity
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={disabled || isProcessingAudio}
                activeOpacity={0.75}
                pressRetentionOffset={{ top: 30, bottom: 30, left: 30, right: 30 }}
                style={[
                  styles.actionBtn,
                  { backgroundColor: disabled || isProcessingAudio ? 'rgba(163,255,60,0.3)' : '#A3FF3C' },
                ]}
              >
                {isRecording ? (
                  <ArrowUp size={18} color="#16153A" weight="bold" />
                ) : isProcessingAudio ? (
                  <Hourglass size={17} color="rgba(22,21,58,0.6)" weight="regular" />
                ) : (
                  <Microphone size={20} color="#16153A" weight="bold" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phone — only rendered in chat mode */}
        {mode === 'chat' && (
          <TouchableOpacity
            onPress={isRecording || isInPreview ? undefined : onLiveVoicePress}
            disabled={disabled || isRecording || isInPreview}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.3 : 1,
            }}
          >
            <Phone size={26} color="rgba(255,255,255,0.55)" weight="regular" />
          </TouchableOpacity>
        )}
      </View>

      {/* Hint text — always mounted when !disabled && !hasText to avoid height jump */}
      {!disabled && !hasText && (
        <AppText style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, textAlign: 'center', marginTop: 5, letterSpacing: 0.2 }}>
          {mode === 'grammar'
            ? 'Type a sentence for grammar analysis'
            : mode === 'pronunciation'
            ? 'Hold mic to record • Charlotte analyzes your pronunciation'
            : 'Hold mic to record · Phone for live call'}
        </AppText>
      )}
    </View>
  );
}

const styles = {
  pill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1A1939',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 48,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A3FF3C',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
