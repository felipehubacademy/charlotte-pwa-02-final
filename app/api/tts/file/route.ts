// app/api/tts/file/route.ts
// GET /api/tts/file?k=filename_without_extension
// Serves pre-generated ElevenLabs MP3 files from public/tts/
// Using query param to avoid Next.js App Router issue with dots in dynamic segments

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('k') ?? '';
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safe) return new NextResponse('Bad request', { status: 400 });

    const filePath = path.join(process.cwd(), 'public', 'tts', `${safe}.mp3`);
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
