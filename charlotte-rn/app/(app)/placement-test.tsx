// app/(app)/placement-test.tsx
//
// Placement test — assigns Charlotte level: Novice / Inter / Advanced
// Charlotte guides the user in first-person throughout (like Duolingo's Duo).
//
// Flow:
//   Intro  → Q1–Q10 Grammar → (optional Listening) → Result

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Platform, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import {
  Headphones, Play, Pause, ArrowRight,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useMessageAudioPlayer } from '@/hooks/useMessageAudioPlayer';

const SCREEN_W     = Dimensions.get('window').width;
const API_BASE_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.10)',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  shadow: Platform.select({
    ios: {
      shadowColor: 'rgba(22,21,58,0.12)',
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 4 },
  }),
};

const LEVEL_TAG: Record<string, string> = {
  Novice:   'NOVICE',
  Inter:    'INTERMEDIATE',
  Advanced: 'ADVANCED',
};

// ── Question types ────────────────────────────────────────────────────────────
type GrammarQ = {
  kind: 'grammar';
  id: number;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type ListeningQ = {
  kind: 'listening';
  id: number;
  forLevel: 'Inter' | 'Advanced';
  audioText: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type AnyQuestion = GrammarQ | ListeningQ;

// ── Grammar questions (A1 → C2) ───────────────────────────────────────────────
const GRAMMAR: GrammarQ[] = [
  {
    kind: 'grammar', id: 1, difficulty: 'Basic',
    question: 'Every morning, she ___ breakfast before leaving for work.',
    options: ['make', 'makes', 'is making', 'made'],
    correctIndex: 1,
  },
  {
    kind: 'grammar', id: 2, difficulty: 'Basic',
    question: 'I ___ dinner when she called me last night.',
    options: ['had', 'was having', 'have had', 'am having'],
    correctIndex: 1,
  },
  {
    kind: 'grammar', id: 3, difficulty: 'Intermediate',
    question: 'She ___ in Paris for three years — she moved there after university.',
    options: ['lives', 'lived', 'has lived', 'is living'],
    correctIndex: 2,
  },
  {
    kind: 'grammar', id: 4, difficulty: 'Intermediate',
    question: 'If I ___ a car, I would drive to work instead of taking the bus.',
    options: ['have', 'had', 'will have', 'would have'],
    correctIndex: 1,
  },
  {
    kind: 'grammar', id: 5, difficulty: 'Intermediate',
    question: 'When I arrived at the station, the last train ___.',
    options: ['already left', 'has already left', 'had already left', 'already leaves'],
    correctIndex: 2,
  },
  {
    kind: 'grammar', id: 6, difficulty: 'Advanced',
    question: 'A new bridge ___ across the river by the end of next year.',
    options: [
      'is going to build',
      'will have been built',
      'is going to be building',
      'will have built',
    ],
    correctIndex: 1,
  },
  {
    kind: 'grammar', id: 7, difficulty: 'Advanced',
    question: 'I wish I ___ that job offer when I had the chance.',
    options: ['accepted', 'would accept', 'had accepted', 'could accept'],
    correctIndex: 2,
  },
  {
    kind: 'grammar', id: 8, difficulty: 'Expert',
    question: 'Not until the final results were announced ___ how close the election had been.',
    options: [
      'the public realized',
      'did the public realize',
      'the public did realize',
      'realized the public',
    ],
    correctIndex: 1,
  },
  {
    kind: 'grammar', id: 9, difficulty: 'Expert',
    question: 'The board of directors insisted that the CEO ___ a full audit of all accounts.',
    options: ['conducts', 'conducted', 'conduct', 'would conduct'],
    correctIndex: 2,
  },
  {
    kind: 'grammar', id: 10, difficulty: 'Expert',
    question: 'Scarcely ___ the building when the fire alarm went off.',
    options: ['we had entered', 'had we entered', 'we entered', 'did we enter'],
    correctIndex: 1,
  },
];

// ── Listening questions ───────────────────────────────────────────────────────
const LISTENING_INTER: ListeningQ = {
  kind: 'listening', id: 11, forLevel: 'Inter',
  audioText:
    "Hi, my name is Sarah. I moved to London about a year ago for work. " +
    "At first, I found it quite difficult to understand different accents, " +
    "but I've gotten much better over time. " +
    "My colleagues have been really helpful — they speak more slowly whenever I ask them to. " +
    "The hardest part is still understanding people on the phone, " +
    "because you can't see their lips or expressions.",
  prompt: 'According to Sarah, what has helped her most with understanding accents?',
  options: [
    'Taking extra English lessons after work',
    'Watching British TV shows with subtitles',
    'Her colleagues slowing down when she asks',
    'Living in London for more than two years',
  ],
  correctIndex: 2,
};

const LISTENING_ADVANCED: ListeningQ = {
  kind: 'listening', id: 12, forLevel: 'Advanced',
  audioText:
    "The recent surge in artificial intelligence adoption has sparked considerable debate among economists. " +
    "While proponents argue that automation will ultimately create more jobs than it displaces — " +
    "much as previous technological revolutions did — " +
    "critics contend that the pace of this transition is unprecedented. " +
    "The concern isn't merely about job losses, " +
    "but about whether workers can adapt quickly enough " +
    "to the demands of an increasingly automated economy.",
  prompt: 'What do critics specifically highlight as different about the current AI transition?',
  options: [
    'The total number of jobs that will be permanently eliminated',
    'The unprecedented speed at which the change is happening',
    'The absence of government regulation in the tech sector',
    'The fact that only low-skilled roles are at risk',
  ],
  correctIndex: 1,
};

// ── Level logic ───────────────────────────────────────────────────────────────
type Level = 'Novice' | 'Inter' | 'Advanced';

function grammarLevel(score: number): Level {
  if (score <= 3) return 'Novice';
  if (score <= 6) return 'Inter';
  return 'Advanced';
}

function applyListening(level: Level, correct: boolean): Level {
  if (correct) return level;
  if (level === 'Advanced') return 'Inter';
  if (level === 'Inter')    return 'Novice';
  return 'Novice';
}

const LEVEL_META: Record<Level, {
  label: string; tagline: string;
  description: string; charlotteMessage: string;
}> = {
  Novice: {
    label: 'Novice',
    tagline: 'Você está começando sua jornada!',
    description:
      'Sem problema — todo expert já foi iniciante. Vou te guiar passo a passo, ' +
      'com suporte em português, conversas simples e as bases que você precisa para evoluir com confiança.',
    charlotteMessage: 'Estou aqui para te apoiar em cada etapa. Vamos juntos!',
  },
  Inter: {
    label: 'Intermediate',
    tagline: 'You have a solid foundation!',
    description:
      "Your English is functional — now let's take it further. I'll challenge you " +
      "with real conversations, complex grammar, and the nuances that separate good from fluent.",
    charlotteMessage: "I can't wait to push your English to the next level. Let's go!",
  },
  Advanced: {
    label: 'Advanced',
    tagline: 'Your English is impressive!',
    description:
      "You're operating at a high level. I'll engage you in sophisticated discussions, " +
      "sharpen your nuances, and help you reach that native-like fluency you're after.",
    charlotteMessage: "Let's have some real conversations — I'm excited to work with you.",
  },
};


// ── Main component ────────────────────────────────────────────────────────────
type Phase = 'intro' | 'test' | 'saving' | 'result';

export default function PlacementTestScreen() {
  const { session, refreshProfile, profile } = useAuth();
  const { toggle: toggleAudio, playingMessageId, stop: stopAudio } = useMessageAudioPlayer();

  const firstName = (profile?.name ?? '').split(' ')[0] || 'você';

  const [phase, setPhase]         = useState<Phase>('intro');
  const [queue, setQueue]         = useState<AnyQuestion[]>([]);
  const [qIndex, setQIndex]       = useState(0);
  const [answers, setAnswers]     = useState<number[]>([]);
  const [selected, setSelected]   = useState<number | null>(null);
  const [locked, setLocked]       = useState(false);
  const [level, setLevel]         = useState<Level>('Novice');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [audioUri, setAudioUri]         = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const LISTEN_ID = 'placement-listen';
  const isPlaying  = playingMessageId === LISTEN_ID;

  const slideAnim = useRef(new Animated.Value(0)).current;

  const slideIn = useCallback((fromRight = true) => {
    slideAnim.setValue(fromRight ? SCREEN_W : -SCREEN_W);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }).start();
  }, [slideAnim]);

  const handleStart = () => {
    setQueue(GRAMMAR);
    setPhase('test');
    slideIn();
  };

  useEffect(() => {
    if (phase !== 'test') return;
    const q = queue[qIndex];
    if (!q || q.kind !== 'listening') return;
    setAudioUri(null);
    setAudioLoading(true);
    stopAudio();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: q.audioText }),
        });
        if (!res.ok) throw new Error('TTS failed');
        const data = await res.json();
        if (!data.audio || cancelled) return;
        const uri = `${FileSystem.cacheDirectory}placement_tts_${q.id}.mp3`;
        await FileSystem.writeAsStringAsync(uri, data.audio, { encoding: 'base64' as any });
        if (!cancelled) setAudioUri(uri);
      } catch { /* silently fail */ } finally {
        if (!cancelled) setAudioLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [phase, qIndex, queue]);

  const handleSelect = (idx: number) => {
    if (locked) return;
    setSelected(idx);
    setLocked(true);
    setTimeout(() => {
      const newAnswers = [...answers, idx];
      const isLastGrammar = qIndex === GRAMMAR.length - 1;
      if (isLastGrammar) {
        const grammarScore = newAnswers
          .slice(0, GRAMMAR.length)
          .filter((ans, i) => ans === GRAMMAR[i].correctIndex).length;
        const prelim = grammarLevel(grammarScore);
        const extra: ListeningQ[] =
          prelim === 'Inter'    ? [LISTENING_INTER] :
          prelim === 'Advanced' ? [LISTENING_ADVANCED] : [];
        const newQueue = [...GRAMMAR, ...extra];
        setQueue(newQueue);
        setAnswers(newAnswers);
        if (extra.length === 0) finalize(newAnswers, newQueue);
        else advance(newAnswers, newQueue, qIndex + 1);
        return;
      }
      const isLastQuestion = qIndex === queue.length - 1;
      if (isLastQuestion) finalize(newAnswers, queue);
      else advance(newAnswers, queue, qIndex + 1);
    }, 520);
  };

  const advance = (newAnswers: number[], newQueue: AnyQuestion[], nextIndex: number) => {
    Animated.timing(slideAnim, { toValue: -SCREEN_W, duration: 200, useNativeDriver: true }).start(() => {
      setAnswers(newAnswers);
      setSelected(null);
      setLocked(false);
      setQIndex(nextIndex);
      slideIn(true);
    });
  };

  const finalize = (finalAnswers: number[], finalQueue: AnyQuestion[]) => {
    const grammarScore = finalAnswers
      .slice(0, GRAMMAR.length)
      .filter((ans, i) => ans === GRAMMAR[i].correctIndex).length;
    let finalLevel: Level = grammarLevel(grammarScore);
    const listeningQ = finalQueue.find(q => q.kind === 'listening') as ListeningQ | undefined;
    if (listeningQ) {
      const listeningIdx    = finalQueue.indexOf(listeningQ);
      const listeningAnswer = finalAnswers[listeningIdx];
      finalLevel = applyListening(finalLevel, listeningAnswer === listeningQ.correctIndex);
    }
    setLevel(finalLevel);
    setAnswers(finalAnswers);
    setPhase('saving');
    saveResult(finalLevel);
  };

  const saveResult = async (assignedLevel: Level) => {
    setSaveError(null);
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('charlotte_users')
        .update({ charlotte_level: assignedLevel, placement_test_done: true })
        .eq('id', userId);
      if (error) throw error;
      await refreshProfile();
      setPhase('result');
    } catch (e: any) {
      console.error('[PlacementTest] save error:', e);
      setSaveError('Erro ao salvar resultado. Seu nível foi definido localmente.');
      setPhase('result');
    }
  };

  if (phase === 'intro')  return <IntroScreen firstName={firstName} onStart={handleStart} />;
  if (phase === 'saving') return <SavingScreen />;
  if (phase === 'result') return (
    <ResultScreen
      level={level}
      firstName={firstName}
      saveError={saveError}
      onFinish={() => router.replace('/(app)')}
    />
  );

  const currentQ = queue[qIndex];
  if (!currentQ) return null;

  const displayTotal   = qIndex < GRAMMAR.length ? GRAMMAR.length : queue.length;
  const displayCurrent = qIndex + 1;
  const progress       = displayCurrent / displayTotal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>

      {/* Progress header — same pattern as learn-session */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppText style={{ fontSize: 12, color: C.navyMid, fontWeight: '700', minWidth: 36 }}>
            {displayCurrent} / {displayTotal}
          </AppText>
          <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(22,21,58,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: 4, width: `${progress * 100}%` as any, backgroundColor: C.green, borderRadius: 2 }} />
          </View>
        </View>
      </View>

      {/* Main card — white, same as learn-session */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }], paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Charlotte instruction bubble — xs avatar + colored bubble */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 0, marginBottom: 24 }}>
              <CharlotteAvatar size="xs" />
              {/* Triangle tail */}
              <View style={{
                width: 0, height: 0,
                borderTopWidth: 5, borderTopColor: 'transparent',
                borderBottomWidth: 5, borderBottomColor: 'transparent',
                borderRightWidth: 7, borderRightColor: 'rgba(22,21,58,0.08)',
                marginTop: 10, marginLeft: 2,
              }} />
              <View style={{
                flex: 1, backgroundColor: 'rgba(22,21,58,0.06)',
                borderRadius: 14, borderTopLeftRadius: 4,
                paddingHorizontal: 14, paddingVertical: 12,
              }}>
                <AppText style={{ fontSize: 14, color: C.navy, fontWeight: '700', lineHeight: 20 }}>
                  {currentQ.kind === 'listening'
                    ? 'Listen to the audio and choose the best answer.'
                    : 'Escolha a opção correta para completar a frase.'}
                </AppText>
              </View>
            </View>

            {/* Listening audio player */}
            {currentQ.kind === 'listening' && (
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: C.navy, borderRadius: 14,
                paddingHorizontal: 16, paddingVertical: 12,
                marginBottom: 20, gap: 12,
              }}>
                <Headphones size={16} color={C.green} weight="duotone" />
                <AppText style={{ flex: 1, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' }}>
                  {isPlaying ? 'Playing…' : 'Tap to listen'}
                </AppText>
                {audioLoading ? (
                  <ActivityIndicator size="small" color={C.green} />
                ) : (
                  <TouchableOpacity
                    onPress={() => audioUri && toggleAudio(LISTEN_ID, audioUri)}
                    activeOpacity={0.8}
                    disabled={!audioUri}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: C.green,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: audioUri ? 1 : 0.4,
                    }}
                  >
                    {isPlaying
                      ? <Pause size={16} color={C.navy} weight="fill" />
                      : <Play  size={16} color={C.navy} weight="fill" />}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Question text — large, prominent */}
            <AppText style={{
              fontSize: 22, fontWeight: '500', color: C.navy,
              lineHeight: 34, marginBottom: 28, textAlign: 'justify',
            }}>
              {currentQ.kind === 'grammar' ? currentQ.question : currentQ.prompt}
            </AppText>

            {/* Options */}
            <OptionList options={currentQ.options} selected={selected} locked={locked} onSelect={handleSelect} />

          </ScrollView>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
}


