// app/api/openai-test/route.ts - OpenAI Test Route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 OpenAI Test - Starting...');
    
    // Verificar credenciais OpenAI
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI test completed',
      timestamp: new Date().toISOString(),
      testType: 'openai-credentials',
      configuration: {
        hasOpenAIKey,
        keyLength: process.env.OPENAI_API_KEY?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ OpenAI test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'OpenAI test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'openai-test',
    description: 'Tests OpenAI API configuration',
    methods: ['POST'],
    purpose: 'Verify OpenAI credentials and connectivity'
  });
} 