#!/usr/bin/env npx tsx
// scripts/generate-greeting-tts.ts
// Gera áudios via ElevenLabs e salva em public/tts/
//   greetings/ → saudações do WelcomeModal
//   sfx/        → feedback curto da Charlotte (Yes!, Nice!, etc.)
//
// Uso: ELEVENLABS_API_KEY=xxx npx tsx scripts/generate-greeting-tts.ts
//
// Ou, se o servidor local está rodando:
//   API_BASE_URL=http://localhost:3000 npx tsx scripts/generate-greeting-tts.ts

import fs from 'fs';
import path from 'path';

const API_BASE        = process.env.API_BASE_URL ?? 'https://charlotte-pwa-02-final.vercel.app';
const ELEVENLABS_KEY  = process.env.ELEVENLABS_API_KEY ?? '';
const VOICE_ID        = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const GREETINGS_DIR   = path.join(__dirname, '..', 'public', 'tts', 'greetings');
const SFX_DIR         = path.join(__dirname, '..', 'public', 'tts', 'sfx');

// ── Saudações ─────────────────────────────────────────────────────────────────
// Novice: PT-BR (voice Rachel com multilingual_v2 fala PT-BR)
// Inter + Advanced: EN

const GREETINGS: { id: string; text: string }[] = [
  // Primeiro acesso — audio especifico por nivel
  { id: 'novice_first_01',   text: 'Oi! Que bom que você chegou. Vamos começar essa jornada juntos?' },
  { id: 'inter_first_01',    text: "Hey! So glad you made it. Ready to start your English journey?" },
  { id: 'advanced_first_01', text: "Hey! Great to have you here. Let's get started — I think we're going to work really well together." },

  // Novice (PT-BR)
  { id: 'novice_01', text: 'Oi! Que bom te ver! Bora praticar?' },
  { id: 'novice_02', text: 'Oi! Estou te esperando. Vamos lá!' },
  { id: 'novice_03', text: 'Ei, que bom que voltou! Bora pro inglês?' },
  { id: 'novice_04', text: 'Oi! Pronto pra mais uma sessão?' },

  // Inter (EN)
  { id: 'inter_01', text: "Hey! Good to see you — let's get started!" },
  { id: 'inter_02', text: "Hey! Ready for some practice?" },
  { id: 'inter_03', text: "Oh hey! Welcome back — let's do this!" },
  { id: 'inter_04', text: "Hey! I've been waiting. Let's go!" },

  // Advanced (EN)
  { id: 'advanced_01', text: "Hey! What's on your mind today?" },
  { id: 'advanced_02', text: "Oh hey! Ready to dive in?" },
  { id: 'advanced_03', text: "Hey! Let's make this session count." },
  { id: 'advanced_04', text: "What's up? Good to see you again." },
];

// ── SFX — feedback curto com a voz da Charlotte ───────────────────────────────

const SFX: { id: string; text: string }[] = [
  { id: 'xp_gained',             text: 'Yes!'         },
  { id: 'answer_correct',        text: 'Nice!'        },
  { id: 'answer_wrong',          text: 'Close!'       },
  { id: 'achievement_common',    text: 'Well done!'   },
  { id: 'achievement_rare',      text: 'Impressive!'  },
  { id: 'achievement_epic',      text: 'Amazing!'     },
  { id: 'achievement_legendary', text: 'Outstanding!' },
  { id: 'streak_alive',          text: 'Keep going!'  },
  { id: 'daily_goal',            text: 'You did it!'  },
];

// ── Core ──────────────────────────────────────────────────────────────────────

// Greetings: via /api/tts (voz padrão, stability 0.55, style 0.10)
async function generateViaApi(id: string, text: string, outputDir: string): Promise<void> {
  const outPath = path.join(outputDir, `${id}.mp3`);
  if (fs.existsSync(outPath)) { console.log(`  skip  ${id}`); return; }
  console.log(`  gen   ${id} — "${text}"`);

  const res = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) { console.error(`  ERROR ${id}: HTTP ${res.status}`); return; }
  const json = await res.json();
  if (!json.audio) { console.error(`  ERROR ${id}: no audio`); return; }

  const buffer = Buffer.from(json.audio, 'base64');
  fs.writeFileSync(outPath, buffer);
  console.log(`  ok    ${id}.mp3 (${Math.round(buffer.length / 1024)}KB)`);
}

// SFX: direto no ElevenLabs com stability 0.30 + style 0.65 — entrega emocional alta
async function generateSfxDirect(id: string, text: string, outputDir: string): Promise<void> {
  const outPath = path.join(outputDir, `${id}.mp3`);
  if (fs.existsSync(outPath)) { console.log(`  skip  ${id}`); return; }
  console.log(`  gen   ${id} — "${text}"`);

  if (!ELEVENLABS_KEY) { console.error('  ERROR: ELEVENLABS_API_KEY not set'); return; }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability:         0.30,  // mais variação = mais expressivo
        similarity_boost:  0.85,  // mantém a voz da Rachel
        style:             0.65,  // entrega emocional alta — chave para entusiasmo
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) { const e = await res.text(); console.error(`  ERROR ${id}: ${res.status} — ${e}`); return; }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  ok    ${id}.mp3 (${Math.round(buffer.length / 1024)}KB)`);
}

async function main() {
  fs.mkdirSync(GREETINGS_DIR, { recursive: true });
  fs.mkdirSync(SFX_DIR,       { recursive: true });

  console.log('── Greetings ────────────────────────────────');
  for (const g of GREETINGS) {
    await generateViaApi(g.id, g.text, GREETINGS_DIR);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n── SFX (entusiasmado) ───────────────────────');
  for (const s of SFX) {
    await generateSfxDirect(s.id, s.text, SFX_DIR);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\nDone.');
}

main().catch(console.error);
