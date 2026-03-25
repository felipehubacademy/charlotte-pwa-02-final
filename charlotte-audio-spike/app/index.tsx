/**
 * Charlotte Audio Spike — Menu Principal
 *
 * Ponto de entrada do spike técnico. Navega para cada teste isolado.
 * Execute cada teste em ordem para validar a viabilidade do stack de áudio.
 */
import { useRouter } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TestStatus = '⏳ Pendente' | '✅ OK' | '❌ Falhou' | '⚠️ Parcial';

interface TestCard {
  id: string;
  route: '/test1' | '/test2' | '/test3' | '/test4';
  title: string;
  description: string;
  objective: string;
  status: TestStatus;
}

const TESTS: TestCard[] = [
  {
    id: 'T1',
    route: '/test1',
    title: 'Gravação & Playback',
    description: 'expo-audio — gravação básica, parar e reproduzir',
    objective: 'Confirmar que expo-audio grava em iOS e Android. Verificar formato de saída (m4a / wav / pcm).',
    status: '⏳ Pendente',
  },
  {
    id: 'T2',
    route: '/test2',
    title: 'Conversão PCM16 24kHz',
    description: 'expo-av AudioRecorder com sampleRate 24000',
    objective: 'Validar se é possível gravar ou converter para PCM16 raw a 24 kHz, formato exigido pela OpenAI Realtime API.',
    status: '⏳ Pendente',
  },
  {
    id: 'T3',
    route: '/test3',
    title: 'WebSocket OpenAI Realtime',
    description: 'Conexão WSS + session.update + audio_append',
    objective: 'Confirmar que WebSocket nativo do RN conecta em wss://api.openai.com/v1/realtime, envia áudio e recebe audio_delta.',
    status: '⏳ Pendente',
  },
  {
    id: 'T4',
    route: '/test4',
    title: 'Loop Completo E2E',
    description: 'Gravar → PCM16 → WS → OpenAI → Playback',
    objective: 'Medir latência e qualidade do loop end-to-end. Definir se a stack é viável para conversação em tempo real.',
    status: '⏳ Pendente',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🏥 Charlotte RN</Text>
        <Text style={styles.subtitle}>Spike Técnico — Áudio & Voice</Text>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>Platform: {Platform.OS.toUpperCase()}</Text>
          <Text style={styles.metaText}>RN: {Platform.Version}</Text>
        </View>
      </View>

      {/* Objetivo */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎯 Objetivo do Spike</Text>
        <Text style={styles.infoText}>
          Validar em 2–3 dias se é viável gravar PCM16 no React Native e
          fazer streaming bidirecional com a OpenAI Realtime API. Execute
          os testes em ordem. Documente cada resultado no SPIKE_RESULT.md.
        </Text>
      </View>

      {/* Cards de Teste */}
      <Text style={styles.sectionTitle}>Testes</Text>
      {TESTS.map((test) => (
        <TouchableOpacity
          key={test.id}
          style={styles.card}
          onPress={() => router.push(test.route)}
          activeOpacity={0.75}
        >
          <View style={styles.cardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{test.id}</Text>
            </View>
            <Text style={styles.cardTitle}>{test.title}</Text>
            <Text style={styles.statusText}>{test.status}</Text>
          </View>
          <Text style={styles.cardDesc}>{test.description}</Text>
          <Text style={styles.cardObjective}>{test.objective}</Text>
          <Text style={styles.cardCta}>Abrir Teste →</Text>
        </TouchableOpacity>
      ))}

      {/* Checklist */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 Perguntas a Responder</Text>
        {[
          'expo-audio suporta PCM16 raw? Ou precisamos de expo-av?',
          'Precisamos de react-native-live-audio-stream?',
          'WebSocket funciona nativamente ou precisa de polyfill?',
          'Latência do loop completo é aceitável para tempo real?',
          'iOS e Android se comportam igual? Quais diferenças?',
        ].map((q, i) => (
          <Text key={i} style={styles.checkItem}>{'☐  ' + q}</Text>
        ))}
      </View>

      <Text style={styles.footer}>
        Após executar todos os testes → preencher SPIKE_RESULT.md
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 48 },

  header: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  logo: { fontSize: 28, fontWeight: '800', color: '#e94560', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8888aa', marginBottom: 10 },
  metaBadge: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: { fontSize: 11, color: '#5555aa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  infoBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#e94560',
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#e94560', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#aaaacc', lineHeight: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  badge: {
    backgroundColor: '#e94560',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#ffffff' },
  statusText: { fontSize: 12, color: '#8888aa' },
  cardDesc: { fontSize: 13, color: '#6666aa', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  cardObjective: { fontSize: 12, color: '#aaaacc', lineHeight: 18, marginBottom: 10 },
  cardCta: { fontSize: 13, color: '#e94560', fontWeight: '600', textAlign: 'right' },

  checkItem: { fontSize: 12, color: '#8888aa', lineHeight: 22 },

  footer: { textAlign: 'center', fontSize: 11, color: '#444466', marginTop: 8 },
});
