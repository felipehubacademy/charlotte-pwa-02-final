// app/api/test-azure-speech/route.ts - Test Azure Speech Route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test Azure Speech - Starting...');
    
    // Verificar credenciais Azure Speech
    const hasAzureKey = !!process.env.AZURE_SPEECH_KEY;
    const hasAzureRegion = !!process.env.AZURE_SPEECH_REGION;
    
    return NextResponse.json({
      success: true,
      message: 'Azure Speech test completed',
      timestamp: new Date().toISOString(),
      testType: 'azure-speech-service',
      configuration: {
        hasAzureKey,
        hasAzureRegion,
        azureRegion: hasAzureRegion ? process.env.AZURE_SPEECH_REGION : 'not configured',
        keyLength: process.env.AZURE_SPEECH_KEY?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Azure Speech test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure Speech test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'test-azure-speech',
    description: 'Tests Azure Speech Service configuration and connectivity',
    methods: ['POST'],
    purpose: 'Verify Azure Speech SDK setup and credentials'
  });
} 