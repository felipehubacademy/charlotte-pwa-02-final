// app/api/debug-azure-env/route.ts - Debug Azure Environment Route

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug Azure Environment - Starting...');
    
    // Verificar variáveis de ambiente Azure
    const azureConfig = {
      hasAzureKey: !!process.env.AZURE_SPEECH_KEY,
      hasAzureRegion: !!process.env.AZURE_SPEECH_REGION,
      azureRegion: process.env.AZURE_SPEECH_REGION || 'not configured',
      keyLength: process.env.AZURE_SPEECH_KEY?.length || 0,
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION || 'not available'
    };
    
    return NextResponse.json({
      success: true,
      message: 'Azure environment debug completed',
      timestamp: new Date().toISOString(),
      configuration: azureConfig
    });

  } catch (error: any) {
    console.error('❌ Azure environment debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure environment debug failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'debug-azure-env',
    description: 'Debug Azure Speech Service environment variables',
    methods: ['GET'],
    purpose: 'Verify Azure configuration and environment setup'
  });
} 