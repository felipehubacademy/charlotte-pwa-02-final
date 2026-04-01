import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Fire,
  Lightning,
  Trophy,
  TextT,
  Microphone,
  ChatTeardropText,
  CheckCircle,
  Gear,
  Lightbulb,
  X,
  CaretRight,
  Lock,
  Phone,
  BookOpenText,
  Headphones,
} from 'phosphor-react-native';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import { AppText } from '@/components/ui/Text';
import EnhancedStatsModal from '@/components/ui/EnhancedStatsModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LEVEL_CONFIG, UserLevel, ChatMode } from '@/lib/levelConfig';

// ── Light theme palette ───────────────────────────────────────
const C = {
  bg:         '#F4F3FA',   // page background — off-white with lavender tint
  card:       '#FFFFFF',   // card surface
  navy:       '#16153A',   // primary text / UI color
  navyMid:    '#4B4A72',   // secondary text
  navyLight:  '#9896B8',   // placeholder / muted
  navyGhost:  'rgba(22,21,58,0.06)',   // subtle borders / dividers
  green:      '#A3FF3C',   // accent fill (bars, badges, active)
  greenDark:  '#3D8800',   // green text on white
  greenBg:    '#F0FFD9',   // green tint background
  blue:       '#60A5FA',
  blueBg:     '#EFF6FF',
  pink:       '#F472B6',
  pinkBg:     '#FDF2F8',
  orange:     '#FF6B35',
  gold:       '#F59E0B',
  shadow:     'rgba(22,21,58,0.08)',
};

const DAILY_XP_GOAL = 100;

// ── Types ─────────────────────────────────────────────────────

interface HomeData {
  streakDays: number;
  totalXP: number;
  todayXP: number;
  rank: number | null;
  todayMessages: number;
  todayAudios: number;
}

interface Mission {
  id: string;
  label: string;
  sub: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  progressLabel: string;
  accentColor: string;
  accentBg: string;
  icon: React.ReactNode;
  doneIcon: React.ReactNode;
}

interface ModeCard {
  mode: ChatMode | 'live';
  title: string;
  sub: string;
  route?: '/(app)/grammar' | '/(app)/pronunciation' | '/(app)/chat';
  accentColor: string;
  accentBg: string;
  icon: React.ReactNode;
  locked?: boolean;
  lockLevel?: string;
}

// ── Helpers ───────────────────────────────────────────────────

function charlotteMessage(firstName: string, streak: number, todayXP: number): string {
  const now   = new Date();
  const h     = now.getHours();
  const seed  = Math.floor(now.getTime() / 86400000); // stable within the same day
  const hi    = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  if (todayXP >= DAILY_XP_GOAL) {
    const opts = [
      `${hi}, ${firstName}! You've already hit your daily goal. I'm proud of you — keep going!`,
      `Amazing effort today, ${firstName}! Daily goal reached. Let's push even further.`,
      `${firstName}, you crushed it today. Goal done. The momentum is all yours now.`,
    ];
    return opts[seed % opts.length];
  }
  if (streak >= 14) {
    return `${hi}, ${firstName}. ${streak} days in a row — you're truly unstoppable. Let's add one more.`;
  }
  if (streak >= 7) {
    return `${hi}, ${firstName}! A whole week streak. You're building something real here.`;
  }
  if (streak > 0 && todayXP === 0) {
    const opts = [
      `${hi}, ${firstName}. Your ${streak}-day streak is on the line — don't let it slip today!`,
      `Hey ${firstName}, no practice yet today. Your streak is waiting for you!`,
      `${hi}! Don't let today break your ${streak}-day streak, ${firstName}. You've got this.`,
    ];
    return opts[seed % opts.length];
  }
  if (todayXP > 0) {
    return `${hi}, ${firstName}! Good start today — just ${DAILY_XP_GOAL - todayXP} XP left to reach your daily goal.`;
  }

  // No activity yet — time-based default
  const pools: Record<string, string[]> = {
    morning: [
      `Good morning, ${firstName}! Ready to start the day with some English?`,
      `Morning, ${firstName}! Let's make today count.`,
      `Good morning! What shall we practise today, ${firstName}?`,
      `Rise and shine, ${firstName}! I'm here whenever you're ready.`,
    ],
    afternoon: [
      `Good afternoon, ${firstName}! How about a practice session right now?`,
      `Hey ${firstName}, perfect time for some English today!`,
      `Afternoon, ${firstName}. Let's keep the momentum going!`,
      `Good afternoon, ${firstName}! I've been waiting for you.`,
    ],
    evening: [
      `Good evening, ${firstName}! One last session before the day ends?`,
      `Evening, ${firstName}. End the day strong — let's practise together.`,
      `Hey ${firstName}, how about some English before bed tonight?`,
      `Good evening! There's still time to practise today, ${firstName}.`,
    ],
  };
  const pool = h < 12 ? pools.morning : h < 18 ? pools.afternoon : pools.evening;
  return pool[seed % pool.length];
}

