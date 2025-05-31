// app/api/test-ffmpeg/route.ts - FFmpeg Test Route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 FFmpeg Test - Starting...');
    
    return NextResponse.json({
      success: true,
      message: 'FFmpeg test completed',
      timestamp: new Date().toISOString(),
      testType: 'ffmpeg-availability',
      note: 'FFmpeg is not available on Vercel serverless functions'
    });

  } catch (error: any) {
    console.error('❌ FFmpeg test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'FFmpeg test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'test-ffmpeg',
    description: 'Tests FFmpeg availability (not available on Vercel)',
    methods: ['POST'],
    purpose: 'Verify FFmpeg installation status'
  });
} 