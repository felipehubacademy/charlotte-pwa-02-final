import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  Animated,
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
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useXPToast } from '@/components/ui/XPToastProvider';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import { AppText } from '@/components/ui/Text';
import EnhancedStatsModal from '@/components/ui/EnhancedStatsModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LEVEL_CONFIG, UserLevel, ChatMode } from '@/lib/levelConfig';
import { getLiveVoiceStatus, getPoolForLevel } from '@/lib/liveVoiceUsage';
import { soundEngine } from '@/lib/soundEngine';
import { identifyUser, track } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';
import { cacheHomeData, getCachedHomeData } from '@/lib/offlineCache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePaywallContext } from '@/lib/paywallContext';
import { getPendingReviews, ReviewItem } from '@/lib/spacedRepetition';
import { getWeeklyChallenge, fetchWeeklyData, WeeklyChallengeState } from '@/lib/weeklyChallenge';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';

// Module-level flag — persists for the entire JS session even if component remounts.
// Combined with a SecureStore date-check so the sound plays at most ONCE PER DAY,
// not on every app open.
let _streakSoundPlayedThisSession = false;

// Palette estática usada apenas em constantes de módulo (fora do componente)
const C = {
  bg:         '#F4F3FA',
  card:       '#FFFFFF',
  navy:       '#16153A',
  navyMid:    '#4B4A72',
  navyLight:  '#9896B8',
  navyGhost:  'rgba(22,21,58,0.06)',
  green:      '#A3FF3C',
  greenDark:  '#3D8800',
  greenBg:    '#F0FFD9',
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

function charlotteMessage(firstName: string, streak: number, todayXP: number, isPortuguese = false): string {
  const now   = new Date();
  const h     = now.getHours();
  const seed  = Math.floor(now.getTime() / 86400000); // stable within the same day
  const hi    = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  if (isPortuguese) {
    const hiPt = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    if (todayXP >= DAILY_XP_GOAL) {
      const opts = [
        `Olá, ${firstName}! Você já bateu sua meta diária. Estou orgulhosa de você — continue assim!`,
        `Que esforço incrível, ${firstName}! Meta diária atingida. Vamos ainda mais longe.`,
        `${firstName}, você arrasou hoje. Meta cumprida. O ritmo agora é todo seu!`,
      ];
      return opts[seed % opts.length];
    }
    if (streak >= 14) {
      return `${hiPt}, ${firstName}. ${streak} dias seguidos — você é imparável. Vamos adicionar mais um!`;
    }
    if (streak >= 7) {
      return `${hiPt}, ${firstName}! Uma semana inteira de sequência. Você está construindo algo real aqui.`;
    }
    if (streak > 0 && todayXP === 0) {
      const opts = [
        `${hiPt}, ${firstName}. Sua sequência de ${streak} dias está em jogo — não deixe escapar hoje!`,
        `Ei ${firstName}, ainda sem prática hoje. Sua sequência está te esperando!`,
        `${hiPt}! Não deixe hoje quebrar sua sequência de ${streak} dias, ${firstName}. Você consegue!`,
      ];
      return opts[seed % opts.length];
    }
    if (todayXP > 0) {
      return `${hiPt}, ${firstName}! Bom começo hoje — faltam apenas ${DAILY_XP_GOAL - todayXP} XP para atingir sua meta diária.`;
    }
    // No activity yet — time-based default PT
    const poolsPt: Record<string, string[]> = {
      morning: [
        `Bom dia, ${firstName}! Pronta para começar o dia com um pouco de inglês?`,
        `Bom dia, ${firstName}! Vamos fazer hoje valer a pena.`,
        `Bom dia! O que vamos praticar hoje, ${firstName}?`,
        `Levanta e brilha, ${firstName}! Estou aqui sempre que você estiver pronta.`,
      ],
      afternoon: [
        `Boa tarde, ${firstName}! Que tal uma sessão de prática agora?`,
        `Ei ${firstName}, hora perfeita para um pouco de inglês hoje!`,
        `Boa tarde, ${firstName}. Vamos manter o ritmo!`,
        `Boa tarde, ${firstName}! Estava esperando por você.`,
      ],
      evening: [
        `Boa noite, ${firstName}! Uma última sessão antes de terminar o dia?`,
        `Boa noite, ${firstName}. Termine o dia forte — vamos praticar juntos.`,
        `Ei ${firstName}, que tal um pouco de inglês antes de dormir?`,
        `Boa noite! Ainda dá tempo de praticar hoje, ${firstName}.`,
      ],
    };
    const poolPt = h < 12 ? poolsPt.morning : h < 18 ? poolsPt.afternoon : poolsPt.evening;
    return poolPt[seed % poolPt.length];
  }

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
  meaningPt?: string;
  examplePt?: string;
}

const TIPS: Record<string, Tip[]> = {
  Novice: [
    { type: 'word',       term: 'ambitious',     meaning: 'having a strong desire to succeed',                          example: 'She\'s very ambitious and wants to become a doctor.',        meaningPt: 'ter um forte desejo de ter sucesso',                                    examplePt: 'Ela é muito ambiciosa e quer se tornar médica.' },
    { type: 'word',       term: 'grateful',       meaning: 'feeling thankful for something good',                        example: 'I\'m so grateful for your help today.',                      meaningPt: 'sentir-se grato por algo bom',                                          examplePt: 'Sou muito grato pela sua ajuda hoje.' },
    { type: 'word',       term: 'hesitate',       meaning: 'to pause before acting, often from doubt',                   example: 'Don\'t hesitate to ask if you have any questions.',           meaningPt: 'pausar antes de agir, geralmente por dúvida',                           examplePt: 'Não hesite em perguntar se tiver dúvidas.' },
    { type: 'word',       term: 'fluent',         meaning: 'speaking a language smoothly and naturally',                 example: 'After two years of practice, she became fluent in English.',  meaningPt: 'falar um idioma com fluidez e naturalidade',                            examplePt: 'Após dois anos de prática, ela ficou fluente em inglês.' },
    { type: 'word',       term: 'available',      meaning: 'free to use or accessible at a given time',                  example: 'Is this time slot available for a meeting?',                 meaningPt: 'livre para usar ou acessível em determinado momento',                   examplePt: 'Este horário está disponível para uma reunião?' },
    { type: 'word',       term: 'improve',        meaning: 'to get better at something over time',                       example: 'You\'ll improve faster if you practise every day.',           meaningPt: 'melhorar em algo ao longo do tempo',                                    examplePt: 'Você vai melhorar mais rápido se praticar todos os dias.' },
    { type: 'expression', term: 'hang on',        meaning: 'wait a moment',                                              example: 'Hang on, I\'ll be right back.',                               meaningPt: 'espera um momento',                                                     examplePt: 'Espera, já volto.' },
    { type: 'expression', term: 'go ahead',       meaning: 'you can proceed or do something',                            example: 'Go ahead — I\'m listening.',                                  meaningPt: 'você pode prosseguir ou fazer algo',                                    examplePt: 'Pode ir — estou ouvindo.' },
    { type: 'expression', term: 'no wonder',      meaning: 'it\'s not surprising',                                       example: 'No wonder you\'re tired — you worked all day!',              meaningPt: 'não é surpresa',                                                        examplePt: 'Não é à toa que você está cansado — trabalhou o dia todo!' },
    { type: 'expression', term: 'fair enough',    meaning: 'that\'s reasonable or acceptable',                           example: 'A: Can we meet at 3? B: Fair enough, see you then.',          meaningPt: 'isso é razoável ou aceitável',                                          examplePt: 'R: Podemos nos encontrar às 3? R: Tudo bem, então até lá.' },
    { type: 'expression', term: 'of course',      meaning: 'naturally — warmer and more natural than "obviously"',       example: 'Of course I\'ll help you with that.',                         meaningPt: 'naturalmente — mais caloroso e natural do que "obviamente"',            examplePt: 'Claro que vou te ajudar com isso.' },
    { type: 'expression', term: 'never mind',     meaning: 'it doesn\'t matter, forget it',                              example: 'Never mind, I found it myself.',                              meaningPt: 'não importa, esqueça',                                                  examplePt: 'Deixa pra lá, eu mesmo encontrei.' },
    { type: 'grammar',    term: 'make vs. do',    meaning: '"make" creates something; "do" is for tasks & actions',      example: 'I made a mistake. Can you do me a favour?',                  meaningPt: '"make" cria algo; "do" é para tarefas e ações',                         examplePt: 'Cometi um erro. Pode me fazer um favor?' },
    { type: 'grammar',    term: 'say vs. tell',   meaning: '"tell" needs a person: "tell me"; "say" stands alone',       example: 'He said he was tired. She told me the truth.',                meaningPt: '"tell" precisa de uma pessoa: "tell me"; "say" fica sozinho',           examplePt: 'Ele disse que estava cansado. Ela me contou a verdade.' },
    { type: 'grammar',    term: 'much vs. many',  meaning: '"much" for uncountable nouns; "many" for countable ones',    example: 'How much time do we have? How many people are coming?',      meaningPt: '"much" para substantivos incontáveis; "many" para contáveis',           examplePt: 'Quanto tempo temos? Quantas pessoas estão vindo?' },
    { type: 'grammar',    term: 'since vs. for',  meaning: '"since" marks a point in time; "for" marks a duration',      example: 'I\'ve lived here since 2020. I\'ve been waiting for an hour.', meaningPt: '"since" marca um ponto no tempo; "for" marca uma duração',            examplePt: 'Moro aqui desde 2020. Estou esperando há uma hora.' },
    { type: 'grammar',    term: 'a vs. an',       meaning: '"an" before vowel sounds, not just vowel letters',           example: 'She wants to be an engineer. It takes an hour to get there.', meaningPt: '"an" antes de sons vogais, não apenas letras vogais',                  examplePt: 'Ela quer ser engenheira. Leva uma hora para chegar lá.' },
    { type: 'grammar',    term: 'suggest + -ing', meaning: '"I suggest going" is correct — not "I suggest to go"',       example: 'I suggest taking the bus — it\'s much faster.',               meaningPt: '"I suggest going" está correto — não "I suggest to go"',               examplePt: 'Sugiro pegar o ônibus — é muito mais rápido.' },
    { type: 'idiom',      term: 'break the ice',  meaning: 'start a conversation in a social situation',                 example: 'He told a joke to break the ice at the meeting.',             meaningPt: 'iniciar uma conversa em uma situação social',                           examplePt: 'Ele contou uma piada para quebrar o gelo na reunião.' },
    { type: 'idiom',      term: 'piece of cake',  meaning: 'something very easy to do',                                  example: 'The test was a piece of cake — I finished in 10 minutes.',   meaningPt: 'algo muito fácil de fazer',                                             examplePt: 'A prova foi moleza — terminei em 10 minutos.' },
    // ── Batch 2 ──
    { type: 'word',        term: 'actually',       meaning: 'in reality — often used to correct or add information',       example: 'I thought it was easy, but actually it was quite hard.',      meaningPt: 'na verdade — usado para corrigir ou acrescentar algo',                  examplePt: 'Achei que seria fácil, mas na verdade foi bem difícil.' },
    { type: 'word',        term: 'definitely',     meaning: 'without any doubt; certainly',                                example: 'I\'m definitely coming to the party tonight.',                  meaningPt: 'com certeza; definitivamente',                                          examplePt: 'Com certeza vou à festa hoje à noite.' },
    { type: 'word',        term: 'although',       meaning: 'in spite of the fact that — like "even though"',             example: 'Although it was raining, we went for a walk.',                 meaningPt: 'embora; apesar de — como "even though"',                               examplePt: 'Embora estivesse chovendo, fomos caminhar.' },
    { type: 'word',        term: 'unless',         meaning: 'except if — used for conditions that prevent something',     example: 'I won\'t go unless you come with me.',                          meaningPt: 'a não ser que — condição que impede algo',                             examplePt: 'Não vou a não ser que você venha comigo.' },
    { type: 'word',        term: 'meanwhile',      meaning: 'at the same time; during that period',                       example: 'She cooked dinner. Meanwhile, he set the table.',               meaningPt: 'enquanto isso; ao mesmo tempo',                                         examplePt: 'Ela cozinhou o jantar. Enquanto isso, ele pôs a mesa.' },
    { type: 'word',        term: 'whenever',       meaning: 'every time that; at any time',                               example: 'Whenever I\'m stressed, I go for a run.',                       meaningPt: 'sempre que; toda vez que',                                              examplePt: 'Sempre que estou estressado, vou correr.' },
    { type: 'word',        term: 'however',        meaning: 'on the other hand; despite that',                            example: 'It\'s expensive. However, it\'s worth it.',                     meaningPt: 'porém; no entanto',                                                     examplePt: 'É caro. Porém, vale a pena.' },
    { type: 'word',        term: 'therefore',      meaning: 'as a result; for that reason',                               example: 'She studied hard and therefore passed the exam.',               meaningPt: 'portanto; por isso',                                                    examplePt: 'Ela estudou muito e portanto passou na prova.' },
    { type: 'expression',  term: 'I mean',         meaning: 'used to clarify or rephrase what you just said',             example: 'It was good — I mean, not perfect, but really solid.',          meaningPt: 'quer dizer — usado para esclarecer o que acabou de dizer',             examplePt: 'Foi bom — quer dizer, não perfeito, mas muito sólido.' },
    { type: 'expression',  term: 'you know',       meaning: 'used to check understanding or soften a statement',          example: 'It\'s like, you know, really hard to explain.',                 meaningPt: 'sabe? — usado para verificar compreensão ou suavizar',                 examplePt: 'É tipo, sabe, muito difícil de explicar.' },
    { type: 'expression',  term: 'kind of',        meaning: 'somewhat; a little (informal softener)',                     example: 'I\'m kind of tired today — long week.',                         meaningPt: 'meio que; um pouco (suavizador informal)',                              examplePt: 'Estou meio cansado hoje — semana longa.' },
    { type: 'expression',  term: 'sort of',        meaning: 'similar to "kind of" — slightly, in a way',                 example: 'It\'s sort of complicated to explain.',                          meaningPt: 'parecido com "kind of" — de certa forma, um pouco',                    examplePt: 'É de certa forma complicado de explicar.' },
    { type: 'grammar',     term: 'can vs. could',  meaning: '"can" is present ability; "could" is past or more polite',   example: 'I can swim. Could you help me, please?',                       meaningPt: '"can" é habilidade presente; "could" é passado ou mais educado',       examplePt: 'Eu sei nadar. Você poderia me ajudar, por favor?' },
    { type: 'grammar',     term: 'will vs. going to', meaning: '"will" for spontaneous decisions; "going to" for plans', example: 'I\'ll get the door! I\'m going to visit Paris next month.',     meaningPt: '"will" para decisões espontâneas; "going to" para planos',             examplePt: 'Eu abro a porta! Vou visitar Paris no próximo mês.' },
    { type: 'grammar',     term: 'present continuous', meaning: 'use it for actions happening right now or temporary',   example: 'I\'m studying English. She\'s living in London for a year.',    meaningPt: 'use para ações acontecendo agora ou temporárias',                      examplePt: 'Estou estudando inglês. Ela está morando em Londres por um ano.' },
    { type: 'grammar',     term: 'there is / there are', meaning: '"there is" for singular; "there are" for plural',    example: 'There is a book on the table. There are two chairs.',            meaningPt: '"there is" para singular; "there are" para plural',                    examplePt: 'Há um livro na mesa. Há duas cadeiras.' },
    { type: 'grammar',     term: 'how much / how many', meaning: '"how much" uncountable; "how many" countable nouns',   example: 'How much water do you drink? How many brothers do you have?',   meaningPt: '"how much" para incontáveis; "how many" para contáveis',               examplePt: 'Quanta água você bebe? Quantos irmãos você tem?' },
    { type: 'grammar',     term: 'do / does in questions', meaning: 'use "do" for I/you/we/they; "does" for he/she/it', example: 'Do you like coffee? Does she work here?',                       meaningPt: 'use "do" para I/you/we/they; "does" para he/she/it',                   examplePt: 'Você gosta de café? Ela trabalha aqui?' },
    { type: 'idiom',       term: 'under the weather', meaning: 'feeling slightly ill or unwell',                         example: 'I\'m feeling a bit under the weather — I might stay home today.', meaningPt: 'sentindo-se um pouco mal ou indisposto',                             examplePt: 'Estou me sentindo um pouco mal — talvez fique em casa hoje.' },
    { type: 'idiom',       term: 'on the tip of my tongue', meaning: 'you almost remember something but can\'t quite',  example: 'His name is on the tip of my tongue — I just can\'t get it.',   meaningPt: 'quase lembro de algo, mas não consigo',                                examplePt: 'O nome dele está na ponta da língua — não consigo lembrar.' },
    { type: 'idiom',       term: 'better late than never', meaning: 'it\'s better to do something late than not at all', example: 'You finally finished the course — better late than never!',     meaningPt: 'melhor tarde do que nunca',                                             examplePt: 'Você finalmente terminou o curso — melhor tarde do que nunca!' },
    // ── Batch 3 ──
    { type: 'word',        term: 'especially',     meaning: 'more than usual; in particular',                             example: 'I love cooking, especially on weekends.',                       meaningPt: 'especialmente; em particular',                                          examplePt: 'Adoro cozinhar, especialmente nos fins de semana.' },
    { type: 'word',        term: 'probably',       meaning: 'almost certainly; very likely',                              example: 'It\'s cloudy — it\'s probably going to rain.',                   meaningPt: 'provavelmente; quase certamente',                                       examplePt: 'Está nublado — provavelmente vai chover.' },
    { type: 'word',        term: 'suddenly',       meaning: 'quickly and unexpectedly',                                   example: 'Suddenly, the lights went out.',                                meaningPt: 'de repente; subitamente',                                               examplePt: 'De repente, as luzes se apagaram.' },
    { type: 'word',        term: 'recently',       meaning: 'not long ago; in the near past',                             example: 'I recently started learning English.',                           meaningPt: 'recentemente; não faz muito tempo',                                     examplePt: 'Comecei a aprender inglês recentemente.' },
    { type: 'word',        term: 'immediately',    meaning: 'at once; without delay',                                     example: 'Call me immediately if anything changes.',                      meaningPt: 'imediatamente; de imediato',                                            examplePt: 'Me ligue imediatamente se algo mudar.' },
    { type: 'word',        term: 'instead',        meaning: 'in place of; as an alternative',                             example: 'I had tea instead of coffee.',                                  meaningPt: 'em vez de; ao invés de',                                               examplePt: 'Tomei chá em vez de café.' },
    { type: 'word',        term: 'during',         meaning: 'throughout or at a point within a time period',             example: 'I fell asleep during the movie.',                               meaningPt: 'durante; ao longo de',                                                  examplePt: 'Adormeci durante o filme.' },
    { type: 'word',        term: 'towards',        meaning: 'in the direction of',                                        example: 'She walked towards the door.',                                  meaningPt: 'em direção a; para',                                                    examplePt: 'Ela caminhou em direção à porta.' },
    { type: 'expression',  term: 'by the way',     meaning: 'used to introduce a new topic or add a side comment',       example: 'By the way, did you see the news today?',                       meaningPt: 'aliás; a propósito — para introduzir um novo assunto',                 examplePt: 'Aliás, você viu as notícias hoje?' },
    { type: 'expression',  term: 'as soon as',     meaning: 'immediately when; the moment that',                         example: 'Call me as soon as you arrive.',                                meaningPt: 'assim que; tão logo',                                                   examplePt: 'Me ligue assim que chegar.' },
    { type: 'expression',  term: 'in fact',        meaning: 'used to add emphasis or introduce real information',        example: 'It was great. In fact, it was the best trip of my life.',       meaningPt: 'na verdade; de fato — para enfatizar ou acrescentar',                  examplePt: 'Foi ótimo. De fato, foi a melhor viagem da minha vida.' },
    { type: 'expression',  term: 'at least',       meaning: 'not less than; used to find a positive in a bad situation', example: 'The hotel wasn\'t great, but at least it was clean.',            meaningPt: 'pelo menos; ao menos',                                                  examplePt: 'O hotel não era ótimo, mas pelo menos estava limpo.' },
    { type: 'expression',  term: 'as well',        meaning: 'in addition; too (used at the end of a sentence)',          example: 'She speaks French and German as well.',                          meaningPt: 'também; além disso (no final da frase)',                                examplePt: 'Ela fala francês e alemão também.' },
    { type: 'grammar',     term: 'articles: a vs. the', meaning: '"a" = first mention; "the" = already known',          example: 'I saw a dog. The dog was really friendly.',                     meaningPt: '"a" = primeira menção; "the" = já conhecido',                          examplePt: 'Vi um cachorro. O cachorro era muito amigável.' },
    { type: 'grammar',     term: 'imperative',     meaning: 'use the base verb to give orders or instructions',          example: 'Open the window. Don\'t touch that. Please sit down.',           meaningPt: 'use o verbo base para dar ordens ou instruções',                       examplePt: 'Abra a janela. Não toque nisso. Por favor, sente-se.' },
    { type: 'grammar',     term: 'have got',       meaning: '"have got" = "have" in British English (possession)',       example: 'I\'ve got a question. She\'s got two brothers.',                  meaningPt: '"have got" = "have" no inglês britânico (posse)',                      examplePt: 'Tenho uma pergunta. Ela tem dois irmãos.' },
    { type: 'grammar',     term: 'object pronouns', meaning: 'me, you, him, her, it, us, them — after verbs or prepositions', example: 'Give it to me. She called him yesterday.',                meaningPt: 'me, you, him, her, it, us, them — após verbos ou preposições',         examplePt: 'Me dê isso. Ela o ligou ontem.' },
    { type: 'grammar',     term: 'possessive \'s',  meaning: 'add \'s to show that something belongs to someone',        example: 'That\'s Maria\'s bag. The teacher\'s name is John.',             meaningPt: 'adicione \'s para mostrar que algo pertence a alguém',                 examplePt: 'Essa é a bolsa da Maria. O nome do professor é John.' },
    { type: 'idiom',       term: 'bite off more than you can chew', meaning: 'take on more than you can handle',        example: 'Don\'t bite off more than you can chew with all those classes.', meaningPt: 'assumir mais do que você consegue lidar',                             examplePt: 'Não assuma mais do que consegue com tantas aulas.' },
    { type: 'idiom',       term: 'cost an arm and a leg', meaning: 'to be very expensive',                               example: 'That new phone costs an arm and a leg.',                        meaningPt: 'custar muito caro; custar os olhos da cara',                           examplePt: 'Aquele celular novo custa os olhos da cara.' },
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
    // ── Batch 2 ──
    { type: 'phrasal verb', term: 'catch up',                 meaning: 'to reach the same level as others; to update someone',     example: 'I need to catch up on the emails I missed this week.' },
    { type: 'phrasal verb', term: 'back up',                  meaning: 'to support someone; to save a copy of data',               example: 'Can you back me up in the meeting? And back up your files!' },
    { type: 'phrasal verb', term: 'carry out',                meaning: 'to complete or perform a task or plan',                    example: 'The team carried out the project on time and under budget.' },
    { type: 'phrasal verb', term: 'set up',                   meaning: 'to establish, arrange, or prepare something',              example: 'She set up a new business after leaving her old job.' },
    { type: 'phrasal verb', term: 'deal with',                meaning: 'to handle or manage a situation or problem',               example: 'How do you deal with difficult clients at work?' },
    { type: 'phrasal verb', term: 'point out',                meaning: 'to draw attention to something; to mention',               example: 'He pointed out several errors in my presentation.' },
    { type: 'phrasal verb', term: 'fall apart',               meaning: 'to break into pieces; to fall into disorder',              example: 'The project started to fall apart after the manager left.' },
    { type: 'phrasal verb', term: 'go through',               meaning: 'to experience something; to examine carefully',            example: 'Let\'s go through the report together before the meeting.' },
    { type: 'phrasal verb', term: 'break down',               meaning: 'to stop working; to lose emotional control',               example: 'The car broke down on the motorway. She broke down in tears.' },
    { type: 'phrasal verb', term: 'hold on',                  meaning: 'to wait; to grip something tightly',                       example: 'Hold on — I just need to check one thing.' },
    { type: 'idiom',        term: 'the last straw',           meaning: 'the final problem that makes a situation unbearable',      example: 'Being late again was the last straw — she quit immediately.' },
    { type: 'idiom',        term: 'beat around the bush',     meaning: 'to avoid talking about the main point directly',           example: 'Stop beating around the bush and tell me what happened.' },
    { type: 'idiom',        term: 'once in a blue moon',      meaning: 'very rarely; almost never',                                example: 'I only eat fast food once in a blue moon.' },
    { type: 'idiom',        term: 'pull someone\'s leg',      meaning: 'to tease or joke with someone',                            example: 'A: You won the lottery! B: Are you pulling my leg?' },
    { type: 'idiom',        term: 'see eye to eye',           meaning: 'to agree with someone on something',                       example: 'We don\'t always see eye to eye, but we respect each other.' },
    { type: 'idiom',        term: 'ring a bell',              meaning: 'to sound familiar; to remind you of something',            example: 'That name rings a bell — did we meet at the conference?' },
    { type: 'expression',   term: 'in a nutshell',            meaning: 'in brief; summarising the key point',                      example: 'In a nutshell, the project is over budget and behind schedule.' },
    { type: 'expression',   term: 'easier said than done',    meaning: 'something sounds simple but is actually difficult',        example: '"Just relax." — Easier said than done when you\'re under pressure.' },
    { type: 'expression',   term: 'for what it\'s worth',     meaning: 'used before an opinion that may or may not be useful',     example: 'For what it\'s worth, I think you made the right call.' },
    { type: 'expression',   term: 'on second thought',        meaning: 'after reconsidering something',                            example: 'On second thought, let\'s postpone the meeting to Friday.' },
    { type: 'grammar',      term: 'past perfect',             meaning: 'use "had + past participle" for actions before another past event', example: 'By the time I arrived, the meeting had already started.' },
    { type: 'grammar',      term: 'reported speech',          meaning: 'change tenses back when reporting what someone said',      example: 'She said she was tired. (was = backshifted from "am")' },
    { type: 'grammar',      term: 'third conditional',        meaning: 'if + past perfect → would have + past participle — for past regrets', example: 'If I had studied harder, I would have passed the exam.' },
    { type: 'grammar',      term: 'relative clauses',         meaning: 'use "who" for people, "which" for things, "that" for both', example: 'The report that she submitted was excellent. The man who called is here.' },
    { type: 'grammar',      term: 'passive voice',            meaning: 'use "be + past participle" to focus on the action, not the actor', example: 'The report was submitted yesterday. Mistakes were made.' },
    { type: 'grammar',      term: 'gerund vs. infinitive',    meaning: 'some verbs take -ing, some take "to", some take both',     example: 'I enjoy running. I want to run. I stopped to rest. I stopped running.' },
    { type: 'grammar',      term: 'present perfect continuous', meaning: 'have/has been + -ing — for ongoing actions with visible results', example: 'I\'ve been working on this for three hours. She\'s been crying.' },
    { type: 'word',         term: 'ambiguous',                meaning: 'open to more than one interpretation; unclear',            example: 'His answer was ambiguous — I wasn\'t sure what he meant.' },
    { type: 'word',         term: 'elaborate',                meaning: 'to explain or describe something in more detail',          example: 'Could you elaborate on that point? I\'d like to know more.' },
    { type: 'word',         term: 'compelling',               meaning: 'convincing and interesting; difficult to ignore',          example: 'She made a compelling argument for changing the strategy.' },
    { type: 'word',         term: 'subtle',                   meaning: 'not obvious; delicate and hard to notice',                 example: 'There\'s a subtle difference between "affect" and "effect".' },
    { type: 'word',         term: 'concise',                  meaning: 'giving a lot of information clearly and in few words',     example: 'Keep your email concise — no one reads long messages.' },
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
    // ── Batch 2 ──
    { type: 'word',         term: 'eloquent',             meaning: 'expressing ideas clearly and effectively in speech or writing', example: 'Her eloquent defence of the proposal won over the board.' },
    { type: 'word',         term: 'lucid',                meaning: 'easy to understand; clear and rational',                   example: 'Despite the complexity, his explanation was remarkably lucid.' },
    { type: 'word',         term: 'unequivocal',          meaning: 'leaving no doubt; completely clear',                       example: 'The CEO gave an unequivocal statement: there will be no layoffs.' },
    { type: 'word',         term: 'reticent',             meaning: 'not revealing one\'s thoughts or feelings readily',        example: 'He was reticent about his plans — no one knew what he was thinking.' },
    { type: 'word',         term: 'ostensibly',           meaning: 'apparently or on the surface — but possibly not really',   example: 'The meeting was ostensibly about budget, but the real issue was leadership.' },
    { type: 'word',         term: 'prerogative',          meaning: 'an exclusive right or privilege',                          example: 'It\'s entirely your prerogative to decline the offer.' },
    { type: 'word',         term: 'pervasive',            meaning: 'spreading widely throughout; present everywhere',          example: 'There\'s a pervasive sense of uncertainty in the market right now.' },
    { type: 'word',         term: 'delineate',            meaning: 'to describe or portray something precisely',               example: 'The report delineates the key risks facing the organisation.' },
    { type: 'word',         term: 'commensurate',         meaning: 'corresponding in size or degree; proportionate',           example: 'The salary should be commensurate with experience and qualifications.' },
    { type: 'word',         term: 'amalgamate',           meaning: 'to combine or unite different things into one',            example: 'The two departments were amalgamated to reduce overhead costs.' },
    { type: 'idiom',        term: 'a double-edged sword', meaning: 'something with both advantages and disadvantages',         example: 'Social media is a double-edged sword — great for reach, risky for reputation.' },
    { type: 'idiom',        term: 'split hairs',          meaning: 'to make overly fine distinctions; argue about details',    example: 'We\'re splitting hairs here — both options are essentially the same.' },
    { type: 'idiom',        term: 'throw in the towel',   meaning: 'to admit defeat; to give up',                              example: 'After three failed attempts, he finally threw in the towel.' },
    { type: 'idiom',        term: 'cut corners',          meaning: 'to do something poorly to save time or money',             example: 'Cutting corners on safety is never acceptable in this industry.' },
    { type: 'idiom',        term: 'on thin ice',          meaning: 'in a risky or precarious situation',                       example: 'After that comment, he\'s on very thin ice with his manager.' },
    { type: 'idiom',        term: 'go to great lengths',  meaning: 'to make a big effort to achieve something',                example: 'She went to great lengths to ensure the client was satisfied.' },
    { type: 'idiom',        term: 'hold your ground',     meaning: 'to maintain your position under pressure',                 example: 'Negotiations were tough, but she held her ground throughout.' },
    { type: 'expression',   term: 'with that in mind',    meaning: 'taking the previous point into consideration',             example: 'The data is inconclusive. With that in mind, I\'d recommend caution.' },
    { type: 'expression',   term: 'on the face of it',    meaning: 'based on initial appearances; superficially',             example: 'On the face of it, the proposal looks attractive. But read the small print.' },
    { type: 'expression',   term: 'it goes without saying', meaning: 'something is so obvious it barely needs to be stated',  example: 'It goes without saying that confidentiality is essential here.' },
    { type: 'expression',   term: 'in the final analysis', meaning: 'when everything has been considered; ultimately',        example: 'In the final analysis, the project failed due to poor communication.' },
    { type: 'expression',   term: 'to no avail',          meaning: 'without success; despite efforts',                        example: 'She tried to reach him several times, but to no avail.' },
    { type: 'expression',   term: 'strike a balance',     meaning: 'to find an acceptable middle point between extremes',     example: 'The policy tries to strike a balance between security and privacy.' },
    { type: 'expression',   term: 'lend weight to',       meaning: 'to add support or credibility to an argument',            example: 'This new evidence lends weight to the prosecution\'s case.' },
    { type: 'grammar',      term: 'nominalisation',       meaning: 'turning verbs/adjectives into nouns — raises register',   example: 'They improved → an improvement. We decided → the decision.' },
    { type: 'grammar',      term: 'ellipsis',             meaning: 'omitting words already understood from context',          example: 'A: Are you coming? B: Yes, I am. (= "I am coming")' },
    { type: 'grammar',      term: 'mixed conditionals',   meaning: 'mix past unreal + present result for nuanced hypotheticals', example: 'If I had studied law, I would be a lawyer now.' },
    { type: 'grammar',      term: 'it + passive reporting', meaning: 'impersonal it + passive is used in formal writing',     example: 'It is believed that… It has been reported that… It is argued that…' },
    { type: 'grammar',      term: 'fronting for emphasis', meaning: 'move element to the front of the clause for focus',      example: 'That I did not expect. What she said surprised everyone.' },
    { type: 'grammar',      term: 'future in the past',   meaning: 'was/were going to, would, was about to — for past future', example: 'She was about to leave when the phone rang. He was going to call.' },
    { type: 'phrasal verb', term: 'call into question',   meaning: 'to cause doubt about something',                          example: 'The new findings call into question the entire research methodology.' },
    { type: 'phrasal verb', term: 'bear out',             meaning: 'to confirm or support the truth of something',            example: 'The results bear out the hypothesis we proposed last year.' },
    { type: 'phrasal verb', term: 'give rise to',         meaning: 'to cause or produce something',                           example: 'The merger gave rise to serious concerns about market competition.' },
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

// ── Typing Dots — matches ChatBox TypingIndicator, white dots for dark bubble ──

function TypingDots() {
  // Same animation as ChatBox.TypingIndicator: opacity 0→1→0, staggered 200ms
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []); // eslint-disable-line

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)', opacity: dot }}
        />
      ))}
    </View>
  );
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

