// lib/weeklyChallenge.ts
// Desafios semanais rotativos — um desafio ativo por semana.
// Progresso rastreado client-side via dados da home (sem tabela extra).

import { supabase } from './supabase';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface WeeklyChallenge {
  id: string;
  title: { pt: string; en: string };
  sub:   { pt: string; en: string };
  target: number;
  unit: { pt: string; en: string };
  xpReward: number;
  color: string;
  bgColor: string;
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
  },
  {
    id: 'xp_500',
    title: { pt: 'Caçador de XP', en: 'XP Hunter' },
    sub:   { pt: 'Ganhe 500 XP esta semana', en: 'Earn 500 XP this week' },
    target: 500, unit: { pt: 'XP', en: 'XP' },
    xpReward: 120, color: '#7C3AED', bgColor: '#FAF5FF',
  },
  {
    id: 'streak_5',
    title: { pt: 'Consistência', en: 'Consistency' },
    sub:   { pt: 'Mantenha 5 dias de streak', en: 'Keep a 5-day streak' },
    target: 5, unit: { pt: 'dias', en: 'days' },
    xpReward: 80, color: '#FF6B35', bgColor: '#FFF3ED',
  },
  {
    id: 'lessons_5',
    title: { pt: 'Estudioso', en: 'Bookworm' },
    sub:   { pt: 'Complete 5 lições esta semana', en: 'Complete 5 lessons this week' },
    target: 5, unit: { pt: 'lições', en: 'lessons' },
    xpReward: 100, color: '#1D4ED8', bgColor: '#EFF6FF',
  },
  {
    id: 'audio_10',
    title: { pt: 'Falante', en: 'Speaker' },
    sub:   { pt: 'Envie 10 mensagens de áudio', en: 'Send 10 audio messages' },
    target: 10, unit: { pt: 'áudios', en: 'audios' },
    xpReward: 90, color: '#F472B6', bgColor: '#FDF2F8',
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
 * Usa dados da home screen (sem query extra).
 */
export function getWeeklyChallenge(
  weeklyMessages: number,
  weeklyXP: number,
  streakDays: number,
  weeklyLessons: number,
  weeklyAudios: number,
): WeeklyChallengeState {
  const seed = getWeekSeed();
  const challenge = CHALLENGE_POOL[seed % CHALLENGE_POOL.length];
  const weekStart = getWeekStart();

  let current = 0;
  switch (challenge.id) {
    case 'messages_50': current = weeklyMessages; break;
    case 'xp_500':      current = weeklyXP; break;
    case 'streak_5':    current = streakDays; break;
    case 'lessons_5':   current = weeklyLessons; break;
    case 'audio_10':    current = weeklyAudios; break;
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
}> {
  const weekStart = getWeekStart();

  const { data, error } = await supabase
    .from('charlotte_practices')
    .select('practice_type, xp_earned')
    .eq('user_id', userId)
    .gte('created_at', `${weekStart}T00:00:00.000Z`);

  if (error || !data) return { weeklyMessages: 0, weeklyXP: 0, weeklyLessons: 0, weeklyAudios: 0 };

  const weeklyMessages = data.filter(p => ['text_message', 'audio_message'].includes(p.practice_type)).length;
  const weeklyXP       = data.reduce((s, p) => s + (p.xp_earned ?? 0), 0);
  const weeklyLessons  = data.filter(p => p.practice_type === 'learn_exercise').length;
  const weeklyAudios   = data.filter(p => p.practice_type === 'audio_message').length;

  return { weeklyMessages, weeklyXP, weeklyLessons, weeklyAudios };
}
