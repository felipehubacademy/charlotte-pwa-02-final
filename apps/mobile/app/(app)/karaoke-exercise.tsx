/**
 * karaoke-exercise.tsx
 *
 * Beta: Read Aloud (Karaoke) exercise.
 * Charlotte reads each chunk → user repeats → Azure Pronunciation Assessment scores each word.
 *
 * Access: Settings screen (beta_features flag only).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, Animated, ActivityIndicator,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Microphone, ArrowLeft, ArrowRight, CheckCircle } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/Audio.types';

import { AppText } from '@/components/ui/Text';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useAudioRecorder, PRONUNCIATION_RECORDING_OPTIONS } from '@/hooks/useAudioRecorder';

// ── Config ────────────────────────────────────────────────────────
const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte.hubacademybr.com';

// ── Types ─────────────────────────────────────────────────────────
interface WordTiming { word: string; start: number; end: number; }

type WordState = 'dim' | 'active' | 'spoken' | 'good' | 'ok' | 'bad' | 'omission';
type Phase     = 'charlotte' | 'listening' | 'scoring' | 'feedback';

interface KaraokeChunk { text: string; words: string[]; translation?: string; }
interface KaraokeExercise { sentence: string; chunks: KaraokeChunk[]; }
interface KaraokeText {
  level: 'Novice' | 'Inter' | 'Advanced';
  title: string;
  exercises: KaraokeExercise[];
}

// ── Test data ─────────────────────────────────────────────────────
const KARAOKE_DATA: KaraokeText[] = [
  {
    level: 'Novice', title: 'My Morning Routine',
    exercises: [{
      sentence: 'Every morning, I wake up at seven.',
      chunks: [
        { text: 'Every morning',  words: ['Every', 'morning'],          translation: 'Todo dia de manhã' },
        { text: 'I wake up',      words: ['I', 'wake', 'up'],           translation: 'Eu acordo' },
        { text: 'at seven',       words: ['at', 'seven'],               translation: 'às sete' },
      ],
    }],
  },
  {
    level: 'Inter', title: 'An Unexpected Opportunity',
    exercises: [{
      sentence: 'After months of working overtime, she finally decided to hand in her resignation.',
      chunks: [
        { text: 'After months of working overtime', words: ['After', 'months', 'of', 'working', 'overtime'] },
        { text: 'she finally decided',              words: ['she', 'finally', 'decided'] },
        { text: 'to hand in her resignation',       words: ['to', 'hand', 'in', 'her', 'resignation'] },
      ],
    }],
  },
  {
    level: 'Advanced', title: "Nobody Warned Daniel",
    exercises: [{
      sentence: 'He kept telling himself he just needed more time to adjust, but deep down he knew something had to change.',
      chunks: [
        { text: 'He kept telling himself',            words: ['He', 'kept', 'telling', 'himself'] },
        { text: 'he just needed more time to adjust', words: ['he', 'just', 'needed', 'more', 'time', 'to', 'adjust'] },
        { text: 'but deep down he knew',              words: ['but', 'deep', 'down', 'he', 'knew'] },
        { text: 'something had to change',            words: ['something', 'had', 'to', 'change'] },
      ],
    }],
  },
];

// ── Palette ───────────────────────────────────────────────────────
const C = {
  bg:        '#16153A',
  card:      'rgba(255,255,255,0.07)',
  cardBorder:'rgba(255,255,255,0.12)',
  wordDim:   'rgba(255,255,255,0.28)',
  wordActive:'#FCD34D',
  wordSpoken:'#FFFFFF',
  wordGood:  '#4ADE80',
  wordOk:    '#FCD34D',
  wordBad:   '#F87171',
  wordOmit:  '#DC2626',
  accent:    '#7C3AED',
  accentLight:'#A78BFA',
  white:     '#FFFFFF',
  whiteAlpha:'rgba(255,255,255,0.50)',
  mic:       '#A78BFA',
  micBg:     'rgba(124,58,237,0.18)',
};

function wordStateColor(s: WordState): string {
  switch (s) {
    case 'active':   return C.wordActive;
    case 'spoken':   return C.wordSpoken;
    case 'good':     return C.wordGood;
    case 'ok':       return C.wordOk;
    case 'bad':      return C.wordBad;
    case 'omission': return C.wordOmit;
    default:         return C.wordDim;
  }
}

// ── Main screen ───────────────────────────────────────────────────
export default function KaraokeExerciseScreen() {
  const { profile, session } = useAuth();
  const userId = session?.user?.id ?? '';

  const userLevel = (profile?.charlotte_level ?? 'Inter') as 'Novice' | 'Inter' | 'Advanced';
  const isPt      = userLevel === 'Novice';
  const data      = KARAOKE_DATA.find(d => d.level === userLevel) ?? KARAOKE_DATA[1];

  // Exercise navigation
  const [exIdx,    setExIdx]    = useState(0);
  const [chunkIdx, setChunkIdx] = useState(0);
  const exercise = data.exercises[exIdx];
  const chunk    = exercise?.chunks[chunkIdx];

  // Phase
  const [phase,      setPhase]      = useState<Phase>('charlotte');
  const [attempts,   setAttempts]   = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [scoringErr, setScoringErr] = useState(false);
  const [done,       setDone]       = useState(false);

  // Charlotte karaoke
  const [audioLoading,  setAudioLoading]  = useState(false);
  const [wordTimings,   setWordTimings]   = useState<WordTiming[]>([]);
  const [currentTime,   setCurrentTime]   = useState(0);
  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const playerRef   = useRef<AudioPlayer | null>(null);
  const subRef      = useRef<ReturnType<AudioPlayer['addListener']> | null>(null);
  const pendingPlay = useRef(false);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mic pulse animation
  const micPulse = useRef(new Animated.Value(1)).current;
  const micPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Recording
  const recorder = useAudioRecorder(PRONUNCIATION_RECORDING_OPTIONS, 8);

  // ── Audio player lifecycle ───────────────────────────────────
  useEffect(() => {
    const player = createAudioPlayer(null);
    playerRef.current = player;
    return () => {
      subRef.current?.remove();
      if (pollRef.current)  clearInterval(pollRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      micPulseLoop.current?.stop();
      try { player.pause(); player.remove(); } catch {}
    };
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (playerRef.current?.playing) {
        setCurrentTime(playerRef.current.currentTime ?? 0);
      }
    }, 50);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Fetch helpers (identical to learn-intro.tsx) ─────────────
  const fetchTimings = useCallback(async (text: string): Promise<WordTiming[]> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      const fileKey  = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}karaoke_${fileKey}.json`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return JSON.parse(await FileSystem.readAsStringAsync(localUri));
      const res = await fetch(`${API_BASE_URL}/tts/${fileKey}.json`);
      if (res.ok) {
        const timings: WordTiming[] = await res.json();
        await FileSystem.writeAsStringAsync(localUri, JSON.stringify(timings));
        return timings;
      }
    } catch {}
    return [];
  }, []);

  const fetchAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      const fileKey  = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}karaoke_${fileKey}.mp3`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return localUri;
      const dl = await FileSystem.downloadAsync(`${API_BASE_URL}/tts/${fileKey}.mp3`, localUri);
      if (dl.status === 200) return localUri;
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...(userId ? { userId } : {}) }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.audio) return null;
      await FileSystem.writeAsStringAsync(localUri, data.audio, { encoding: 'base64' as any });
      return localUri;
    } catch { return null; }
  }, [userId]);

  // ── Load chunk — Charlotte's turn ────────────────────────────
  const loadChunk = useCallback(async (c: KaraokeChunk) => {
    subRef.current?.remove();
    subRef.current = null;
    pendingPlay.current = false;
    setWordTimings([]);
    setCurrentTime(0);
    setWordStates([]);
    setScoringErr(false);
    setPhase('charlotte');

    setAudioLoading(true);
    const [uri, timings] = await Promise.all([fetchAudio(c.text), fetchTimings(c.text)]);
    setAudioLoading(false);

    setWordTimings(timings);

    if (!uri || !playerRef.current) { setPhase('listening'); return; }

    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      playerRef.current.replace({ uri });
      pendingPlay.current = true;

      subRef.current = playerRef.current.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (pendingPlay.current && status.isLoaded && !status.playing) {
          pendingPlay.current = false;
          try { playerRef.current?.play(); } catch {}
        }
        if (status.didJustFinish) {
          subRef.current?.remove();
          subRef.current = null;
          startListening();
        }
      });

      setTimeout(() => {
        if (pendingPlay.current) {
          pendingPlay.current = false;
          try { playerRef.current?.play(); } catch {}
        }
      }, 1500);
    } catch { setPhase('listening'); }
  }, [fetchAudio, fetchTimings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start user listening phase ───────────────────────────────
  const startListening = useCallback(async () => {
    setPhase('listening');
    setWordStates([]);

    // Mic pulse animation
    micPulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    micPulseLoop.current.start();

    await recorder.startRecording();

    // Auto-stop after chunk word count * 0.9s + 3s buffer (max 8s)
  }, [recorder, micPulse]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User stops recording → score ────────────────────────────
  const stopAndScore = useCallback(async () => {
    micPulseLoop.current?.stop();
    micPulse.setValue(1);
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }

    setPhase('scoring');
    const result = await recorder.stopRecording();
    if (!result?.uri) { setPhase('listening'); return; }

    try {
      const lower    = result.uri.toLowerCase();
      const isWav    = lower.endsWith('.wav');
      const formData = new FormData();
      formData.append('audio', { uri: result.uri, name: isWav ? 'r.wav' : 'r.m4a', type: isWav ? 'audio/wav' : 'audio/x-m4a' } as unknown as Blob);
      formData.append('referenceText', chunk.text);

      const res  = await fetch(`${API_BASE_URL}/api/pronunciation`, { method: 'POST', body: formData });
      const data = await res.json();
      const words: Array<{ word: string; accuracyScore: number; errorType: string }> =
        data.result?.words ?? [];

      // Align scores to chunk.words
      const states: WordState[] = chunk.words.map(refWord => {
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
        const match = words.find(w => norm(w.word) === norm(refWord));
        if (!match) return 'omission';
        if (match.errorType === 'Omission') return 'omission';
        if (match.accuracyScore >= 80) return 'good';
        if (match.accuracyScore >= 50) return 'ok';
        return 'bad';
      });

      setWordStates(states);
      setPhase('feedback');

      const hasOmission = states.includes('omission');
      if (hasOmission && attempts < 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(
          states.every(s => s === 'good') ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        );
        setTimeout(() => advanceChunk(states), 1800);
      }
    } catch {
      setScoringErr(true);
      setPhase('feedback');
    }
  }, [recorder, chunk, attempts, micPulse]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance to next chunk or exercise ───────────────────────
  const advanceChunk = useCallback((states?: WordState[]) => {
    const ex = data.exercises[exIdx];
    if (chunkIdx < ex.chunks.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setChunkIdx(c => c + 1);
        setAttempts(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    } else if (exIdx < data.exercises.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setExIdx(e => e + 1);
        setChunkIdx(0);
        setAttempts(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    } else {
      setDone(true);
    }
  }, [exIdx, chunkIdx, data.exercises, fadeAnim]);

  // ── Retry chunk ──────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setAttempts(a => a + 1);
    startListening();
  }, [startListening]);

  // ── Load chunk when index changes ───────────────────────────
  useEffect(() => {
    if (chunk) loadChunk(chunk);
  }, [exIdx, chunkIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render words ─────────────────────────────────────────────
  const renderWords = () => {
    if (phase === 'charlotte') {
      if (!wordTimings.length) {
        return (
          <AppText style={{ fontSize: 24, fontWeight: '600', color: C.wordDim, lineHeight: 36, textAlign: 'center' }}>
            {chunk?.text}
          </AppText>
        );
      }
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {wordTimings.map((w, i) => {
            const isActive = w.start <= currentTime && currentTime < w.end;
            const isSpoken = w.end <= currentTime;
            const color    = isActive ? C.wordActive : isSpoken ? C.wordSpoken : C.wordDim;
            return (
              <AppText key={i} style={{ fontSize: 24, fontWeight: '600', color, lineHeight: 36 }}>
                {w.word}{' '}
              </AppText>
            );
          })}
        </View>
      );
    }

    // User turn — color by score
    const words = chunk?.words ?? [];
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {words.map((w, i) => {
          const state = wordStates[i] ?? 'dim';
          const color = wordStateColor(state);
          return (
            <AppText key={i} style={{ fontSize: 24, fontWeight: '600', color, lineHeight: 36 }}>
              {w}{' '}
            </AppText>
          );
        })}
      </View>
    );
  };

  // ── Done screen ──────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <CheckCircle size={64} color={C.wordGood} weight="fill" />
        <AppText style={{ fontSize: 26, fontWeight: '800', color: C.white, marginTop: 20, textAlign: 'center' }}>
          {isPt ? 'Muito bem!' : 'Great job!'}
        </AppText>
        <AppText style={{ fontSize: 15, color: C.whiteAlpha, marginTop: 10, textAlign: 'center' }}>
          {data.title}
        </AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 36, backgroundColor: C.accent, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40 }}
        >
          <AppText style={{ fontSize: 16, fontWeight: '800', color: C.white }}>
            {isPt ? 'Voltar' : 'Back'}
          </AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!chunk) return null;

  const totalChunks   = exercise.chunks.length;
  const globalChunk   = data.exercises.slice(0, exIdx).reduce((s, e) => s + e.chunks.length, 0) + chunkIdx;
  const totalAllChunks = data.exercises.reduce((s, e) => s + e.chunks.length, 0);
  const hasOmission   = wordStates.includes('omission');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={C.whiteAlpha} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={{ color: C.whiteAlpha, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {data.title}
          </AppText>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* ── Progress bar ── */}
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: 20, borderRadius: 2 }}>
        <View style={{
          height: 3, borderRadius: 2, backgroundColor: C.accentLight,
          width: `${((globalChunk + (phase === 'feedback' ? 1 : 0)) / totalAllChunks) * 100}%`,
        }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 }}>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>

          {/* Charlotte avatar — shown during her turn */}
          {phase === 'charlotte' && (
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <CharlotteAvatar size="xl" />
              {audioLoading && <ActivityIndicator color={C.accentLight} style={{ marginTop: 10 }} />}
            </View>
          )}

          {/* Exercise sentence (context) */}
          <AppText style={{ fontSize: 12, fontWeight: '700', color: C.accentLight, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 16, textAlign: 'center' }}>
            {isPt ? `Trecho ${chunkIdx + 1} de ${totalChunks}` : `Chunk ${chunkIdx + 1} of ${totalChunks}`}
          </AppText>

          {/* Karaoke / scored words */}
          <View style={{
            backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder,
            paddingHorizontal: 24, paddingVertical: 22, width: '100%', alignItems: 'center', marginBottom: 24,
          }}>
            {renderWords()}
            {/* Translation — Novice only */}
            {isPt && chunk.translation && (
              <AppText style={{ fontSize: 13, color: C.whiteAlpha, marginTop: 12, textAlign: 'center' }}>
                {chunk.translation}
              </AppText>
            )}
          </View>

          {/* ── User turn: mic ── */}
          {(phase === 'listening' || phase === 'scoring' || phase === 'feedback') && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>

              {phase === 'listening' && (
                <>
                  <AppText style={{ fontSize: 13, color: C.whiteAlpha, marginBottom: 20 }}>
                    {isPt ? 'Sua vez — repita o trecho' : 'Your turn — repeat the chunk'}
                  </AppText>
                  <TouchableOpacity onPress={stopAndScore} activeOpacity={0.8}>
                    <Animated.View style={{
                      width: 80, height: 80, borderRadius: 40,
                      backgroundColor: C.micBg, alignItems: 'center', justifyContent: 'center',
                      transform: [{ scale: micPulse }],
                      borderWidth: 1.5, borderColor: C.mic,
                    }}>
                      <Microphone size={36} color={C.mic} weight="fill" />
                    </Animated.View>
                  </TouchableOpacity>
                  <AppText style={{ fontSize: 11, color: C.whiteAlpha, marginTop: 12 }}>
                    {isPt ? 'Toque para confirmar' : 'Tap to confirm'}
                  </AppText>
                </>
              )}

              {phase === 'scoring' && (
                <ActivityIndicator color={C.accentLight} size="large" />
              )}

              {phase === 'feedback' && (
                <>
                  {scoringErr ? (
                    <AppText style={{ fontSize: 14, color: C.wordBad, marginBottom: 16, textAlign: 'center' }}>
                      {isPt ? 'Erro ao avaliar. Tente novamente.' : 'Could not score. Try again.'}
                    </AppText>
                  ) : hasOmission && attempts < 2 ? (
                    <>
                      <AppText style={{ fontSize: 14, color: C.wordOmit, marginBottom: 4, textAlign: 'center', fontWeight: '700' }}>
                        {isPt ? 'Palavra pulada — tente de novo!' : 'Word skipped — try again!'}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: C.whiteAlpha, marginBottom: 20, textAlign: 'center' }}>
                        {isPt ? `Tentativa ${attempts + 1} de 2` : `Attempt ${attempts + 1} of 2`}
                      </AppText>
                      <TouchableOpacity onPress={handleRetry} style={{
                        backgroundColor: C.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32,
                      }}>
                        <AppText style={{ fontSize: 15, fontWeight: '800', color: C.white }}>
                          {isPt ? 'Tentar novamente' : 'Try again'}
                        </AppText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => advanceChunk()} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: C.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32,
                    }}>
                      <AppText style={{ fontSize: 15, fontWeight: '800', color: C.white }}>
                        {chunkIdx < exercise.chunks.length - 1
                          ? (isPt ? 'Próximo trecho' : 'Next chunk')
                          : (isPt ? 'Concluir' : 'Finish')}
                      </AppText>
                      <ArrowRight size={16} color={C.white} weight="bold" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
