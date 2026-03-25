/**
 * TESTE 1 — Gravação e Playback com expo-av (padrão estável)
 * expo-audio (novo) tem bugs no iOS com setAudioModeAsync.
 * expo-av é maduro e funciona confiavelmente.
 */
import { Audio } from 'expo-av';
import { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TestResult = {
  label: string;
  status: '✅' | '❌' | '⚠️' | '⏳';
  detail: string;
};

export default function Test1Screen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 50));
  };

  const setResult = (result: TestResult) => {
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.label === result.label);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const handleStartRecording = async () => {
    try {
      addLog('Solicitando permissão de microfone...');

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        addLog('❌ Permissão negada');
        setResult({ label: 'Permissão de microfone', status: '❌', detail: 'Usuário negou' });
        return;
      }

      addLog('✅ Permissão concedida');
      setResult({ label: 'Permissão de microfone', status: '✅', detail: 'Concedida' });

      // Passo obrigatório no iOS
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      addLog('✅ Modo de gravação iOS ativado');

      addLog('Iniciando gravação...');
      startTime.current = Date.now();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      durationTimer.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime.current) / 1000));
      }, 500);

      addLog('🔴 Gravando...');
      setResult({ label: `Gravação em ${Platform.OS}`, status: '⏳', detail: 'Em andamento...' });
    } catch (e: any) {
      addLog(`❌ Erro ao gravar: ${e.message}`);
      setResult({ label: `Gravação em ${Platform.OS}`, status: '❌', detail: e.message });
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (durationTimer.current) { clearInterval(durationTimer.current); durationTimer.current = null; }

      addLog('Parando gravação...');
      await recordingRef.current.stopAndUnloadAsync();

      // Restaurar modo de áudio para playback
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      setRecordingDuration(duration);

      if (uri) {
        setRecordingUri(uri);
        const extension = uri.split('.').pop()?.toLowerCase() ?? '?';
        addLog(`✅ Gravado: ${uri}`);
        addLog(`📁 Formato: .${extension} | Duração: ${duration}s`);

        setResult({
          label: `Gravação em ${Platform.OS}`,
          status: '✅',
          detail: `Duração: ${duration}s`,
        });
        setResult({
          label: 'Formato de saída',
          status: extension === 'pcm' ? '✅' : '⚠️',
          detail: extension === 'pcm'
            ? 'PCM nativo — ideal!'
            : `.${extension} — precisará converter para PCM16 (Teste 2)`,
        });
        setResult({
          label: 'URI do arquivo',
          status: '✅',
          detail: uri,
        });
      }
    } catch (e: any) {
      addLog(`❌ Erro ao parar: ${e.message}`);
      setIsRecording(false);
    }
  };

  const handlePlayback = async () => {
    if (!recordingUri) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      addLog('▶️ Iniciando playback...');
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;
      await sound.playAsync();
      addLog('✅ Playback OK');
      setResult({ label: 'Playback', status: '✅', detail: 'Reproduzindo sem erro' });
    } catch (e: any) {
      addLog(`❌ Erro no playback: ${e.message}`);
      setResult({ label: 'Playback', status: '❌', detail: e.message });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.testId}>T1</Text>
        <Text style={styles.title}>Gravação & Playback</Text>
      </View>
      <Text style={styles.subtitle}>expo-av — Audio.Recording (padrão estável)</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CONTROLES</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, isRecording && styles.btnDisabled]} onPress={handleStartRecording} disabled={isRecording}>
            <Text style={styles.btnText}>🔴 Gravar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnStop, !isRecording && styles.btnDisabled]} onPress={handleStopRecording} disabled={!isRecording}>
            <Text style={styles.btnText}>⏹ Parar</Text>
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.dot} />
            <Text style={styles.recordingText}>Gravando... {recordingDuration}s</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnPlay, !recordingUri && styles.btnDisabled]} onPress={handlePlayback} disabled={!recordingUri}>
          <Text style={styles.btnText}>▶️ Reproduzir gravação</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RESULTADOS</Text>
          {results.map((r, i) => (
            <View key={i} style={styles.resultRow}>
              <Text style={styles.resultIcon}>{r.status}</Text>
              <View style={styles.resultText}>
                <Text style={styles.resultLabel}>{r.label}</Text>
                <Text style={styles.resultDetail}>{r.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOG</Text>
        <View style={styles.logBox}>
          {logs.length === 0
            ? <Text style={styles.logEmpty}>Aguardando...</Text>
            : logs.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)
          }
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  testId: { backgroundColor: '#e94560', color: '#fff', fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 13 },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1 },
  subtitle: { fontSize: 11, color: '#5555aa', marginBottom: 16 },
  section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 14 },
  sectionLabel: { fontSize: 10, color: '#e94560', fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: { flex: 1, backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnStop: { backgroundColor: '#444466' },
  btnPlay: { backgroundColor: '#1a6e3c' },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e94560' },
  recordingText: { color: '#e94560', fontWeight: '600', fontSize: 13 },
  resultRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  resultIcon: { fontSize: 18, marginTop: 1 },
  resultText: { flex: 1 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  resultDetail: { fontSize: 11, color: '#8888aa', lineHeight: 17 },
  logBox: { maxHeight: 250 },
  logEmpty: { fontSize: 12, color: '#444466', fontStyle: 'italic' },
  logLine: { fontSize: 11, color: '#7777aa', lineHeight: 17, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
