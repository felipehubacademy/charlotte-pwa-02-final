// lib/weeklyChallenge.ts
// Desafios semanais rotativos — um desafio ativo por semana.
// Progresso rastreado client-side via dados da home (sem tabela extra).

import { supabase } from './supabase';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type UserLevel = 'Novice' | 'Inter' | 'Advanced';

export interface WeeklyChallenge {
  id: string;
  title: { pt: string; en: string };
  sub:   { pt: string; en: string };
  target: number;
  unit: { pt: string; en: string };
  xpReward: number;
  color: string;
  bgColor: string;
  /** Levels that can receive this challenge. Omit = all levels. */
  allowedLevels?: UserLevel[];
}

export interface WeeklyChallengeState {
  challenge: WeeklyChallenge;
  current: number;
  completed: boolean;
  weekStart: string; // ISO date da segunda-feira
}

// ── Pool de desafios ────────────────────────────────────────────────────────

const CHALLENGE_POOL: WeeklyChallenge[] = [
  {
    id: 'messages_50',
    title: { pt: 'Maratonista', en: 'Marathon Runner' },
    sub:   { pt: 'Envie 50 mensagens esta semana', en: 'Send 50 messages this week' },
    target: 50, unit: { pt: 'mensagens', en: 'messages' },
    xpReward: 100, color: '#3D8800', bgColor: '#F0FFD9',
    // Novice only sends text — lower target so the challenge is achievable
  },
  {
    id: 'xp_500',
    title: { pt: 'Cac\u0327ador de XP', en: 'XP Hunter' },
    sub:   { pt: 'Ganhe 500 XP esta semana', en: 'Earn 500 XP this week' },
    target: 500, unit: { pt: 'XP', en: 'XP' },
    xpReward: 120, color: '#7C3AED', bgColor: '#FAF5FF',
  },
  {
    id: 'streak_5',
    title: { pt: 'Consist\u00eancia', en: 'Consistency' },
    sub:   { pt: 'Mantenha 5 dias de streak', en: 'Keep a 5-day streak' },
    target: 5, unit: { pt: 'dias', en: 'days' },
    xpReward: 80, color: '#FF6B35', bgColor: '#FFF3ED',
  },
  {
    id: 'lessons_5',
    title: { pt: 'Estudioso', en: 'Bookworm' },
    sub:   { pt: 'Complete 5 li\u00e7\u00f5es esta semana', en: 'Complete 5 lessons this week' },
    target: 5, unit: { pt: 'li\u00e7\u00f5es', en: 'lessons' },
    xpReward: 100, color: '#1D4ED8', bgColor: '#EFF6FF',
  },
  {
    id: 'audio_10',
    title: { pt: 'Falante', en: 'Speaker' },
    sub:   { pt: 'Envie 10 mensagens de \u00e1udio', en: 'Send 10 audio messages' },
    target: 10, unit: { pt: '\u00e1udios', en: 'audios' },
    xpReward: 90, color: '#F472B6', bgColor: '#FDF2F8',
    // Audio messages are only available from Inter onwards
    allowedLevels: ['Inter', 'Advanced'],
  },
  {
    id: 'grammar_20',
    title: { pt: 'Gram\u00e1tica', en: 'Grammar Star' },
    sub:   { pt: 'Envie 20 frases no modo Gram\u00e1tica', en: 'Send 20 sentences in Grammar mode' },
    target: 20, unit: { pt: 'frases', en: 'sentences' },
    xpReward: 90, color: '#D97706', bgColor: '#FFFBEB',
    // Replaces audio_10 for Novice (Grammar is unlocked for all)
    allowedLevels: ['Novice'],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna a segunda-feira da semana atual (ISO date string YYYY-MM-DD). */
function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=dom, 1=seg, ..., 6=sab
  const diff = day === 0 ? 6 : day - 1; // ajustar para seg=0
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Seleciona o desafio da semana baseado num seed determinístico. */
function getWeekSeed(): number {
  const ws = getWeekStart();
  let hash = 0;
  for (let i = 0; i < ws.length; i++) {
    hash = ws.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// ── Função pública ──────────────────────────────────────────────────────────

/**
 * Retorna o desafio da semana e o progresso atual.
 * Filtra o pool pelo nível do usuário antes de selecionar.
 * Usa dados da home screen (sem query extra).
 */
export function getWeeklyChallenge(
  weeklyMessages: number,
  weeklyXP: number,
  streakDays: number,
  weeklyLessons: number,
  weeklyAudios: number,
  weeklyGrammarMessages: number = 0,
  userLevel: UserLevel = 'Inter',
): WeeklyChallengeState {
  const seed = getWeekSeed();
  // Filter pool to only challenges available for this level
  const availablePool = CHALLENGE_POOL.filter(
    c => !c.allowedLevels || c.allowedLevels.includes(userLevel)
  );
  const challenge = availablePool[seed % availablePool.length];
  const weekStart = getWeekStart();

  let current = 0;
  switch (challenge.id) {
    case 'messages_50':  current = weeklyMessages; break;
    case 'xp_500':       current = weeklyXP; break;
    case 'streak_5':     current = streakDays; break;
    case 'lessons_5':    current = weeklyLessons; break;
    case 'audio_10':     current = weeklyAudios; break;
    case 'grammar_20':   current = weeklyGrammarMessages; break;
  }

  return {
    challenge,
    current: Math.min(current, challenge.target),
    completed: current >= challenge.target,
    weekStart,
  };
}

/**
 * Busca dados da semana para o weekly challenge.
 * Retorna contadores de mensagens, XP, lições e áudios da semana.
 */
export async function fetchWeeklyData(userId: string): Promise<{
  weeklyMessages: number;
  weeklyXP: number;
  weeklyLessons: number;
  weeklyAudios: number;
  weeklyGrammarMessages: number;
}> {
  const weekStart = getWeekStart();

  const { data, error } = await supabase
    .from('charlotte_practices')
    .select('practice_type, xp_earned')
    .eq('user_id', userId)
    .gte('created_at', `${weekStart}T00:00:00.000Z`);

  if (error || !data) return { weeklyMessages: 0, weeklyXP: 0, weeklyLessons: 0, weeklyAudios: 0, weeklyGrammarMessages: 0 };

  const weeklyMessages        = data.filter(p => ['text_message', 'audio_message'].includes(p.practice_type)).length;
  const weeklyXP              = data.reduce((s, p) => s + (p.xp_earned ?? 0), 0);
  const weeklyLessons         = data.filter(p => p.practice_type === 'learn_exercise').length;
  const weeklyAudios          = data.filter(p => p.practice_type === 'audio_message').length;
  const weeklyGrammarMessages = data.filter(p => p.practice_type === 'grammar_message').length;

  return { weeklyMessages, weeklyXP, weeklyLessons, weeklyAudios, weeklyGrammarMessages };
}
