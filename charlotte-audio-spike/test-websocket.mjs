/**
 * Spike: WebSocket OpenAI Realtime API — Node.js puro
 * Roda sem simulador, sem dispositivo.
 *
 * Como usar:
 *   OPENAI_API_KEY=sk-... node test-websocket.mjs
 *
 * O que testa:
 *   1. Conexão WebSocket com headers de auth
 *   2. session.update (configurar PCM16 + voz)
 *   3. Envio de áudio sintético (sine wave PCM16)
 *   4. Recepção de audio.delta da OpenAI
 */

import { WebSocket } from 'ws';

const API_KEY = process.env.OPENAI_API_KEY;
const WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY não definida.');
  console.error('   Use: OPENAI_API_KEY=sk-... node test-websocket.mjs');
  process.exit(1);
}

// ── Gera sine wave PCM16 24kHz em base64 ──────────────────────────────────
function generateSineWavePCM16(durationSec = 0.25, sampleRate = 24000, freq = 440) {
  const samples = Math.floor(sampleRate * durationSec);
  const buf = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const val = Math.round(8000 * Math.sin((2 * Math.PI * freq * i) / sampleRate));
    buf.writeInt16LE(val, i * 2);
  }
  return buf.toString('base64');
}

// ── Helpers de log ────────────────────────────────────────────────────────
const ts = () => new Date().toISOString().slice(11, 23);
const log  = (msg) => console.log(`[${ts()}] ${msg}`);
const send = (ws, obj) => { ws.send(JSON.stringify(obj)); log(`→ ${obj.type}`); };

// ── Resultado final ───────────────────────────────────────────────────────
const result = {
  conectou: false,
  sessaoCriada: false,
  sessaoConfigurada: false,
  enviouAudio: false,
  recebeuAudioDelta: false,
  latenciaMs: null,
  erros: [],
};

// ── Conectar ──────────────────────────────────────────────────────────────
log(`Conectando a ${WS_URL}...`);
const connectStart = Date.now();

const ws = new WebSocket(WS_URL, {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'OpenAI-Beta': 'realtime=v1',
  },
});

let audioSentAt = null;

ws.on('open', () => {
  result.conectou = true;
  log(`✅ Conectado em ${Date.now() - connectStart}ms`);

  send(ws, {
    type: 'session.update',
    session: {
      modalities: ['text', 'audio'],
      voice: 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      instructions: 'Responda só com: "Conexão OK".',
    },
  });
});

ws.on('message', (raw) => {
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  switch (data.type) {
    case 'session.created':
      result.sessaoCriada = true;
      log(`✅ session.created — id: ${data.session?.id}`);
      break;

    case 'session.updated':
      result.sessaoConfigurada = true;
      log(`✅ session.updated — formato: ${data.session?.input_audio_format}`);

      // Enviar 4 chunks de 250ms
      log('Enviando áudio sintético (4 × 250ms @ 24kHz PCM16)...');
      audioSentAt = Date.now();
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          send(ws, { type: 'input_audio_buffer.append', audio: generateSineWavePCM16(0.25) });
          if (i === 3) {
            setTimeout(() => {
              send(ws, { type: 'input_audio_buffer.commit' });
              send(ws, { type: 'response.create' });
              result.enviouAudio = true;
            }, 50);
          }
        }, i * 260);
      }
      break;

    case 'response.audio.delta':
      if (!result.recebeuAudioDelta) {
        result.recebeuAudioDelta = true;
        result.latenciaMs = Date.now() - audioSentAt;
        log(`✅ AUDIO DELTA recebido! Latência: ${result.latenciaMs}ms | chunk: ${data.delta?.length} chars`);
      }
      break;

    case 'response.done':
      log('✅ Resposta completa. Encerrando...');
      ws.close();
      break;

    case 'error':
      const msg = data.error?.message ?? JSON.stringify(data.error);
      result.erros.push(msg);
      log(`❌ Erro API: ${msg}`);
      break;

    default:
      log(`← ${data.type}`);
  }
});

ws.on('error', (err) => {
  result.erros.push(err.message);
  log(`❌ Erro WebSocket: ${err.message}`);
});

ws.on('close', (code, reason) => {
  log(`Conexão encerrada — code: ${code} reason: "${reason}"`);
  printResult();
  process.exit(result.recebeuAudioDelta ? 0 : 1);
});

// Timeout de segurança
setTimeout(() => {
  log('⏱ Timeout de 30s atingido');
  ws.close();
}, 30000);

// ── Imprimir resultado ────────────────────────────────────────────────────
function printResult() {
  console.log('\n═══════════════════════════════════════');
  console.log('           RESULTADO DO SPIKE          ');
  console.log('═══════════════════════════════════════');
  console.log(`WebSocket conectou:        ${result.conectou        ? '✅' : '❌'}`);
  console.log(`Sessão criada:             ${result.sessaoCriada    ? '✅' : '❌'}`);
  console.log(`Sessão configurada PCM16:  ${result.sessaoConfigurada ? '✅' : '❌'}`);
  console.log(`Enviou áudio (PCM16):      ${result.enviouAudio     ? '✅' : '❌'}`);
  console.log(`Recebeu audio.delta:       ${result.recebeuAudioDelta ? '✅' : '❌'}`);
  console.log(`Latência (1º delta):       ${result.latenciaMs !== null ? result.latenciaMs + 'ms' : '—'}`);
  if (result.erros.length > 0) {
    console.log(`Erros:                     ${result.erros.join(', ')}`);
  }
  console.log('═══════════════════════════════════════');
  const passed = result.recebeuAudioDelta;
  console.log(passed
    ? '\n🟢 SPIKE PASSOU — WebSocket + PCM16 funciona. Fase 6 pode prosseguir.\n'
    : '\n🔴 SPIKE FALHOU — ver erros acima para ajustar estratégia.\n'
  );
}
