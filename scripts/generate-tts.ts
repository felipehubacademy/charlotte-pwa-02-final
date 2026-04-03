/**
 * Pre-generate TTS audio for all curriculum pronunciation phrases via ElevenLabs.
 * Run: npm run generate-tts
 *
 * Output: public/tts/{key}.mp3  (served as static CDN by Vercel)
 * Requires: ELEVENLABS_API_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CURRICULUM } = require('../charlotte-rn/data/curriculum') as typeof import('../charlotte-rn/data/curriculum');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MODULE_INTROS } = require('../charlotte-rn/data/moduleIntros') as typeof import('../charlotte-rn/data/moduleIntros');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Rachel — clear American English, excellent for language teaching
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

function ttsKey(text: string): string {
  return text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

async function generateAudio(text: string): Promise<Buffer | null> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.80,
        style: 0.10,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('Missing ELEVENLABS_API_KEY in .env.local');
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../public/tts');
  fs.mkdirSync(outDir, { recursive: true });

  // Collect all unique phrase texts
  const phrases = new Map<string, string>(); // key → text

  // ── Curriculum pronunciation phrases ──────────────────────────
  for (const level of Object.keys(CURRICULUM) as Array<keyof typeof CURRICULUM>) {
    for (const mod of CURRICULUM[level]) {
      for (const topic of mod.topics) {
        for (const step of topic.pronunciation) {
          const key = ttsKey(step.text);
          if (!phrases.has(key)) phrases.set(key, step.text);
        }
      }
    }
  }

  // ── Module intro slide narrations ─────────────────────────────
  for (const levelIntros of Object.values(MODULE_INTROS)) {
    if (!levelIntros) continue;
    for (const intro of Object.values(levelIntros)) {
      for (const slide of intro.slides) {
        const key = ttsKey(slide.audio);
        if (!phrases.has(key)) phrases.set(key, slide.audio);
      }
    }
  }

  console.log(`Found ${phrases.size} unique phrases (pronunciation + intro slides).\n`);

  let generated = 0;
  let skipped   = 0;
  let failed    = 0;

  for (const [key, text] of phrases) {
    const filePath = path.join(outDir, `${key}.mp3`);

    if (fs.existsSync(filePath)) {
      skipped++;
      process.stdout.write('.');
      continue;
    }

    try {
      process.stdout.write(`\n  [${generated + skipped + failed + 1}/${phrases.size}] ${text.slice(0, 55)}… `);
      const buffer = await generateAudio(text);
      if (!buffer) throw new Error('Empty response');
      fs.writeFileSync(filePath, buffer);
      generated++;
      console.log('✓');
    } catch (err: any) {
      failed++;
      console.log(`✗  ${err?.message ?? err}`);
    }

    // ElevenLabs free tier: ~2 req/s
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n\nDone.  Generated: ${generated}  Skipped (cached): ${skipped}  Failed: ${failed}`);
  if (generated > 0) console.log(`Files saved to: ${outDir}`);
}

main().catch(e => { console.error(e); process.exit(1); });
