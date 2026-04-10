#!/usr/bin/env npx tsx
// scripts/generate-greeting-timings.ts
// Gera word timings JSON para os greetings usando ElevenLabs with_timestamps.
//
// Uso: ELEVENLABS_API_KEY=xxx npx tsx scripts/generate-greeting-timings.ts

import fs from 'fs';
import path from 'path';

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'tts', 'greetings');

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

const GREETINGS: { id: string; text: string }[] = [
  // Primeiro acesso
  { id: 'novice_first_01',   text: 'Oi! Que bom que você chegou. Vamos começar essa jornada juntos?' },
  { id: 'inter_first_01',    text: "Hey! So glad you made it. Ready to start your English journey?" },
  { id: 'advanced_first_01', text: "Hey! Great to have you here. Let's get started — I think we're going to work really well together." },

  { id: 'novice_01', text: 'Oi! Que bom te ver! Bora praticar?' },
  { id: 'novice_02', text: 'Oi! Estou te esperando. Vamos lá!' },
  { id: 'novice_03', text: 'Ei, que bom que voltou! Bora pro inglês?' },
  { id: 'novice_04', text: 'Oi! Pronto pra mais uma sessão?' },
  { id: 'inter_01',    text: "Hey! Good to see you — let's get started!" },
  { id: 'inter_02',    text: "Hey! Ready for some practice?" },
  { id: 'inter_03',    text: "Oh hey! Welcome back — let's do this!" },
  { id: 'inter_04',    text: "Hey! I've been waiting. Let's go!" },
  { id: 'advanced_01', text: "Hey! What's on your mind today?" },
  { id: 'advanced_02', text: "Oh hey! Ready to dive in?" },
  { id: 'advanced_03', text: "Hey! Let's make this session count." },
  { id: 'advanced_04', text: "What's up? Good to see you again." },
];

function alignmentToWordTimings(alignment: Alignment): WordTiming[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const timings: WordTiming[] = [];
  let wordStart = -1;
  let wordChars = '';

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    if (ch === ' ' || ch === '\n') {
      if (wordChars.length > 0) {
        timings.push({ word: wordChars, start: wordStart, end: character_end_times_seconds[i - 1] });
        wordChars = '';
        wordStart = -1;
      }
    } else {
      if (wordStart < 0) wordStart = character_start_times_seconds[i];
      wordChars += ch;
    }
  }
  if (wordChars.length > 0 && wordStart >= 0) {
    timings.push({ word: wordChars, start: wordStart, end: character_end_times_seconds[characters.length - 1] });
  }

  return timings;
}

async function generateTimings(greeting: typeof GREETINGS[0]): Promise<void> {
  const outPath = path.join(OUTPUT_DIR, `${greeting.id}.json`);

  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skip (exists): ${greeting.id}.json`);
    return;
  }

  console.log(`🎤 Generating timings: ${greeting.id} — "${greeting.text}"`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: greeting.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.80,
          style: 0.10,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    console.error(`❌ Failed ${greeting.id}: HTTP ${res.status} — ${await res.text()}`);
    return;
  }

  const json = await res.json();
  const alignment: Alignment | undefined = json.alignment;

  if (!alignment) {
    console.error(`❌ No alignment data for ${greeting.id}`);
    return;
  }

  const timings = alignmentToWordTimings(alignment);
  fs.writeFileSync(outPath, JSON.stringify(timings, null, 2));
  console.log(`✅ Saved: ${outPath} (${timings.length} words)`);
}

async function main() {
  if (!API_KEY) {
    console.error('Set ELEVENLABS_API_KEY env var');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const g of GREETINGS) {
    await generateTimings(g);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
