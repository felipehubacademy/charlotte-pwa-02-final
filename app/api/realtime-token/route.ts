// app/api/realtime-token/route.ts
// Cria uma ephemeral session token para o OpenAI Realtime API via WebRTC.
// O client_secret retornado é de curta duração (~1 min) e usado apenas para
// a troca de SDP — a API key nunca sai do servidor.

import { NextRequest, NextResponse } from 'next/server';

const MODEL = 'gpt-4o-realtime-preview-2024-12-17';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { userLevel, userName } = body;

    console.log('🔑 Creating Realtime ephemeral session for', userName, '/', userLevel);

    // Cria uma sessão efêmera via REST — retorna client_secret.value (token curto)
    const sessionRes = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        voice: 'coral',
      }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      console.error('❌ Failed to create realtime session:', err);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const session = await sessionRes.json();
    const clientSecret = session.client_secret?.value;

    if (!clientSecret) {
      console.error('❌ No client_secret in session response:', session);
      return NextResponse.json({ error: 'No client_secret returned' }, { status: 500 });
    }

    console.log('✅ Ephemeral session created, expires_at:', session.client_secret?.expires_at);

    return NextResponse.json({
      clientSecret,
      userLevel,
      userName,
    });

  } catch (error: any) {
    console.error('❌ Realtime token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'realtime-token',
    description: 'Creates an ephemeral OpenAI Realtime session token for WebRTC',
    methods: ['POST'],
  });
}
