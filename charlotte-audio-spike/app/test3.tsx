/**
 * TESTE 3 — WebSocket com OpenAI Realtime API
 *
 * Testa:
 *  1. Conexão WebSocket nativa do RN → wss://api.openai.com/v1/realtime
 *  2. Envio de session.update (configuração)
 *  3. Envio de input_audio_buffer.append (chunk de áudio PCM16 simulado)
 *  4. Recepção de response.audio.delta
 *
 * NÃO usa expo-audio neste teste — o áudio é simulado via sine wave
 * para isolar o problema do WebSocket do problema de gravação.
 *
 * Configure sua chave em .env:
 *  EXPO_PUBLIC_OPENAI_API_KEY=sk-...
 */
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

// Pegar chave do ambiente (EXPO_PUBLIC_ é exposta no RN)
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type WSEvent = {
  direction: '→' | '←';
  type: string;
  summary: string;
  timestamp: string;
  raw?: string;
};

/**
 * Gera um buffer PCM16 sintético (sine wave 440Hz, 1s, 24kHz)
 * Usado para simular envio de áudio sem precisar de microfone neste teste
 */
function generateSineWavePCM16(durationSeconds = 1, sampleRate = 24000, frequency = 440): string {
  const numSamples = sampleRate * durationSeconds;
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Amplitude reduzida para não saturar
    buffer[i] = Math.round(8000 * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
  }

  // Converter para base64
  const uint8 = new Uint8Array(buffer.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

export default function Test3Screen() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioReceived, setAudioReceived] = useState(false);
  const [audioChunksReceived, setAudioChunksReceived] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const connectTimeRef = useRef<number>(0);
  const firstAudioTimeRef = useRef<number>(0);

  const addEvent = (event: Omit<WSEvent, 'timestamp'>) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    setEvents((prev) => [{ ...event, timestamp }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connect = () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key necessária', 'Insira sua OpenAI API Key antes de conectar.');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionState('connecting');
    setEvents([]);
    setSessionId(null);
    setAudioReceived(false);
    setAudioChunksReceived(0);
    setLatencyMs(null);
    connectTimeRef.current = Date.now();

    addEvent({ direction: '→', type: 'connect', summary: `Conectando a ${WS_URL}` });

    try {
      /**
       * React Native tem WebSocket nativo desde RN 0.60+
       * Suporte a headers customizados via terceiro parâmetro (protocols)
       * Para headers de auth, alguns RN WebSocket não suportam diretamente.
       *
       * Tentativa 1: URL com query param (não suportado pela OpenAI)
       * Tentativa 2: Headers via protocolo (workaround comum)
       * Tentativa 3: WebSocket com subprotocol "realtime" + Bearer header
       */
      const ws = new WebSocket(WS_URL, [], {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      } as any); // Cast necessário pois RN aceita options não-padrão

      wsRef.current = ws;

      ws.onopen = () => {
        const elapsed = Date.now() - connectTimeRef.current;
        setConnectionState('connected');
        addEvent({
          direction: '←',
          type: 'open',
          summary: `✅ WebSocket conectado em ${elapsed}ms`,
        });

        // Enviar session.update imediatamente após conexão
        sendSessionUpdate(ws);
      };

      ws.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handleServerEvent(data);
        } catch {
          addEvent({
            direction: '←',
            type: 'raw',
            summary: `Mensagem não-JSON: ${String(event.data).slice(0, 100)}`,
          });
        }
      };

      ws.onerror = (error: Event) => {
        setConnectionState('error');
        addEvent({
          direction: '←',
          type: 'error',
          summary: `❌ Erro WebSocket: ${JSON.stringify(error)}`,
        });
      };

      ws.onclose = (event: WebSocketCloseEvent) => {
        setConnectionState('disconnected');
        addEvent({
          direction: '←',
          type: 'close',
          summary: `Conexão encerrada — code: ${event.code} reason: "${event.reason || 'sem reason'}"`,
        });
      };
    } catch (e: any) {
      setConnectionState('error');
      addEvent({ direction: '←', type: 'error', summary: `❌ Exceção ao criar WebSocket: ${e.message}` });
    }
  };

  const sendSessionUpdate = (ws: WebSocket) => {
    const payload = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
        },
        instructions: 'Você é Charlotte, uma enfermeira de triagem. Responda brevemente em português.',
      },
    };

    ws.send(JSON.stringify(payload));
    addEvent({
      direction: '→',
      type: 'session.update',
      summary: 'Enviado session.update (modalities: text+audio, voice: alloy, format: pcm16)',
      raw: JSON.stringify(payload, null, 2),
    });
  };

  const handleServerEvent = (data: any) => {
    const type: string = data.type ?? 'unknown';

    switch (type) {
      case 'session.created':
        setSessionId(data.session?.id ?? null);
        addEvent({
          direction: '←',
          type,
          summary: `✅ Sessão criada — ID: ${data.session?.id ?? '?'} | Modelo: ${data.session?.model ?? '?'}`,
        });
        break;

      case 'session.updated':
        addEvent({
          direction: '←',
          type,
          summary: `✅ Sessão configurada — voice: ${data.session?.voice} | input_format: ${data.session?.input_audio_format}`,
        });
        break;

      case 'input_audio_buffer.committed':
        addEvent({ direction: '←', type, summary: `Buffer de áudio recebido pelo servidor` });
        firstAudioTimeRef.current = Date.now();
        break;

      case 'response.created':
        addEvent({ direction: '←', type, summary: `Resposta em geração — ID: ${data.response?.id ?? '?'}` });
        break;

      case 'response.audio.delta':
        if (!audioReceived) {
          setAudioReceived(true);
          const latency = Date.now() - firstAudioTimeRef.current;
          setLatencyMs(latency);
          addEvent({
            direction: '←',
            type,
            summary: `✅ PRIMEIRO audio.delta recebido! Latência: ${latency}ms | chunk: ${data.delta?.length ?? 0} chars base64`,
          });
        }
        setAudioChunksReceived((n) => n + 1);
        break;

      case 'response.audio.done':
        addEvent({ direction: '←', type, summary: `✅ Audio completo recebido` });
        break;

      case 'response.done':
        addEvent({ direction: '←', type, summary: `Resposta finalizada` });
        break;

      case 'error':
        addEvent({
          direction: '←',
          type: 'error',
          summary: `❌ Erro da API: ${data.error?.message ?? JSON.stringify(data.error)}`,
          raw: JSON.stringify(data, null, 2),
        });
        break;

      default:
        addEvent({ direction: '←', type, summary: JSON.stringify(data).slice(0, 120) });
    }
  };

  const sendSyntheticAudio = () => {
    if (!wsRef.current || connectionState !== 'connected') {
      Alert.alert('Sem conexão', 'Conecte-se primeiro.');
      return;
    }

    addEvent({ direction: '→', type: 'audio_append', summary: 'Gerando sine wave PCM16 1s @ 24kHz...' });
    firstAudioTimeRef.current = Date.now();

    // Gerar e enviar áudio em 4 chunks de 250ms (simulando streaming real)
    const chunkDurationMs = 250;
    const chunksTotal = 4;

    for (let i = 0; i < chunksTotal; i++) {
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const pcm16Base64 = generateSineWavePCM16(chunkDurationMs / 1000, 24000, 440);
        const appendEvent = {
          type: 'input_audio_buffer.append',
          audio: pcm16Base64,
        };
        wsRef.current.send(JSON.stringify(appendEvent));
        addEvent({
          direction: '→',
          type: 'input_audio_buffer.append',
          summary: `Chunk ${i + 1}/${chunksTotal} — ${pcm16Base64.length} chars base64 (${chunkDurationMs}ms @ 24kHz)`,
        });

        // Após último chunk, commitar
        if (i === chunksTotal - 1) {
          setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            const commitEvent = { type: 'input_audio_buffer.commit' };
            wsRef.current.send(JSON.stringify(commitEvent));
            addEvent({ direction: '→', type: 'input_audio_buffer.commit', summary: 'Buffer commitado — aguardando resposta' });

            // Solicitar resposta
            const responseEvent = { type: 'response.create' };
            wsRef.current.send(JSON.stringify(responseEvent));
            addEvent({ direction: '→', type: 'response.create', summary: 'Solicitando resposta de áudio' });
          }, 100);
        }
      }, i * chunkDurationMs);
    }
  };

  const disconnect = () => {
    wsRef.current?.close(1000, 'Teste finalizado');
    wsRef.current = null;
  };

  const connectionColor = {
    disconnected: '#444466',
    connecting: '#5a4a00',
    connected: '#1a6e3c',
    error: '#6e1a1a',
  }[connectionState];

  const connectionLabel = {
    disconnected: '⚫ Desconectado',
    connecting: '🟡 Conectando...',
    connected: '🟢 Conectado',
    error: '🔴 Erro',
  }[connectionState];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.testId}>T3</Text>
        <Text style={styles.title}>WebSocket OpenAI Realtime</Text>
      </View>
      <Text style={styles.subtitle}>wss://api.openai.com/v1/realtime — sem áudio real, sine wave sintético</Text>

      {/* Status */}
      <View style={[styles.statusBanner, { backgroundColor: connectionColor }]}>
        <Text style={styles.statusBannerText}>{connectionLabel}</Text>
        {sessionId && <Text style={styles.sessionId}>Session: {sessionId}</Text>}
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
        />
        <Text style={styles.inputHint}>
          Ou defina EXPO_PUBLIC_OPENAI_API_KEY no .env
        </Text>
      </View>

      {/* Controles WS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CONTROLES</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, connectionState !== 'disconnected' && connectionState !== 'error' && styles.btnDisabled]}
            onPress={connect}
            disabled={connectionState === 'connecting' || connectionState === 'connected'}
          >
            <Text style={styles.btnText}>🔌 Conectar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnStop, connectionState !== 'connected' && styles.btnDisabled]}
            onPress={disconnect}
            disabled={connectionState !== 'connected'}
          >
            <Text style={styles.btnText}>✖ Desconectar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnAudio, connectionState !== 'connected' && styles.btnDisabled]}
          onPress={sendSyntheticAudio}
          disabled={connectionState !== 'connected'}
        >
          <Text style={styles.btnText}>🎵 Enviar Áudio Sintético (sine 440Hz, 1s)</Text>
        </TouchableOpacity>
      </View>

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{audioChunksReceived}</Text>
          <Text style={styles.metricLabel}>Chunks Recebidos</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, audioReceived && styles.metricSuccess]}>
            {latencyMs !== null ? `${latencyMs}ms` : '—'}
          </Text>
          <Text style={styles.metricLabel}>Latência (1º delta)</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, audioReceived && styles.metricSuccess]}>
            {audioReceived ? '✅' : '⏳'}
          </Text>
          <Text style={styles.metricLabel}>Áudio Recebido</Text>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CHECKLIST DE VALIDAÇÃO</Text>
        {[
          { label: 'WebSocket conecta no iOS?', done: connectionState === 'connected' && Platform.OS === 'ios' },
          { label: 'WebSocket conecta no Android?', done: connectionState === 'connected' && Platform.OS === 'android' },
          { label: 'Sessão criada?', done: !!sessionId },
          { label: 'Consegue enviar audio_append?', done: events.some(e => e.type === 'input_audio_buffer.append') },
          { label: 'Recebe audio_delta?', done: audioReceived },
        ].map((item, i) => (
          <View key={i} style={styles.checkRow}>
            <Text style={styles.checkIcon}>{item.done ? '✅' : '⏳'}</Text>
            <Text style={styles.checkLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Eventos WS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EVENTOS WEBSOCKET ({events.length})</Text>
        <View style={styles.logBox}>
          {events.length === 0 ? (
            <Text style={styles.logEmpty}>Aguardando conexão...</Text>
          ) : (
            events.map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <Text style={[styles.eventDir, e.direction === '→' ? styles.dirOut : styles.dirIn]}>
                  {e.direction}
                </Text>
                <View style={styles.eventBody}>
                  <Text style={styles.eventType}>{e.type}</Text>
                  <Text style={styles.eventSummary}>{e.summary}</Text>
                  <Text style={styles.eventTime}>{e.timestamp}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚠️ Nota sobre Headers no React Native</Text>
        <Text style={styles.infoText}>
          {`O WebSocket nativo do RN suporta headers customizados via terceiro argumento no construtor.\n\n` +
            `Se a conexão falhar com erro 401, pode ser necessário:\n` +
            `• Usar uma lib como "react-native-websocket" com melhor suporte a headers\n` +
            `• Ou fazer o auth via query string (se OpenAI suportar)\n` +
            `• Ou usar um proxy em Node.js intermediando a conexão`}
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

  statusBanner: { borderRadius: 10, padding: 10, marginBottom: 16, alignItems: 'center' },
  statusBannerText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
  sessionId: { fontSize: 10, color: '#aaffaa', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14 },
  sectionLabel: { fontSize: 10, color: '#e94560', fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  input: {
    backgroundColor: '#0f0f1a', borderRadius: 8, padding: 12,
    color: '#aaaacc', fontSize: 13, borderWidth: 1, borderColor: '#2a2a4e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 6,
  },
  inputHint: { fontSize: 10, color: '#444466' },

  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: {
    flex: 1, backgroundColor: '#e94560', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  btnStop: { backgroundColor: '#444466' },
  btnAudio: { backgroundColor: '#1a3a6e' },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricBox: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#aaaacc', marginBottom: 4 },
  metricSuccess: { color: '#44ff88' },
  metricLabel: { fontSize: 10, color: '#5555aa', textAlign: 'center' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkIcon: { fontSize: 16 },
  checkLabel: { fontSize: 13, color: '#aaaacc' },

  logBox: { maxHeight: 350 },
  logEmpty: { fontSize: 12, color: '#444466', fontStyle: 'italic' },

  eventRow: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  eventDir: { fontSize: 16, fontWeight: '800', width: 20 },
  dirOut: { color: '#e94560' },
  dirIn: { color: '#44ff88' },
  eventBody: { flex: 1 },
  eventType: { fontSize: 11, fontWeight: '700', color: '#8888ff', marginBottom: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  eventSummary: { fontSize: 12, color: '#aaaacc', lineHeight: 17 },
  eventTime: { fontSize: 10, color: '#444466', marginTop: 2 },

  infoBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#e94560',
  },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#ff8888', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#8888aa', lineHeight: 19 },
});
