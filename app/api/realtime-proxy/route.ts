// app/api/realtime-proxy/route.ts - Proxy WebSocket para OpenAI Realtime API

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Verificar se a API key está configurada
  if (!process.env.OPENAI_API_KEY) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const userLevel = searchParams.get('userLevel');
  const userName = searchParams.get('userName');

  // Validar parâmetros
  if (!userLevel || !['Novice', 'Intermediate', 'Advanced'].includes(userLevel)) {
    return new Response('Invalid user level', { status: 400 });
  }

  // Verificar se é uma requisição de upgrade para WebSocket
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // Em um ambiente real, você implementaria um proxy WebSocket aqui
    // Por enquanto, vamos retornar instruções para usar a API diretamente
    return new Response(JSON.stringify({
      error: 'WebSocket proxy not implemented',
      suggestion: 'Use fallback mode for now',
      apiKey: process.env.OPENAI_API_KEY // Temporário para desenvolvimento
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Realtime proxy error:', error);
    return new Response(JSON.stringify({
      error: 'Proxy failed',
      details: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 