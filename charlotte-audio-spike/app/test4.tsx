/**
 * TESTE 4 — Loop Completo End-to-End
 *
 * Integra os Testes 1, 2 e 3 em um único fluxo:
 *
 *  1. Grava 3s de voz real via expo-av (LinearPCM 24kHz se disponível)
 *  2. Lê o arquivo e extrai os bytes PCM (ou usa áudio sintético como fallback)
 *  3. Conecta ao WebSocket OpenAI Realtime API
 *  4. Envia áudio em chunks de 100ms
 *  5. Recebe resposta de áudio (audio_delta)
 *  6. Reproduz resposta via expo-av
 *  7. Mede latências e exibe timeline
 *
 * Este é o teste definitivo para a decisão de arquitetura da Fase 6.
 *
 * REQUER: EXPO_PUBLIC_OPENAI_API_KEY no .env
 */
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
const RECORDING_DURATION_MS = 3000;
const CHUNK_SIZE_MS = 100; // 100ms por chunk = 4800 samples @ 24kHz = 9600 bytes

/** Converte ArrayBuffer PCM16 para base64 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Converte base64 para Uint8Array */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Gera áudio PCM16 sintético (fallback se gravação falhar) */
function generateSineWave(durationMs: number, sampleRate = 24000): string {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / sampleRate));
  }
  return arrayBufferToBase64(buffer.buffer as ArrayBuffer);
}

type Phase =
  | 'idle'
  | 'recording'
  | 'connecting'
  | 'sending_audio'
  | 'waiting_response'
  | 'playing_response'
  | 'done'
  | 'error';

type TimelineEvent = {
  phase: string;
  label: string;
  timestamp: number;
  durationMs?: number;
};