function getLevel(xp: number) { return Math.floor(xp / 100) + 1; }

// ── Daily tip ──────────────────────────────────────────────────

interface Tip {
  type: 'word' | 'expression' | 'phrasal verb' | 'grammar' | 'idiom';
  term: string;
  meaning: string;
  example: string;
}

const TIPS: Record<string, Tip[]> = {
  Novice: [
    { type: 'word',       term: 'ambitious',     meaning: 'having a strong desire to succeed',                          example: 'She\'s very ambitious and wants to become a doctor.' },
    { type: 'word',       term: 'grateful',       meaning: 'feeling thankful for something good',                        example: 'I\'m so grateful for your help today.' },
    { type: 'word',       term: 'hesitate',       meaning: 'to pause before acting, often from doubt',                   example: 'Don\'t hesitate to ask if you have any questions.' },
    { type: 'word',       term: 'fluent',         meaning: 'speaking a language smoothly and naturally',                 example: 'After two years of practice, she became fluent in English.' },
    { type: 'word',       term: 'available',      meaning: 'free to use or accessible at a given time',                  example: 'Is this time slot available for a meeting?' },
    { type: 'word',       term: 'improve',        meaning: 'to get better at something over time',                       example: 'You\'ll improve faster if you practise every day.' },
    { type: 'expression', term: 'hang on',        meaning: 'wait a moment',                                              example: 'Hang on, I\'ll be right back.' },
    { type: 'expression', term: 'go ahead',       meaning: 'you can proceed or do something',                            example: 'Go ahead — I\'m listening.' },
    { type: 'expression', term: 'no wonder',      meaning: 'it\'s not surprising',                                       example: 'No wonder you\'re tired — you worked all day!' },
    { type: 'expression', term: 'fair enough',    meaning: 'that\'s reasonable or acceptable',                           example: 'A: Can we meet at 3? B: Fair enough, see you then.' },
    { type: 'expression', term: 'of course',      meaning: 'naturally — warmer and more natural than "obviously"',       example: 'Of course I\'ll help you with that.' },
    { type: 'expression', term: 'never mind',     meaning: 'it doesn\'t matter, forget it',                              example: 'Never mind, I found it myself.' },
    { type: 'grammar',    term: 'make vs. do',    meaning: '"make" creates something; "do" is for tasks & actions',      example: 'I made a mistake. Can you do me a favour?' },
    { type: 'grammar',    term: 'say vs. tell',   meaning: '"tell" needs a person: "tell me"; "say" stands alone',       example: 'He said he was tired. She told me the truth.' },
    { type: 'grammar',    term: 'much vs. many',  meaning: '"much" for uncountable nouns; "many" for countable ones',    example: 'How much time do we have? How many people are coming?' },
    { type: 'grammar',    term: 'since vs. for',  meaning: '"since" marks a point in time; "for" marks a duration',      example: 'I\'ve lived here since 2020. I\'ve been waiting for an hour.' },
    { type: 'grammar',    term: 'a vs. an',       meaning: '"an" before vowel sounds, not just vowel letters',           example: 'She wants to be an engineer. It takes an hour to get there.' },
    { type: 'grammar',    term: 'suggest + -ing', meaning: '"I suggest going" is correct — not "I suggest to go"',       example: 'I suggest taking the bus — it\'s much faster.' },
    { type: 'idiom',      term: 'break the ice',  meaning: 'start a conversation in a social situation',                 example: 'He told a joke to break the ice at the meeting.' },
    { type: 'idiom',      term: 'piece of cake',  meaning: 'something very easy to do',                                  example: 'The test was a piece of cake — I finished in 10 minutes.' },
  ],
  Inter: [
    { type: 'phrasal verb', term: 'bring up',               meaning: 'to mention a topic in conversation',                        example: 'She brought up the salary issue during the meeting.' },
    { type: 'phrasal verb', term: 'put off',                 meaning: 'to postpone or delay something',                            example: 'Stop putting off your homework — do it now.' },
    { type: 'phrasal verb', term: 'run into',                meaning: 'to meet someone unexpectedly',                              example: 'I ran into my old teacher at the supermarket.' },
    { type: 'phrasal verb', term: 'give away',               meaning: 'to reveal information unintentionally',                     example: 'His nervous laugh gave away that he was lying.' },
    { type: 'phrasal verb', term: 'look into',               meaning: 'to investigate or research something',                      example: 'I\'ll look into the problem and get back to you.' },
    { type: 'phrasal verb', term: 'take on',                 meaning: 'to accept a challenge or responsibility',                   example: 'She decided to take on the new project.' },
    { type: 'phrasal verb', term: 'come across',             meaning: 'to seem a certain way, or find something by chance',        example: 'He came across as very confident in the interview.' },
    { type: 'phrasal verb', term: 'figure out',              meaning: 'to understand or solve something',                          example: 'I couldn\'t figure out how to fix the error.' },
    { type: 'phrasal verb', term: 'turn down',               meaning: 'to reject an offer or request',                             example: 'She turned down the job offer — the salary was too low.' },
    { type: 'idiom',        term: 'hit the nail on the head', meaning: 'to describe something exactly right',                      example: 'That\'s exactly it — you really hit the nail on the head.' },
    { type: 'idiom',        term: 'bite the bullet',          meaning: 'to endure a painful situation bravely',                    example: 'I bit the bullet and went to the dentist.' },
    { type: 'idiom',        term: 'on the fence',             meaning: 'undecided about something',                                example: 'I\'m still on the fence about moving to a new city.' },
    { type: 'idiom',        term: 'cost an arm and a leg',    meaning: 'to be very expensive',                                     example: 'That renovation is going to cost an arm and a leg.' },
    { type: 'idiom',        term: 'get the hang of it',       meaning: 'to gradually learn how to do something well',              example: 'Keep practising — you\'ll get the hang of it soon.' },
    { type: 'idiom',        term: 'the ball is in your court', meaning: 'it\'s your turn to take action or decide',               example: 'I\'ve made my offer. The ball is in your court now.' },
    { type: 'expression',   term: 'to be honest',             meaning: 'used before a frank or direct opinion',                    example: 'To be honest, I don\'t think that plan will work.' },
    { type: 'expression',   term: 'as far as I know',         meaning: 'based on what I know — with some uncertainty',             example: 'As far as I know, the meeting is still on for Friday.' },
    { type: 'expression',   term: 'let alone',                meaning: 'not to mention — for increasingly unlikely things',        example: 'I can barely afford rent, let alone a holiday.' },
    { type: 'grammar',      term: 'used to vs. would',        meaning: '"used to" for states & habits; "would" only for habits',   example: 'I used to be shy. I would study every evening as a kid.' },
    { type: 'grammar',      term: 'wish + past simple',       meaning: 'expresses regret about the present',                       example: 'I wish I knew the answer. I wish I could speak better.' },
  ],
  Advanced: [
    { type: 'word',         term: 'albeit',               meaning: 'even though — used for concession mid-sentence',          example: 'It was a successful event, albeit a small one.' },
    { type: 'word',         term: 'concede',              meaning: 'to admit something is true, often reluctantly',            example: 'I have to concede that you make a valid point.' },
    { type: 'word',         term: 'nuance',               meaning: 'a subtle difference in meaning, tone, or expression',     example: 'There\'s a nuance between "confident" and "arrogant".' },
    { type: 'word',         term: 'mitigate',             meaning: 'to reduce the severity or impact of something',           example: 'Good preparation can mitigate the risk of failure.' },
    { type: 'word',         term: 'candid',               meaning: 'truthful and straightforward',                            example: 'Can I give you a candid opinion? I think you need more practice.' },
    { type: 'word',         term: 'pragmatic',            meaning: 'dealing with things sensibly and realistically',          example: 'Let\'s be pragmatic — we don\'t have the budget for that.' },
    { type: 'idiom',        term: 'read between the lines', meaning: 'to understand the hidden or implied meaning',           example: 'Read between the lines — she said "fine" but she\'s not happy.' },
    { type: 'idiom',        term: 'burn bridges',         meaning: 'to permanently damage a relationship or opportunity',     example: 'Don\'t burn bridges with your old employer — you may need them.' },
    { type: 'idiom',        term: 'the tip of the iceberg', meaning: 'a small visible part of a much larger problem',         example: 'The complaints we heard are just the tip of the iceberg.' },
    { type: 'idiom',        term: 'take with a grain of salt', meaning: 'to be skeptical about something you\'ve heard',      example: 'Take those reviews with a grain of salt — they may be fake.' },
    { type: 'idiom',        term: 'devil\'s advocate',   meaning: 'arguing the opposite side to explore all angles',          example: 'Let me play devil\'s advocate — what if the opposite is true?' },
    { type: 'idiom',        term: 'push the envelope',   meaning: 'to go beyond accepted limits; try something new',          example: 'This design really pushes the envelope in modern architecture.' },
    { type: 'expression',   term: 'by the same token',   meaning: 'for the same reason / in the same way',                   example: 'He\'s talented, but by the same token, so are the other candidates.' },
    { type: 'expression',   term: 'to put it bluntly',   meaning: 'to say something directly, even if it\'s harsh',          example: 'To put it bluntly, your report needs a complete rewrite.' },
    { type: 'expression',   term: 'needless to say',     meaning: 'it should be obvious — use sparingly to avoid arrogance', example: 'Needless to say, we were all shocked by the news.' },
    { type: 'expression',   term: 'all things considered', meaning: 'taking everything into account; overall',               example: 'All things considered, I think the project went quite well.' },
    { type: 'grammar',      term: 'inversion for emphasis', meaning: 'invert subject and auxiliary for formal impact',        example: 'Rarely have I seen such dedication from a student.' },
    { type: 'grammar',      term: 'cleft sentences',     meaning: 'split a sentence to emphasise one element elegantly',     example: 'It was the tone of his voice that made me uncomfortable.' },
    { type: 'grammar',      term: 'subjunctive mood',    meaning: 'used in formal recommendations and hypotheticals',        example: 'The committee recommends that the policy be reviewed annually.' },
    { type: 'phrasal verb', term: 'gloss over',          meaning: 'to treat something briefly without proper attention',     example: 'The report glosses over some serious financial problems.' },
  ],
};

