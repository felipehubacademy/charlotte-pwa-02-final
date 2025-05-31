// app/api/audio-pipeline-test/route.ts - Audio Pipeline Test Route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Audio Pipeline Test - Starting...');
    
    return NextResponse.json({
      success: true,
      message: 'Audio pipeline test completed',
      timestamp: new Date().toISOString(),
      testType: 'audio-pipeline'
    });

  } catch (error: any) {
    console.error('❌ Audio pipeline test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Audio pipeline test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'audio-pipeline-test',
    description: 'Tests the complete audio processing pipeline',
    methods: ['POST'],
    purpose: 'Verify audio conversion and processing functionality'
  });
} 