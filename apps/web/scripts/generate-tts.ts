/**
 * Pre-generate TTS audio for curriculum phrases and module intro slides.
 * Run: npm run generate-tts
 *
 * Pronunciation phrases → {key}.mp3  (standard endpoint)
 * Intro slides          → {key}.mp3 + {key}.json  (with-timestamps endpoint)
 *
 * Output: public/tts/  (served as static CDN by Vercel)
 * Requires: ELEVENLABS_API_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CURRICULUM } = require('../../mobile/data/curriculum') as typeof import('../../mobile/data/curriculum');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MODULE_INTROS } = require('../../mobile/data/moduleIntros') as typeof import('../../mobile/data/moduleIntros');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Rachel — clear American English, excellent for language teaching
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.80,
  style: 0.10,
  use_speaker_boost: true,
};

function ttsKey(text: string): string {
  return text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

// ── Standard audio (pronunciation exercises) ───────────────────
async function generateAudio(text: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Audio + word timings (intro slides) ────────────────────────
export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

async function generateAudioWithTimings(text: string): Promise<{ buffer: Buffer; words: WordTiming[] }> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const buffer = Buffer.from(data.audio_base64, 'base64');
  const words  = parseWordTimings(
    data.alignment.characters,
    data.alignment.character_start_times_seconds,
    data.alignment.character_end_times_seconds,
  );
  return { buffer, words };
}

function parseWordTimings(chars: string[], starts: number[], ends: number[]): WordTiming[] {
  const words: WordTiming[] = [];
  let wordStart = -1;
  let wordChars = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === ' ' || ch === '\n') {
      if (wordChars) {
        words.push({ word: wordChars, start: wordStart, end: ends[i - 1] });
        wordChars = '';
        wordStart = -1;
      }
    } else {
      if (wordStart === -1) wordStart = starts[i];
      wordChars += ch;
    }
  }
  if (wordChars) {
    words.push({ word: wordChars, start: wordStart, end: ends[ends.length - 1] });
  }
  return words;
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('Missing ELEVENLABS_API_KEY in .env.local');
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../public/tts');
  fs.mkdirSync(outDir, { recursive: true });

  // ── 1. Pronunciation phrases (standard, no timings) ────────
  const phrases = new Map<string, string>();
  for (const level of Object.keys(CURRICULUM) as Array<keyof typeof CURRICULUM>) {
    for (const mod of CURRICULUM[level]) {
      for (const topic of mod.topics) {
        for (const step of topic.pronunciation) {
          if (!step.text) continue;
          const key = ttsKey(step.text);
          if (!phrases.has(key)) phrases.set(key, step.text);
        }
      }
    }
  }

  console.log(`\nFound ${phrases.size} pronunciation phrases.\n`);
  let gen = 0, skip = 0, fail = 0;

  for (const [key, text] of phrases) {
    const mp3 = path.join(outDir, `${key}.mp3`);
    if (fs.existsSync(mp3)) { skip++; process.stdout.write('.'); continue; }
    try {
      process.stdout.write(`\n  [${gen + skip + fail + 1}/${phrases.size}] ${text.slice(0, 55)}… `);
      fs.writeFileSync(mp3, await generateAudio(text));
      gen++; console.log('✓');
    } catch (e: any) { fail++; console.log(`✗  ${e?.message ?? e}`); }
    await new Promise(r => setTimeout(r, 600));
  }
  console.log(`\nPronunciation: Generated ${gen}  Skipped ${skip}  Failed ${fail}`);

  // ── 2. Intro slides (with-timestamps) ─────────────────────
  const introTexts = new Map<string, string>();
  for (const levelIntros of Object.values(MODULE_INTROS)) {
    if (!levelIntros) continue;
    for (const intro of Object.values(levelIntros)) {
      for (const slide of intro.slides) {
        const key = ttsKey(slide.text);
        if (!introTexts.has(key)) introTexts.set(key, slide.text);
      }
    }
  }

  console.log(`\nFound ${introTexts.size} intro slide narrations.\n`);
  let igen = 0, iskip = 0, ifail = 0;

  for (const [key, text] of introTexts) {
    const mp3  = path.join(outDir, `${key}.mp3`);
    const json = path.join(outDir, `${key}.json`);
    if (fs.existsSync(mp3) && fs.existsSync(json)) { iskip++; process.stdout.write('.'); continue; }
    try {
      process.stdout.write(`\n  [intro] ${text.slice(0, 55)}… `);
      const { buffer, words } = await generateAudioWithTimings(text);
      fs.writeFileSync(mp3, buffer);
      fs.writeFileSync(json, JSON.stringify(words));
      igen++; console.log('✓');
    } catch (e: any) { ifail++; console.log(`✗  ${e?.message ?? e}`); }
    await new Promise(r => setTimeout(r, 600));
  }
  console.log(`\nIntro slides: Generated ${igen}  Skipped ${iskip}  Failed ${ifail}`);

  // ── 3. Karaoke exercise chunks (with-timestamps) ───────────
  const karaokeChunks = [
    'Every morning',
    'I wake up',
    'at seven',
    'After months of working overtime',
    'she finally decided',
    'to hand in her resignation',
    'He kept telling himself',
    'he just needed more time to adjust',
    'but deep down he knew',
    'something had to change',
  ];

  console.log(`\nFound ${karaokeChunks.length} karaoke chunks.\n`);
  let kgen = 0, kskip = 0, kfail = 0;

  for (const text of karaokeChunks) {
    const key  = ttsKey(text);
    const mp3  = path.join(outDir, `${key}.mp3`);
    const json = path.join(outDir, `${key}.json`);
    if (fs.existsSync(mp3) && fs.existsSync(json)) { kskip++; process.stdout.write('.'); continue; }
    try {
      process.stdout.write(`\n  [karaoke] ${text}… `);
      const { buffer, words } = await generateAudioWithTimings(text);
      fs.writeFileSync(mp3, buffer);
      fs.writeFileSync(json, JSON.stringify(words));
      kgen++; console.log('✓');
    } catch (e: any) { kfail++; console.log(`✗  ${e?.message ?? e}`); }
    await new Promise(r => setTimeout(r, 600));
  }
  console.log(`\nKaraoke chunks: Generated ${kgen}  Skipped ${kskip}  Failed ${kfail}`);
  console.log(`\nFiles saved to: ${outDir}`);
}

main().catch(e => { console.error(e); process.exit(1); });
