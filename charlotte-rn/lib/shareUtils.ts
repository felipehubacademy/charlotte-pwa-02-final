// lib/shareUtils.ts
// Utilitários para compartilhar streak e conquistas via Share Sheet nativo.
// Gera texto + link (sem imagem por agora — simplificar para MVP).

import { Share, Platform } from 'react-native';
import { track } from './analytics';

const APP_URL = 'https://charlotte.hubacademybr.com';

/** Compartilha streak atual. */
export async function shareStreak(streakDays: number, isPt: boolean): Promise<void> {
  const message = isPt
    ? `🔥 ${streakDays} dias seguidos praticando inglês com Charlotte AI! Quanto tempo você consegue manter? ${APP_URL}`
    : `🔥 ${streakDays}-day streak learning English with Charlotte AI! How long can you keep it going? ${APP_URL}`;

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message }
        : { message, title: 'Charlotte AI' },
    );
    track('share_streak', { streakDays });
  } catch { /* cancelado */ }
}

/** Compartilha conquista desbloqueada. */
export async function shareAchievement(
  title: string,
  rarity: string,
  isPt: boolean,
): Promise<void> {
  const emoji = rarity === 'legendary' ? '🏆' : rarity === 'epic' ? '🔥' : rarity === 'rare' ? '🎖️' : '⚡';
  const message = isPt
    ? `${emoji} Desbloqueei "${title}" no Charlotte AI! Aprenda inglês com IA. ${APP_URL}`
    : `${emoji} Unlocked "${title}" on Charlotte AI! Learn English with AI. ${APP_URL}`;

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message }
        : { message, title: 'Charlotte AI' },
    );
    track('share_achievement', { title, rarity });
  } catch { /* cancelado */ }
}

/** Compartilha XP total. */
export async function shareXP(totalXP: number, isPt: boolean): Promise<void> {
  const message = isPt
    ? `⚡ Já acumulei ${totalXP.toLocaleString()} XP aprendendo inglês com Charlotte AI! ${APP_URL}`
    : `⚡ Already earned ${totalXP.toLocaleString()} XP learning English with Charlotte AI! ${APP_URL}`;

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message }
        : { message, title: 'Charlotte AI' },
    );
  } catch { /* cancelado */ }
}
