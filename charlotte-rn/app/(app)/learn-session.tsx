import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle,
  LightbulbFilament, Lightning, BookOpen, Microphone,
  SpeakerHigh, Play, Pause,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { AppText } from '@/components/ui/Text';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { useMessageAudioPlayer } from '@/hooks/useMessageAudioPlayer';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import {
  CURRICULUM, TrailLevel, GrammarEx, PronStep,
  getTopic,
} from '@/data/curriculum';

// ── Palette ────────────────────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  ghost:     'rgba(22,21,58,0.06)',
  border:    'rgba(22,21,58,0.10)',
  gold:      '#D97706',
  goldBg:    '#FFFBEB',
  green:     '#3D8800',
  greenBg:   '#F0FFD9',
  red:       '#DC2626',
  redBg:     'rgba(220,38,38,0.07)',
  violet:    '#7C3AED',
  violetBg:  '#F5F3FF',
};

const shadow = Platform.select({
  ios:     { shadowColor: 'rgba(22,21,58,0.10)', shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
});

const API_BASE_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

// ── Step types ─────────────────────────────────────────────────
type StepKind = 'grammar' | 'pronunciation';
interface GrammarStep  { kind: 'grammar';       exercise: GrammarEx }
interface PronStepWrap { kind: 'pronunciation'; phrase: PronStep }
type SessionStep = GrammarStep | PronStepWrap;

// ── Grammar helpers ────────────────────────────────────────────
function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[''']/g, "'").replace(/\s+/g, ' ');
}

function checkGrammar(ex: GrammarEx, answer: string): boolean {
  const u = normalise(answer);
  const c = normalise(ex.answer);
  if (u === c) return true;
  if (ex.type === 'multiple_choice' || ex.type === 'word_bank') return u === c;
  if (ex.type === 'read_answer') {
    const words = c.split(' ').filter(w => w.length > 2);
    return words.length > 0 && words.filter(w => u.includes(w)).length >= Math.ceil(words.length * 0.7);
  }
  if (ex.type === 'fix_error' && c.length > 10) {
    return u === c || u.includes(c) || c.includes(u);
  }
  return false;
}

// ── Score helpers ──────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 85) return '#22C55E';
  if (s >= 70) return C.gold;
  if (s >= 55) return '#FB923C';
  return C.red;
}
function scoreLabel(s: number) {
  if (s >= 90) return 'Excellent!';
  if (s >= 80) return 'Very good!';
  if (s >= 70) return 'Good job!';
  if (s >= 55) return 'Keep going!';
  return 'Keep practising';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <AppText style={{ fontSize: 11, color: C.navyLight, fontWeight: '600' }}>{label}</AppText>
        <AppText style={{ fontSize: 11, color, fontWeight: '800' }}>{Math.round(score)}</AppText>
      </View>
      <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(score, 100)}%` as any, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function LearnSessionScreen() {
  const params      = useLocalSearchParams<{ level: string; moduleIndex: string; topicIndex: string }>();
  const level       = (params.level ?? 'Inter') as TrailLevel;
  const moduleIndex = parseInt(params.moduleIndex ?? '0', 10);
  const topicIndex  = parseInt(params.topicIndex  ?? '0', 10);

  const { profile } = useAuth();
  const { saveTopicComplete, saveExercise } = useLearnProgress(profile?.id, level);

  const topic = getTopic(level, moduleIndex, topicIndex);

  // ── Build flat steps array ─────────────────────────────────
  const steps: SessionStep[] = [
    ...(topic?.grammar.map(ex => ({ kind: 'grammar' as const, exercise: ex })) ?? []),
    ...(topic?.pronunciation.map(ph => ({ kind: 'pronunciation' as const, phrase: ph })) ?? []),
  ];
  const totalSteps = steps.length;

  // ── Session XP accumulator ─────────────────────────────────
  const [sessionXP, setSessionXP] = useState(0);

  // ── Step index ─────────────────────────────────────────────
  const [stepIdx, setStepIdx]         = useState(0);
  const [isComplete, setIsComplete]   = useState(false);

  // ── Grammar state ──────────────────────────────────────────
  const [gStatus, setGStatus]           = useState<'answering' | 'submitted'>('answering');
  const [userAnswer, setUserAnswer]     = useState('');
  const [isCorrect, setIsCorrect]       = useState<boolean | null>(null);
  const [showHint, setShowHint]         = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // ── Pronunciation state ────────────────────────────────────
  type PronStatus = 'loading_audio' | 'listening' | 'recording' | 'assessing' | 'result' | 'error';
  const [pronStatus, setPronStatus]           = useState<PronStatus>('loading_audio');
  const [charlotteAudioUri, setCharlotteAudioUri] = useState<string | null>(null);
  const [listenWriteAnswer, setListenWriteAnswer] = useState('');
  const [listenWriteCorrect, setListenWriteCorrect] = useState<boolean | null>(null);
  const [assessmentResult, setAssessmentResult]   = useState<any>(null);
  const [sessionScores, setSessionScores]         = useState<number[]>([]);
  const resultAnim   = useRef(new Animated.Value(0)).current;

  const { playingMessageId, toggle: toggleAudio, stop: stopAudio } = useMessageAudioPlayer();
  const charlottePlayId = 'learn-session-phrase';
  const isPlaying = playingMessageId === charlottePlayId;

  const recorder          = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingRef      = useRef(false);
  const recordingStartRef = useRef(0);

  // ── Colour by step kind ────────────────────────────────────
  const currentStep  = steps[stepIdx];
  const accent       = !currentStep ? C.gold
    : currentStep.kind === 'grammar' ? C.gold : C.violet;
  const accentBg     = !currentStep ? C.goldBg
    : currentStep.kind === 'grammar' ? C.goldBg : C.violetBg;

  // ── TTS — CDN first, fallback POST, local cache ────────────
  const fetchTTS = useCallback(async (text: string): Promise<string | null> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      // cdnKey matches filenames in public/tts/ (no prefix)
      // localKey has v2_ prefix to bust any old OpenAI-cached files on device
      const cdnKey   = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localKey = 'v2_' + text.slice(0, 76).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}${localKey}.mp3`;

      // 1. Local cache hit
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return localUri;

      // 2. Download pre-generated file from CDN (public/tts/)
      const cdnUrl = `${API_BASE_URL}/tts/${cdnKey}.mp3`;
      const dl = await FileSystem.downloadAsync(cdnUrl, localUri);
      if (dl.status === 200) return localUri;
      // Non-200 = CDN 404 — delete the bad file so it's not cached
      await FileSystem.deleteAsync(localUri, { idempotent: true });

      // 3. Fallback: generate on-demand via API
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.audio) return null;
      await FileSystem.writeAsStringAsync(localUri, data.audio, { encoding: 'base64' as any });
      return localUri;
    } catch { return null; }
  }, []);

  // ── Load grammar step ──────────────────────────────────────
  const loadGrammarStep = useCallback((ex: GrammarEx) => {
    setGStatus('answering');
    setUserAnswer('');
    setIsCorrect(null);
    setShowHint(false);
    feedbackAnim.setValue(0);
    if (ex.options) setShuffledOptions([...ex.options].sort(() => Math.random() - 0.5));
    if (ex.choices) setShuffledChoices([...ex.choices].sort(() => Math.random() - 0.5));
  }, [feedbackAnim]);

  // ── Load pronunciation step ────────────────────────────────
  const lastPhraseText = useRef<string | null>(null);

  const loadPronStep = useCallback(async (ph: PronStep) => {
    setPronStatus('loading_audio');
    setAssessmentResult(null);
    setListenWriteAnswer('');
    setListenWriteCorrect(null);
    resultAnim.setValue(0);
    stopAudio();

    // Reuse audio if same phrase text (e.g. repeat then listen_write)
    if (ph.text !== lastPhraseText.current) {
      const uri = await fetchTTS(ph.text);
      // If TTS fails, still proceed — record button must always appear
      if (uri) {
        setCharlotteAudioUri(uri);
        lastPhraseText.current = ph.text;
      } else {
        setCharlotteAudioUri(null);
        lastPhraseText.current = null;
      }
    }
    // Force speaker (iOS: .playback category routes to speaker, not earpiece)
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setPronStatus('listening');
  }, [fetchTTS, stopAudio, resultAnim]);

  // ── Initialise & step transitions ──────────────────────────
  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.kind === 'grammar') {
      loadGrammarStep(currentStep.exercise);
    } else {
      loadPronStep(currentStep.phrase);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // ── Grammar: check answer ──────────────────────────────────
  const handleGrammarSubmit = () => {
    if (!currentStep || currentStep.kind !== 'grammar') return;
    if (!userAnswer.trim()) return;

    const correct = checkGrammar(currentStep.exercise, userAnswer);
    const xp = correct ? 10 : 2;
    setIsCorrect(correct);
    setGStatus('submitted');
    setSessionXP(xp => xp + xp);

    saveExercise({
      level, moduleIndex, topicIndex,
      exerciseType: currentStep.exercise.type,
      isCorrect: correct, xpEarned: xp,
    });

    if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  // ── Pronunciation: play ────────────────────────────────────
  const handlePlayCharlotte = () => {
    if (charlotteAudioUri) toggleAudio(charlottePlayId, charlotteAudioUri);
  };

  // ── Pronunciation: record ──────────────────────────────────
  const startRecording = async () => {
    if (recordingRef.current) return;
    recordingRef.current = true;
    recordingStartRef.current = Date.now();
    setPronStatus('recording');
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      recordingRef.current = false;
      setPronStatus('listening');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !currentStep || currentStep.kind !== 'pronunciation') return;

    // Ignore accidental taps shorter than 800ms
    const elapsed = Date.now() - recordingStartRef.current;
    if (elapsed < 800) {
      recordingRef.current = false;
      try { await recorder.stop(); } catch {}
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setPronStatus('listening');
      return;
    }

    recordingRef.current = false;
    setPronStatus('assessing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const audioUri = recorder.uri;
      if (!audioUri) { setPronStatus('error'); return; }

      const isWav = audioUri.toLowerCase().endsWith('.wav');
      const formData = new FormData();
      formData.append('audio', { uri: audioUri, name: isWav ? 'recording.wav' : 'recording.m4a', type: isWav ? 'audio/wav' : 'audio/x-m4a' } as unknown as Blob);
      formData.append('referenceText', currentStep.phrase.text);

      const res = await fetch(`${API_BASE_URL}/api/pronunciation`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Assessment failed');
      const data = await res.json();

      if (data.result) {
        setAssessmentResult(data.result);
        const score = data.result.pronunciationScore ?? 0;
        setSessionScores(prev => [...prev, score]);
        const xp = score >= 85 ? 15 : score >= 70 ? 10 : 5;
        setSessionXP(prev => prev + xp);
        saveExercise({ level, moduleIndex, topicIndex, exerciseType: 'repeat', isCorrect: score >= 70, xpEarned: xp });
        if (score >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
      }
      setPronStatus('result');
    } catch { setPronStatus('error'); }
  };

  // ── Pronunciation: listen_write check ─────────────────────
  const checkListenWrite = () => {
    if (!currentStep || currentStep.kind !== 'pronunciation') return;
    if (!listenWriteAnswer.trim()) return;
    const u = listenWriteAnswer.trim().toLowerCase().replace(/[.,!?]/g, '');
    const c = currentStep.phrase.text.toLowerCase().replace(/[.,!?]/g, '');
    const words   = c.split(' ').filter(w => w.length > 2);
    const matched = words.filter(w => u.includes(w)).length;
    const correct = matched >= Math.ceil(words.length * 0.7);
    setListenWriteCorrect(correct);
    const xp = correct ? 8 : 2;
    setSessionXP(prev => prev + xp);
    saveExercise({ level, moduleIndex, topicIndex, exerciseType: 'listen_write', isCorrect: correct, xpEarned: xp });
    if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    setPronStatus('result');
  };

  // ── Advance step ───────────────────────────────────────────
  const handleNext = async () => {
    const next = stepIdx + 1;
    if (next >= totalSteps) {
      await saveTopicComplete(level, moduleIndex, topicIndex);
      setIsComplete(true);
    } else {
      setStepIdx(next);
    }
  };

  const progress = totalSteps > 0 ? (stepIdx + 1) / totalSteps : 0;
  const avgScore = sessionScores.length > 0
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : null;

  const modTitle   = CURRICULUM[level]?.[moduleIndex]?.title ?? '';
  const topicTitle = topic?.title ?? '';

  // ── Completion screen ──────────────────────────────────────
  if (isComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: accentBg, borderWidth: 2, borderColor: accent,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <CheckCircle size={40} color={accent} weight="fill" />
          </View>
          <AppText style={{ fontSize: 24, fontWeight: '900', color: C.navy, marginBottom: 8, letterSpacing: -0.5 }}>
            Topic complete!
          </AppText>
          <AppText style={{ fontSize: 15, color: C.navyMid, textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
            {topicTitle}
          </AppText>
          <AppText style={{ fontSize: 13, color: C.navyLight, textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
            {sessionXP} XP earned
            {avgScore !== null ? ` · Avg pronunciation ${avgScore}` : ''}
          </AppText>
          <TouchableOpacity
            onPress={() => router.replace('/(app)/learn-trail')}
            style={{ backgroundColor: C.navy, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 16 }}
          >
            <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>Continue trail</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <AppText style={{ fontSize: 14, color: C.navyLight, fontWeight: '600' }}>Back</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentStep) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, height: 52,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={C.navy} weight="bold" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1 }}>
            {modTitle}
          </AppText>
          <AppText style={{ fontSize: 14, fontWeight: '800', color: C.navy, letterSpacing: -0.3 }} numberOfLines={1}>
            {topicTitle}
          </AppText>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: sessionXP > 0 ? 'rgba(61,136,0,0.10)' : C.ghost,
          borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Lightning size={13} color={sessionXP > 0 ? C.green : C.navyLight} weight="fill" />
          <AppText style={{ fontSize: 13, fontWeight: '800', color: sessionXP > 0 ? C.green : C.navyLight }}>
            {sessionXP}
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={{ padding: 20, paddingBottom: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Progress ── */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                backgroundColor: accentBg, borderWidth: 1,
                borderColor: accent + '33',
              }}>
                {currentStep.kind === 'grammar'
                  ? <BookOpen  size={12} color={accent} weight="fill" />
                  : <Microphone size={12} color={accent} weight="fill" />
                }
                <AppText style={{ fontSize: 11, fontWeight: '700', color: accent }}>
                  {currentStep.kind === 'grammar'
                    ? (currentStep.exercise.type === 'multiple_choice' ? 'Choose the Answer'
                      : currentStep.exercise.type === 'word_bank' ? 'Word Bank'
                      : currentStep.exercise.type === 'fill_gap'   ? 'Fill the Gap'
                      : currentStep.exercise.type === 'fix_error'  ? 'Fix the Error'
                      : 'Read & Answer')
                    : (currentStep.phrase.type === 'repeat' ? 'Repeat After Me' : 'Listen & Write')
                  }
                </AppText>
              </View>
              <AppText style={{ fontSize: 12, color: C.navyLight, fontWeight: '600' }}>
                {stepIdx + 1} / {totalSteps}
              </AppText>
            </View>
            <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 5, width: `${progress * 100}%` as any, backgroundColor: accent, borderRadius: 3 }} />
            </View>
          </View>

          {/* ── GRAMMAR CARD ── */}
          {currentStep.kind === 'grammar' && (
            <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, ...shadow }}>
              {/* Charlotte instruction */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
                <CharlotteAvatar size="xs" />
                <View style={{ flex: 1, backgroundColor: accentBg, borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 14 }}>
                  <AppText style={{ fontSize: 14, color: accent, fontWeight: '700' }}>
                    {currentStep.exercise.type === 'multiple_choice' ? 'Choose the correct option to complete the sentence.'
                      : currentStep.exercise.type === 'word_bank'      ? 'Tap the correct word to fill the blank.'
                      : currentStep.exercise.type === 'fill_gap'       ? 'Fill in the blank with the correct word or phrase.'
                      : currentStep.exercise.type === 'fix_error'      ? 'Find the mistake and rewrite the sentence correctly.'
                      : 'Read the passage and answer the question.'}
                  </AppText>
                </View>
              </View>

              {/* Passage */}
              {currentStep.exercise.type === 'read_answer' && currentStep.exercise.passage && (
                <View style={{ backgroundColor: C.ghost, borderRadius: 14, padding: 18, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: accent }}>
                  <AppText style={{ fontSize: 15, color: C.navy, lineHeight: 24 }}>{currentStep.exercise.passage}</AppText>
                </View>
              )}

              {/* Sentence / Question */}
              <AppText style={{
                fontSize: currentStep.exercise.type === 'read_answer' ? 16 : 22,
                fontWeight: currentStep.exercise.type === 'read_answer' ? '700' : '500',
                color: C.navy,
                lineHeight: currentStep.exercise.type === 'read_answer' ? 26 : 34,
                marginBottom: (currentStep.exercise.type === 'multiple_choice' || currentStep.exercise.type === 'word_bank') ? 28 : (gStatus === 'answering' ? 0 : 20),
              }}>
                {currentStep.exercise.type === 'read_answer' ? currentStep.exercise.question : currentStep.exercise.sentence}
              </AppText>

              {/* Multiple choice */}
              {currentStep.exercise.type === 'multiple_choice' && gStatus === 'answering' && (
                <View style={{ gap: 10 }}>
                  {shuffledOptions.map((opt, i) => {
                    const selected = userAnswer === opt;
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setUserAnswer(selected ? '' : opt)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 14,
                          borderRadius: 14, borderWidth: 2,
                          borderColor: selected ? accent : C.border,
                          backgroundColor: selected ? accentBg : C.card,
                          paddingHorizontal: 16, paddingVertical: 16,
                        }}
                      >
                        <View style={{
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: selected ? accent : C.ghost,
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <AppText style={{ fontSize: 13, fontWeight: '800', color: selected ? '#FFF' : C.navyMid }}>
                            {['A', 'B', 'C'][i]}
                          </AppText>
                        </View>
                        <AppText style={{ fontSize: 15, fontWeight: '600', color: C.navy, flex: 1 }}>{opt}</AppText>
                        {selected && <CheckCircle size={18} color={accent} weight="fill" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Word bank */}
              {currentStep.exercise.type === 'word_bank' && gStatus === 'answering' && (
                <View>
                  <TouchableOpacity
                    onPress={() => userAnswer && setUserAnswer('')}
                    activeOpacity={userAnswer ? 0.7 : 1}
                    style={{
                      borderRadius: 12, borderWidth: 2,
                      borderColor: userAnswer ? accent : C.border,
                      backgroundColor: userAnswer ? accentBg : 'transparent',
                      paddingVertical: 14, paddingHorizontal: 18,
                      minHeight: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                    }}
                  >
                    {userAnswer
                      ? <AppText style={{ fontSize: 17, fontWeight: '700', color: accent }}>{userAnswer}</AppText>
                      : <AppText style={{ fontSize: 14, color: C.navyLight }}>tap a word below</AppText>
                    }
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {shuffledChoices.map((chip, i) => {
                      const used = chip === userAnswer;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setUserAnswer(used ? '' : chip)}
                          style={{
                            paddingHorizontal: 20, paddingVertical: 13,
                            borderRadius: 12, borderWidth: 1.5,
                            borderColor: used ? C.border : C.navy,
                            backgroundColor: used ? C.ghost : C.card,
                            opacity: used ? 0.45 : 1,
                          }}
                        >
                          <AppText style={{ fontSize: 16, fontWeight: '700', color: used ? C.navyLight : C.navy }}>{chip}</AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Text input (fill_gap / fix_error / read_answer) */}
              {(currentStep.exercise.type === 'fill_gap' || currentStep.exercise.type === 'fix_error' || currentStep.exercise.type === 'read_answer') && gStatus === 'answering' && (
                <>
                  <View style={{ flex: 1 }} />
                  <TextInput
                    value={userAnswer}
                    onChangeText={setUserAnswer}
                    placeholder={
                      currentStep.exercise.type === 'fill_gap'  ? 'Type the missing word…'
                      : currentStep.exercise.type === 'fix_error' ? 'Rewrite the full sentence…'
                      : 'Your answer…'
                    }
                    placeholderTextColor={C.navyLight}
                    style={{
                      borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
                      paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 16, color: C.navy, backgroundColor: '#FAFAF9',
                      minHeight: currentStep.exercise.type === 'fill_gap' ? 56 : 110,
                      textAlignVertical: 'top',
                    }}
                    multiline={currentStep.exercise.type !== 'fill_gap'}
                    returnKeyType={currentStep.exercise.type === 'fill_gap' ? 'done' : 'default'}
                    onSubmitEditing={currentStep.exercise.type === 'fill_gap' ? handleGrammarSubmit : undefined}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {currentStep.exercise.hint && (
                    <>
                      <TouchableOpacity
                        onPress={() => setShowHint(v => !v)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start' }}
                      >
                        <LightbulbFilament size={14} color={accent} weight="fill" />
                        <AppText style={{ fontSize: 13, color: accent, fontWeight: '600' }}>
                          {showHint ? 'Hide hint' : 'Show hint'}
                        </AppText>
                      </TouchableOpacity>
                      {showHint && (
                        <View style={{ marginTop: 10, padding: 14, backgroundColor: accentBg, borderRadius: 12 }}>
                          <AppText style={{ fontSize: 14, color: accent }}>{currentStep.exercise.hint}</AppText>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Grammar feedback */}
              {gStatus === 'submitted' && isCorrect !== null && (
                <Animated.View style={{
                  opacity: feedbackAnim,
                  transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                  marginTop: 8,
                }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    padding: 14, borderRadius: 14, marginBottom: 12,
                    backgroundColor: isCorrect ? C.greenBg : C.redBg,
                    borderWidth: 1,
                    borderColor: isCorrect ? 'rgba(61,136,0,0.2)' : 'rgba(220,38,38,0.18)',
                  }}>
                    {isCorrect ? <CheckCircle size={20} color={C.green} weight="fill" /> : <XCircle size={20} color={C.red} weight="fill" />}
                    <AppText style={{ fontSize: 15, fontWeight: '700', color: isCorrect ? C.green : C.red, flex: 1 }}>
                      {isCorrect ? 'Correct!' : 'Not quite…'}
                    </AppText>
                    <View style={{ backgroundColor: isCorrect ? 'rgba(61,136,0,0.12)' : 'rgba(220,38,38,0.10)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <AppText style={{ fontSize: 11, fontWeight: '800', color: isCorrect ? C.green : C.red }}>
                        +{isCorrect ? 10 : 2} XP
                      </AppText>
                    </View>
                  </View>
                  {!isCorrect && (
                    <View style={{ padding: 14, backgroundColor: C.ghost, borderRadius: 12, marginBottom: 10 }}>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Correct answer</AppText>
                      <AppText style={{ fontSize: 15, color: C.navy, fontWeight: '600' }}>{currentStep.exercise.answer}</AppText>
                    </View>
                  )}
                  <View style={{ padding: 14, backgroundColor: C.ghost, borderRadius: 12 }}>
                    <AppText style={{ fontSize: 11, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Why</AppText>
                    <AppText style={{ fontSize: 14, color: C.navyMid, lineHeight: 21 }}>{currentStep.exercise.explanation}</AppText>
                  </View>
                </Animated.View>
              )}
            </View>
          )}

          {/* ── PRONUNCIATION CARD ── */}
          {currentStep.kind === 'pronunciation' && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, ...shadow }}>
              {/* Charlotte instruction */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                <CharlotteAvatar size="xs" />
                <View style={{ flex: 1, backgroundColor: accentBg, borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 14 }}>
                  <AppText style={{ fontSize: 14, color: accent, fontWeight: '700' }}>
                    {currentStep.phrase.type === 'repeat'
                      ? 'Listen to Charlotte, then record yourself repeating the phrase.'
                      : 'Listen to Charlotte, then type what you heard.'}
                  </AppText>
                </View>
              </View>

              {/* Focus label */}
              <View style={{ backgroundColor: C.ghost, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', marginBottom: 18 }}>
                <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navyMid }}>
                  Focus: {currentStep.phrase.focus}
                </AppText>
              </View>

              {/* Phrase (hidden for listen_write until answered) */}
              {(currentStep.phrase.type === 'repeat' || pronStatus === 'result') && (
                <AppText style={{ fontSize: 22, fontWeight: '500', color: C.navy, lineHeight: 34, marginBottom: 24 }}>
                  {currentStep.phrase.text}
                </AppText>
              )}
              {currentStep.phrase.type === 'listen_write' && pronStatus !== 'result' && (
                <View style={{ height: 4, backgroundColor: accent + '33', borderRadius: 2, marginBottom: 24 }} />
              )}

              {/* Play Charlotte button */}
              {pronStatus !== 'loading_audio' && (
                <TouchableOpacity
                  onPress={handlePlayCharlotte}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    backgroundColor: accentBg, borderRadius: 16, borderWidth: 1.5,
                    borderColor: accent + '40', paddingVertical: 14, marginBottom: 20,
                  }}
                >
                  {isPlaying
                    ? <Pause size={20} color={accent} weight="fill" />
                    : <SpeakerHigh size={20} color={accent} weight="fill" />
                  }
                  <AppText style={{ fontSize: 14, fontWeight: '700', color: accent }}>
                    {isPlaying ? 'Pause' : 'Listen to Charlotte'}
                  </AppText>
                </TouchableOpacity>
              )}

              {/* Loading audio */}
              {pronStatus === 'loading_audio' && (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator color={accent} />
                  <AppText style={{ color: C.navyLight, fontSize: 13, marginTop: 10 }}>Preparing audio…</AppText>
                </View>
              )}


              {/* Listen & Write: text input */}
              {currentStep.phrase.type === 'listen_write' && (pronStatus === 'listening' || pronStatus === 'result') && (
                <>
                  <TextInput
                    value={listenWriteAnswer}
                    onChangeText={setListenWriteAnswer}
                    placeholder="Type what you heard…"
                    placeholderTextColor={C.navyLight}
                    editable={pronStatus === 'listening'}
                    style={{
                      borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
                      paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 16, color: C.navy, backgroundColor: '#FAFAF9',
                      minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
                    }}
                    autoCorrect={false} autoCapitalize="none" multiline
                  />
                  {pronStatus === 'listening' && (
                    <TouchableOpacity
                      onPress={checkListenWrite}
                      disabled={!listenWriteAnswer.trim()}
                      style={{
                        backgroundColor: listenWriteAnswer.trim() ? accent : C.ghost,
                        borderRadius: 16, paddingVertical: 15, alignItems: 'center',
                      }}
                    >
                      <AppText style={{ fontSize: 15, fontWeight: '800', color: listenWriteAnswer.trim() ? '#FFF' : C.navyLight }}>
                        Check
                      </AppText>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Pronunciation result */}
              {pronStatus === 'result' && (
                <Animated.View style={{
                  opacity: resultAnim,
                  transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                  marginTop: 8,
                }}>
                  {/* Repeat result */}
                  {assessmentResult && currentStep.phrase.type === 'repeat' && (
                    <View style={{ backgroundColor: C.ghost, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                      <AppText style={{ fontSize: 16, fontWeight: '800', color: scoreColor(assessmentResult.pronunciationScore ?? 0), marginBottom: 12 }}>
                        {scoreLabel(assessmentResult.pronunciationScore ?? 0)}
                      </AppText>
                      <ScoreBar label="Overall"      score={assessmentResult.pronunciationScore ?? 0} />
                      <ScoreBar label="Accuracy"     score={assessmentResult.accuracyScore     ?? 0} />
                      <ScoreBar label="Fluency"      score={assessmentResult.fluencyScore       ?? 0} />
                      <ScoreBar label="Completeness" score={assessmentResult.completenessScore  ?? 0} />
                    </View>
                  )}
                  {/* Listen & Write result */}
                  {currentStep.phrase.type === 'listen_write' && listenWriteCorrect !== null && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      padding: 14, borderRadius: 14, marginBottom: 12,
                      backgroundColor: listenWriteCorrect ? C.greenBg : C.redBg,
                      borderWidth: 1,
                      borderColor: listenWriteCorrect ? 'rgba(61,136,0,0.2)' : 'rgba(220,38,38,0.18)',
                    }}>
                      {listenWriteCorrect ? <CheckCircle size={20} color={C.green} weight="fill" /> : <XCircle size={20} color={C.red} weight="fill" />}
                      <AppText style={{ fontSize: 15, fontWeight: '700', color: listenWriteCorrect ? C.green : C.red }}>
                        {listenWriteCorrect ? 'Correct!' : 'Not quite — listen again.'}
                      </AppText>
                    </View>
                  )}
                  {/* Error fallback */}
                  {pronStatus === 'error' && (
                    <AppText style={{ color: C.red, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                      Could not assess. Tap Next to continue.
                    </AppText>
                  )}
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Bottom CTA ── */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 20,
          backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
        }}>
          {/* ── Grammar ── */}
          {currentStep.kind === 'grammar' && gStatus === 'answering' && (
            <TouchableOpacity onPress={handleGrammarSubmit} disabled={!userAnswer.trim()}
              style={{ backgroundColor: userAnswer.trim() ? C.navy : C.ghost, borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: userAnswer.trim() ? '#FFF' : C.navyLight }}>Check answer</AppText>
            </TouchableOpacity>
          )}
          {currentStep.kind === 'grammar' && gStatus === 'submitted' && (
            <TouchableOpacity onPress={handleNext}
              style={{ backgroundColor: C.navy, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{stepIdx + 1 >= totalSteps ? 'Finish' : 'Next'}</AppText>
              {stepIdx + 1 < totalSteps && <ArrowRight size={18} color="#FFF" weight="bold" />}
            </TouchableOpacity>
          )}

          {/* ── Pronunciation: Repeat ── */}
          {currentStep.kind === 'pronunciation' && currentStep.phrase.type === 'repeat' && pronStatus === 'loading_audio' && (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <ActivityIndicator color={accent} />
              <AppText style={{ color: C.navyLight, fontSize: 13, marginTop: 8 }}>Loading audio…</AppText>
            </View>
          )}
          {currentStep.kind === 'pronunciation' && currentStep.phrase.type === 'repeat' && pronStatus === 'assessing' && (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <ActivityIndicator color={accent} />
              <AppText style={{ color: C.navyLight, fontSize: 13, marginTop: 8 }}>Analysing pronunciation…</AppText>
            </View>
          )}
          {currentStep.kind === 'pronunciation' && currentStep.phrase.type === 'repeat' && pronStatus !== 'loading_audio' && pronStatus !== 'assessing' && pronStatus !== 'result' && (
            <Pressable onPressIn={startRecording} onPressOut={stopRecording}
              style={({ pressed }) => ({
                backgroundColor: pronStatus === 'recording' ? '#DC2626' : pressed ? accent + 'CC' : accent,
                borderRadius: 20, paddingVertical: 18,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
              })}>
              <Microphone size={22} color="#FFF" weight="fill" />
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>
                {pronStatus === 'recording' ? 'Recording… release to stop' : 'Hold to speak'}
              </AppText>
            </Pressable>
          )}
          {currentStep.kind === 'pronunciation' && currentStep.phrase.type === 'repeat' && pronStatus === 'result' && (
            <TouchableOpacity onPress={handleNext}
              style={{ backgroundColor: C.navy, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{stepIdx + 1 >= totalSteps ? 'Finish' : 'Next'}</AppText>
              {stepIdx + 1 < totalSteps && <ArrowRight size={18} color="#FFF" weight="bold" />}
            </TouchableOpacity>
          )}

          {/* ── Pronunciation: Listen & Write ── */}
          {currentStep.kind === 'pronunciation' && currentStep.phrase.type === 'listen_write' && pronStatus === 'result' && (
            <TouchableOpacity onPress={handleNext}
              style={{ backgroundColor: C.navy, borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{stepIdx + 1 >= totalSteps ? 'Finish' : 'Next'}</AppText>
              {stepIdx + 1 < totalSteps && <ArrowRight size={18} color="#FFF" weight="bold" />}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
