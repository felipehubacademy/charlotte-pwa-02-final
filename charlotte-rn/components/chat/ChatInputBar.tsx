import React from 'react';
import {
  View, TextInput, TouchableOpacity,
  Animated, Platform, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ArrowUp, Microphone, X, Play, Pause, Hourglass } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import { useAudioRecorder, PRONUNCIATION_RECORDING_OPTIONS } from '@/hooks/useAudioRecorder';

// ── Light theme ───────────────────────────────────────────────
const C = {
  bg:        '#FFFFFF',
  pill:      '#F4F3FA',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.09)',
  topBorder: 'rgba(22,21,58,0.08)',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  red:       '#DC2626',
};

interface ChatInputBarProps {
  onSendText: (text: string) => void;
  onSendAudio?: (uri: string, duration: number) => void;
  onLiveVoicePress?: () => void; // kept for compat — Phone moved to header
  disabled?: boolean;
  mode?: 'grammar' | 'pronunciation' | 'chat';
  userLevel?: string;
}

const BAR_COUNT = 22;

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function ChatInputBar({
  onSendText,
  onSendAudio,
  disabled = false,
  mode = 'chat',
  userLevel,
}: ChatInputBarProps) {
  const isNovice = userLevel === 'Novice';
  const insets = useSafeAreaInsets();
  const [text, setText]             = React.useState('');
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewDur, setPreviewDur] = React.useState(0);

  const player       = useAudioPlayer(previewUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const isPlaying    = playerStatus.playing;

  const barAnims = React.useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const waveRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing rings for pronunciation recording state
  const ring1 = React.useRef(new Animated.Value(0)).current;
  const ring2 = React.useRef(new Animated.Value(0)).current;
  const ring3 = React.useRef(new Animated.Value(0)).current;

  // Pronunciation mode records WAV (PCM 16kHz) so Azure Speech SDK can process
  // it directly without any server-side conversion (M4A fails in serverless).
  const { state, duration, startRecording, stopRecording, cancelRecording } =
    useAudioRecorder(mode === 'pronunciation' ? PRONUNCIATION_RECORDING_OPTIONS : undefined);

  const isRecording  = state === 'recording';
  const isProcessing = state === 'processing';
  const isPreview    = !!previewUri;
  const hasText      = text.trim().length > 0;
  const releasedRef  = React.useRef(false);

  // Wave animation (chat mode only)
  React.useEffect(() => {
    if (isRecording && mode !== 'pronunciation') {
      const go = () => barAnims.forEach(a =>
        Animated.timing(a, { toValue: 0.1 + Math.random() * 0.9, duration: 100, useNativeDriver: true }).start()
      );
      go();
      waveRef.current = setInterval(go, 120);
      return () => { if (waveRef.current) clearInterval(waveRef.current); barAnims.forEach(a => a.setValue(0.15)); };
    }
  }, [isRecording, mode]);

  // Pulse rings animation (pronunciation mode only)
  React.useEffect(() => {
    if (mode !== 'pronunciation') return;
    if (!isRecording) {
      ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);
      return;
    }
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1, duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = makePulse(ring1, 0);
    const a2 = makePulse(ring2, 470);
    const a3 = makePulse(ring3, 940);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); ring1.setValue(0); ring2.setValue(0); ring3.setValue(0); };
  }, [isRecording, mode]);

  const sendText = () => {
    if (!text.trim() || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSendText(text.trim());
    setText('');
  };

  const micPressIn = async () => {
    if (disabled || isProcessing || isPreview) return;
    releasedRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startRecording();
    if (releasedRef.current) await cancelRecording();
  };

  const micPressOut = async () => {
    releasedRef.current = true;
    if (!isRecording) return;
    const res = await stopRecording();
    if (res && res.duration >= 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreviewUri(res.uri);
      setPreviewDur(res.duration);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const cancelPreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.pause();
    setPreviewUri(null);
    setPreviewDur(0);
  };

  const sendPreview = () => {
    if (!previewUri || !onSendAudio) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = previewUri; const dur = previewDur;
    player.pause();
    setPreviewUri(null); setPreviewDur(0);
    onSendAudio(uri, dur);
  };

  const wrapper = {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.topBorder,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Math.max(insets.bottom, 10),
  };

  // ══════════════════════════════════════════════════════════
  //  PRONUNCIATION — big central mic, no pill
  // ══════════════════════════════════════════════════════════
  if (mode === 'pronunciation') {

    // Interpolations for the 3 pulse rings
    const ringScale = (anim: Animated.Value) =>
      anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
    const ringOpacity = (anim: Animated.Value) =>
      anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.45, 0] });

    return (
      <View style={[wrapper, { paddingHorizontal: 20 }]}>

        {/* ── Preview state — circular layout, same position as mic ── */}
        {isPreview && (
          <View style={{ alignItems: 'center', paddingVertical: 8, gap: 10 }}>

            {/* Row: [X]  [Play/Pause]  [↑] */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>

              {/* Cancel */}
              <TouchableOpacity
                onPress={cancelPreview}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: `${C.red}18`,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={22} color={C.red} weight="bold" />
              </TouchableOpacity>

              {/* Play / Pause — same size as mic button */}
              <TouchableOpacity
                onPress={() => { if (isPlaying) player.pause(); else player.play(); }}
                activeOpacity={0.85}
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: C.green,
                  alignItems: 'center', justifyContent: 'center',
                  ...Platform.select({
                    ios: {
                      shadowColor: C.green,
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 4 },
                    },
                    android: { elevation: 6 },
                  }),
                }}
              >
                {isPlaying
                  ? <Pause size={34} color={C.navy} weight="fill" />
                  : <Play  size={34} color={C.navy} weight="fill" />
                }
              </TouchableOpacity>

              {/* Send */}
              <TouchableOpacity
                onPress={sendPreview}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: C.navy,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ArrowUp size={22} color={C.green} weight="bold" />
              </TouchableOpacity>

            </View>

            {/* Duration below, same position as "Hold to record" label */}
            <AppText style={{
              fontSize: 12, color: C.navyLight, fontWeight: '500',
              ...(Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }),
            }}>
              {formatDuration(previewDur)}
            </AppText>

          </View>
        )}

        {/* ── Idle + Recording: big mic button with pulse rings ── */}
        {!isPreview && (
          <View style={{ alignItems: 'center', paddingVertical: 8, gap: 10 }}>

            {/* Button + rings container */}
            <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>

              {/* Pulse rings — visible only while recording */}
              {[ring1, ring2, ring3].map((anim, i) => (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 80, height: 80, borderRadius: 40,
                    borderWidth: 2,
                    borderColor: C.red,
                    transform: [{ scale: ringScale(anim) }],
                    opacity: ringOpacity(anim),
                  }}
                />
              ))}

              {/* The mic button itself */}
              <TouchableOpacity
                onPressIn={micPressIn}
                onPressOut={micPressOut}
                disabled={disabled || isProcessing}
                activeOpacity={1}
                pressRetentionOffset={{ top: 60, bottom: 60, left: 60, right: 60 }}
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor:
                    isProcessing         ? `${C.green}50`
                    : isRecording        ? C.red
                    : disabled           ? `${C.green}50`
                    : C.green,
                  alignItems: 'center', justifyContent: 'center',
                  ...Platform.select({
                    ios: {
                      shadowColor: isRecording ? C.red : C.green,
                      shadowOpacity: isRecording ? 0.45 : 0.35,
                      shadowRadius: isRecording ? 20 : 16,
                      shadowOffset: { width: 0, height: 4 },
                    },
                    android: { elevation: isRecording ? 10 : 6 },
                  }),
                }}
              >
                {isProcessing
                  ? <Hourglass size={30} color={`${C.navy}60`} weight="regular" />
                  : <Microphone size={34} color={isRecording ? '#FFFFFF' : C.navy} weight="bold" />
                }
              </TouchableOpacity>
            </View>

            {/* Status label — fixed height so button never shifts */}
            <AppText style={{
              fontSize: 12, fontWeight: isRecording ? '700' : '500', letterSpacing: 0.2,
              color: isRecording ? C.red : C.navyLight,
              ...(isRecording && Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : {}),
              ...(isRecording && Platform.OS !== 'ios' ? { fontFamily: 'monospace' } : {}),
            }}>
              {isProcessing ? 'Processing...' : isRecording ? formatDuration(duration) : 'Hold to record'}
            </AppText>

          </View>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  GRAMMAR — text pill + send button outside (disabled when empty)
  // ══════════════════════════════════════════════════════════
  if (mode === 'grammar') {
    return (
      <View style={wrapper}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>

          {/* Input pill */}
          <View style={[styles.pill, { flex: 1, paddingHorizontal: 16, paddingVertical: 12 }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={isNovice ? 'Digite em inglês...' : 'Type in English...'}
              placeholderTextColor={C.navyLight}
              style={{ color: C.navy, fontSize: 15, lineHeight: 22, maxHeight: 120, flex: 1 }}
              multiline
              returnKeyType="default"
              editable={!disabled}
              onSubmitEditing={hasText ? sendText : undefined}
            />
          </View>

          {/* Send button — outside, always visible, dims when no text */}
          <TouchableOpacity
            onPress={sendText}
            disabled={disabled || !hasText}
            style={[
              styles.actionBtn,
              { backgroundColor: hasText ? C.green : C.pill,
                borderWidth: hasText ? 0 : 1, borderColor: C.border,
              },
            ]}
          >
            <ArrowUp size={20} color={hasText ? C.navy : C.navyLight} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  CHAT — pill + outside button (mic ↔ send)
  // ══════════════════════════════════════════════════════════
  return (
    <View style={wrapper}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>

        {/* Input pill — shows text OR waveform OR preview */}
        <View style={[styles.pill, { flex: 1, paddingHorizontal: 16, paddingVertical: 12 }]}>

          {/* Audio preview */}
          {isPreview && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <TouchableOpacity onPress={() => { if (isPlaying) player.pause(); else player.play(); }} style={{ padding: 2 }}>
                {isPlaying
                  ? <Pause size={16} color={C.navy} weight="fill" />
                  : <Play  size={16} color={C.navy} weight="fill" />
                }
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 28, gap: 2 }}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <View key={i} style={{
                    flex: 1, height: 4 + ((i * 5) % 16), borderRadius: 2,
                    backgroundColor: C.navy, opacity: isPlaying ? 0.6 : (0.2 + (i % 4) * 0.1),
                  }} />
                ))}
              </View>
              <AppText style={{ color: C.navyLight, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                {formatDuration(previewDur)}
              </AppText>
              <TouchableOpacity onPress={cancelPreview} style={{ padding: 2 }}>
                <X size={16} color={C.red} weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Recording waveform */}
          {!isPreview && isRecording && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, flexShrink: 0 }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 28, gap: 2 }}>
                {barAnims.map((anim, i) => (
                  <Animated.View key={i} style={{
                    flex: 1, height: 22, borderRadius: 2,
                    backgroundColor: C.navy, opacity: 0.4,
                    transform: [{ scaleY: anim }],
                  }} />
                ))}
              </View>
              <AppText style={{
                color: C.navy, fontSize: 13, minWidth: 36,
                ...(Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : { fontFamily: 'monospace' }),
              }}>
                {formatDuration(duration)}
              </AppText>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); cancelRecording(); }} style={{ padding: 2 }}>
                <X size={16} color={C.red} weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Text input */}
          {!isPreview && !isRecording && (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type in English..."
              placeholderTextColor={C.navyLight}
              style={{ color: C.navy, fontSize: 15, lineHeight: 22, maxHeight: 120, flex: 1 }}
              multiline
              returnKeyType="default"
              editable={!disabled}
              onSubmitEditing={hasText ? sendText : undefined}
            />
          )}
        </View>

        {/* Action button — outside the pill */}
        {isPreview ? (
          // Preview: send audio
          <TouchableOpacity onPress={sendPreview} style={[styles.actionBtn, { backgroundColor: C.green }]}>
            <ArrowUp size={20} color={C.navy} weight="bold" />
          </TouchableOpacity>
        ) : hasText ? (
          // Has text: send text
          <TouchableOpacity onPress={sendText} disabled={disabled} style={[styles.actionBtn, { backgroundColor: C.green, opacity: disabled ? 0.4 : 1 }]}>
            <ArrowUp size={20} color={C.navy} weight="bold" />
          </TouchableOpacity>
        ) : (
          // No text, no preview: mic
          <TouchableOpacity
            onPressIn={micPressIn}
            onPressOut={micPressOut}
            disabled={disabled || isProcessing}
            activeOpacity={0.75}
            pressRetentionOffset={{ top: 30, bottom: 30, left: 30, right: 30 }}
            style={[styles.actionBtn, {
              backgroundColor: disabled || isProcessing ? `${C.green}50` : C.green,
            }]}
          >
            {isProcessing
              ? <Hourglass size={17} color={`${C.navy}60`} weight="regular" />
              : <Microphone size={20} color={C.navy} weight="bold" />
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = {
  pill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F4F3FA',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(22,21,58,0.09)',
    minHeight: 48,
  },
  actionBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#A3FF3C',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
};
