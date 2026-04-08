/**
 * generate-karaoke.mjs
 *
 * Gera MP3 + JSON de word timings (karaoke) para todos os slides de MODULE_INTROS.
 * Usa ElevenLabs /with-timestamps endpoint.
 *
 * Uso:
 *   ELEVENLABS_API_KEY=xxx node scripts/generate-karaoke.mjs
 *
 * Arquivos salvos em: public/tts/{fileKey}.mp3 + {fileKey}.json
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ── Config ─────────────────────────────────────────────────────
const API_KEY   = process.env.ELEVENLABS_API_KEY;
const VOICE_ID  = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const PUBLIC_TTS = path.join(__dirname, '../public/tts');
const RATE_MS   = 1300; // ~46 req/min — dentro do free tier

if (!API_KEY) { console.error('❌ ELEVENLABS_API_KEY não definida'); process.exit(1); }

// ── Helpers ─────────────────────────────────────────────────────
function getFileKey(text) {
  return text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Converte alinhamento de caracteres do ElevenLabs para array de word timings.
 * Formato saída: [{word, start, end}, ...]
 */
function charAlignToWords(characters, startTimes, endTimes) {
  const words = [];
  let currentWord = '';
  let wordStart   = 0;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];

    if (ch === ' ' || ch === '\n') {
      if (currentWord.trim()) {
        words.push({
          word:  currentWord.trim(),
          start: Math.round(wordStart * 1000) / 1000,
          end:   Math.round(endTimes[i - 1] * 1000) / 1000,
        });
      }
      currentWord = '';
    } else {
      if (!currentWord) wordStart = startTimes[i] ?? 0;
      currentWord += ch;
    }
  }

  // Último token sem espaço no final
  if (currentWord.trim()) {
    words.push({
      word:  currentWord.trim(),
      start: Math.round(wordStart * 1000) / 1000,
      end:   Math.round(endTimes[characters.length - 1] * 1000) / 1000,
    });
  }

  return words;
}

// ── Geração de um slide ─────────────────────────────────────────
async function generateSlide(text, label = '') {
  const fileKey  = getFileKey(text);
  const mp3Path  = path.join(PUBLIC_TTS, `${fileKey}.mp3`);
  const jsonPath = path.join(PUBLIC_TTS, `${fileKey}.json`);

  // Só pula se já tiver AMBOS
  if (fs.existsSync(mp3Path) && fs.existsSync(jsonPath)) {
    process.stdout.write(`  ✓ (cache) ${label || text.slice(0, 50)}\n`);
    return;
  }

  process.stdout.write(`  → Gerando: ${label || text.slice(0, 50)}...\n`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':   API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability:        0.55,
          similarity_boost: 0.80,
          style:            0.10,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ❌ Erro ElevenLabs: ${res.status} ${err.slice(0, 200)}`);
    return;
  }

  const data = await res.json();

  // Salva MP3
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  fs.writeFileSync(mp3Path, audioBuffer);

  // Salva JSON de word timings
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = data.alignment;
  const words = charAlignToWords(characters, starts, ends);
  fs.writeFileSync(jsonPath, JSON.stringify(words));

  console.log(`  ✅ ${words.length} palavras → ${fileKey.slice(0, 60)}`);
}

// ── Extrai todos os textos de moduleIntros ──────────────────────
// Importa via require (CommonJS-transpilado) — o .js compilado ou via tsx
async function getAllSlideTexts() {
  // Tenta importar o módulo TypeScript como JS via bundle já existente
  // Fallback: parseia o .ts diretamente com regex simples
  const tsPath = path.join(__dirname, '../charlotte-rn/data/moduleIntros.ts');
  const src    = fs.readFileSync(tsPath, 'utf-8');

  // Extrai todos os valores de `text:` seguidos de string
  const matches = [...src.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)];
  const texts   = matches.map(m => m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));

  console.log(`\n📚 Total de slides encontrados: ${texts.length}`);
  return texts;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(PUBLIC_TTS, { recursive: true });

  const texts = await getAllSlideTexts();

  let done = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < texts.length; i++) {
    const text    = texts[i];
    const fileKey = getFileKey(text);
    const hasMp3  = fs.existsSync(path.join(PUBLIC_TTS, `${fileKey}.mp3`));
    const hasJson = fs.existsSync(path.join(PUBLIC_TTS, `${fileKey}.json`));

    if (hasMp3 && hasJson) {
      skipped++;
      process.stdout.write(`[${i+1}/${texts.length}] ✓ cache\n`);
      continue;
    }

    process.stdout.write(`[${i+1}/${texts.length}] `);
    try {
      await generateSlide(text);
      done++;
    } catch (e) {
      console.error(`  ❌ Exceção: ${e.message}`);
      errors++;
    }

    // Rate limit
    await sleep(RATE_MS);
  }

  console.log(`\n🎉 Concluído! Gerados: ${done}  Cache: ${skipped}  Erros: ${errors}`);
  console.log('📦 Agora faça deploy do Next.js para que os arquivos fiquem no CDN.');
}

main().catch(console.error);