const TIP_STYLE: Record<string, { bg: string; color: string }> = {
  'word':         { bg: '#F0FFD9', color: '#3D8800' },
  'expression':   { bg: '#EFF6FF', color: '#1D4ED8' },
  'phrasal verb': { bg: '#FDF2F8', color: '#BE185D' },
  'grammar':      { bg: '#FFFBEB', color: '#D97706' },
  'idiom':        { bg: '#F5F3FF', color: '#6D28D9' },
};

function getTip(level: string, seed: number): Tip {
  const pool = TIPS[level] ?? TIPS.Novice;
  return pool[seed % pool.length];
}

// ── XP Ring ───────────────────────────────────────────────────

function XPRing({ todayXP, goal }: { todayXP: number; goal: number }) {
  const SIZE = 50, SW = 5;
  const r    = (SIZE - SW) / 2;
  const circ = 2 * Math.PI * r;
  const prog = Math.min(todayXP / goal, 1);
  const done = prog >= 1;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={r} stroke={C.navyGhost} strokeWidth={SW} fill="none" />
        {prog > 0 && (
          <Circle
            cx={SIZE/2} cy={SIZE/2} r={r}
            stroke={done ? C.green : '#7EE8A2'}
            strokeWidth={SW} fill="none"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
          />
        )}
      </Svg>
      <AppText style={{ fontSize: 12, fontWeight: '900', color: done ? C.greenDark : C.navy }}>
        {todayXP}
      </AppText>
    </View>
  );
}

