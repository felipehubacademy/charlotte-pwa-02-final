// lib/liveVoiceUsage.ts
// Pool mensal de Live Voice: 30 min (1800 s) por usuário.
// Reset automático no 1º dia de cada mês.

import { supabase } from './supabase';

// ── Constantes ──────────────────────────────────────────────────────────────

export const LIVE_VOICE_POOL_SECONDS = 30 * 60; // 1 800 s

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna a data do 1º dia do mês corrente em formato 'YYYY-MM-01'. */
function thisMonthFirstDay(): string {
  const d    = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}-01`;
}

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface LiveVoiceStatus {
  secondsUsed:      number;
  secondsRemaining: number;
  resetDate:        string; // 'YYYY-MM-01'
}

// ── Funções públicas ─────────────────────────────────────────────────────────

/**
 * Obtém o status atual do pool.
 * Se o mês mudou desde o último uso, zera o contador automaticamente.
 */
export async function getLiveVoiceStatus(): Promise<LiveVoiceStatus> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (!user || authErr) throw new Error('Not authenticated');

  const thisMonth = thisMonthFirstDay();

  const { data, error } = await supabase
    .from('charlotte_users')
    .select('live_voice_seconds_used, live_voice_reset_date')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  // Virou o mês → reset
  const needsReset =
    !data.live_voice_reset_date ||
    data.live_voice_reset_date < thisMonth;

  if (needsReset) {
    const { error: updErr } = await supabase
      .from('charlotte_users')
      .update({
        live_voice_seconds_used: 0,
        live_voice_reset_date:   thisMonth,
      })
      .eq('id', user.id);

    if (updErr) console.warn('[liveVoiceUsage] reset error:', updErr.message);

    return {
      secondsUsed:      0,
      secondsRemaining: LIVE_VOICE_POOL_SECONDS,
      resetDate:        thisMonth,
    };
  }

  const secondsUsed = data.live_voice_seconds_used ?? 0;
  return {
    secondsUsed,
    secondsRemaining: Math.max(0, LIVE_VOICE_POOL_SECONDS - secondsUsed),
    resetDate:        data.live_voice_reset_date,
  };
}

/**
 * Registra segundos consumidos na sessão atual.
 * Usa leitura+escrita (o SDK JS não suporta increment atômico nativo;
 * para uso de um único dispositivo por vez, isso é suficientemente seguro).
 */
export async function consumeLiveVoiceSeconds(seconds: number): Promise<void> {
  if (seconds <= 0) return;
  const rounded = Math.round(seconds);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error: fetchErr } = await supabase
    .from('charlotte_users')
    .select('live_voice_seconds_used')
    .eq('id', user.id)
    .single();

  if (fetchErr || !data) {
    console.warn('[liveVoiceUsage] fetch error:', fetchErr?.message);
    return;
  }

  const current = data.live_voice_seconds_used ?? 0;
  const { error: updErr } = await supabase
    .from('charlotte_users')
    .update({ live_voice_seconds_used: current + rounded })
    .eq('id', user.id);

  if (updErr) console.warn('[liveVoiceUsage] consume error:', updErr.message);
}

/** Formata segundos em 'MM min' para exibição no badge da home. */
export function formatPoolMinutes(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}
