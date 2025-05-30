// app/api/test-ffmpeg/route.ts - Teste de disponibilidade do FFmpeg

import { NextRequest, NextResponse } from 'next/server';
import { ServerAudioConverter } from '@/lib/audio-converter-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing FFmpeg availability...');
    
    const ffmpegAvailable = await ServerAudioConverter.checkFFmpegAvailability();
    
    return NextResponse.json({
      ffmpegAvailable,
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      message: ffmpegAvailable 
        ? 'FFmpeg is available and ready for audio conversion'
        : 'FFmpeg is not available - audio conversion will not work'
    });
    
  } catch (error: any) {
    console.error('❌ FFmpeg test failed:', error);
    
    return NextResponse.json({
      ffmpegAvailable: false,
      error: error.message,
      environment: process.env.NODE_ENV,
      message: 'FFmpeg test failed with error'
    });
  }
} 