// app/api/greeting/route.ts
// Generates a short, personalised home-screen greeting via GPT-4o-mini.
// Called once per day per user; client caches the result in SecureStore.

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
  dailyGoal: number;
  hour: number;        // 0–23 local hour (sent by client)
  level: 'Novice' | 'Inter' | 'Advanced';
}

function systemPrompt(level: string): string {
  if (level === 'Novice') {
    return `You are Charlotte, a warm and encouraging English teacher. You are greeting a Brazilian student (beginner level) at the start of their practice session. Write a short, natural greeting in Brazilian Portuguese (1–2 sentences max). Be personal, warm, motivating. Use the provided context (name, streak, XP today, time of day) to make it feel real and specific. Never use emoji. Never be generic. Sound like a real teacher who knows the student.`;
  }
  return `You are Charlotte, a friendly and sharp English coach. You are greeting an English learner at the start of their practice session. Write a short, natural greeting in English (1–2 sentences max). Be personal, encouraging, and direct. Use the provided context (name, streak, XP today, time of day) to make it specific. Never use emoji. Sound like a real coach who knows the student.`;
}

function userPrompt(req: GreetingRequest): string {
  const { firstName, streak, todayXP, dailyGoal, hour, level } = req;
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const xpLeft = Math.max(0, dailyGoal - todayXP);
  const goalMet = todayXP >= dailyGoal;

  const ctx: string[] = [
    `Student name: ${firstName}`,
    `Time of day: ${timeOfDay}`,
    `Current streak: ${streak} day${streak !== 1 ? 's' : ''}`,
    goalMet
      ? `XP today: ${todayXP} — daily goal already met!`
      : todayXP > 0
        ? `XP earned today: ${todayXP} (${xpLeft} XP left to hit the daily goal)`
        : `No XP earned yet today`,
  ];

  if (level === 'Novice') {
    return `Context:\n${ctx.join('\n')}\n\nWrite the greeting in Brazilian Portuguese. Keep it to 1–2 sentences. Be specific about something from the context.`;
  }
  return `Context:\n${ctx.join('\n')}\n\nWrite the greeting in English. Keep it to 1–2 sentences. Be specific about something from the context.`;
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      temperature: 0.9,
      messages: [
        { role: 'system', content: systemPrompt(level) },
        { role: 'user',   content: userPrompt(body) },
      ],
    });

    const message = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ message });
  } catch (err) {
    console.error('Greeting API error:', err);
    return NextResponse.json({ error: 'Failed to generate greeting' }, { status: 500 });
  }
}
