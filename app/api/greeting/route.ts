// app/api/greeting/route.ts
// Generates a short, punchy home-screen greeting via GPT-4o-mini.
// Charlotte personality: direct, warm, real — never generic, never verbose.

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface GreetingRequest {
  firstName: string;
  streak: number;
  todayXP: number;
  totalXP: number;
  dailyGoal: number;
  hour: number;           // 0–23 local hour
  level: 'Novice' | 'Inter' | 'Advanced';
  isNewUser?: boolean;    // from profile.first_welcome_done — reliable flag
}

function buildPrompt(req: GreetingRequest): { system: string; user: string } {
  const { firstName, streak, todayXP, totalXP, dailyGoal, hour, level, isNewUser } = req;

  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const goalMet   = todayXP >= dailyGoal;
  const xpLeft    = Math.max(0, dailyGoal - todayXP);
  const newUser   = isNewUser ?? (totalXP === 0 && streak === 0);

  // ── System prompt ────────────────────────────────────────────────────────
  const system = level === 'Novice'
    ? `Voce e Charlotte, professora de ingles com personalidade: direta, animada, real. Escreva UMA frase de recepcao em portugues brasileiro — curta, com personalidade, encorajadora. Estilo: como uma amiga que te conhece e quer que voce arrase. Nunca use emoji. Nunca seja generica. Nunca diga "sessao" nem "app". Seja natural e especifica ao contexto.`
    : `You are Charlotte — sharp, warm, direct. Write ONE punchy welcome message in English. Style: like a cool coach who actually knows the student. No emoji. No generic phrases. Never say "session" or "app". Use the context to make it feel personal and real.`;

  // ── User prompt (context) ─────────────────────────────────────────────────
  const ctx: string[] = [`Name: ${firstName}`, `Time: ${timeOfDay}`];

  if (newUser) {
    ctx.push('This is their very first time here. Welcome them like it is the start of something great. Do not mention streaks or XP.');
  } else if (goalMet) {
    ctx.push(`Streak: ${streak} day${streak !== 1 ? 's' : ''}. Daily goal already crushed (${todayXP} XP). Acknowledge the win.`);
  } else if (todayXP > 0) {
    ctx.push(`Streak: ${streak} day${streak !== 1 ? 's' : ''}. ${todayXP} XP earned today, ${xpLeft} XP left to hit the goal. Push them gently.`);
  } else if (streak > 1) {
    ctx.push(`Streak: ${streak} days. No XP yet today. Motivate them to keep the streak alive.`);
  } else {
    ctx.push(`No XP yet today. Short motivational nudge.`);
  }

  const user = `${ctx.join(' | ')}\n\nWrite the greeting now. ONE sentence only. MAX 12 WORDS. Short, punchy, no fluff.`;

  return { system, user };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const body: GreetingRequest = await request.json();
    const { firstName, level } = body;

    if (!firstName || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { system, user } = buildPrompt(body);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 30,
      temperature: 0.85,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    // Se o modelo ignorou o limite, descarta — melhor sem mensagem que frase cortada
    const words = raw.split(/\s+/);
    const message = words.length <= 15 ? raw : '';
    return NextResponse.json({ message });
  } catch (err) {
    console.error('Greeting API error:', err);
    return NextResponse.json({ error: 'Failed to generate greeting' }, { status: 500 });
  }
}