// ── Build missions ────────────────────────────────────────────

function buildMissions(data: HomeData, level: UserLevel): Mission[] {
  const config = LEVEL_CONFIG[level];
  const list: Mission[] = [];

  list.push({
    id: 'messages', label: 'Envie 5 mensagens', sub: 'Qualquer modo de prática vale',
    xpReward: 20,
    completed: data.todayMessages >= 5,
    progress: Math.min(data.todayMessages / 5, 1),
    progressLabel: `${Math.min(data.todayMessages, 5)} / 5`,
    accentColor: C.greenDark,
    accentBg: C.greenBg,
    icon: <ChatTeardropText size={22} color={C.greenDark} weight="fill" />,
    doneIcon: <CheckCircle size={26} color={C.greenDark} weight="fill" />,
  });

  if (config.tabs.includes('pronunciation')) {
    list.push({
      id: 'audio', label: 'Grave sua voz', sub: 'Segure o microfone e fale algo',
      xpReward: 15,
      completed: data.todayAudios >= 1,
      progress: data.todayAudios >= 1 ? 1 : 0,
      progressLabel: data.todayAudios >= 1 ? 'Feito' : '0 / 1',
      accentColor: C.blue,
      accentBg: C.blueBg,
      icon: <Microphone size={22} color={C.blue} weight="fill" />,
      doneIcon: <CheckCircle size={26} color={C.blue} weight="fill" />,
    });
  }

  list.push({
    id: 'xp', label: 'Ganhe 30 XP', sub: 'Mantenha a conversa fluindo',
    xpReward: 10,
    completed: data.todayXP >= 30,
    progress: Math.min(data.todayXP / 30, 1),
    progressLabel: `${Math.min(data.todayXP, 30)} / 30 XP`,
    accentColor: C.gold,
    accentBg: '#FFFBEB',
    icon: <Lightning size={22} color={C.gold} weight="fill" />,
    doneIcon: <CheckCircle size={26} color={C.gold} weight="fill" />,
  });

  return list;
}

