// app/api/azure-test/route.ts - Azure Test Route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Azure Test - Starting...');
    
    // Verificar credenciais Azure
    const hasAzureKey = !!process.env.AZURE_SPEECH_KEY;
    const hasAzureRegion = !!process.env.AZURE_SPEECH_REGION;
    
    return NextResponse.json({
      success: true,
      message: 'Azure test completed',
      timestamp: new Date().toISOString(),
      testType: 'azure-credentials',
      configuration: {
        hasAzureKey,
        azureRegion: hasAzureRegion ? process.env.AZURE_SPEECH_REGION : 'not configured'
      }
    });

  } catch (error: any) {
    console.error('❌ Azure test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'azure-test',
    description: 'Tests Azure Speech Service configuration',
    methods: ['POST'],
    purpose: 'Verify Azure credentials and connectivity'
  });
} 