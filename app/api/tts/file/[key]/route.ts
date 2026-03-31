// app/api/tts/file/[key]/route.ts
// Serves pre-generated ElevenLabs MP3 files from public/tts/
// Bypasses Vercel CDN which has a stale 404 cache for /tts/*.mp3

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!key.endsWith('.mp3')) {
      return new NextResponse('Not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'tts', key);
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}
