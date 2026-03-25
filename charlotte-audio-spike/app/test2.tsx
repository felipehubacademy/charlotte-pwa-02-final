/**
 * TESTE 2 — Conversão para PCM16 24kHz
 *
 * A OpenAI Realtime API exige: PCM16 mono, 24kHz, little-endian
 *
 * Estratégias testadas neste arquivo:
 *
 *  Estratégia A: expo-audio com HIGH_QUALITY preset
 *    → Grava em m4a/aac, precisa de conversão
 *
 *  Estratégia B: expo-av Audio.RecordingOptionsPresets.HIGH_QUALITY
 *    com customização de sampleRate
 *    → Testa se sampleRate: 24000 é respeitado
 *
 *  Estratégia C: expo-av LinearPCM
 *    → Grava diretamente em WAV/PCM se a plataforma suportar
 *
 * Resultado esperado para passar:
 *  ✅ Consegue gravar em PCM16 24kHz OU
 *  ⚠️  Consegue gravar em outro formato e converter via JS
 */
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Strategy = 'A' | 'B' | 'C';

type StrategyResult = {
  strategy: Strategy;
  label: string;
  status: '✅' | '❌' | '⚠️' | '⏳' | '—';
  detail: string;
  uri?: string;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
};

// Configuração para LinearPCM via expo-av (Estratégia C)
const PCM_RECORDING_OPTIONS: Audio.RecordingOptions = {
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
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 384000,
  },
};

// Configuração HIGH_QUALITY com 24kHz (Estratégia B)
const HIGH_QUALITY_24K: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitDepth: 16,
  },
  web: {
    mimeType: 'audio/mp4',
    bitsPerSecond: 128000,
  },
};

