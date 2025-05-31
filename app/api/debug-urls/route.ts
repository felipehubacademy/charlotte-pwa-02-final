// app/api/debug-urls/route.ts - Debug URLs Route

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug URLs - Starting...');
    
    // Informações sobre URLs e ambiente
    const urlInfo = {
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL || 'not available',
      vercelRegion: process.env.VERCEL_REGION || 'not available',
      baseUrl: process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      message: 'URL debug completed',
      urlInfo
    });

  } catch (error: any) {
    console.error('❌ URL debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'URL debug failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'debug-urls',
    description: 'Debug URL configuration and environment',
    methods: ['GET'],
    purpose: 'Verify URL setup and Vercel configuration'
  });
} 