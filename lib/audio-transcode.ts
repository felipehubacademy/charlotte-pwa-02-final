// lib/audio-transcode.ts
//
// Server-side audio transcoding via ffmpeg. Used when the client uploads
// a codec (e.g. AAC in MPEG-4/m4a from Android) that Azure Speech cannot
// decode natively on Node — Azure SDK on Node only handles WAV PCM, and
// the REST API list of compressed codecs omits AAC entirely.
//
// We convert everything to WAV PCM 16 kHz mono 16-bit, which Azure accepts
// via getWaveFormatPCM(16000, 16, 1) without any additional configuration.

import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

// Point fluent-ffmpeg at the bundled binary — required on Vercel serverless,
// where ffmpeg is not on the PATH.
ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function transcodeToWavPcm16k(input: ArrayBuffer, sourceExt = 'm4a'): Promise<Buffer> {
  const tmp = os.tmpdir();
  const id  = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputPath  = path.join(tmp, `in-${id}.${sourceExt}`);
  const outputPath = path.join(tmp, `out-${id}.wav`);

  try {
    await fs.writeFile(inputPath, Buffer.from(input));

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    return await fs.readFile(outputPath);
  } finally {
    // Best-effort cleanup, never block the response on these.
    fs.unlink(inputPath).catch(() => {});
    fs.unlink(outputPath).catch(() => {});
  }
}

// Decide whether the incoming blob needs transcoding before hitting Azure
// Speech. iOS WAV is passthrough; AMR variants used to be passthrough until
// we saw Android VAD eat the signal; everything else (m4a/aac, webm/aac,
// mp4, etc.) must be converted.
export function needsTranscode(mimeType: string, filename = ''): boolean {
  const m = (mimeType ?? '').toLowerCase();
  const f = filename.toLowerCase();
  if (m.includes('wav') || m.includes('wave')) return false;
  if (f.endsWith('.wav')) return false;
  // Everything else — m4a, aac, mp4, 3gp, webm, amr, ... — gets transcoded so
  // Azure always sees the same clean WAV PCM 16k mono.
  return true;
}

export function guessExtension(mimeType: string, filename = ''): string {
  const m = (mimeType ?? '').toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  if (m.includes('webm')) return 'webm';
  if (m.includes('amr'))  return 'amr';
  if (m.includes('3gp'))  return '3gp';
  if (m.includes('ogg'))  return 'ogg';
  if (m.includes('mp3'))  return 'mp3';
  const f = filename.toLowerCase();
  const dot = f.lastIndexOf('.');
  if (dot >= 0) return f.slice(dot + 1);
  return 'bin';
}