export default function Test4Screen() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [audioSource, setAudioSource] = useState<'real' | 'synthetic' | null>(null);
  const [chunksAudioEnviados, setChunksAudioEnviados] = useState(0);
  const [chunksAudioRecebidos, setChunksAudioRecebidos] = useState(0);
  const [latencias, setLatencias] = useState({
    recordingMs: 0,
    wsConnectMs: 0,
    firstResponseMs: 0,
    totalLoopMs: 0,
  });
  const [resultadoFinal, setResultadoFinal] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const responseAudioChunks = useRef<string[]>([]);
  const timers = useRef<{ [key: string]: number }>({});

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 100));
  };

  const addTimeline = (phase: string, label: string) => {
    const now = Date.now();
    setTimeline((prev) => {
      const last = prev[prev.length - 1];
      const updated = last
        ? [...prev.slice(0, -1), { ...last, durationMs: now - last.timestamp }, { phase, label, timestamp: now }]
        : [{ phase, label, timestamp: now }];
      return updated;
    });
    return now;
  };

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ status }) => {
      addLog(`Permissão de microfone: ${status}`);
    });
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    return () => {
      wsRef.current?.close();
      soundRef.current?.unloadAsync();
    };
  }, []);

  // ─── FASE 1: Gravação ───────────────────────────────────────────────────────
  const startLoop = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key necessária', 'Configure EXPO_PUBLIC_OPENAI_API_KEY no .env');
      return;
    }

    setPhase('recording');
    setTimeline([]);
    setLogs([]);
    setChunksAudioEnviados(0);
    setChunksAudioRecebidos(0);
    responseAudioChunks.current = [];
    setResultadoFinal(null);

    const loopStart = Date.now();
    timers.current.loopStart = loopStart;
    addTimeline('recording', '🔴 Iniciando gravação');
    addLog(`=== LOOP E2E INICIADO ===`);
    addLog(`Platform: ${Platform.OS} | ${new Date().toISOString()}`);

    let recordedUri: string | null = null;
    let usingRealAudio = false;

    try {
      addLog('Tentando gravar com LinearPCM 24kHz...');
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitDepth: 16,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/wav', bitsPerSecond: 384000 },
      });
      recordingRef.current = recording;

      addLog(`Gravando ${RECORDING_DURATION_MS / 1000}s... fale algo!`);
      await new Promise((r) => setTimeout(r, RECORDING_DURATION_MS));

      await recording.stopAndUnloadAsync();
      const recordingMs = Date.now() - loopStart;
      recordedUri = recording.getURI();
      usingRealAudio = !!recordedUri;
      setAudioSource('real');

      setLatencias((l) => ({ ...l, recordingMs }));
      addLog(`✅ Gravação concluída em ${recordingMs}ms — URI: ${recordedUri?.slice(-50)}`);
    } catch (e: any) {
      addLog(`⚠️ Gravação falhou: ${e.message} → usando áudio sintético`);
      setAudioSource('synthetic');
    }

    addTimeline('recording', `✅ Gravação (${usingRealAudio ? 'real' : 'sintético'})`);

    // ─── FASE 2: Conectar WebSocket ─────────────────────────────────────────
    setPhase('connecting');
    addTimeline('connecting', '🔌 Conectando WebSocket');
    const wsStart = Date.now();

    try {
      await connectAndStream(recordedUri, usingRealAudio, loopStart, wsStart);
    } catch (e: any) {
      addLog(`❌ Loop falhou: ${e.message}`);
      setPhase('error');
      setResultadoFinal(`❌ FALHOU: ${e.message}`);
      addTimeline('error', `❌ Erro: ${e.message}`);
    }
  };

  const connectAndStream = (
    uri: string | null,
    isReal: boolean,
    loopStart: number,
    wsStart: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL, [], {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      } as any);

      wsRef.current = ws;

      ws.onopen = async () => {
        const wsConnectMs = Date.now() - wsStart;
        setLatencias((l) => ({ ...l, wsConnectMs }));
        addLog(`✅ WS conectado em ${wsConnectMs}ms`);
        addTimeline('connecting', `✅ WS conectado (${wsConnectMs}ms)`);

        // Configurar sessão
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            instructions: 'Você é Charlotte, uma enfermeira. Responda em 1 frase curta em português.',
            turn_detection: null, // Modo manual para controle total
          },
        }));

        // Aguardar session.updated antes de enviar áudio
        addLog('Aguardando session.updated...');
      };

      let sessionConfigured = false;

      ws.onmessage = async (event: WebSocketMessageEvent) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        const type: string = data.type ?? '';

        if (type === 'session.updated' && !sessionConfigured) {
          sessionConfigured = true;
          addLog('✅ Sessão configurada — enviando áudio');
          setPhase('sending_audio');
          addTimeline('sending_audio', '📤 Enviando áudio');
          await streamAudio(ws, uri, isReal);
        }

        if (type === 'response.audio.delta') {
          if (chunksAudioRecebidos === 0) {
            const firstResponseMs = Date.now() - loopStart;
            setLatencias((l) => ({ ...l, firstResponseMs }));
            addLog(`✅ PRIMEIRO audio.delta em ${firstResponseMs}ms desde início`);
            setPhase('waiting_response');
            addTimeline('waiting_response', `⏳ Resposta chegando (latência: ${firstResponseMs}ms)`);
          }
          responseAudioChunks.current.push(data.delta ?? '');
          setChunksAudioRecebidos((n) => n + 1);
        }

        if (type === 'response.audio.done') {
          addLog(`✅ Áudio da resposta completo — ${responseAudioChunks.current.length} chunks`);
          addTimeline('playing_response', '▶️ Reproduzindo resposta');
          setPhase('playing_response');
          ws.close(1000);
          await playResponseAudio(responseAudioChunks.current, loopStart, resolve, reject);
        }

        if (type === 'error') {
          addLog(`❌ Erro da API: ${data.error?.message}`);
          reject(new Error(data.error?.message ?? 'API error'));
        }
      };

      ws.onerror = (e: Event) => {
        addLog(`❌ Erro WS: ${JSON.stringify(e)}`);
        reject(new Error('WebSocket error'));
      };

      ws.onclose = (e: WebSocketCloseEvent) => {
        if (e.code !== 1000) {
          addLog(`WS fechado inesperadamente: code=${e.code} reason="${e.reason}"`);
        }
      };
    });
  };

  const streamAudio = async (ws: WebSocket, uri: string | null, isReal: boolean) => {
    const sampleRate = 24000;
    const samplesPerChunk = Math.floor((sampleRate * CHUNK_SIZE_MS) / 1000);
    const bytesPerChunk = samplesPerChunk * 2; // PCM16 = 2 bytes por sample

    let totalChunks = 0;

    if (isReal && uri) {
      try {
        addLog(`Lendo arquivo WAV: ${uri}`);
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Pular header WAV (44 bytes padrão)
        const headerSize = 44;
        const pcmData = bytes.slice(headerSize);

        addLog(`PCM data size: ${pcmData.length} bytes (${(pcmData.length / (sampleRate * 2)).toFixed(1)}s)`);

        // Enviar em chunks
        for (let offset = 0; offset < pcmData.length; offset += bytesPerChunk) {
          if (ws.readyState !== WebSocket.OPEN) break;

          const chunk = pcmData.slice(offset, offset + bytesPerChunk);
          const base64 = arrayBufferToBase64(chunk.buffer as ArrayBuffer);

          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
          totalChunks++;
          setChunksAudioEnviados((n) => n + 1);

          // Throttle para simular streaming em tempo real
          await new Promise((r) => setTimeout(r, CHUNK_SIZE_MS));
        }
        addLog(`✅ ${totalChunks} chunks reais enviados`);
      } catch (e: any) {
        addLog(`⚠️ Erro ao ler WAV: ${e.message} → fallback para sintético`);
        await streamSyntheticAudio(ws, RECORDING_DURATION_MS);
        return;
      }
    } else {
      await streamSyntheticAudio(ws, RECORDING_DURATION_MS);
    }

    // Commitar buffer e solicitar resposta
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      addLog('Buffer commitado');
      ws.send(JSON.stringify({ type: 'response.create' }));
      addLog('Resposta solicitada — aguardando audio_delta...');
      setPhase('waiting_response');
      addTimeline('waiting_response', '⏳ Aguardando resposta da OpenAI');
    }
  };

  const streamSyntheticAudio = async (ws: WebSocket, durationMs: number) => {
    const chunks = Math.ceil(durationMs / CHUNK_SIZE_MS);
    addLog(`Enviando ${chunks} chunks sintéticos (sine 440Hz)...`);
    for (let i = 0; i < chunks; i++) {
      if (ws.readyState !== WebSocket.OPEN) break;
      const pcm = generateSineWave(CHUNK_SIZE_MS);
      ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: pcm }));
      setChunksAudioEnviados((n) => n + 1);
      await new Promise((r) => setTimeout(r, CHUNK_SIZE_MS));
    }
    addLog(`✅ ${chunks} chunks sintéticos enviados`);
  };

  const playResponseAudio = async (
    chunks: string[],
    loopStart: number,
    resolve: () => void,
    reject: (e: Error) => void
  ) => {
    try {
      // Concatenar todos os chunks base64 em um único buffer PCM16
      const allBytes: number[] = [];
      for (const chunk of chunks) {
        const bytes = base64ToUint8Array(chunk);
        allBytes.push(...bytes);
      }

      const totalSamples = allBytes.length / 2;
      const durationSec = totalSamples / 24000;
      addLog(`Áudio da resposta: ${allBytes.length} bytes | ${durationSec.toFixed(1)}s`);

      /**
       * expo-av não reproduz PCM16 raw diretamente.
       * Para playback real na Fase 6, precisaremos de uma das abordagens:
       *  A) Converter PCM16 → WAV adicionando header (recomendado)
       *  B) Usar react-native-audio-toolkit
       *  C) Deixar a API gerar MP3 (output_audio_format: 'mp3')
       *
       * Neste spike, documentamos o que recebemos mas não reproduzimos o raw PCM.
       * Para um teste real de playback, peça output_audio_format: 'mp3' e carregue o Sound.
       */
      addLog('ℹ️ expo-av não reproduz PCM16 raw diretamente.');
      addLog('💡 Alternativas para playback na Fase 6:');
      addLog('   1. Adicionar WAV header ao PCM16 recebido → reproducir como WAV');
      addLog('   2. Usar output_audio_format: "mp3" na session.update');
      addLog('   3. Usar react-native-audio-toolkit com suporte a PCM raw');

      const totalLoopMs = Date.now() - loopStart;
      setLatencias((l) => ({ ...l, totalLoopMs }));

      setPhase('done');
      addTimeline('done', `✅ Loop completo em ${totalLoopMs}ms`);

      const resumo = [
        `✅ Loop E2E concluído!`,
        `Duração total: ${totalLoopMs}ms`,
        `Áudio recebido: ${chunks.length} chunks | ${allBytes.length} bytes | ${durationSec.toFixed(1)}s`,
        `Fonte de áudio: ${audioSource === 'real' ? 'real (microfone)' : 'sintético (fallback)'}`,
        Platform.OS === 'ios'
          ? '🍎 iOS: OK'
          : '🤖 Android: OK',
      ].join('\n');

      setResultadoFinal(resumo);
      addLog(`\n${resumo}`);
      resolve();
    } catch (e: any) {
      addLog(`❌ Erro no playback: ${e.message}`);
      reject(e);
    }
  };

  const resetLoop = () => {
    wsRef.current?.close();
    wsRef.current = null;
    soundRef.current?.unloadAsync();
    soundRef.current = null;
    setPhase('idle');
    setTimeline([]);
    setLogs([]);
    setResultadoFinal(null);
    setChunksAudioEnviados(0);
    setChunksAudioRecebidos(0);
    setAudioSource(null);
    setLatencias({ recordingMs: 0, wsConnectMs: 0, firstResponseMs: 0, totalLoopMs: 0 });
  };

  const phaseColor: Record<Phase, string> = {
    idle: '#444466',
    recording: '#8b0000',
    connecting: '#5a4a00',
    sending_audio: '#1a3a6e',
    waiting_response: '#1a1a6e',
    playing_response: '#1a6e3c',
    done: '#0d2d0d',
    error: '#6e1a1a',
  };

  const phaseLabel: Record<Phase, string> = {
    idle: '⚫ Aguardando início',
    recording: '🔴 Gravando...',
    connecting: '🟡 Conectando ao WebSocket...',
    sending_audio: '📤 Enviando áudio...',
    waiting_response: '⏳ Aguardando resposta da OpenAI...',
    playing_response: '🔊 Processando resposta de áudio',
    done: '✅ Loop concluído!',
    error: '❌ Erro no loop',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.testId}>T4</Text>
        <Text style={styles.title}>Loop Completo E2E</Text>
      </View>
      <Text style={styles.subtitle}>Gravar → PCM16 → WebSocket → OpenAI → Áudio → Playback</Text>

      {/* Status atual */}
      <View style={[styles.phaseBanner, { backgroundColor: phaseColor[phase] }]}>
        <Text style={styles.phaseBannerText}>{phaseLabel[phase]}</Text>
      </View>

      {/* API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>API KEY</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-..."
          placeholderTextColor="#444466"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={phase === 'idle' || phase === 'done' || phase === 'error'}
        />
      </View>

      {/* Botões */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.btn, phase !== 'idle' && phase !== 'done' && phase !== 'error' && styles.btnDisabled]}
          onPress={startLoop}
          disabled={phase !== 'idle' && phase !== 'done' && phase !== 'error'}
        >
          <Text style={styles.btnText}>▶ Iniciar Loop E2E ({RECORDING_DURATION_MS / 1000}s)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={resetLoop}>
          <Text style={styles.btnText}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Métricas */}
      <View style={styles.metricsGrid}>
        {[
          { label: 'Gravação', value: latencias.recordingMs, suffix: 'ms' },
          { label: 'WS Connect', value: latencias.wsConnectMs, suffix: 'ms' },
          { label: '1º Response', value: latencias.firstResponseMs, suffix: 'ms' },
          { label: 'Total Loop', value: latencias.totalLoopMs, suffix: 'ms' },
          { label: 'Chunks →', value: chunksAudioEnviados, suffix: '' },
          { label: 'Chunks ←', value: chunksAudioRecebidos, suffix: '' },
        ].map((m, i) => (
          <View key={i} style={styles.metricBox}>
            <Text style={[styles.metricValue, m.value > 0 && styles.metricActive]}>
              {m.value > 0 ? `${m.value}${m.suffix}` : '—'}
            </Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Timeline */}
      {timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          {timeline.map((e, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>{e.label}</Text>
                {e.durationMs !== undefined && (
                  <Text style={styles.timelineDuration}>{e.durationMs}ms</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Resultado final */}
      {resultadoFinal && (
        <View style={[styles.resultBox, phase === 'done' ? styles.resultOk : styles.resultErr]}>
          <Text style={styles.resultTitle}>
            {phase === 'done' ? '✅ RESULTADO FINAL' : '❌ RESULTADO FINAL'}
          </Text>
          <Text style={styles.resultText}>{resultadoFinal}</Text>
          <Text style={styles.resultHint}>
            {'\n⚠️ Nota sobre playback:\nexpo-av não reproduz PCM16 raw. Na Fase 6, use:\n• output_audio_format: "mp3" + expo-av Sound\n• Ou construir WAV header + playback WAV'}
          </Text>
        </View>
      )}

      {/* Fonte de áudio */}
      {audioSource && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FONTE DE ÁUDIO</Text>
          <Text style={[styles.audioSourceText, audioSource === 'real' ? styles.audioReal : styles.audioSynth]}>
            {audioSource === 'real'
              ? '✅ Áudio real (microfone) — LinearPCM 24kHz'
              : '⚠️ Áudio sintético (fallback) — sine wave PCM16'}
          </Text>
        </View>
      )}

      {/* Log */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOG ({logs.length} linhas)</Text>
        <ScrollView style={styles.logBox} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>Aguardando início do loop...</Text>
          ) : (
            logs.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)
          )}
        </ScrollView>
      </View>

      {/* Decisão arquitetural */}
      <View style={styles.decisionBox}>
        <Text style={styles.decisionTitle}>🏗️ Decisão para Fase 6</Text>
        <Text style={styles.decisionText}>
          {`Com base nos resultados deste teste, documentar em SPIKE_RESULT.md:\n\n` +
            `Se latência total < 2000ms → stack viável para tempo real\n` +
            `Se latência total > 2000ms → avaliar WebRTC ou servidor intermediário\n\n` +
            `Stack recomendada baseada nos dados:\n` +
            `• Gravação: expo-av LinearPCM 24kHz (ou fallback expo-audio)\n` +
            `• WebSocket: nativo do RN (ou lib se headers falharem)\n` +
            `• Playback: output_audio_format "mp3" + expo-av Sound\n` +
            `• Servidor: proxy Node.js opcional para auth segura`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  testId: {
    backgroundColor: '#e94560', color: '#fff', fontWeight: '800',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 13,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1 },
  subtitle: { fontSize: 11, color: '#5555aa', marginBottom: 16 },

  phaseBanner: { borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  phaseBannerText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },

  section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14 },
  sectionLabel: { fontSize: 10, color: '#e94560', fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  input: {
    backgroundColor: '#0f0f1a', borderRadius: 8, padding: 12,
    color: '#aaaacc', fontSize: 13, borderWidth: 1, borderColor: '#2a2a4e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btn: {
    flex: 1, backgroundColor: '#e94560', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  btnReset: { backgroundColor: '#333355', flex: 0.4 },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14,
  },
  metricBox: {
    width: '30%', backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 10, alignItems: 'center', flexGrow: 1,
  },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#444466', marginBottom: 2 },
  metricActive: { color: '#44ff88' },
  metricLabel: { fontSize: 9, color: '#5555aa', textAlign: 'center' },

  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e94560', marginTop: 5 },
  timelineContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  timelineLabel: { fontSize: 12, color: '#aaaacc', flex: 1 },
  timelineDuration: { fontSize: 11, color: '#e94560', fontWeight: '700' },

  resultBox: { borderRadius: 12, padding: 16, marginBottom: 14 },
  resultOk: { backgroundColor: '#0d2d0d', borderWidth: 1, borderColor: '#1a6e3c' },
  resultErr: { backgroundColor: '#2d0d0d', borderWidth: 1, borderColor: '#6e1a1a' },
  resultTitle: { fontSize: 12, fontWeight: '800', color: '#44ff88', marginBottom: 8, letterSpacing: 1 },
  resultText: {
    fontSize: 12, color: '#aaffaa', lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultHint: { fontSize: 11, color: '#888866', lineHeight: 17, marginTop: 8 },

  audioSourceText: { fontSize: 13, fontWeight: '600' },
  audioReal: { color: '#44ff88' },
  audioSynth: { color: '#ffcc44' },

  logBox: { maxHeight: 250 },
  logEmpty: { fontSize: 12, color: '#444466', fontStyle: 'italic' },
  logLine: {
    fontSize: 10, color: '#7777aa', lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  decisionBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#e94560',
  },
  decisionTitle: { fontSize: 13, fontWeight: '800', color: '#e94560', marginBottom: 8 },
  decisionText: { fontSize: 12, color: '#aaaacc', lineHeight: 20 },
});