// ──────────────────────────────────────────────────────────────
//  HOME SCREEN
// ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const userId = profile?.id ?? '';
  const level  = (profile?.user_level ?? 'Novice') as UserLevel;
  const name   = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const config = LEVEL_CONFIG[level];

  const [data, setData]             = useState<HomeData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTipModal, setShowTipModal]   = useState(false);
  const [showLiveVoice, setShowLiveVoice] = useState(false);
  const [showStats, setShowStats]         = useState(false);

  // Track which mission rewards were already granted today (persisted in rn_user_practices)
  const rewardedMissionsRef = React.useRef<Set<string>>(new Set());
  const rewardSeedLoadedRef = React.useRef(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [prog, prac] = await Promise.all([
      supabase.from('rn_user_progress').select('streak_days,total_xp').eq('user_id', userId).maybeSingle(),
      supabase.from('rn_user_practices').select('practice_type,xp_earned').eq('user_id', userId).gte('created_at', today.toISOString()),
    ]);
    const practices   = prac.data ?? [];
    const todayXP     = practices.reduce((s, p) => s + (p.xp_earned ?? 0), 0);
    const userTotalXP = prog.data?.total_xp ?? 0;

    // Seed already-rewarded missions from DB (only once per session)
    if (!rewardSeedLoadedRef.current) {
      rewardSeedLoadedRef.current = true;
      practices
        .filter(p => p.practice_type.startsWith('mission_reward_'))
        .forEach(p => rewardedMissionsRef.current.add(p.practice_type));
    }

    // Dynamic rank: count rn_leaderboard_cache entries in same level with strictly higher total_xp
    const { count: higherCount } = await supabase
      .from('rn_leaderboard_cache')
      .select('*', { count: 'exact', head: true })
      .eq('user_level', level)
      .gt('total_xp', userTotalXP);
    const computedRank = (higherCount ?? 0) + 1;

    const newData: HomeData = {
      streakDays:    prog.data?.streak_days ?? 0,
      totalXP:       userTotalXP,
      todayXP,
      rank:          computedRank,
      todayMessages: practices.filter(p => ['text_message','audio_message'].includes(p.practice_type)).length,
      todayAudios:   practices.filter(p => p.practice_type === 'audio_message').length,
    };
    setData(newData);

    // Grant mission rewards for newly completed missions (idempotent via rewardedMissionsRef)
    const missions = buildMissions(newData, level);
    for (const m of missions) {
      const rewardKey = `mission_reward_${m.id}`;
      if (m.completed && !rewardedMissionsRef.current.has(rewardKey)) {
        rewardedMissionsRef.current.add(rewardKey);
        supabase.from('rn_user_practices').insert({
          user_id:       userId,
          practice_type: rewardKey,
          xp_earned:     m.xpReward,
        }).then(({ error }) => {
          if (error) console.warn('⚠️ mission reward error:', error.message);
        });
      }
    }
  }, [userId, level]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line

  useFocusEffect(useCallback(() => {
    if (userId) fetchData();
  }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const missions     = data ? buildMissions(data, level) : [];
  const doneMissions = missions.filter(m => m.completed).length;
  const todayXP      = data?.todayXP   ?? 0;
  const streak       = data?.streakDays ?? 0;
  const totalXP      = data?.totalXP   ?? 0;
  const rank         = data?.rank;
  const levelNum     = getLevel(totalXP);
  const firstName    = (name.split(' ')[0] ?? name);
  const daySeed      = Math.floor(Date.now() / 86400000);
  const tip          = getTip(level, daySeed);

  const hasGrammar      = config.tabs.includes('grammar');
  const hasPronun       = config.tabs.includes('pronunciation');
  const hasChat         = config.tabs.includes('chat');
  const hasLive         = level === 'Advanced';

  const modeCards: ModeCard[] = [
    {
      mode: 'grammar' as const,
      title: 'Grammar',
      sub: '',
      route: '/(app)/grammar' as const,
      accentColor: C.greenDark,
      accentBg: C.greenBg,
      icon: <TextT size={26} color={C.greenDark} weight="bold" />,
      locked: !hasGrammar,
      lockLevel: 'Intermediate',
    },
    {
      mode: 'pronunciation' as const,
      title: 'Pronunciation',
      sub: '',
      route: '/(app)/pronunciation' as const,
      accentColor: C.blue,
      accentBg: C.blueBg,
      icon: <Microphone size={26} color={C.blue} weight="bold" />,
      locked: !hasPronun,
      lockLevel: 'Intermediate',
    },
    {
      mode: 'chat' as const,
      title: 'Free Chat',
      sub: '',
      route: '/(app)/chat' as const,
      accentColor: C.pink,
      accentBg: C.pinkBg,
      icon: <ChatTeardropText size={26} color={C.pink} weight="bold" />,
      locked: !hasChat,
      lockLevel: 'Intermediate',
    },
    {
      mode: 'live' as const,
      title: 'Live Voice',
      sub: '',
      accentColor: C.orange,
      accentBg: 'rgba(255,107,53,0.10)',
      icon: <Phone size={26} color={hasLive ? C.orange : C.navyLight} weight="bold" />,
      locked: !hasLive,
      lockLevel: 'Advanced',
    },
  ];

  const tipStyle = TIP_STYLE[tip.type];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>

      {/* ══════════════════════════════════════════
          HEADER  —  streak · XP · rank · gear
      ══════════════════════════════════════════ */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, height: 52,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.navyGhost,
      }}>
        {/* Stats pills — tappable group → stats modal */}
        <TouchableOpacity
          onPress={() => setShowStats(true)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
        >
          {/* Streak pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: streak ? 'rgba(251,146,60,0.12)' : 'rgba(22,21,58,0.05)',
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Fire size={15} color={streak ? C.orange : C.navyLight} weight="fill" />
            <AppText style={{ fontSize: 13, fontWeight: '800', color: streak ? C.orange : C.navyLight }}>
              {streak}
            </AppText>
          </View>

          {/* XP pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: totalXP > 0 ? 'rgba(61,136,0,0.10)' : 'rgba(22,21,58,0.05)',
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Lightning size={15} color={totalXP > 0 ? C.greenDark : C.navyLight} weight="fill" />
            <AppText style={{ fontSize: 13, fontWeight: '800', color: totalXP > 0 ? C.greenDark : C.navyLight }}>
              {totalXP.toLocaleString()}
            </AppText>
          </View>

          {/* Rank pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: rank ? 'rgba(234,179,8,0.12)' : 'rgba(22,21,58,0.05)',
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Trophy size={15} color={rank ? C.gold : C.navyLight} weight="fill" />
            <AppText style={{ fontSize: 13, fontWeight: '800', color: rank ? C.gold : C.navyLight }}>
              {rank ? `#${rank}` : '—'}
            </AppText>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.push('/(app)/configuracoes')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Gear size={22} color={C.navyMid} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
      >

        {/* ══════════════════════════════════════════
            CHARLOTTE HERO CARD
            Navy header + white body.
            She opens every session — coach, not mascot.
        ══════════════════════════════════════════ */}
        <View style={{ marginHorizontal: 20, marginTop: 8 }}>
          <View style={{
            borderRadius: 22,
            backgroundColor: C.card,
            overflow: 'hidden',
            ...cardShadow,
          }}>
            {/* Navy header strip */}
            <View style={{
              backgroundColor: C.navy,
              paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
              flexDirection: 'row', alignItems: 'flex-start', gap: 12,
            }}>
              {/* Avatar + online dot only */}
              <View style={{ position: 'relative', flexShrink: 0 }}>
                <Image
                  source={require('@/assets/charlotte-avatar.png')}
                  style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: C.green }}
                  resizeMode="cover"
                />
                <View style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: '#4ade80',
                  borderWidth: 2, borderColor: C.navy,
                }} />
              </View>

              {/* Chat bubble with tail */}
              <View style={{ flex: 1, position: 'relative' }}>
                {/* Triangle tail pointing left toward avatar */}
                <View style={{
                  position: 'absolute',
                  left: -7, top: 14,
                  width: 0, height: 0,
                  borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 8,
                  borderTopColor: 'transparent', borderBottomColor: 'transparent',
                  borderRightColor: '#3B3A5A',
                }} />
                <View style={{
                  backgroundColor: '#3B3A5A',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}>
                  <AppText style={{
                    fontSize: 15, color: '#FFFFFF',
                    lineHeight: 23, fontWeight: '500',
                  }}>
                    {charlotteMessage(firstName, streak, todayXP)}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Accent divider — bridges navy and white */}
            <View style={{ height: 2, backgroundColor: 'rgba(163,255,60,0.28)' }} />

            {/* White body — XP progress (tappable → stats modal) */}
            <TouchableOpacity onPress={() => setShowStats(true)} activeOpacity={0.75} style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <XPRing todayXP={todayXP} goal={DAILY_XP_GOAL} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                    <AppText style={{ fontSize: 11, color: C.navyMid, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                      XP de hoje
                    </AppText>
                    <AppText style={{ fontSize: 11, fontWeight: '800',
                      color: todayXP >= DAILY_XP_GOAL ? C.greenDark : C.navyLight }}>
                      {todayXP} / {DAILY_XP_GOAL}
                    </AppText>
                  </View>
                  <View style={{ height: 8, backgroundColor: C.navyGhost, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{
                      height: '100%',
                      width: `${Math.min((todayXP / DAILY_XP_GOAL) * 100, 100)}%`,
                      backgroundColor: C.green,
                      borderRadius: 4,
                    }} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════
            DAILY MISSIONS — zigzag path nodes
        ══════════════════════════════════════════ */}
        <SectionHeader label="Missões do dia" badge={`${doneMissions}/${missions.length}`} />

        <View style={{ paddingHorizontal: 20 }}>
          {missions.map((m, index) => (
            <MissionNode
              key={m.id}
              mission={m}
              alignRight={index % 2 === 1}
              showConnector={index < missions.length - 1}
            />
          ))}
        </View>

        {/* ══════════════════════════════════════════
            LEARN — structured lessons
        ══════════════════════════════════════════ */}
        <SectionHeader label="Aprender com Charlotte" />

        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
              onPress={() => router.push('/(app)/learn-trail')}
              activeOpacity={0.72}
              style={{
                borderRadius: 18,
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.navyGhost,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 18,
                paddingHorizontal: 20,
                gap: 16,
              }}
            >
              <View style={{
                width: 52, height: 52, borderRadius: 14,
                backgroundColor: '#FFFBEB',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <BookOpenText size={28} color="#D97706" weight="bold" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy }}>
                  Trilha de Aprendizado
                </AppText>
                <AppText style={{ fontSize: 12, color: C.navyLight, marginTop: 2 }}>
                  Aulas guiadas — Gramática & Pronúncia
                </AppText>
              </View>
              <CaretRight size={18} color={C.navyLight} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════
            PRACTICE — destination cards
        ══════════════════════════════════════════ */}
        <SectionHeader label="Praticar com Charlotte" />

        <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {modeCards.map(card => (
            <PracticePortal
              key={card.mode}
              card={card}
              onPress={() => {
                if (card.locked) {
                  Alert.alert(
                    `Recurso ${card.lockLevel}`,
                    `${card.title} será desbloqueado ao atingir o nível ${card.lockLevel}. Continue praticando!`,
                    [{ text: 'Entendido' }]
                  );
                } else if (card.mode === 'live') {
                  setShowLiveVoice(true);
                } else if (card.route) {
                  router.push(card.route);
                }
              }}
            />
          ))}
        </View>

      </ScrollView>

      {/* ══════════════════════════════════════════
          BOTTOM TIP BAR — fixed, daily tip by level
      ══════════════════════════════════════════ */}
      <TouchableOpacity
        onPress={() => setShowTipModal(true)}
        activeOpacity={0.75}
        style={{
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.navyGhost,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 12,
          backgroundColor: tipStyle.bg,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Lightbulb size={18} color={tipStyle.color} weight="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 3 }}>
            Dica do dia
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <View style={{ backgroundColor: tipStyle.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <AppText style={{ fontSize: 10, fontWeight: '700', color: tipStyle.color, textTransform: 'capitalize' }}>
                {tip.type}
              </AppText>
            </View>
            <AppText style={{ fontSize: 13, fontWeight: '700', color: C.navy }}>
              {tip.term}
            </AppText>
          </View>
          <AppText style={{ fontSize: 12, color: C.navyMid, lineHeight: 16 }} numberOfLines={1}>
            {tip.meaning}
          </AppText>
        </View>
        <CaretRight size={16} color={C.navyLight} weight="bold" />
      </TouchableOpacity>

      <LiveVoiceModal
        isOpen={showLiveVoice}
        onClose={() => setShowLiveVoice(false)}
        userLevel={level}
        userName={name}
      />

      <EnhancedStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        sessionXP={data?.todayXP ?? 0}
        totalXP={totalXP}
        userId={userId}
        userLevel={level}
        userName={name}
      />

      {/* ══════════════════════════════════════════
          TIP MODAL
      ══════════════════════════════════════════ */}
      <Modal visible={showTipModal} transparent animationType="fade" onRequestClose={() => setShowTipModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(22,21,58,0.52)', justifyContent: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setShowTipModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 24 }}>

              {/* Header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <View style={{ backgroundColor: tipStyle.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: tipStyle.color, textTransform: 'capitalize' }}>
                    {tip.type}
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTipModal(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={C.navyLight} weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Term */}
              <AppText style={{ fontSize: 26, fontWeight: '800', color: C.navy, marginBottom: 8, letterSpacing: -0.5 }}>
                {tip.term}
              </AppText>

              {/* Meaning */}
              <AppText style={{ fontSize: 15, color: C.navyMid, lineHeight: 23, marginBottom: 20 }}>
                {tip.meaning}
              </AppText>

              {/* Example */}
              <View style={{ backgroundColor: tipStyle.bg, borderRadius: 16, padding: 16 }}>
                <AppText style={{ fontSize: 10, fontWeight: '700', color: tipStyle.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Exemplo
                </AppText>
                <AppText style={{ fontSize: 15, color: C.navy, fontStyle: 'italic', lineHeight: 23 }}>
                  "{tip.example}"
                </AppText>
              </View>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// ── Helpers & sub-components ──────────────────────────────────

const cardShadow = Platform.select({
  ios: {
    shadowColor: C.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
});

function SectionHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 28, marginBottom: 16 }}>
      <AppText style={{ fontSize: 17, fontWeight: '800', color: C.navy, flex: 1 }}>
        {label}
      </AppText>
      {badge ? (
        <View style={{ backgroundColor: C.navyGhost, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
          <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navyMid }}>{badge} feito</AppText>
        </View>
      ) : null}
    </View>
  );
}

// Mission node — circular, zigzag, with connector line between them

function MissionNode({ mission, alignRight, showConnector }: {
  mission: Mission;
  alignRight: boolean;
  showConnector: boolean;
}) {
  const NODE = 58;

  return (
    <View style={{ marginBottom: showConnector ? 10 : 0 }}>
      <View style={{
        flexDirection: alignRight ? 'row-reverse' : 'row',
        alignItems: 'center',
      }}>
        {/* Circle node */}
        <View style={{
          width: NODE, height: NODE, borderRadius: NODE / 2,
          backgroundColor: mission.completed ? mission.accentBg : C.card,
          borderWidth: 1.5,
          borderColor: mission.completed ? `${mission.accentColor}40` : C.navyGhost,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          ...cardShadow,
        }}>
          {mission.completed ? mission.doneIcon : mission.icon}
        </View>

        {/* Horizontal connector — links THIS circle to THIS card */}
        <View style={{ width: 14, height: 1.5, backgroundColor: C.navyGhost, flexShrink: 0 }} />

        {/* Card content */}
        <View style={{
          flex: 1,
          backgroundColor: C.card,
          borderRadius: 16,
          padding: 11,
          borderWidth: 1,
          borderColor: mission.completed ? `${mission.accentColor}30` : C.navyGhost,
          ...cardShadow,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText style={{
              flex: 1, fontSize: 14, fontWeight: '700',
              color: mission.completed ? C.navyLight : C.navy,
              textDecorationLine: mission.completed ? 'line-through' : 'none',
            }}>
              {mission.label}
            </AppText>
            <View style={{
              backgroundColor: mission.completed ? C.greenBg : C.bg,
              borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <AppText style={{
                fontSize: 11, fontWeight: '800',
                color: mission.completed ? C.greenDark : C.navyLight,
              }}>
                +{mission.xpReward} XP
              </AppText>
            </View>
          </View>

          {mission.completed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <CheckCircle size={12} color={mission.accentColor} weight="fill" />
              <AppText style={{ fontSize: 12, color: C.navyLight }}>Concluída hoje</AppText>
            </View>
          ) : (
            <AppText style={{ fontSize: 12, color: C.navyLight, marginTop: 3 }}>
              {mission.sub}
            </AppText>
          )}

          {!mission.completed && mission.progress > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1, height: 4, backgroundColor: C.navyGhost, borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${mission.progress * 100}%`,
                  backgroundColor: mission.accentColor, borderRadius: 2 }} />
              </View>
              <AppText style={{ fontSize: 10, color: C.navyLight, fontWeight: '600' }}>
                {mission.progressLabel}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Practice portal — 2×2 grid card, icon + label only

function PracticePortal({ card, onPress }: { card: ModeCard; onPress: () => void }) {
  const locked = !!card.locked;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={{
        width: '47%',
        borderRadius: 18,
        backgroundColor: locked ? C.bg : C.card,
        borderWidth: 1,
        borderColor: C.navyGhost,
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 8,
        opacity: locked ? 0.52 : 1,
        ...cardShadow,
      }}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: locked ? 'rgba(22,21,58,0.05)' : card.accentBg,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
      }}>
        {locked ? <Lock size={26} color={C.navyLight} weight="bold" /> : card.icon}
      </View>
      <AppText style={{ fontSize: 13, fontWeight: '700', color: locked ? C.navyLight : C.navy, textAlign: 'center' }}>
        {card.title}
      </AppText>
      {locked && card.lockLevel && (
        <AppText style={{ fontSize: 10, color: C.navyLight, marginTop: 3, textAlign: 'center' }}>
          {card.lockLevel}
        </AppText>
      )}
    </TouchableOpacity>
  );
}
