// app/api/debug-urls/route.ts - Debug URL construction

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const originalVercelUrl = process.env.VERCEL_URL;
  const correctedVercelUrl = originalVercelUrl?.replace(/-[a-z0-9]+\.vercel\.app$/, '.vercel.app');
  
  const baseUrl = typeof window !== 'undefined' 
    ? '' // Cliente: URL relativa
    : correctedVercelUrl 
      ? `https://${correctedVercelUrl}` 
      : 'http://localhost:3000'; // Servidor: URL absoluta

  const transcribeUrl = `${baseUrl}/api/transcribe`;
  const pronunciationUrl = `${baseUrl}/api/pronunciation`;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    originalVercelUrl,
    correctedVercelUrl,
    baseUrl,
    transcribeUrl,
    pronunciationUrl,
    isServer: typeof window === 'undefined',
    requestUrl: request.url,
    actualHost: request.headers.get('host')
  });
} 