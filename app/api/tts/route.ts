// app/api/tts/route.ts — OpenAI Text-to-Speech for Charlotte's audio responses

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 });
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',        // warm, natural female voice
      input: text,
      response_format: 'mp3',
      speed: 0.95,
    });

    // Return as base64 so React Native can play without a separate download step
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString('base64');

    return NextResponse.json({ audio: base64, mimeType: 'audio/mp3' });

  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech', details: error?.message },
      { status: 500 }
    );
  }
}
