/**
 * karaoke-exercise.tsx — Beta: Read Aloud (Karaoke)
 *
 * Charlotte reads each chunk with karaoke word highlight → mic opens automatically →
 * silence detection stops recording → Azure scores each word → colors appear inline.
 * One continuous text block. Mic always visible at bottom.
 */

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View, TouchableOpacity, Animated, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Microphone, MicrophoneSlash, ArrowLeft, CheckCircle } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/Audio.types';

import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { useAudioRecorder, PRONUNCIATION_RECORDING_OPTIONS } from '@/hooks/useAudioRecorder';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte.hubacademybr.com';

// ── Types ─────────────────────────────────────────────────────────
interface WordTiming { word: string; start: number; end: number; }
type WordScore  = 'dim' | 'good' | 'ok' | 'bad' | 'omission';
type ChunkPhase = 'upcoming' | 'charlotte' | 'listening' | 'scoring' | 'done';

interface ChunkState {
  phase:       ChunkPhase;
  wordScores:  WordScore[];
  attempts:    number;
  timings:     WordTiming[];
  currentTime: number;
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
        { text: 'Every morning',  words: ['Every', 'morning'],        translation: 'Todo dia de manhã' },
        { text: 'I wake up',      words: ['I', 'wake', 'up'],         translation: 'Eu acordo' },
        { text: 'at seven',       words: ['at', 'seven'],             translation: 'às sete' },
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
    level: 'Advanced', title: 'Nobody Warned Daniel',
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
  micMuted:    'rgba(255,255,255,0.18)',
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

// ── Main screen ───────────────────────────────────────────────────
export default function KaraokeExerciseScreen() {
  const { profile, session } = useAuth();
  const userId       = session?.user?.id ?? '';
  const defaultLevel = (profile?.charlotte_level ?? 'Inter') as 'Novice' | 'Inter' | 'Advanced';
  const [selectedLevel, setSelectedLevel] = useState<'Novice' | 'Inter' | 'Advanced'>(defaultLevel);
  const userLevel = selectedLevel;
  const isPt      = userLevel === 'Novice';
  const data      = KARAOKE_DATA.find(d => d.level === userLevel) ?? KARAOKE_DATA[1];

  const [exIdx, setExIdx] = useState(0);
  const [done,  setDone]  = useState(false);
  const exercise          = data.exercises[exIdx];

  const initChunkStates = (ex: KaraokeExercise): ChunkState[] =>
    ex.chunks.map((_, i) => ({
      phase: i === 0 ? 'charlotte' : 'upcoming',
      wordScores: [], attempts: 0, timings: [], currentTime: 0,
    }));

  const [chunks, setChunks] = useState<ChunkState[]>(() => initChunkStates(exercise));
  const activeIdx = chunks.findIndex(c => c.phase !== 'done' && c.phase !== 'upcoming');

  // Mic pulse animation
  const micPulse     = useRef(new Animated.Value(1)).current;
  const micPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Audio player
  const playerRef   = useRef<AudioPlayer | null>(null);
  const subRef      = useRef<ReturnType<AudioPlayer['addListener']> | null>(null);
  const pendingPlay = useRef(false);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Silence detection
  const silencePollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpeechRef    = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const recordStartRef  = useRef(0);

  const recorder = useAudioRecorder(PRONUNCIATION_RECORDING_OPTIONS, 12);

  const patchChunk = useCallback((idx: number, patch: Partial<ChunkState>) => {
    setChunks(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }, []);

  // ── Ref so silence detection can call scoreChunk without circular dep
  const scoreChunkRef = useRef<(idx: number) => void>(() => {});

  // ── Audio player setup ───────────────────────────────────────
  useEffect(() => {
    const player = createAudioPlayer(null);
    playerRef.current = player;
    return () => {
      subRef.current?.remove();
      if (pollRef.current)        clearInterval(pollRef.current);
      if (silencePollRef.current) clearInterval(silencePollRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      micPulseLoop.current?.stop();
      try { player.pause(); player.remove(); } catch {}
    };
  }, []);

  // ── Poll currentTime for karaoke ─────────────────────────────
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

    micPulseLoop.current?.stop();
    micPulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    micPulseLoop.current.start();

    await recorder.startRecording();

    // Silence detection
    hasSpeechRef.current    = false;
    silenceStartRef.current = null;
    recordStartRef.current  = Date.now();

    if (silencePollRef.current) clearInterval(silencePollRef.current);
    silencePollRef.current = setInterval(() => {
      const elapsed  = Date.now() - recordStartRef.current;
      const metering = recorder.getMeteringLevel();

      if (metering !== undefined && metering !== null) {
        if (!hasSpeechRef.current && metering > -28) {
          hasSpeechRef.current    = true;
          silenceStartRef.current = null;
        }
        if (hasSpeechRef.current) {
          if (metering < -38) {
            if (!silenceStartRef.current) silenceStartRef.current = Date.now();
            if (Date.now() - silenceStartRef.current >= 900 && elapsed >= 1200) {
              clearInterval(silencePollRef.current!);
              silencePollRef.current = null;
              if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
              scoreChunkRef.current(idx);
              return;
            }
          } else {
            silenceStartRef.current = null;
          }
        }
      }
    }, 150);

    // Safety cap — stops even without silence detection (no metering or very long speech)
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      safetyTimerRef.current = null;
      if (silencePollRef.current) { clearInterval(silencePollRef.current); silencePollRef.current = null; }
      scoreChunkRef.current(idx);
    }, 9000);
  }, [recorder, micPulse, patchChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Score chunk ──────────────────────────────────────────────
  const scoreChunk = useCallback(async (idx: number) => {
    if (silencePollRef.current) { clearInterval(silencePollRef.current); silencePollRef.current = null; }
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
    micPulseLoop.current?.stop();
    micPulse.setValue(1);

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

      const hasOmission     = scores.includes('omission');
      const currentAttempts = chunks[idx]?.attempts ?? 0;

      if (hasOmission && currentAttempts < 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        patchChunk(idx, { phase: 'listening', wordScores: scores, attempts: currentAttempts + 1 });
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

  // Keep ref in sync so silence detection can call scoreChunk without circular dep
  useLayoutEffect(() => { scoreChunkRef.current = scoreChunk; }, [scoreChunk]);

  // ── Advance to next chunk ────────────────────────────────────
  const advance = useCallback((idx: number) => {
    const next = idx + 1;
    if (next < exercise.chunks.length) {
      patchChunk(next, { phase: 'charlotte' });
      playChunk(next);
    } else {
      const nextEx = exIdx + 1;
      if (nextEx < data.exercises.length) {
        setExIdx(nextEx);
      } else {
        setDone(true);
      }
    }
  }, [exercise, exIdx, data.exercises, patchChunk, playChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset when level changes ─────────────────────────────────
  useEffect(() => {
    subRef.current?.remove();
    if (silencePollRef.current) clearInterval(silencePollRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    micPulseLoop.current?.stop();
    micPulse.setValue(1);
    try { playerRef.current?.pause(); } catch {}
    setExIdx(0);
    setDone(false);
    setChunks(initChunkStates(data.exercises[0]));
  }, [selectedLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setChunks(initChunkStates(data.exercises[exIdx]));
  }, [exIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start first chunk on mount / exercise change ─────────────
  useEffect(() => {
    if (chunks[0]?.phase === 'charlotte') playChunk(0);
  }, [exIdx, selectedLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Word color ───────────────────────────────────────────────
  function wordColor(chunkIdx: number, wordIdx: number): string {
    const state = chunks[chunkIdx];
    if (!state) return C.wordDim;
    switch (state.phase) {
      case 'upcoming': return C.wordDim;
      case 'charlotte': {
        if (!state.timings.length) return C.wordDim;
        const t = state.timings[wordIdx];
        if (!t) return C.wordDim;
        if (t.start <= state.currentTime && state.currentTime < t.end) return C.wordActive;
        if (t.end <= state.currentTime) return C.wordSpoken;
        return C.wordDim;
      }
      case 'listening':
      case 'scoring':
        if (state.wordScores.length) return scoreColor(state.wordScores[wordIdx] ?? 'dim');
        return C.wordSpoken;
      case 'done':
        return scoreColor(state.wordScores[wordIdx] ?? 'dim');
      default: return C.wordDim;
    }
  }

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

  const activeState = activeIdx >= 0 ? chunks[activeIdx] : null;
  const isListening = activeState?.phase === 'listening';
  const isCharlotte = activeState?.phase === 'charlotte';
  const totalDone   = chunks.filter(c => c.phase === 'done').length;
  const progressPct = totalDone / exercise.chunks.length;

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
      <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 1, marginBottom: 32 }}>
        <View style={{ height: 2, borderRadius: 1, backgroundColor: C.accentLight, width: `${progressPct * 100}%` }} />
      </View>

      {/* Sentence — one continuous text block */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {exercise.chunks.map((chunk, chunkIdx) =>
            chunk.words.map((word, wordIdx) => (
              <AppText
                key={`${chunkIdx}-${wordIdx}`}
                style={{
                  fontSize: 30,
                  fontWeight: '700',
                  lineHeight: 46,
                  color: wordColor(chunkIdx, wordIdx),
                }}
              >
                {word}{' '}
              </AppText>
            ))
          )}
        </View>
      </ScrollView>

      {/* Mic — always visible at bottom */}
      <View style={{ alignItems: 'center', paddingBottom: 44, paddingTop: 20 }}>
        <TouchableOpacity
          activeOpacity={isListening ? 0.7 : 1}
          onPress={() => {
            if (isListening && activeIdx >= 0) scoreChunkRef.current(activeIdx);
          }}
        >
          <Animated.View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: isListening
              ? 'rgba(124,58,237,0.25)'
              : 'rgba(255,255,255,0.05)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: isListening ? C.accentLight : 'rgba(255,255,255,0.10)',
            transform: [{ scale: isListening ? micPulse : 1 }],
          }}>
            {isCharlotte
              ? <MicrophoneSlash size={34} color={C.micMuted} weight="fill" />
              : <Microphone      size={34} color={isListening ? C.accentLight : C.whiteAlpha} weight="fill" />
            }
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