export default function Test2Screen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [results, setResults] = useState<StrategyResult[]>([
    { strategy: 'A', label: 'expo-audio HIGH_QUALITY (baseline)', status: '—', detail: 'Não testado (ver Teste 1)' },
    { strategy: 'B', label: 'expo-av AAC com sampleRate 24000', status: '⏳', detail: 'Aguardando teste' },
    { strategy: 'C', label: 'expo-av LinearPCM 16-bit 24kHz', status: '⏳', detail: 'Aguardando teste' },
  ]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [jsConversionResult, setJsConversionResult] = useState<string | null>(null);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 80));
  };

  const updateResult = (strategy: Strategy, update: Partial<StrategyResult>) => {
    setResults((prev) =>
      prev.map((r) => (r.strategy === strategy ? { ...r, ...update } : r))
    );
  };

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permissão de microfone não concedida.');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      addLog('✅ expo-av inicializado. Permissão: ' + status);
    })();
  }, []);

  const runStrategy = async (strategy: 'B' | 'C') => {
    if (recording) {
      addLog('⚠️ Há uma gravação em andamento. Pare antes de iniciar outra.');
      return;
    }
    setActiveStrategy(strategy);
    const options = strategy === 'B' ? HIGH_QUALITY_24K : PCM_RECORDING_OPTIONS;
    const label = strategy === 'B' ? 'AAC 24kHz' : 'LinearPCM 24kHz';

    try {
      addLog(`▶️ [Estratégia ${strategy}] Iniciando gravação: ${label}`);
      updateResult(strategy, { status: '⏳', detail: 'Gravando 3 segundos...' });

      const { recording: rec } = await Audio.Recording.createAsync(options);
      setRecording(rec);
      addLog(`🔴 [Estratégia ${strategy}] Gravando... aguarde 3s`);

      // Grava por 3 segundos automaticamente
      await new Promise((r) => setTimeout(r, 3000));

      addLog(`⏹ [Estratégia ${strategy}] Parando gravação...`);
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const status = await rec.getStatusAsync();
      setRecording(null);
      setActiveStrategy(null);

      if (!uri) {
        updateResult(strategy, { status: '❌', detail: 'URI retornada é null' });
        addLog(`❌ [Estratégia ${strategy}] URI null`);
        return;
      }

      const ext = uri.split('.').pop()?.toLowerCase();
      const durationMs = status.durationMillis ?? 0;
      const isPcm = ext === 'wav' || ext === 'pcm';

      addLog(`✅ [Estratégia ${strategy}] URI: ${uri}`);
      addLog(`📊 Duração: ${(durationMs / 1000).toFixed(1)}s | Ext: .${ext}`);

      const detail = [
        `URI: ...${uri.slice(-40)}`,
        `Extensão: .${ext}`,
        `Duração: ${(durationMs / 1000).toFixed(1)}s`,
        isPcm ? '🎯 É WAV/PCM — potencialmente utilizável!' : '⚠️ Formato comprimido — precisa de conversão',
        `Platform: ${Platform.OS}`,
      ].join('\n');

      updateResult(strategy, {
        status: isPcm ? '✅' : '⚠️',
        detail,
        uri,
      });

      // Se for WAV, testar extração de header
      if (isPcm && strategy === 'C') {
        await analyzeWavHeader(uri, strategy);
      }
    } catch (e: any) {
      addLog(`❌ [Estratégia ${strategy}] Erro: ${e.message}`);
      updateResult(strategy, { status: '❌', detail: `Erro: ${e.message}` });
      setRecording(null);
      setActiveStrategy(null);
    }
  };

  /**
   * Analisa o header WAV para confirmar sampleRate, channels e bit depth
   * O header WAV RIFF tem formato fixo nos primeiros 44 bytes:
   * Bytes 24-27: sampleRate (little-endian uint32)
   * Bytes 22-23: channels (little-endian uint16)
   * Bytes 34-35: bitsPerSample (little-endian uint16)
   */
  const analyzeWavHeader = async (uri: string, strategy: Strategy) => {
    try {
      addLog('🔬 Analisando header WAV...');
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (bytes.length < 44) {
        addLog('⚠️ Arquivo muito pequeno para ser WAV válido');
        return;
      }

      // Verificar magic "RIFF"
      const riff = String.fromCharCode(...bytes.slice(0, 4));
      const wave = String.fromCharCode(...bytes.slice(8, 12));

      if (riff !== 'RIFF' || wave !== 'WAVE') {
        addLog(`⚠️ Não é WAV válido: magic="${riff}" wave="${wave}"`);
        return;
      }

      // Ler campos do header (little-endian)
      const view = new DataView(buffer);
      const channels = view.getUint16(22, true);
      const sampleRate = view.getUint32(24, true);
      const bitsPerSample = view.getUint16(34, true);
      const byteRate = view.getUint32(28, true);

      const analysis = [
        `Canais: ${channels} (${channels === 1 ? '✅ mono' : '⚠️ não-mono'})`,
        `SampleRate: ${sampleRate} Hz (${sampleRate === 24000 ? '✅ 24kHz' : `⚠️ ${sampleRate}Hz — esperado 24000`})`,
        `BitDepth: ${bitsPerSample}-bit (${bitsPerSample === 16 ? '✅ PCM16' : `⚠️ ${bitsPerSample}-bit`})`,
        `ByteRate: ${byteRate} B/s`,
        `TamanhoTotal: ${buffer.byteLength} bytes`,
      ].join('\n');

      addLog(`📊 Header WAV:\n${analysis}`);
      setJsConversionResult(analysis);

      updateResult(strategy, {
        sampleRate,
        channels,
        bitDepth: bitsPerSample,
        status: sampleRate === 24000 && channels === 1 && bitsPerSample === 16 ? '✅' : '⚠️',
        detail:
          sampleRate === 24000 && channels === 1 && bitsPerSample === 16
            ? `✅ PCM16 mono 24kHz confirmado!\n${analysis}`
            : `⚠️ Formato próximo mas não exato:\n${analysis}`,
      });
    } catch (e: any) {
      addLog(`❌ Erro ao analisar header: ${e.message}`);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      addLog('⏹ Interrompendo gravação manualmente...');
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setActiveStrategy(null);
      addLog('Gravação interrompida manualmente');
    } catch (e: any) {
      addLog(`Erro ao interromper: ${e.message}`);
    }
  };

  const statusColor = (s: StrategyResult['status']) => {
    if (s === '✅') return '#1a6e3c';
    if (s === '❌') return '#6e1a1a';
    if (s === '⚠️') return '#5a4a00';
    return '#1a1a2e';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.testId}>T2</Text>
        <Text style={styles.title}>Conversão PCM16 24kHz</Text>
      </View>
      <Text style={styles.subtitle}>Objetivo: confirmar formato compatível com OpenAI Realtime API</Text>

      {/* Requisito */}
      <View style={styles.requirementBox}>
        <Text style={styles.requirementTitle}>🎯 Requisito da OpenAI Realtime API</Text>
        <Text style={styles.requirementCode}>
          {`Format:     PCM16 (Linear PCM, 16-bit)\nSample Rate: 24.000 Hz\nChannels:   1 (mono)\nEndian:     Little-endian`}
        </Text>
      </View>

      {/* Estratégias */}
      <Text style={styles.sectionLabel}>ESTRATÉGIAS</Text>

      {results.map((r) => (
        <View key={r.strategy} style={[styles.strategyCard, { borderLeftColor: r.status === '✅' ? '#1a6e3c' : r.status === '❌' ? '#e94560' : '#444466' }]}>
          <View style={styles.strategyHeader}>
            <Text style={styles.strategyId}>Estratégia {r.strategy}</Text>
            <Text style={styles.strategyStatus}>{r.status}</Text>
          </View>
          <Text style={styles.strategyLabel}>{r.label}</Text>

          <Text style={[styles.strategyDetail, { backgroundColor: statusColor(r.status) }]}>
            {r.detail}
          </Text>

          {(r.strategy === 'B' || r.strategy === 'C') && (
            <View style={styles.buttonRow}>
              {activeStrategy === r.strategy ? (
                <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={stopRecording}>
                  <Text style={styles.btnText}>⏹ Interromper</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, activeStrategy !== null && styles.btnDisabled]}
                  onPress={() => runStrategy(r.strategy as 'B' | 'C')}
                  disabled={activeStrategy !== null}
                >
                  <Text style={styles.btnText}>
                    {activeStrategy === r.strategy ? '🔴 Gravando 3s...' : `▶ Testar Estratégia ${r.strategy}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}

      {/* Análise WAV */}
      {jsConversionResult && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ANÁLISE DO HEADER WAV</Text>
          <Text style={styles.codeBlock}>{jsConversionResult}</Text>
        </View>
      )}

      {/* Recomendação */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Alternativa: Conversão em JS</Text>
        <Text style={styles.infoText}>
          {`Se nenhuma estratégia gerar PCM16 24kHz diretamente, é possível:\n\n` +
            `1. Gravar em qualquer formato\n` +
            `2. Enviar ao servidor para conversão via ffmpeg\n` +
            `3. Ou converter parcialmente no cliente com resampling JS\n\n` +
            `Porém, isso aumenta a latência. O ideal é gravar em PCM direto.`}
        </Text>
      </View>

      {/* Log */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOG</Text>
        <View style={styles.logBox}>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>Aguardando testes...</Text>
          ) : (
            logs.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)
          )}
        </View>
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
  subtitle: { fontSize: 12, color: '#5555aa', marginBottom: 16 },

  requirementBox: {
    backgroundColor: '#0d1a2e', borderRadius: 10, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#1a3a6e',
  },
  requirementTitle: { fontSize: 12, fontWeight: '700', color: '#6699ff', marginBottom: 8 },
  requirementCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12, color: '#aaccff', lineHeight: 20,
  },

  sectionLabel: { fontSize: 10, color: '#e94560', fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  strategyCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 12, borderLeftWidth: 4,
  },
  strategyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  strategyId: { fontSize: 11, fontWeight: '800', color: '#e94560', letterSpacing: 1 },
  strategyStatus: { fontSize: 18 },
  strategyLabel: { fontSize: 13, fontWeight: '600', color: '#ccccee', marginBottom: 8 },
  strategyDetail: {
    fontSize: 11, color: '#aaaacc', lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 8, borderRadius: 6, marginBottom: 10,
  },

  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, backgroundColor: '#e94560', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  btnStop: { backgroundColor: '#444466' },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14 },

  codeBlock: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, color: '#aaffaa', lineHeight: 18,
  },

  infoBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#4444aa',
  },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#8888ff', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#8888aa', lineHeight: 19 },

  logBox: { maxHeight: 200 },
  logEmpty: { fontSize: 12, color: '#444466', fontStyle: 'italic' },
  logLine: {
    fontSize: 11, color: '#7777aa', lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
