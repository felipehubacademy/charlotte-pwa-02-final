#!/usr/bin/env npx tsx
// scripts/generate-greeting-tts.ts
// Gera áudios de saudação via ElevenLabs e salva em public/tts/greetings/
//
// Uso: ELEVENLABS_API_KEY=xxx npx tsx scripts/generate-greeting-tts.ts
//
// Ou, se o servidor local está rodando:
//   API_BASE_URL=http://localhost:3000 npx tsx scripts/generate-greeting-tts.ts

import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_BASE_URL ?? 'https://charlotte-pwa-02-final.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'tts', 'greetings');

// ── Frases de saudação ──────────────────────────────────────────────────────
// Novice: PT-BR (mesmo voice Rachel com multilingual_v2 fala PT-BR)
// Inter + Advanced: EN

const GREETINGS: { level: string; id: string; text: string }[] = [
  // Primeiro acesso — audio especifico por nivel
  { level: 'novice', id: 'novice_first_01', text: 'Oi! Seja bem-vindo ao Charlotte! Que bom ter você aqui. Vamos aprender inglês juntos?' },
  { level: 'inter',    id: 'inter_first_01',    text: "Hey! Welcome to Charlotte! I'm so glad you're here. Let's learn English together!" },
  { level: 'advanced', id: 'advanced_first_01', text: "Hey there! Welcome to Charlotte. I'm really looking forward to working with you — we're going to do great things." },

  // Novice (PT-BR)
  { level: 'novice', id: 'novice_01', text: 'Oi! Que bom te ver! Bora praticar?' },
  { level: 'novice', id: 'novice_02', text: 'Oi! Estou te esperando. Vamos lá!' },
  { level: 'novice', id: 'novice_03', text: 'Ei, que bom que voltou! Bora pro inglês?' },
  { level: 'novice', id: 'novice_04', text: 'Oi! Pronta pra mais uma sessão?' },

  // Inter (EN)
  { level: 'inter', id: 'inter_01', text: "Hey! Good to see you — let's get started!" },
  { level: 'inter', id: 'inter_02', text: "Hey! Ready for some practice?" },
  { level: 'inter', id: 'inter_03', text: "Oh hey! Welcome back — let's do this!" },
  { level: 'inter', id: 'inter_04', text: "Hey! I've been waiting. Let's go!" },

  // Advanced (EN)
  { level: 'advanced', id: 'advanced_01', text: "Hey! What's on your mind today?" },
  { level: 'advanced', id: 'advanced_02', text: "Oh hey! Ready to dive in?" },
  { level: 'advanced', id: 'advanced_03', text: "Hey! Let's make this session count." },
  { level: 'advanced', id: 'advanced_04', text: "What's up? Good to see you again." },
];

async function generateOne(greeting: typeof GREETINGS[0]): Promise<void> {
  const outPath = path.join(OUTPUT_DIR, `${greeting.id}.mp3`);

  // Skip if already exists
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skip (exists): ${greeting.id}`);
    return;
  }

  console.log(`🔊 Generating: ${greeting.id} — "${greeting.text}"`);

  const res = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: greeting.text }),
  });

  if (!res.ok) {
    console.error(`❌ Failed ${greeting.id}: HTTP ${res.status}`);
    return;
  }

  const json = await res.json();
  if (!json.audio) {
    console.error(`❌ No audio in response for ${greeting.id}`);
    return;
  }

  // json.audio is base64-encoded mp3
  const buffer = Buffer.from(json.audio, 'base64');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Saved: ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
}

async function main() {
  // Create output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate sequentially to avoid rate limits
  for (const g of GREETINGS) {
    await generateOne(g);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n✅ Done! Files in:', OUTPUT_DIR);
}

main().catch(console.error);