// ── Daily mission pool + seeded rotation ─────────────────────
//
// 8 mission templates — 3 are picked each day using a day-based seed.
// Same missions all day; different missions tomorrow.
// IDs must stay stable — they're used as `mission_reward_<id>` in DB.

interface MissionTemplate {
  id: string;
  label:  (isPt: boolean) => string;
  sub:    (isPt: boolean) => string;
  xpReward: number;
  accentColor: string;
  accentBg:   string;
  icon:    React.ReactElement;
  levels: 'all' | 'pronunciation'; // 'pronunciation' = only Inter/Advanced
  getCompleted:     (d: HomeData) => boolean;
  getProgress:      (d: HomeData) => number;
  getProgressLabel: (d: HomeData, isPt: boolean) => string;
}

const MISSION_POOL: MissionTemplate[] = [

  // ── Família: Mensagens ────────────────────────────────────────
  {
    id: 'messages_3',
    label: isPt => isPt ? 'Envie 3 mensagens' : 'Send 3 messages',
    sub:   isPt => isPt ? 'Qualquer modo de prática vale' : 'Any practice mode counts',
    xpReward: 12, accentColor: C.greenDark, accentBg: C.greenBg, levels: 'all',
    icon: <ChatTeardropText size={22} color={C.greenDark} weight="fill" />,
    getCompleted:     d => d.todayMessages >= 3,
    getProgress:      d => Math.min(d.todayMessages / 3, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages, 3)} / 3`,
  },
  {
    id: 'messages_5',
    label: isPt => isPt ? 'Envie 5 mensagens' : 'Send 5 messages',
    sub:   isPt => isPt ? 'Mantenha o ritmo hoje' : 'Keep the rhythm going today',
    xpReward: 20, accentColor: C.greenDark, accentBg: C.greenBg, levels: 'all',
    icon: <ChatTeardropText size={22} color={C.greenDark} weight="fill" />,
    getCompleted:     d => d.todayMessages >= 5,
    getProgress:      d => Math.min(d.todayMessages / 5, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages, 5)} / 5`,
  },
  {
    id: 'messages_10',
    label: isPt => isPt ? 'Envie 10 mensagens' : 'Send 10 messages',
    sub:   isPt => isPt ? 'Uma sessão completa de prática' : 'A full practice session',
    xpReward: 35, accentColor: C.greenDark, accentBg: C.greenBg, levels: 'all',
    icon: <ChatTeardropText size={22} color={C.greenDark} weight="fill" />,
    getCompleted:     d => d.todayMessages >= 10,
    getProgress:      d => Math.min(d.todayMessages / 10, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages, 10)} / 10`,
  },
  {
    id: 'messages_20',
    label: isPt => isPt ? 'Envie 20 mensagens' : 'Send 20 messages',
    sub:   isPt => isPt ? 'Dia de praticar muito!' : 'Make today count!',
    xpReward: 60, accentColor: C.greenDark, accentBg: C.greenBg, levels: 'all',
    icon: <ChatTeardropText size={22} color={C.greenDark} weight="fill" />,
    getCompleted:     d => d.todayMessages >= 20,
    getProgress:      d => Math.min(d.todayMessages / 20, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages, 20)} / 20`,
  },

  // ── Família: XP ──────────────────────────────────────────────
  {
    id: 'xp_20',
    label: isPt => isPt ? 'Ganhe 20 XP' : 'Earn 20 XP',
    sub:   isPt => isPt ? 'Um começo rápido!' : 'A quick start!',
    xpReward: 8, accentColor: C.gold, accentBg: '#FFFBEB', levels: 'all',
    icon: <Lightning size={22} color={C.gold} weight="fill" />,
    getCompleted:     d => d.todayXP >= 20,
    getProgress:      d => Math.min(d.todayXP / 20, 1),
    getProgressLabel: d => `${Math.min(d.todayXP, 20)} / 20 XP`,
  },
  {
    id: 'xp_50',
    label: isPt => isPt ? 'Ganhe 50 XP hoje' : 'Earn 50 XP today',
    sub:   isPt => isPt ? 'Mantenha a conversa fluindo' : 'Keep the conversation going',
    xpReward: 15, accentColor: C.gold, accentBg: '#FFFBEB', levels: 'all',
    icon: <Lightning size={22} color={C.gold} weight="fill" />,
    getCompleted:     d => d.todayXP >= 50,
    getProgress:      d => Math.min(d.todayXP / 50, 1),
    getProgressLabel: d => `${Math.min(d.todayXP, 50)} / 50 XP`,
  },
  {
    id: 'xp_100',
    label: isPt => isPt ? 'Ganhe 100 XP hoje' : 'Earn 100 XP today',
    sub:   isPt => isPt ? 'Vá além do básico hoje!' : 'Push beyond the basics!',
    xpReward: 25, accentColor: C.gold, accentBg: '#FFFBEB', levels: 'all',
    icon: <Lightning size={22} color={C.gold} weight="fill" />,
    getCompleted:     d => d.todayXP >= 100,
    getProgress:      d => Math.min(d.todayXP / 100, 1),
    getProgressLabel: d => `${Math.min(d.todayXP, 100)} / 100 XP`,
  },

  // ── Família: Streak ───────────────────────────────────────────
  // Requer prática HOJE (todayXP > 0) além do streak acumulado,
  // para evitar mostrar "Concluída" antes de qualquer ação no dia.
  {
    id: 'streak_2',
    label: isPt => isPt ? 'Sequência de 2 dias' : '2-day streak',
    sub:   isPt => isPt ? 'Pratique hoje e mantenha a sequência!' : 'Practice today and keep it going!',
    xpReward: 20, accentColor: C.orange, accentBg: '#FFF3ED', levels: 'all',
    icon: <Fire size={22} color={C.orange} weight="fill" />,
    getCompleted:     d => d.streakDays >= 2 && d.todayXP > 0,
    getProgress:      d => d.todayXP > 0 ? Math.min(d.streakDays / 2, 1) : Math.min(d.streakDays / 2, 0.9),
    getProgressLabel: (d, isPt) => `${Math.min(d.streakDays, 2)} / 2 ${isPt ? 'dias' : 'days'}`,
  },
  {
    id: 'streak_10',
    label: isPt => isPt ? 'Sequência de 10 dias' : '10-day streak',
    sub:   isPt => isPt ? 'Você está no caminho certo!' : 'You\'re on a roll!',
    xpReward: 80, accentColor: C.orange, accentBg: '#FFF3ED', levels: 'all',
    icon: <Fire size={22} color={C.orange} weight="fill" />,
    getCompleted:     d => d.streakDays >= 10 && d.todayXP > 0,
    getProgress:      d => d.todayXP > 0 ? Math.min(d.streakDays / 10, 1) : Math.min(d.streakDays / 10, 0.9),
    getProgressLabel: (d, isPt) => `${Math.min(d.streakDays, 10)} / 10 ${isPt ? 'dias' : 'days'}`,
  },

  // ── Família: Texto ────────────────────────────────────────────
  {
    id: 'text_3',
    label: isPt => isPt ? 'Escreva 3 mensagens' : 'Write 3 text messages',
    sub:   isPt => isPt ? 'Pratique no Grammar ou Chat' : 'Practice in Grammar or Chat mode',
    xpReward: 15, accentColor: C.pink, accentBg: C.pinkBg, levels: 'all',
    icon: <TextT size={22} color={C.pink} weight="fill" />,
    getCompleted:     d => (d.todayMessages - d.todayAudios) >= 3,
    getProgress:      d => Math.min((d.todayMessages - d.todayAudios) / 3, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages - d.todayAudios, 3)} / 3`,
  },
  {
    id: 'text_7',
    label: isPt => isPt ? 'Escreva 7 mensagens' : 'Write 7 text messages',
    sub:   isPt => isPt ? 'Treine sua escrita em inglês' : 'Train your written English',
    xpReward: 28, accentColor: C.pink, accentBg: C.pinkBg, levels: 'all',
    icon: <TextT size={22} color={C.pink} weight="fill" />,
    getCompleted:     d => (d.todayMessages - d.todayAudios) >= 7,
    getProgress:      d => Math.min((d.todayMessages - d.todayAudios) / 7, 1),
    getProgressLabel: d => `${Math.min(d.todayMessages - d.todayAudios, 7)} / 7`,
  },

  // ── Família: Áudio (Inter/Advanced) ──────────────────────────
  {
    id: 'audio_1',
    label: isPt => isPt ? 'Grave sua voz' : 'Record your voice',
    sub:   isPt => isPt ? 'Segure o microfone e fale algo' : 'Hold the mic and say something',
    xpReward: 15, accentColor: C.blue, accentBg: C.blueBg, levels: 'pronunciation',
    icon: <Microphone size={22} color={C.blue} weight="fill" />,
    getCompleted:     d => d.todayAudios >= 1,
    getProgress:      d => d.todayAudios >= 1 ? 1 : 0,
    getProgressLabel: (d, isPt) => d.todayAudios >= 1 ? (isPt ? 'Feito' : 'Done') : '0 / 1',
  },
  {
    id: 'audio_3',
    label: isPt => isPt ? 'Grave 3 áudios' : 'Record 3 voice messages',
    sub:   isPt => isPt ? 'Pratique a pronúncia com áudios' : 'Work on your pronunciation',
    xpReward: 30, accentColor: C.blue, accentBg: C.blueBg, levels: 'pronunciation',
    icon: <Microphone size={22} color={C.blue} weight="fill" />,
    getCompleted:     d => d.todayAudios >= 3,
    getProgress:      d => Math.min(d.todayAudios / 3, 1),
    getProgressLabel: d => `${Math.min(d.todayAudios, 3)} / 3`,
  },
  {
    id: 'audio_5',
    label: isPt => isPt ? 'Grave 5 áudios' : 'Record 5 voice messages',
    sub:   isPt => isPt ? 'Foco total na pronúncia hoje' : 'Full pronunciation focus today',
    xpReward: 45, accentColor: C.blue, accentBg: C.blueBg, levels: 'pronunciation',
    icon: <Microphone size={22} color={C.blue} weight="fill" />,
    getCompleted:     d => d.todayAudios >= 5,
    getProgress:      d => Math.min(d.todayAudios / 5, 1),
    getProgressLabel: d => `${Math.min(d.todayAudios, 5)} / 5`,
  },
];

/** Fisher-Yates shuffle seeded with a simple LCG — deterministic. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed | 1; // ensure non-zero
  const rand = () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Mission families — one picked per family per day (no duplicates within family)
const MISSION_FAMILIES: Record<string, string[]> = {
  messages: ['messages_3', 'messages_5', 'messages_10', 'messages_20'],
  xp:       ['xp_20', 'xp_50', 'xp_100'],
  streak:   ['streak_2', 'streak_10'],
  text:     ['text_3', 'text_7'],
  audio:    ['audio_1', 'audio_3', 'audio_5'],
};

function buildMissions(data: HomeData, level: UserLevel): Mission[] {
  const hasPronunciation = LEVEL_CONFIG[level].tabs.includes('pronunciation');
  const isPt = level === 'Novice';

  // Day seed — changes once per UTC day; offset by level so each level rotates differently
  const dayNum = Math.floor(Date.now() / 86400000);
  const lvlOff = level === 'Novice' ? 0 : level === 'Inter' ? 137 : 271;

  // Pick one template per family using day seed, then pick 3 families for today
  const familyKeys = Object.keys(MISSION_FAMILIES);
  const shuffledFamilies = seededShuffle(familyKeys, dayNum + lvlOff);

  // Exclude audio family for Novice (no pronunciation tab)
  const eligibleFamilies = shuffledFamilies.filter(f =>
    f !== 'audio' || hasPronunciation
  );

  const selected: MissionTemplate[] = [];
  for (const family of eligibleFamilies) {
    if (selected.length === 3) break;
    const candidates = MISSION_POOL.filter(t => MISSION_FAMILIES[family].includes(t.id));
    const shuffledCandidates = seededShuffle(candidates, dayNum + lvlOff + family.length);
    if (shuffledCandidates[0]) selected.push(shuffledCandidates[0]);
  }

  // Pick 3 missions for today
  return selected.map(t => ({
    id:            t.id,
    label:         t.label(isPt),
    sub:           t.sub(isPt),
    xpReward:      t.xpReward,
    completed:     t.getCompleted(data),
    progress:      t.getProgress(data),
    progressLabel: t.getProgressLabel(data, isPt),
    accentColor:   t.accentColor,
    accentBg:      t.accentBg,
    icon:          t.icon,
    doneIcon:      <CheckCircle size={26} color={t.accentColor} weight="fill" />,
  }));
}

// ──────────────────────────────────────────────────────────────
//  HOME SCREEN
// ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useAuth();
  const { openPaywall } = usePaywallContext();
  const insets = useSafeAreaInsets();
  const userId = profile?.id ?? '';
  const level  = (profile?.charlotte_level ?? 'Novice') as UserLevel;
  const name   = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const config = LEVEL_CONFIG[level];
  const { colors: T, isDark } = useTheme();
  // Dentro do componente, C = T para que todos os estilos respondam ao dark mode
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const C = T;
  const isOnline = useNetworkStatus();
  const { triggerToast } = useXPToast();

  // Trial badge — days remaining for non-institutional users on trial
  const trialDaysLeft = useMemo(() => {
    if (!profile || profile.is_institutional) return null;
    if (profile.subscription_status !== 'trial') return null;
    if (!profile.trial_ends_at) return null;
    const diff = new Date(profile.trial_ends_at).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [profile]);

  const [data, setData]             = useState<HomeData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTipModal, setShowTipModal]   = useState(false);
  const [showLiveVoice, setShowLiveVoice]           = useState(false);
  const [liveVoiceRemaining, setLiveVoiceRemaining] = useState<number | null>(null);
  const [showStats, setShowStats]                   = useState(false);
  const [pendingReviews, setPendingReviews]         = useState<ReviewItem[]>([]);
  const [weeklyState, setWeeklyState]               = useState<WeeklyChallengeState | null>(null);
  const [aiGreeting, setAiGreeting]         = useState<string | null>(null);
  const [greetingLoading, setGreetingLoading] = useState(true);
  const greetingFetchedRef = useRef(false);
  const greetingLevelRef   = useRef<string>('');
  // Tracks weekly challenge rewards already granted this session to prevent double-credit
  const weeklyRewardedRef  = useRef<Set<string>>(new Set());

  // Track which mission rewards were already granted today (persisted in charlotte_practices)
  const rewardedMissionsRef = React.useRef<Set<string>>(new Set());
  const rewardSeedLoadedRef = React.useRef(false);
  // Prevent concurrent fetchData calls (race condition → double mission grants)
  const isFetchingRef = React.useRef(false);
  // streakSoundPlayed: uses module-level var so it survives component remounts

  const fetchData = useCallback(async () => {
    if (!userId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [prog, prac, achToday] = await Promise.all([
      supabase.from('charlotte_progress').select('streak_days,total_xp').eq('user_id', userId).maybeSingle(),
      supabase.from('charlotte_practices').select('practice_type,xp_earned').eq('user_id', userId).gte('created_at', today.toISOString()),
      // Achievement bonuses earned today (go via direct UPDATE, not in charlotte_practices)
      supabase.from('user_achievements').select('xp_bonus').eq('user_id', userId).gte('earned_at', today.toISOString()),
    ]);
    const practices         = prac.data ?? [];
    const practicesXP       = practices.reduce((s, p) => s + (p.xp_earned ?? 0), 0);
    const achievementXP     = (achToday.data ?? []).reduce((s: number, a: any) => s + (a.xp_bonus ?? 0), 0);
    const todayXP           = practicesXP + achievementXP;
    const userTotalXP       = prog.data?.total_xp ?? 0;

    // Seed already-rewarded missions from DB (only once per session)
    if (!rewardSeedLoadedRef.current) {
      rewardSeedLoadedRef.current = true;
      practices
        .filter(p => p.practice_type.startsWith('mission_reward_'))
        .forEach(p => rewardedMissionsRef.current.add(p.practice_type));
    }

    // Dynamic rank: count charlotte_leaderboard_cache entries in same level with strictly higher total_xp
    const { count: higherCount } = await supabase
      .from('charlotte_leaderboard_cache')
      .select('*', { count: 'exact', head: true })
      .eq('user_level', level)
      .gt('total_xp', userTotalXP);
    const computedRank = (higherCount ?? 0) + 1;

    const newData: HomeData = {
      streakDays:    prog.data?.streak_days ?? 0,
      totalXP:       userTotalXP,
      todayXP,
      rank:          userTotalXP > 0 ? computedRank : null,
      todayMessages: practices.filter(p => ['text_message','audio_message'].includes(p.practice_type)).length,
      todayAudios:   practices.filter(p => p.practice_type === 'audio_message').length,
    };

    // Grant mission rewards for newly completed missions (idempotent via rewardedMissionsRef)
    const missions = buildMissions(newData, level);
    let missionXPGranted = 0;
    for (const m of missions) {
      const rewardKey = `mission_reward_${m.id}`;
      if (m.completed && !rewardedMissionsRef.current.has(rewardKey)) {
        rewardedMissionsRef.current.add(rewardKey);
        const { error } = await supabase.from('charlotte_practices').insert({
          user_id:       userId,
          practice_type: rewardKey,
          xp_earned:     m.xpReward,
        });
        if (error) {
          console.warn('⚠️ mission reward error:', error.message);
          rewardedMissionsRef.current.delete(rewardKey); // rollback on failure
        } else {
          missionXPGranted += m.xpReward;
        }
      }
    }
    // Reflect granted reward XP immediately so Total matches Hoje
    if (missionXPGranted > 0) {
      newData.totalXP += missionXPGranted;
      newData.todayXP += missionXPGranted;
    }
    setData(newData);

    // 🔊 Som de streak — toca UMA VEZ POR DIA quando há streak ativo.
    // Usa SecureStore para persistir a data do último toque, garantindo que
    // múltiplas aberturas do app no mesmo dia não disparem o som de novo.
    if (!_streakSoundPlayedThisSession && newData.streakDays > 0) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const streakKey = `streak_sound_played_${userId}`;
      SecureStore.getItemAsync(streakKey).then(lastPlayed => {
        if (lastPlayed !== today) {
          _streakSoundPlayedThisSession = true;
          SecureStore.setItemAsync(streakKey, today).catch(() => {});
          setTimeout(() => soundEngine.play('streak_alive').catch(() => {}), 800);
        } else {
          _streakSoundPlayedThisSession = true; // skip but mark so we don't check again
        }
      }).catch(() => {});
    }
    // Cache para uso offline
    cacheHomeData({ ...newData, cachedAt: Date.now() }).catch(() => {});
    } catch (e) {
      console.warn('⚠️ fetchData error:', e);
      // Offline fallback: tentar carregar dados cacheados
      if (!data) {
        const cached = await getCachedHomeData().catch(() => null);
        if (cached) {
          setData({
            streakDays:    cached.streakDays,
            totalXP:       cached.totalXP,
            todayXP:       cached.todayXP,
            rank:          cached.rank,
            todayMessages: cached.todayMessages,
            todayAudios:   cached.todayAudios,
          });
        }
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [userId, level]);

  useEffect(() => {
    if (!userId) return;
    identifyUser(userId, level);
    track('app_open');
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line

  useFocusEffect(useCallback(() => {
    if (userId) fetchData();
  }, [fetchData]));

  const loadLiveVoicePool = useCallback(async () => {
    if (!userId) return;
    try {
      const { secondsRemaining } = await getLiveVoiceStatus(level);
      setLiveVoiceRemaining(secondsRemaining);
    } catch { /* silencioso */ }
  }, [userId, level]);

  const loadPendingReviews = useCallback(async () => {
    if (!userId) return;
    try {
      const items = await getPendingReviews(userId);
      setPendingReviews(items);
    } catch { /* silencioso */ }
  }, [userId]);

  const loadWeeklyChallenge = useCallback(async () => {
    if (!userId) return;
    try {
      const weekly = await fetchWeeklyData(userId);
      const state = getWeeklyChallenge(
        weekly.weeklyMessages, weekly.weeklyXP,
        data?.streakDays ?? 0, weekly.weeklyLessons, weekly.weeklyAudios,
        weekly.weeklyGrammarMessages, level,
      );

      // ── Weekly challenge completion celebration & XP credit ───────────────
      if (state.completed) {
        const rewardKey = `weekly_reward_${state.challenge.id}_${state.weekStart}`;
        if (!weeklyRewardedRef.current.has(rewardKey)) {
          weeklyRewardedRef.current.add(rewardKey);

          // Check DB to avoid crediting again after app restart
          const { data: existing } = await supabase
            .from('charlotte_practices')
            .select('id')
            .eq('user_id', userId)
            .eq('practice_type', rewardKey)
            .maybeSingle();

          if (!existing) {
            // Credit XP
            const { error } = await supabase.from('charlotte_practices').insert({
              user_id:       userId,
              practice_type: rewardKey,
              xp_earned:     state.challenge.xpReward,
            });

            if (!error) {
              // Celebrate!
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => {
                soundEngine.play('achievement_rare').catch(() => {});
                triggerToast(state.challenge.xpReward);
              }, 300);
            } else {
              weeklyRewardedRef.current.delete(rewardKey); // rollback
            }
          }
        }
      }

      setWeeklyState(state);
    } catch { /* silencioso */ }
  }, [userId, data?.streakDays, triggerToast]);

  useEffect(() => {
    if (userId) { loadLiveVoicePool(); loadPendingReviews(); loadWeeklyChallenge(); }
  }, [userId]); // eslint-disable-line

  useFocusEffect(useCallback(() => {
    if (userId) { loadLiveVoicePool(); loadPendingReviews(); loadWeeklyChallenge(); }
  }, [loadLiveVoicePool, loadPendingReviews, loadWeeklyChallenge]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── AI Greeting — always fresh on every app open ────────────
  // No cache: a new contextual greeting is fetched every time the home
  // screen mounts (cold/warm start). greetingFetchedRef prevents double-
  // fetching within the same session (e.g. navigation back to home).
  useEffect(() => {
    // Re-fetch if level changed (e.g. after placement test Novice → Advanced)
    if (greetingLevelRef.current && greetingLevelRef.current !== level) {
      greetingFetchedRef.current = false;
      setAiGreeting(null);
    }
    if (!userId || !name || greetingFetchedRef.current) return;
    greetingFetchedRef.current = true;
    greetingLevelRef.current = level;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/greeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: name.split(' ')[0] ?? name,
            streak:    data?.streakDays ?? 0,
            todayXP:   data?.todayXP   ?? 0,
            totalXP:   data?.totalXP   ?? 0,
            dailyGoal: DAILY_XP_GOAL,
            hour:      new Date().getHours(),
            level,
          }),
        });
        if (!res.ok) { setGreetingLoading(false); return; }
        const json = await res.json();
        if (json.message) setAiGreeting(json.message);
      } catch {
        // Silently fail — dots will disappear, no message shown (acceptable)
      } finally {
        setGreetingLoading(false);
      }
    })();
  }, [userId, name, level]); // eslint-disable-line

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

  const isPortuguese    = level === 'Novice';

  const hasGrammar      = config.tabs.includes('grammar');
  const hasPronun       = config.tabs.includes('pronunciation');
  const hasChat         = config.tabs.includes('chat');
  const hasLive         = level === 'Advanced' || level === 'Inter';

  const modeCards: ModeCard[] = [
    {
      mode: 'grammar' as const,
      title: isPortuguese ? 'Gram\u00e1tica' : 'Grammar',
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
      title: isPortuguese ? 'Pron\u00fancia' : 'Pronunciation',
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
      sub: hasLive && liveVoiceRemaining !== null
        ? liveVoiceRemaining <= 0
          ? (isPortuguese ? '0 min este mês' : '0 min this month')
          : (isPortuguese
              ? `${Math.ceil(liveVoiceRemaining / 60)} min restantes`
              : `${Math.ceil(liveVoiceRemaining / 60)} min left`)
        : '',
      accentColor: C.orange,
      accentBg: 'rgba(255,107,53,0.10)',
      icon: <Phone size={26} color={hasLive ? C.orange : C.navyLight} weight="bold" />,
      locked: !hasLive,
      lockLevel: 'Intermediate',
    },
  ];

  const tipStyle = TIP_STYLE[tip.type];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.card }} edges={['top', 'left', 'right']}>

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
          accessibilityLabel="Estatísticas / Stats"
          accessibilityRole="button"
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

        {/* Trial badge — shown only while on trial */}
        {trialDaysLeft !== null && (
          <TouchableOpacity
            onPress={openPaywall}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: 'rgba(61,136,0,0.10)',
              borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
              marginRight: 10,
              borderWidth: 1, borderColor: 'rgba(61,136,0,0.20)',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3D8800' }} />
            <AppText style={{ fontSize: 12, fontWeight: '700', color: '#3D8800' }}>
              {level === 'Novice'
                ? `${trialDaysLeft}d grátis`
                : `${trialDaysLeft}d trial`}
            </AppText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(app)/configuracoes')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Configurações / Settings"
          accessibilityRole="button"
        >
          <Gear size={22} color={C.navyMid} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: T.bg }}
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
                  paddingVertical: greetingLoading ? 10 : 12,
                }}>
                  {greetingLoading ? (
                    <TypingDots />
                  ) : (
                    <AppText style={{
                      fontSize: 15, color: '#FFFFFF',
                      lineHeight: 23, fontWeight: '500',
                    }}>
                      {aiGreeting ?? charlotteMessage(firstName, streak, todayXP, isPortuguese)}
                    </AppText>
                  )}
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
                      {isPortuguese ? 'XP de hoje' : "Today's XP"}
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
        <SectionHeader label={isPortuguese ? 'Missões do dia' : 'Daily Missions'} badge={`${doneMissions}/${missions.length}`} isPt={isPortuguese} />

        <View style={{ paddingHorizontal: 20 }}>
          {missions.map((m, index) => (
            <MissionNode
              key={m.id}
              mission={m}
              alignRight={index % 2 === 1}
              showConnector={index < missions.length - 1}
              isPt={isPortuguese}
            />
          ))}
        </View>

        {/* ══════════════════════════════════════════
            WEEKLY CHALLENGE — um desafio por semana
        ══════════════════════════════════════════ */}
        {weeklyState && (
          <>
          <SectionHeader label={isPortuguese ? 'Desafio da semana' : 'Weekly Challenge'} />
          <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <View style={{
              borderRadius: 18, overflow: 'hidden',
              backgroundColor: weeklyState.challenge.bgColor,
              borderWidth: 1,
              borderColor: weeklyState.challenge.color + '25',
              ...cardShadow,
            }}>
              <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText style={{ fontSize: 10, fontWeight: '800', color: weeklyState.challenge.color, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {isPortuguese ? 'Desafio da semana' : 'Weekly Challenge'}
                    </AppText>
                    {weeklyState.completed && (
                      <View style={{ backgroundColor: weeklyState.challenge.color + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <AppText style={{ fontSize: 9, fontWeight: '800', color: weeklyState.challenge.color }}>
                          {isPortuguese ? 'COMPLETO' : 'DONE'}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText style={{ fontSize: 11, fontWeight: '700', color: weeklyState.challenge.color }}>
                    +{weeklyState.challenge.xpReward} XP
                  </AppText>
                </View>
                <AppText style={{ fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 2 }}>
                  {isPortuguese ? weeklyState.challenge.title.pt : weeklyState.challenge.title.en}
                </AppText>
                <AppText style={{ fontSize: 12, color: C.navyMid, marginBottom: 10 }}>
                  {isPortuguese ? weeklyState.challenge.sub.pt : weeklyState.challenge.sub.en}
                </AppText>
                {/* Progress bar */}
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(22,21,58,0.06)' }}>
                  <View style={{
                    height: 8, borderRadius: 4,
                    backgroundColor: weeklyState.challenge.color,
                    width: `${Math.round((weeklyState.current / weeklyState.challenge.target) * 100)}%`,
                    maxWidth: '100%',
                  }} />
                </View>
                <AppText style={{ fontSize: 11, color: C.navyLight, marginTop: 4, textAlign: 'right' }}>
                  {weeklyState.current} / {weeklyState.challenge.target} {isPortuguese ? weeklyState.challenge.unit.pt : weeklyState.challenge.unit.en}
                </AppText>
              </View>
            </View>
          </View>
          </>
        )}

        {/* ══════════════════════════════════════════
            LEARN — structured lessons
        ══════════════════════════════════════════ */}
        <SectionHeader label={isPortuguese ? 'Aprender com Charlotte' : 'Learn with Charlotte'} />

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
                  {isPortuguese ? 'Trilha de Aprendizado' : 'Learning Trail'}
                </AppText>
                <AppText style={{ fontSize: 12, color: C.navyLight, marginTop: 2 }}>
                  {isPortuguese ? 'Aulas guiadas — Gramática & Pronúncia' : 'Guided lessons — Grammar & Pronunciation'}
                </AppText>
              </View>
              <CaretRight size={18} color={C.navyLight} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════
            REVIEWS — revisão espaçada
        ══════════════════════════════════════════ */}
        {pendingReviews.length > 0 && (
          <>
            <SectionHeader
              label={isPortuguese ? 'Revisão pendente' : 'Review due'}
              badge={`${pendingReviews.length}`}
              isPt={isPortuguese}
            />
            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  // Navegar para o primeiro tópico pendente
                  const r = pendingReviews[0];
                  router.push({
                    pathname: '/(app)/learn-session',
                    params: {
                      level: r.userLevel,
                      moduleIndex: r.moduleIndex.toString(),
                      topicIndex: r.topicIndex.toString(),
                      reviewId: r.id.toString(),
                    },
                  });
                }}
                activeOpacity={0.72}
                style={{
                  borderRadius: 18,
                  backgroundColor: '#FFFBEB',
                  borderWidth: 1,
                  borderColor: 'rgba(245,158,11,0.2)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  gap: 14,
                  ...cardShadow,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: 'rgba(245,158,11,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpenText size={22} color="#F59E0B" weight="bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 14, fontWeight: '700', color: C.navy }}>
                    {pendingReviews[0].topicTitle || (isPortuguese ? 'Revisão' : 'Review')}
                  </AppText>
                  <AppText style={{ fontSize: 11, color: C.navyLight, marginTop: 2 }}>
                    {isPortuguese
                      ? `${pendingReviews.length} tópico${pendingReviews.length > 1 ? 's' : ''} para revisar`
                      : `${pendingReviews.length} topic${pendingReviews.length > 1 ? 's' : ''} to review`}
                  </AppText>
                </View>
                <CaretRight size={16} color={C.navyLight} weight="bold" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════
            PRACTICE — destination cards
        ══════════════════════════════════════════ */}
        <SectionHeader label={isPortuguese ? 'Praticar com Charlotte' : 'Practise with Charlotte'} />

        <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {modeCards.map(card => (
            <PracticePortal
              key={card.mode}
              card={card}
              onPress={() => {
                if (card.locked) {
                  Alert.alert(
                    isPortuguese ? `Recurso ${card.lockLevel}` : `${card.lockLevel} Feature`,
                    isPortuguese
                      ? `${card.title} será desbloqueado ao atingir o nível ${card.lockLevel}. Continue praticando!`
                      : `${card.title} unlocks when you reach the ${card.lockLevel} level. Keep practising!`,
                    [{ text: isPortuguese ? 'Entendido' : 'Got it' }]
                  );
                } else if (card.mode === 'live') {
                  soundEngine.setMuted(true); // silenciar sons durante Live Voice
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
            {isPortuguese ? 'Dica do dia' : 'Tip of the day'}
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
            {isPortuguese && tip.meaningPt ? tip.meaningPt : tip.meaning}
          </AppText>
        </View>
        <CaretRight size={16} color={C.navyLight} weight="bold" />
      </TouchableOpacity>

      <LiveVoiceModal
        isOpen={showLiveVoice}
        onClose={() => {
          setShowLiveVoice(false);
          soundEngine.setMuted(false); // reativar sons
          setTimeout(() => loadLiveVoicePool(), 1500);
        }}
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
                {isPortuguese && tip.meaningPt ? tip.meaningPt : tip.meaning}
              </AppText>

              {/* Example */}
              <View style={{ backgroundColor: tipStyle.bg, borderRadius: 16, padding: 16 }}>
                <AppText style={{ fontSize: 10, fontWeight: '700', color: tipStyle.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  {isPortuguese ? 'Exemplo' : 'Example'}
                </AppText>
                <AppText style={{ fontSize: 15, color: C.navy, fontStyle: 'italic', lineHeight: 23 }}>
                  "{tip.example}"
                </AppText>
                {isPortuguese && tip.examplePt && (
                  <AppText style={{ fontSize: 14, color: C.navyMid, fontStyle: 'italic', lineHeight: 22, marginTop: 8 }}>
                    "{tip.examplePt}"
                  </AppText>
                )}
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

function SectionHeader({ label, badge, isPt }: { label: string; badge?: string; isPt?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 28, marginBottom: 16 }}>
      <AppText style={{ fontSize: 17, fontWeight: '800', color: C.navy, flex: 1 }}>
        {label}
      </AppText>
      {badge ? (
        <View style={{ backgroundColor: C.navyGhost, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
          <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navyMid }}>{badge} {isPt ? 'feito' : 'done'}</AppText>
        </View>
      ) : null}
    </View>
  );
}

// Mission node — circular, zigzag, with connector line between them

function MissionNode({ mission, alignRight, showConnector, isPt }: {
  mission: Mission;
  alignRight: boolean;
  showConnector: boolean;
  isPt?: boolean;
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
              <AppText style={{ fontSize: 12, color: C.navyLight }}>{isPt ? 'Concluída hoje' : 'Completed today'}</AppText>
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
      {!locked && card.sub ? (
        <AppText style={{ fontSize: 10, color: C.navyLight, marginTop: 3, textAlign: 'center' }}>
          {card.sub}
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
}
