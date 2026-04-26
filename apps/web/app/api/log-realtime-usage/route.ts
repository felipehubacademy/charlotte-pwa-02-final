/**
 * POST /api/log-realtime-usage
 *
 * Called by the client (LiveVoiceModal) after a Realtime API session ends.
 * Logs audio duration to openai_usage so costs appear in /admin/metrics#costs.
 *
 * Body: { userId: string, durationSeconds: number, model?: string }
 *
 * The cost split assumes ~50/50 user vs Charlotte speaking time, which is a
 * reasonable heuristic for conversational sessions. Actual token billing from
 * OpenAI can be checked in the OpenAI dashboard for exact figures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logOpenAIUsage } from '@/lib/openai-usage';

const DEFAULT_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Missing durationSeconds' }, { status: 400 });
    }

    const { userId, durationSeconds, model } = body as {
      userId?: string;
      durationSeconds: number;
      model?: string;
    };

    if (durationSeconds <= 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const totalMinutes  = durationSeconds / 60;
    // Heuristic: user speaks ~40% of the time, Charlotte ~60%
    const audioInputMin  = totalMinutes * 0.40;
    const audioOutputMin = totalMinutes * 0.60;

    logOpenAIUsage({
      userId:        userId ?? null,
      endpoint:      '/api/realtime-token',
      model:         model ?? DEFAULT_MODEL,
      audioInputMin,
      audioOutputMin,
      meta: { durationSeconds, source: 'live-voice-modal' },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[log-realtime-usage]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
