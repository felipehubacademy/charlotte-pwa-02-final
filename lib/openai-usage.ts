/**
 * lib/openai-usage.ts
 *
 * Logger fire-and-forget para custo de chamadas OpenAI.
 * Grava tokens + custo estimado em charlotte.openai_usage.
 *
 * Pricing table: valores em USD por 1M tokens (chat/embedding) ou por 1h (audio).
 * Referencia: https://openai.com/pricing (abril 2026).
 * Atualize aqui quando a OpenAI mexer nos precos — eh retroativo nos aggregates
 * porque o dashboard pode reprocessar ou a gente deixa o cost_usd como snapshot.
 *
 * IMPORTANTE: todas as chamadas sao fire-and-forget (.catch(noop)). Nunca
 * quebramos o endpoint real por causa de erro no logger.
 */

import { getSupabaseAdmin } from './supabase-admin';

// ── Pricing (USD) — valores por 1M tokens, exceto onde indicado ─────────────
// Fonte: openai.com/pricing, em vigor em 2026-04. Revise trimestralmente.
export const PRICING = {
  // Chat / text
  'gpt-4o-mini': {
    input:  0.15,   // USD / 1M input tokens
    output: 0.60,   // USD / 1M output tokens
  },
  'gpt-4o': {
    input:  2.50,
    output: 10.00,
  },
  'gpt-4.1-nano': {
    input:  0.10,
    output: 0.40,
  },
  'gpt-4.1-mini': {
    input:  0.40,
    output: 1.60,
  },

  // Audio — whisper-1 bill per second of audio transcribed
  'whisper-1': {
    perMinute: 0.006,  // USD / minute
  },

  // Realtime voice (gpt-realtime / gpt-4o-realtime-preview)
  // Precos atuais: input audio $40/1M tokens (~$0.06/min), output audio $80/1M tokens (~$0.24/min)
  // Aqui a gente ja recebe os minutos do billing do RealTime API.
  'gpt-realtime': {
    audioInputPerMin:  0.06,   // USD / min de audio entrada
    audioOutputPerMin: 0.24,   // USD / min de audio saida
    textInput:  5.00,          // USD / 1M text input tokens (system prompts)
    textOutput: 20.00,         // USD / 1M text output tokens
  },
  'gpt-4o-realtime-preview': {
    audioInputPerMin:  0.06,
    audioOutputPerMin: 0.24,
    textInput:  5.00,
    textOutput: 20.00,
  },
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIUsageRecord {
  userId?: string | null;
  endpoint: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  audioSeconds?: number;       // whisper
  audioInputMin?: number;      // realtime
  audioOutputMin?: number;     // realtime
  meta?: Record<string, unknown>;
}

// ── Cost calculation ─────────────────────────────────────────────────────────

export function computeCostUSD(r: OpenAIUsageRecord): number {
  const p = (PRICING as Record<string, any>)[r.model];
  if (!p) return 0;

  // Realtime: audio + text
  if (p.audioInputPerMin != null) {
    const audioIn  = (r.audioInputMin  ?? 0) * p.audioInputPerMin;
    const audioOut = (r.audioOutputMin ?? 0) * p.audioOutputPerMin;
    const textIn   = ((r.promptTokens     ?? 0) / 1_000_000) * p.textInput;
    const textOut  = ((r.completionTokens ?? 0) / 1_000_000) * p.textOutput;
    return round6(audioIn + audioOut + textIn + textOut);
  }

  // Whisper: per minute of audio
  if (p.perMinute != null) {
    const minutes = (r.audioSeconds ?? 0) / 60;
    return round6(minutes * p.perMinute);
  }

  // Chat / text: per token
  if (p.input != null) {
    const inCost  = ((r.promptTokens     ?? 0) / 1_000_000) * p.input;
    const outCost = ((r.completionTokens ?? 0) / 1_000_000) * p.output;
    return round6(inCost + outCost);
  }

  return 0;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ── Logger (fire-and-forget) ─────────────────────────────────────────────────

/**
 * Grava uma chamada OpenAI em charlotte.openai_usage.
 * NAO faz await — retorna imediatamente. Erros sao silenciados (console apenas).
 *
 * Uso tipico:
 *   const completion = await openai.chat.completions.create({ ... });
 *   logOpenAIUsage({
 *     userId: user.id,
 *     endpoint: '/api/assistant',
 *     model: 'gpt-4o-mini',
 *     promptTokens:     completion.usage?.prompt_tokens,
 *     completionTokens: completion.usage?.completion_tokens,
 *     totalTokens:      completion.usage?.total_tokens,
 *   });
 */
export function logOpenAIUsage(rec: OpenAIUsageRecord): void {
  // Fire-and-forget
  (async () => {
    try {
      const supabase = getSupabaseAdmin();
      const cost = computeCostUSD(rec);
      await supabase.from('openai_usage').insert({
        user_id:            rec.userId ?? null,
        endpoint:           rec.endpoint,
        model:              rec.model,
        prompt_tokens:      rec.promptTokens     ?? 0,
        completion_tokens: rec.completionTokens ?? 0,
        total_tokens:       rec.totalTokens      ?? (rec.promptTokens ?? 0) + (rec.completionTokens ?? 0),
        audio_seconds:      rec.audioSeconds     ?? null,
        audio_input_min:    rec.audioInputMin    ?? null,
        audio_output_min:   rec.audioOutputMin   ?? null,
        cost_usd:           cost,
        meta:               rec.meta ?? null,
      });
    } catch (err) {
      // Nunca quebrar o endpoint por causa do logger
      console.warn('[openai-usage] log failed:', (err as Error).message);
    }
  })();
}
