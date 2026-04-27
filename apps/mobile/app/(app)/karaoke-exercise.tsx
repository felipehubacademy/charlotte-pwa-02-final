/**
 * karaoke-exercise.tsx — Beta: Read Aloud (Karaoke)
 *
 * One exercise per screen: all chunks visible.
 * Charlotte reads each chunk → mic opens automatically → user repeats → scores appear.
 * Completed chunks show pronunciation colors. Next chunk auto-starts.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, Animated, ActivityIndicator,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Microphone, ArrowLeft, CheckCircle } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/Audio.types';

import { AppText } from '@/components/ui/Text';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useAudioRecorder, PRONUNCIATION_RECORDING_OPTIONS } from '@/hooks/useAudioRecorder';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte.hubacademybr.com';

// ── Types ─────────────────────────────────────────────────────────
interface WordTiming { word: string; start: number; end: number; }

// Per-word state after scoring
type WordScore = 'dim' | 'good' | 'ok' | 'bad' | 'omission';

// Per-chunk lifecycle state
type ChunkPhase = 'upcoming' | 'charlotte' | 'listening' | 'scoring' | 'done';

interface ChunkState {
  phase:      ChunkPhase;
  wordScores: WordScore[];   // populated after scoring
  attempts:   number;
  timings:    WordTiming[];  // Charlotte's word timings for karaoke
  currentTime: number;       // playback time for karaoke highlight
}

interface KaraokeChunk    { text: string; words: string[]; translation?: string; }
interface KaraokeExercise { sentence: string; chunks: KaraokeChunk[]; }
interface KaraokeText     { level: 'Novice' | 'Inter' | 'Advanced'; title: string; exercises: KaraokeExercise[]; }

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
  bg:          '#16153A',
  card:        'rgba(255,255,255,0.06)',
  cardActive:  'rgba(124,58,237,0.15)',
  cardBorder:  'rgba(255,255,255,0.10)',
  cardBorderActive: 'rgba(167,139,250,0.50)',
  wordDim:     'rgba(255,255,255,0.22)',
  wordActive:  '#FCD34D',
  wordSpoken:  '#FFFFFF',
  wordGood:    '#4ADE80',
  wordOk:      '#FCD34D',
  wordBad:     '#F87171',
  wordOmit:    '#DC2626',
  accent:      '#7C3AED',
  accentLight: '#A78BFA',
  white:       '#FFFFFF',
  whiteAlpha:  'rgba(255,255,255,0.45)',
  recDot:      '#F87171',
};

function scoreColor(s: WordScore): string {
  switch (s) {
    case 'good':     return C.wordGood;
    case 'ok':       return C.wordOk;
    case 'bad':      return C.wordBad;
    case 'omission': return C.wordOmit;
    default:         return C.wordDim;
  }
}

// ── Recording timer duration per chunk ───────────────────────────
function listenDuration(words: string[]): number {
  return Math.max(3000, words.length * 900 + 1500); // ms
}

// ── Main screen ───────────────────────────────────────────────────
export default function KaraokeExerciseScreen() {
  const { profile, session } = useAuth();
  const userId    = session?.user?.id ?? '';
  const userLevel = (profile?.charlotte_level ?? 'Inter') as 'Novice' | 'Inter' | 'Advanced';
  const isPt      = userLevel === 'Novice';
  const data      = KARAOKE_DATA.find(d => d.level === userLevel) ?? KARAOKE_DATA[1];

  const [exIdx, setExIdx]   = useState(0);
  const [done,  setDone]    = useState(false);
  const exercise            = data.exercises[exIdx];

  // Per-chunk state array
  const initChunkStates = (ex: KaraokeExercise): ChunkState[] =>
    ex.chunks.map((_, i) => ({
      phase: i === 0 ? 'charlotte' : 'upcoming',
      wordScores: [], attempts: 0, timings: [], currentTime: 0,
    }));

  const [chunks, setChunks] = useState<ChunkState[]>(() => initChunkStates(exercise));
  const activeIdx           = chunks.findIndex(c => c.phase !== 'done' && c.phase !== 'upcoming');

  // Listening timer
  const [listenProgress, setListenProgress] = useState(0); // 0→1
  const listenTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenTotalRef  = useRef(0);
  const listenElapsedRef = useRef(0);

  // Mic pulse animation
  const micPulse     = useRef(new Animated.Value(1)).current;
  const micPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Audio player
  const playerRef   = useRef<AudioPlayer | null>(null);
  const subRef      = useRef<ReturnType<AudioPlayer['addListener']> | null>(null);
  const pendingPlay = useRef(false);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const recorder = useAudioRecorder(PRONUNCIATION_RECORDING_OPTIONS, 12);

  // ── Patch a single chunk's state ────────────────────────────
  const patchChunk = useCallback((idx: number, patch: Partial<ChunkState>) => {
    setChunks(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }, []);

  // ── Audio player setup ───────────────────────────────────────
  useEffect(() => {
    const player = createAudioPlayer(null);
    playerRef.current = player;
    return () => {
      subRef.current?.remove();
      if (pollRef.current) clearInterval(pollRef.current);
      if (listenTimerRef.current) clearInterval(listenTimerRef.current);
      micPulseLoop.current?.stop();
      try { player.pause(); player.remove(); } catch {}
    };
  }, []);

  // ── Poll currentTime for active karaoke chunk ────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (playerRef.current?.playing && activeIdx >= 0) {
        const t = playerRef.current.currentTime ?? 0;
        patchChunk(activeIdx, { currentTime: t });
      }
    }, 50);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeIdx, patchChunk]);

  // ── Fetch helpers ────────────────────────────────────────────
  const fetchTimings = useCallback(async (text: string): Promise<WordTiming[]> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      const key      = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}karaoke_${key}.json`;
      const info     = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return JSON.parse(await FileSystem.readAsStringAsync(localUri));
      const res = await fetch(`${API_BASE_URL}/tts/${key}.json`);
      if (res.ok) {
        const t: WordTiming[] = await res.json();
        await FileSystem.writeAsStringAsync(localUri, JSON.stringify(t));
        return t;
      }
    } catch {}
    return [];
  }, []);

  const fetchAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      const key      = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}karaoke_${key}.mp3`;
      const info     = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return localUri;
      const dl = await FileSystem.downloadAsync(`${API_BASE_URL}/tts/${key}.mp3`, localUri);
      if (dl.status === 200) return localUri;
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...(userId ? { userId } : {}) }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (!d.audio) return null;
      await FileSystem.writeAsStringAsync(localUri, d.audio, { encoding: 'base64' as any });
      return localUri;
    } catch { return null; }
  }, [userId]);

  // ── Play Charlotte's chunk → then open mic ───────────────────
  const playChunk = useCallback(async (idx: number) => {
    const chunk = exercise.chunks[idx];
    if (!chunk || !playerRef.current) return;

    subRef.current?.remove();
    subRef.current = null;
    pendingPlay.current = false;
    patchChunk(idx, { phase: 'charlotte', currentTime: 0, timings: [] });

    const [uri, timings] = await Promise.all([fetchAudio(chunk.text), fetchTimings(chunk.text)]);
    patchChunk(idx, { timings });

    if (!uri || !playerRef.current) { openMic(idx); return; }

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
          openMic(idx);
        }
      });

      setTimeout(() => {
        if (pendingPlay.current) {
          pendingPlay.current = false;
          try { playerRef.current?.play(); } catch {}
        }
      }, 1500);
    } catch { openMic(idx); }
  }, [exercise, fetchAudio, fetchTimings, patchChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open mic automatically ───────────────────────────────────
  const openMic = useCallback(async (idx: number) => {
    patchChunk(idx, { phase: 'listening' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pulse animation
    micPulseLoop.current?.stop();
    micPulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.22, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    micPulseLoop.current.start();

    await recorder.startRecording();

    // Auto-stop timer
    const total = listenDuration(exercise.chunks[idx].words);
    listenTotalRef.current   = total;
    listenElapsedRef.current = 0;
    setListenProgress(0);

    if (listenTimerRef.current) clearInterval(listenTimerRef.current);
    const interval = 80;
    listenTimerRef.current = setInterval(() => {
      listenElapsedRef.current += interval;
      setListenProgress(Math.min(listenElapsedRef.current / total, 1));
      if (listenElapsedRef.current >= total) {
        clearInterval(listenTimerRef.current!);
        listenTimerRef.current = null;
        scoreChunk(idx);
      }
    }, interval);
  }, [exercise, recorder, micPulse, patchChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Score chunk ──────────────────────────────────────────────
  const scoreChunk = useCallback(async (idx: number) => {
    if (listenTimerRef.current) { clearInterval(listenTimerRef.current); listenTimerRef.current = null; }
    micPulseLoop.current?.stop();
    micPulse.setValue(1);
    setListenProgress(0);

    patchChunk(idx, { phase: 'scoring' });
    const result = await recorder.stopRecording();

    const chunk = exercise.chunks[idx];
    if (!result?.uri) {
      patchChunk(idx, { phase: 'done', wordScores: chunk.words.map(() => 'dim') });
      advance(idx);
      return;
    }

    try {
      const lower    = result.uri.toLowerCase();
      const isWav    = lower.endsWith('.wav');
      const formData = new FormData();
      formData.append('audio', { uri: result.uri, name: isWav ? 'r.wav' : 'r.m4a', type: isWav ? 'audio/wav' : 'audio/x-m4a' } as unknown as Blob);
      formData.append('referenceText', chunk.text);

      const res  = await fetch(`${API_BASE_URL}/api/pronunciation`, { method: 'POST', body: formData });
      const d    = await res.json();
      const words: Array<{ word: string; accuracyScore: number; errorType: string }> = d.result?.words ?? [];

      const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
      const scores: WordScore[] = chunk.words.map(ref => {
        const match = words.find(w => norm(w.word) === norm(ref));
        if (!match || match.errorType === 'Omission') return 'omission';
        if (match.accuracyScore >= 80) return 'good';
        if (match.accuracyScore >= 50) return 'ok';
        return 'bad';
      });

      const hasOmission = scores.includes('omission');
      const currentAttempts = chunks[idx]?.attempts ?? 0;

      if (hasOmission && currentAttempts < 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        patchChunk(idx, { phase: 'listening', wordScores: scores, attempts: currentAttempts + 1 });
        // Brief pause then retry
        setTimeout(() => openMic(idx), 800);
      } else {
        Haptics.notificationAsync(
          scores.every(s => s === 'good')
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
        patchChunk(idx, { phase: 'done', wordScores: scores });
        setTimeout(() => advance(idx), 600);
      }
    } catch {
      patchChunk(idx, { phase: 'done', wordScores: chunk.words.map(() => 'dim') });
      advance(idx);
    }
  }, [exercise, recorder, chunks, patchChunk, micPulse]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance to next chunk ────────────────────────────────────
  const advance = useCallback((idx: number) => {
    const next = idx + 1;
    if (next < exercise.chunks.length) {
      patchChunk(next, { phase: 'charlotte' });
      playChunk(next);
    } else {
      // Exercise done
      const nextEx = exIdx + 1;
      if (nextEx < data.exercises.length) {
        setExIdx(nextEx);
      } else {
        setDone(true);
      }
    }
  }, [exercise, exIdx, data.exercises, patchChunk, playChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset when exercise changes ──────────────────────────────
  useEffect(() => {
    setChunks(initChunkStates(data.exercises[exIdx]));
  }, [exIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start first chunk on mount / exercise change ─────────────
  useEffect(() => {
    if (chunks[0]?.phase === 'charlotte') playChunk(0);
  }, [exIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render word row ──────────────────────────────────────────
  const renderChunkWords = (chunk: KaraokeChunk, state: ChunkState, isActive: boolean) => {
    const { phase, timings, currentTime, wordScores } = state;

    if (phase === 'upcoming') {
      return chunk.words.map((w, i) => (
        <AppText key={i} style={{ fontSize: 20, fontWeight: '600', color: C.wordDim, lineHeight: 30 }}>
          {w}{' '}
        </AppText>
      ));
    }

    if (phase === 'charlotte') {
      if (!timings.length) {
        return chunk.words.map((w, i) => (
          <AppText key={i} style={{ fontSize: 20, fontWeight: '600', color: C.wordDim, lineHeight: 30 }}>
            {w}{' '}
          </AppText>
        ));
      }
      return timings.map((w, i) => {
        const isAct  = w.start <= currentTime && currentTime < w.end;
        const isSpk  = w.end <= currentTime;
        const color  = isAct ? C.wordActive : isSpk ? C.wordSpoken : C.wordDim;
        return (
          <AppText key={i} style={{ fontSize: 20, fontWeight: '600', color, lineHeight: 30 }}>
            {w.word}{' '}
          </AppText>
        );
      });
    }

    // listening / scoring / done — show scores if available
    const scores = wordScores.length ? wordScores : chunk.words.map(() => 'dim' as WordScore);
    return chunk.words.map((w, i) => (
      <AppText key={i} style={{ fontSize: 20, fontWeight: '600', color: scoreColor(scores[i] ?? 'dim'), lineHeight: 30 }}>
        {w}{' '}
      </AppText>
    ));
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
        <AppText style={{ fontSize: 15, color: C.whiteAlpha, marginTop: 8, textAlign: 'center' }}>
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

  const activeChunk       = activeIdx >= 0 ? exercise.chunks[activeIdx] : null;
  const activeState       = activeIdx >= 0 ? chunks[activeIdx] : null;
  const isListening       = activeState?.phase === 'listening';
  const isScoring         = activeState?.phase === 'scoring';
  const totalDone         = chunks.filter(c => c.phase === 'done').length;
  const progressPct       = totalDone / exercise.chunks.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={C.whiteAlpha} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={{ color: C.whiteAlpha, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6 }}>
            {data.title}
          </AppText>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 2, marginBottom: 16 }}>
        <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: C.accentLight, width: `${progressPct * 100}%` }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Charlotte avatar — shown while her turn */}
        {activeState?.phase === 'charlotte' && (
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <CharlotteAvatar size="lg" />
          </View>
        )}

        {/* All chunks */}
        {exercise.chunks.map((chunk, idx) => {
          const state    = chunks[idx];
          const isActive = idx === activeIdx;
          const isDone   = state?.phase === 'done';
          const isListen = state?.phase === 'listening' || state?.phase === 'scoring';

          return (
            <View
              key={idx}
              style={{
                backgroundColor: isActive ? C.cardActive : C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isActive ? C.cardBorderActive : C.cardBorder,
                paddingHorizontal: 20,
                paddingVertical: 16,
                marginBottom: 10,
              }}
            >
              {/* Words row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {renderChunkWords(chunk, state, isActive)}
              </View>

              {/* Translation for Novice */}
              {isPt && chunk.translation && (isDone || isListen) && (
                <AppText style={{ fontSize: 12, color: C.whiteAlpha, marginTop: 6 }}>
                  {chunk.translation}
                </AppText>
              )}

              {/* Scoring indicator */}
              {state?.phase === 'scoring' && (
                <ActivityIndicator size="small" color={C.accentLight} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
              )}
            </View>
          );
        })}

        {/* Mic area — shown when listening */}
        {(isListening || isScoring) && (
          <View style={{ alignItems: 'center', marginTop: 24 }}>

            {/* Recording label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Animated.View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: C.recDot,
                opacity: micPulse.interpolate({ inputRange: [1, 1.22], outputRange: [0.5, 1] }),
              }} />
              <AppText style={{ fontSize: 13, fontWeight: '700', color: C.white, letterSpacing: 0.5 }}>
                {isScoring
                  ? (isPt ? 'Avaliando...' : 'Scoring...')
                  : (isPt ? 'Ouvindo você' : 'Listening...')}
              </AppText>
            </View>

            {/* Mic button — pulsing */}
            <Animated.View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: 'rgba(124,58,237,0.20)',
              alignItems: 'center', justifyContent: 'center',
              transform: [{ scale: micPulse }],
              borderWidth: 2,
              borderColor: isListening ? C.accentLight : 'transparent',
            }}>
              <Microphone size={38} color={isListening ? C.accentLight : C.whiteAlpha} weight="fill" />
            </Animated.View>

            {/* Timer bar */}
            {isListening && (
              <View style={{ width: 160, height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, marginTop: 20 }}>
                <View style={{
                  height: 3, borderRadius: 2, backgroundColor: C.accentLight,
                  width: `${(1 - listenProgress) * 100}%`,
                }} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