// ── Option list ───────────────────────────────────────────────────────────────

function OptionList({
  options, selected, locked, onSelect,
}: {
  options: string[];
  selected: number | null;
  locked: boolean;
  onSelect: (idx: number) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {options.map((option, idx) => {
        const isSelected = selected === idx;
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelect(idx)}
            activeOpacity={locked ? 1 : 0.75}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              borderRadius: 14, borderWidth: 2,
              borderColor: isSelected ? C.navy : C.border,
              backgroundColor: isSelected ? 'rgba(22,21,58,0.06)' : C.card,
              paddingHorizontal: 16, paddingVertical: 16,
            }}
          >
            <View style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: isSelected ? C.navy : 'rgba(22,21,58,0.06)',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AppText style={{ fontSize: 13, fontWeight: '800', color: isSelected ? C.green : C.navyMid }}>
                {String.fromCharCode(65 + idx)}
              </AppText>
            </View>
            <AppText style={{ fontSize: 15, fontWeight: '600', color: C.navy, flex: 1, lineHeight: 22 }}>
              {option}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Intro screen ──────────────────────────────────────────────────────────────

function IntroScreen({ firstName, onStart }: { firstName: string; onStart: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulse1   = useRef(new Animated.Value(1)).current;
  const pulse2   = useRef(new Animated.Value(1)).current;
  const bubbleY  = useRef(new Animated.Value(12)).current;
  const bubbleO  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Pulse rings around avatar
    const ring = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ]));
    ring(pulse1, 0).start();
    ring(pulse2, 500).start();

    // Speech bubble entrance
    Animated.parallel([
      Animated.timing(bubbleO, { toValue: 1, duration: 380, delay: 350, useNativeDriver: true }),
      Animated.timing(bubbleY, { toValue: 0, duration: 380, delay: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const isNovice = true; // intro is always in PT (user hasn't been tested yet)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <Animated.View style={{
        flex: 1, opacity: fadeAnim,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32, paddingVertical: 40,
      }}>

        {/* Avatar with pulse rings */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Animated.View style={{
            position: 'absolute',
            width: 152, height: 152, borderRadius: 76,
            backgroundColor: 'rgba(163,255,60,0.08)',
            transform: [{ scale: pulse1 }],
          }} />
          <Animated.View style={{
            position: 'absolute',
            width: 124, height: 124, borderRadius: 62,
            backgroundColor: 'rgba(163,255,60,0.13)',
            transform: [{ scale: pulse2 }],
          }} />
          <CharlotteAvatar size="xxl" />
        </View>

        {/* Charlotte speech bubble */}
        <Animated.View style={{
          opacity: bubbleO,
          transform: [{ translateY: bubbleY }],
          width: '100%', marginBottom: 36,
        }}>
          {/* Bubble tail pointing up to avatar */}
          <View style={{
            alignSelf: 'center',
            width: 0, height: 0,
            borderLeftWidth: 10, borderLeftColor: 'transparent',
            borderRightWidth: 10, borderRightColor: 'transparent',
            borderBottomWidth: 12, borderBottomColor: C.navy,
            marginBottom: -1,
          }} />
          <View style={{
            backgroundColor: C.navy, borderRadius: 20,
            paddingHorizontal: 22, paddingVertical: 20,
            ...C.shadow,
          }}>
            <AppText style={{
              fontSize: 11, fontWeight: '800', color: C.green,
              letterSpacing: 0.8, marginBottom: 10,
            }}>
              CHARLOTTE
            </AppText>
            <AppText style={{ fontSize: 17, color: '#FFFFFF', lineHeight: 26, fontWeight: '500' }}>
              Olá, {firstName}! Qual é o seu nível de inglês?
            </AppText>
            <AppText style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 23, marginTop: 8 }}>
              Me responde algumas questões rápidas e eu adapto as conversas e o conteúdo ao seu nível.
            </AppText>
          </View>
        </Animated.View>

        {/* CTA */}
        <TouchableOpacity
          onPress={onStart}
          activeOpacity={0.85}
          style={{
            backgroundColor: C.green, borderRadius: 16,
            paddingVertical: 17, width: '100%',
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          <AppText style={{ fontSize: 16, fontWeight: '800', color: C.navy }}>Começar</AppText>
          <ArrowRight size={18} color={C.navy} weight="bold" />
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

// ── Saving screen ─────────────────────────────────────────────────────────────

function SavingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <CharlotteAvatar size="xl" />
      <ActivityIndicator size="large" color={C.navy} style={{ marginTop: 24 }} />
      <AppText style={{ marginTop: 14, fontSize: 15, color: C.navyMid, fontWeight: '500' }}>
        Calculando seu nível...
      </AppText>
    </SafeAreaView>
  );
}

// ── Result screen ──────────────────────────────────────────────────────────────

function ResultScreen({
  level, firstName, saveError, onFinish,
}: {
  level: Level; firstName: string; saveError: string | null; onFinish: () => void;
}) {
  const meta = LEVEL_META[level];

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 480, delay: 80, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: anim, transform: [{ translateY }] }}>

        {/* Navy hero — avatar + level */}
        <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 36, paddingHorizontal: 28 }}>
          <CharlotteAvatar size="xxl" />
          <View style={{
            marginTop: 20, backgroundColor: 'rgba(163,255,60,0.15)',
            borderRadius: 100, paddingHorizontal: 20, paddingVertical: 7,
            borderWidth: 1, borderColor: 'rgba(163,255,60,0.3)',
          }}>
            <AppText style={{ fontSize: 11, fontWeight: '900', color: C.green, letterSpacing: 2 }}>
              {LEVEL_TAG[level]}
            </AppText>
          </View>
          <AppText style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 30, marginTop: 14 }}>
            {meta.tagline}
          </AppText>
        </View>

        {/* White card — slides up from bottom */}
        <View style={{
          flex: 1, backgroundColor: C.bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingHorizontal: 28, paddingTop: 32, paddingBottom: 32,
        }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

            <AppText style={{ fontSize: 15, color: C.navyMid, lineHeight: 24, marginBottom: 24 }}>
              {meta.description}
            </AppText>

            {/* Charlotte quote */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 0, marginBottom: 32,
            }}>
              <CharlotteAvatar size="xs" />
              {/* Triangle tail */}
              <View style={{
                width: 0, height: 0,
                borderTopWidth: 5, borderTopColor: 'transparent',
                borderBottomWidth: 5, borderBottomColor: 'transparent',
                borderRightWidth: 7, borderRightColor: 'rgba(22,21,58,0.08)',
                marginTop: 10, marginLeft: 2,
              }} />
              <View style={{
                flex: 1, backgroundColor: 'rgba(22,21,58,0.06)',
                borderRadius: 14, borderTopLeftRadius: 4,
                paddingHorizontal: 14, paddingVertical: 12,
              }}>
                <AppText style={{ fontSize: 14, color: C.navy, fontStyle: 'italic', lineHeight: 22 }}>
                  "{meta.charlotteMessage}"
                </AppText>
              </View>
            </View>

            {saveError && (
              <View style={{
                backgroundColor: 'rgba(220,38,38,0.07)', borderRadius: 12,
                borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
                padding: 12, marginBottom: 20,
              }}>
                <AppText style={{ fontSize: 13, color: '#DC2626', textAlign: 'center', lineHeight: 20 }}>
                  {saveError}
                </AppText>
              </View>
            )}

            <View style={{ flex: 1 }} />

            {/* CTA */}
            <TouchableOpacity
              onPress={onFinish}
              activeOpacity={0.85}
              style={{
                backgroundColor: C.green, borderRadius: 16, paddingVertical: 17,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <AppText style={{ fontSize: 16, fontWeight: '800', color: C.navy }}>Começar a aprender</AppText>
              <ArrowRight size={18} color={C.navy} weight="bold" />
            </TouchableOpacity>

          </ScrollView>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}
