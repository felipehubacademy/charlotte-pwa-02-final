// app/api/debug-urls/route.ts - Debug URL construction

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = typeof window !== 'undefined' 
    ? '' // Cliente: URL relativa
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'; // Servidor: URL absoluta

  const transcribeUrl = `${baseUrl}/api/transcribe`;
  const pronunciationUrl = `${baseUrl}/api/pronunciation`;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    baseUrl,
    transcribeUrl,
    pronunciationUrl,
    isServer: typeof window === 'undefined',
    requestUrl: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
} 