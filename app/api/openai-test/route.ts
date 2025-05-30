// app/api/openai-test/route.ts - Teste de conectividade OpenAI

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing OpenAI connectivity...');
    
    // Verificar variável de ambiente
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('📋 Environment check:', {
      hasKey: !!apiKey,
      keyValue: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
      environment: process.env.NODE_ENV
    });
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key missing',
        details: {
          hasKey: !!apiKey,
          environment: process.env.NODE_ENV
        }
      }, { status: 500 });
    }
    
    // Testar conectividade com OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    console.log('🌐 Testing OpenAI models list...');
    
    const models = await openai.models.list();
    
    console.log('📡 OpenAI response:', {
      modelsCount: models.data.length,
      hasWhisper: models.data.some(m => m.id.includes('whisper'))
    });
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI connectivity OK',
      details: {
        modelsCount: models.data.length,
        hasWhisper: models.data.some(m => m.id.includes('whisper')),
        whisperModels: models.data.filter(m => m.id.includes('whisper')).map(m => m.id)
      }
    });
    
  } catch (error: any) {
    console.error('❌ OpenAI test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'OpenAI test failed',
      details: {
        message: error.message,
        code: error.code,
        type: error.type,
        environment: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
} 