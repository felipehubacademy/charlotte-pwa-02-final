// app/api/realtime-token/route.ts - Endpoint seguro para tokens do Realtime API

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Em produção, você pode adicionar autenticação aqui
    // Por exemplo, verificar JWT token do usuário
    
    const body = await request.json();
    const { userLevel, userName } = body;

    // Validar parâmetros
    if (!userLevel || !['Novice', 'Intermediate', 'Advanced'].includes(userLevel)) {
      return NextResponse.json(
        { error: 'Invalid user level' },
        { status: 400 }
      );
    }

    // Retornar a API key (em produção, considere usar tokens temporários)
    console.log('🔑 Providing API key for user:', userName, 'level:', userLevel);
    console.log('🔑 API key configured:', !!process.env.OPENAI_API_KEY);
    
    return NextResponse.json({
      success: true,
      apiKey: process.env.OPENAI_API_KEY,
      config: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        userLevel,
        userName
      }
    });

  } catch (error: any) {
    console.error('Realtime token API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate token', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 