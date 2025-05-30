// app/api/debug-azure-env/route.ts - Debug Azure environment variables

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    azure: {
      hasKey: !!process.env.AZURE_SPEECH_KEY,
      hasRegion: !!process.env.AZURE_SPEECH_REGION,
      region: process.env.AZURE_SPEECH_REGION,
      keyLength: process.env.AZURE_SPEECH_KEY?.length || 0,
      keyPrefix: process.env.AZURE_SPEECH_KEY?.substring(0, 8) + '...' || 'undefined'
    },
    vercel: {
      url: process.env.VERCEL_URL,
      region: process.env.VERCEL_REGION,
      env: process.env.VERCEL_ENV
    }
  });
} 