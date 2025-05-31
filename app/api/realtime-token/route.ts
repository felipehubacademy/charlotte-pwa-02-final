// app/api/realtime-token/route.ts - Rota para tokens do OpenAI Realtime API

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Realtime token request received...');
    
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    // Processar request body
    const body = await request.json();
    const { userLevel, userName, debug } = body;

    console.log('📋 Token request details:', {
      userLevel,
      userName,
      debug,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length
    });

    // Para o Realtime API, retornamos a própria API key
    // Em produção, você poderia implementar tokens temporários aqui
    const apiKey = process.env.OPENAI_API_KEY;

    console.log('✅ Returning API key for Realtime API access');

    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      userLevel,
      userName,
      timestamp: new Date().toISOString(),
      debug: debug ? {
        environment: process.env.NODE_ENV,
        vercelRegion: process.env.VERCEL_REGION,
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length
      } : undefined
    });

  } catch (error: any) {
    console.error('❌ Realtime token error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate realtime token',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'realtime-token',
    description: 'Generates tokens for OpenAI Realtime API access',
    methods: ['POST'],
    requiredBody: {
      userLevel: 'string (Novice|Intermediate|Advanced)',
      userName: 'string',
      debug: 'boolean (optional)'
    },
    purpose: 'Provides secure API key access for OpenAI Realtime API'
  });
} 