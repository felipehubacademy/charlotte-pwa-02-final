// components/voice/LiveVoiceModal.tsx
// Live voice — UI estilo chamada WhatsApp
// Canal 1: Charlotte → iPhone  (response.audio.delta → WAV → AudioPlayer)
// Canal 2: iPhone → Charlotte  (mic chunks PCM16 → input_audio_buffer.append)

import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  AudioModule,
  type AudioPlayer,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { PhoneSlash, MicrophoneSlash, Microphone, SpeakerHigh, Ear } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import CallWave, { WaveState } from '@/components/voice/CallWave';
import { useCallTimer } from '@/hooks/useCallTimer';
import Constants from 'expo-constants';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

// ── Opções de gravação: Linear PCM 24 kHz mono (formato que OpenAI espera) ───
const MIC_OPTIONS = {
  extension: Platform.OS === 'ios' ? '.wav' : '.m4a',
  sampleRate: 24000,
  numberOfChannels: 1,
  bitRate: 384000,
  ios: {
    outputFormat: 'lpcm' as any,
    audioQuality: 'max' as any,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 384000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    outputFormat: 'MPEG_4' as any,
    audioEncoder: 'AAC' as any,
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
};

// ── Helpers de áudio ──────────────────────────────────────────────────────────

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

/** Monta chunks PCM16 base64 num WAV base64 pronto para tocar */
function buildWav(base64Chunks: string[]): string {
  const arrays = base64Chunks.map(base64ToUint8Array);
  const pcmLen = arrays.reduce((s, a) => s + a.length, 0);
  const pcm = new Uint8Array(pcmLen);
  let off = 0;
  for (const a of arrays) { pcm.set(a, off); off += a.length; }

  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const sr = 24000, ch = 1, bps = 16;
  // RIFF
  [0x52,0x49,0x46,0x46].forEach((b,i) => v.setUint8(i, b));
  v.setUint32(4, 36 + pcmLen, true);
  [0x57,0x41,0x56,0x45].forEach((b,i) => v.setUint8(8+i, b));
  // fmt
  [0x66,0x6D,0x74,0x20].forEach((b,i) => v.setUint8(12+i, b));
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * (bps/8), true); v.setUint16(32, ch * (bps/8), true);
  v.setUint16(34, bps, true);
  // data
  [0x64,0x61,0x74,0x61].forEach((b,i) => v.setUint8(36+i, b));
  v.setUint32(40, pcmLen, true);

  const wav = new Uint8Array(44 + pcmLen);
  wav.set(new Uint8Array(header)); wav.set(pcm, 44);
  return uint8ArrayToBase64(wav);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Gera PCM16 base64 para tom de chamada (440 Hz + 480 Hz mixed) ────────────
// Retorna raw PCM sem header (passa direto para buildWav)
function generateRingPcm(): string {
  const sampleRate  = 24000;
  const toneSamples = Math.floor(sampleRate * 1.0);    // 1 s de tom
  const silSamples  = Math.floor(sampleRate * 1.5);    // 1.5 s de silêncio
  const total       = toneSamples + silSamples;
  const pcm = new Uint8Array(total * 2);                // Int16LE

  for (let i = 0; i < toneSamples; i++) {
    const t   = i / sampleRate;
    const amp = 0.30 * 32767;
    const s   = amp * (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 480 * t)) / 2;
    const v   = Math.max(-32768, Math.min(32767, Math.round(s)));
    pcm[i * 2]     = v & 0xFF;
    pcm[i * 2 + 1] = (v >> 8) & 0xFF;
  }
  // silêncio: bytes já são 0

  // base64 em chunks para evitar stack overflow em strings longas
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < pcm.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, pcm.subarray(i, i + CHUNK) as any);
  }
  return btoa(bin);
}

// ── Frases de saudação por nível ────────────────────────────────────────────
const GREETINGS: Record<'Novice' | 'Inter' | 'Advanced', string[]> = {
  Novice: [
    'Oi! Que bom te ver! Vamos praticar English hoje?',
    'Olá! Tô aqui! Bora começar nossa aula?',
    'Ei! Saudade! Vamos praticar juntos hoje?',
    'Oi! Tudo bem? Bora falar um inglezinho?',
  ],
  Inter: [
    "Hey! Good to hear from you — what's been going on?",
    "Hey! How's your day been so far?",
    "Oh hey! What's up? Anything interesting happen lately?",
    "Hey! Been a while — what've you been up to?",
  ],
  Advanced: [
    "Hey! What's on your mind?",
    "Hey! So what are we talking about today?",
    "Oh hey! Anything interesting you want to get into?",
    "Hey! What's been going on with you lately?",
  ],
};

// ── System prompts por nível — naturais, sem formalidade desnecessária ────────
const SYSTEM_PROMPTS: Record<'Novice' | 'Inter' | 'Advanced', string> = {
  Novice: `You are Charlotte, a friendly and encouraging English tutor having a real voice conversation with a student named {NAME}. This student is a beginner — they understand some English but feel more comfortable mixing English and Portuguese.

Your personality: warm, patient, uses simple words, celebrates small wins, never makes the student feel embarrassed. Think of yourself as a friendly teacher, not a formal assistant.

How you talk:
- Keep sentences short and clear
- Repeat or rephrase if needed, without making a big deal of it
- Mix a little Portuguese when the student seems lost (e.g., "isso mesmo!" or "tente dizer...")
- React naturally to what they say — laugh, be surprised, show genuine interest
- Never say things like "How can I assist you?" or "Certainly!" — that's too robotic
- After they respond, gently correct mistakes by modeling the right way naturally in your reply (not by saying "you made a mistake")
- Keep the conversation going with simple follow-up questions

Start with: "{GREETING}"`,

  Inter: `You are Charlotte, a friendly English conversation partner and tutor. You're having a real voice chat with {NAME}, who has intermediate English — they can hold a conversation but still make mistakes and sometimes hesitate.

Your personality: casual, genuine, fun, supportive. Like a friend who happens to be really good at English. Not a formal teacher, not a stiff assistant.

How you talk:
- Sound like a real person, not a chatbot — use contractions, natural fillers ("oh nice", "wait really?", "that's so funny"), informal expressions
- React to what they actually say — don't just redirect to "practice"
- When they make a grammar mistake, weave the correct form naturally into your response without calling it out explicitly
- Occasionally introduce a cool idiom or expression, but casually ("oh by the way, we'd usually say X here")
- Ask follow-up questions that feel genuine, not like exercises
- Never say "How can I assist you today?" — just talk like a person

Start with: "{GREETING}"`,

  Advanced: `You are Charlotte — sharp, fun, and direct. You're on a voice call with {NAME}, who speaks English at an advanced level. They want real conversation, not hand-holding.

Your vibe: think of a smart, witty friend who challenges you intellectually and isn't afraid to joke around. You're not their teacher right now, you're their conversation partner who happens to catch their English slips.

How you talk:
- Be yourself — opinionated, curious, occasionally sarcastic (in a fun way)
- Engage deeply with whatever topic they bring up — share your own take, push back if you disagree, ask sharp questions
- When they use an awkward phrase or make a mistake, you can call it out naturally and humorously ("wait, did you just say...? — haha, I think you meant X")
- Throw in advanced vocabulary, idioms, nuanced expressions organically — not as a lesson
- Never sound like a customer service bot. No "certainly", no "how may I assist", no "great question!"
- If there's a silence, just pick something interesting to say — no need to ask "what would you like to practice?"

Start with: "{GREETING}"`,
};

function getSystemPrompt(level: 'Novice' | 'Inter' | 'Advanced', name: string, greeting: string): string {
  return SYSTEM_PROMPTS[level]
    .replace('{NAME}', name)
    .replace('{GREETING}', greeting);
}

function getRandomGreeting(level: 'Novice' | 'Inter' | 'Advanced'): string {
  const list = GREETINGS[level];
  return list[Math.floor(Math.random() * list.length)];
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName?: string;
  onXPGained?: (amount: number) => void;
}

export default function LiveVoiceModal({
  isOpen,
  onClose,
  userLevel,
  userName = 'Student',
  onXPGained,
}: LiveVoiceModalProps) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeaker, setIsSpeaker] = React.useState(true); // viva-voz ativo por padrão
  const [errorMsg, setErrorMsg] = React.useState('');
  const [charlotteSpeaking, setCharlotteSpeaking] = React.useState(false);
  const [userSpeaking, setUserSpeaking] = React.useState(false);

  const wsRef             = React.useRef<WebSocket | null>(null);
  const playerRef         = React.useRef<AudioPlayer | null>(null);
  const ringingPlayerRef  = React.useRef<AudioPlayer | null>(null);
  const audioChunksRef    = React.useRef<string[]>([]);
  const micActiveRef           = React.useRef(false);
  const isMutedRef             = React.useRef(false);
  const isSpeakerRef           = React.useRef(true); // sincronizado com isSpeaker inicial
  const charlotteSpeakingRef   = React.useRef(false);
  const lastCharlotteDoneRef   = React.useRef(0);
  const responseActiveRef      = React.useRef(false); // servidor gerando resposta agora

  const callTime = useCallTimer(status === 'connected');

  const waveState: WaveState =
    status === 'connecting'  ? 'connecting' :
    charlotteSpeaking        ? 'speaking'   : 'idle';

  // ── Audio mode ───────────────────────────────────────────────────────────
  const applyAudioMode = React.useCallback(async (speakerOn?: boolean) => {
    try {
      const useSpeaker = speakerOn !== undefined ? speakerOn : isSpeakerRef.current;
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: !useSpeaker, // false = speaker, true = earpiece
      });
    } catch (e) { console.warn('Audio mode:', e); }
  }, []);

  // ── Ring tone: toca enquanto conecta ────────────────────────────────────
  const startRingTone = React.useCallback(async () => {
    try {
      await applyAudioMode();
      const wavBase64 = buildWav([generateRingPcm()]);
      const path = `${FileSystem.cacheDirectory}ring.wav`;
      await FileSystem.writeAsStringAsync(path, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      ringingPlayerRef.current?.pause();
      ringingPlayerRef.current?.remove();
      ringingPlayerRef.current = createAudioPlayer({ uri: path });
      ringingPlayerRef.current.loop = true;
      ringingPlayerRef.current.play();
    } catch (e) { console.warn('startRingTone error:', e); }
  }, [applyAudioMode]);

  const stopRingTone = React.useCallback(() => {
    ringingPlayerRef.current?.pause();
    ringingPlayerRef.current?.remove();
    ringingPlayerRef.current = null;
  }, []);

  // ── Canal 1: Tocar áudio da Charlotte ────────────────────────────────────
  const playCharlotteAudio = React.useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;
    try {
      const wavBase64 = buildWav(audioChunksRef.current);
      audioChunksRef.current = [];

      const path = `${FileSystem.cacheDirectory}ch_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(path, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      playerRef.current?.pause();
      playerRef.current?.remove();
      playerRef.current = createAudioPlayer({ uri: path });
      playerRef.current.play(); // applyAudioMode já setado em connect() — sem await aqui

      setCharlotteSpeaking(true);

      // Detecta fim da reprodução via flag hasStarted
      // (player.isLoaded não é confiável em expo-audio 1.1.1 — pode ser undefined)
      let hasStarted = false;
      const checkDone = setInterval(() => {
        if (!playerRef.current) { clearInterval(checkDone); return; }
        if (playerRef.current.playing) hasStarted = true;
        if (hasStarted && !playerRef.current.playing) {
          clearInterval(checkDone);
          console.log('🔊 Charlotte done — liberando mic');
          FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
          // Cooldown: aguarda 800ms antes de liberar mic (deixa eco dissipar)
          setTimeout(() => {
            charlotteSpeakingRef.current = false; // síncrono
            setCharlotteSpeaking(false);
            lastCharlotteDoneRef.current = Date.now();
          }, 800);
        }
      }, 150);

      // Segurança: libera o lock em até 12s mesmo se o player travar
      setTimeout(() => {
        clearInterval(checkDone);
        if (charlotteSpeakingRef.current) {
          charlotteSpeakingRef.current = false;
          setCharlotteSpeaking(false);
          lastCharlotteDoneRef.current = Date.now();
        }
      }, 12000);
    } catch (e) {
      console.warn('playCharlotteAudio error:', e);
      charlotteSpeakingRef.current = false;
      setCharlotteSpeaking(false);
    }
  }, [applyAudioMode]);

  // ── Canal 2: Stream mic → OpenAI em chunks de 400 ms ────────────────────
  // Sem noise gate local — o servidor VAD (threshold 0.75, neural) filtra ruído ambiente.
  // 400ms reduz a latência de tail (último chunk antes do silêncio) vs 750ms anterior.
  const startMicStream = React.useCallback(async () => {
    micActiveRef.current = true;

    while (micActiveRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      if (isMutedRef.current) {
        await sleep(300);
        continue;
      }

      let recorderUri: string | null = null;
      try {
        const rec = new AudioModule.AudioRecorder(MIC_OPTIONS);
        await rec.prepareToRecordAsync();
        rec.record();

        await sleep(400);

        if (!micActiveRef.current) {
          await rec.stop().catch(() => {});
          break;
        }

        await rec.stop();
        recorderUri = rec.uri;

        if (recorderUri && wsRef.current?.readyState === WebSocket.OPEN) {
          const fullBase64 = await FileSystem.readAsStringAsync(recorderUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          let pcmBytes: Uint8Array;
          if (Platform.OS === 'ios') {
            const fullBytes = base64ToUint8Array(fullBase64);
            pcmBytes = fullBytes.slice(44); // strip WAV header (iOS LPCM)
          } else {
            pcmBytes = base64ToUint8Array(fullBase64);
          }

          // Envia direto — servidor VAD decide se é fala ou silêncio
          const CHUNK = 0x8000;
          let bin = '';
          for (let i = 0; i < pcmBytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, pcmBytes.subarray(i, i + CHUNK) as any);
          }
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: btoa(bin),
          }));

          FileSystem.deleteAsync(recorderUri, { idempotent: true }).catch(() => {});
        }
      } catch (e) {
        if (recorderUri) FileSystem.deleteAsync(recorderUri, { idempotent: true }).catch(() => {});
        await sleep(300);
      }
    }

    micActiveRef.current = false;
  }, []);

  // ── Avatar ring animations ────────────────────────────────────────────────
  const ringScale   = React.useRef(new Animated.Value(1)).current;
  const ringOpacity = React.useRef(new Animated.Value(0.5)).current;
  const loopRef     = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    loopRef.current?.stop();

    if (status === 'connecting') {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.12, duration: 900, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.2,  duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.45, duration: 900, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else if (status === 'connected' && userSpeaking) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.22, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.15, duration: 300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.08, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.65, duration: 300, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else if (status === 'connected') {
      Animated.parallel([
        Animated.timing(ringScale,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.18, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      ringScale.setValue(1);
      ringOpacity.setValue(0);
    }

    return () => loopRef.current?.stop();
  }, [status, userSpeaking]);

  const ringColor = status === 'connecting' ? '#F97316' : '#A3FF3C';

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = React.useCallback(async () => {
    setStatus('connecting');
    setErrorMsg('');
    audioChunksRef.current = [];

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setErrorMsg('Permissão de microfone negada');
        setStatus('error');
        return;
      }

      await applyAudioMode();

      // Toca ringing enquanto conecta
      startRingTone();

      const tokenRes = await fetch(`${API_BASE_URL}/api/realtime-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLevel, userName }),
      });
      if (!tokenRes.ok) throw new Error('Failed to get session token');
      const { apiKey } = await tokenRes.json();
      if (!apiKey) throw new Error('No API key returned');

      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        ['realtime', `openai-insecure-api-key.${apiKey}`, 'openai-beta.realtime-v1']
      );
      wsRef.current = ws;

      ws.onopen = () => {
        stopRingTone();
        setStatus('connected');
        const greeting = getRandomGreeting(userLevel);
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: getSystemPrompt(userLevel, userName, greeting),
            voice: 'coral',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.75,
              prefix_padding_ms: 300,
              silence_duration_ms: 500, // 650→500: -150ms por turno sem cortar falas naturais
            },
          },
        }));

        // Dispara saudação após session.update ser processado pelo servidor
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'response.create' }));
          }
        }, 500);

        // Inicia stream do mic imediatamente
        startMicStream();
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'response.audio.delta':
              responseActiveRef.current = true;
              if (msg.delta) audioChunksRef.current.push(msg.delta);

              // Marca Charlotte falando no primeiro chunk (síncrono — sem delay de render)
              if (!charlotteSpeakingRef.current) {
                charlotteSpeakingRef.current = true;
                setCharlotteSpeaking(true);
                setUserSpeaking(false);
                // Limpa buffer de mic para suprimir o echo que já entrou
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
                }
              }
              break;

            case 'response.audio.done':
              responseActiveRef.current = false;
              // Resposta completa — toca tudo de uma vez (sem race condition de early playback)
              if (audioChunksRef.current.length > 0 && charlotteSpeakingRef.current) {
                await playCharlotteAudio();
              } else {
                audioChunksRef.current = []; // descarta resíduo de resposta cancelada
              }
              break;

            case 'response.done':
              responseActiveRef.current = false;
              break;

            case 'input_audio_buffer.speech_started':
              setUserSpeaking(true);

              // Interrupção: Charlotte tocando E servidor ainda gerando
              if (charlotteSpeakingRef.current && playerRef.current?.playing) {
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);

                playerRef.current.pause();
                playerRef.current.remove();
                playerRef.current = null;
                audioChunksRef.current = [];

                // Só cancela no servidor se a geração ainda está em andamento
                if (responseActiveRef.current && ws.readyState === WebSocket.OPEN) {
                  responseActiveRef.current = false;
                  ws.send(JSON.stringify({ type: 'response.cancel' }));
                }
              } else if (charlotteSpeakingRef.current && !playerRef.current?.playing) {
                // Ref presa em true mas áudio já terminou — limpa sem cancelar
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);
              }
              break;

            case 'response.cancelled':
              responseActiveRef.current = false;
              playerRef.current?.pause();
              playerRef.current?.remove();
              playerRef.current = null;
              audioChunksRef.current = [];
              charlotteSpeakingRef.current = false;
              setCharlotteSpeaking(false);
              break;

            case 'input_audio_buffer.speech_stopped':
              setUserSpeaking(false);
              break;

            case 'error':
              console.error('WS error event:', msg.error);
              break;
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => {
        stopRingTone();
        setStatus('error');
        setErrorMsg('Falha na conexão. Tente novamente.');
      };

      ws.onclose = () => {
        micActiveRef.current = false;
        setStatus('disconnected');
        setCharlotteSpeaking(false);
        setUserSpeaking(false);
      };
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || 'Não foi possível conectar');
    }
  }, [userLevel, userName, isSpeaker, applyAudioMode, startRingTone, stopRingTone, startMicStream, playCharlotteAudio]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = React.useCallback(() => {
    micActiveRef.current = false;
    responseActiveRef.current = false;
    wsRef.current?.close();
    wsRef.current = null;
    stopRingTone();
    playerRef.current?.pause();
    playerRef.current?.remove();
    playerRef.current = null;
    audioChunksRef.current = [];
    setStatus('disconnected');
    setCharlotteSpeaking(false);
    setUserSpeaking(false);
  }, [stopRingTone]);

  const handleEndCall = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    disconnect();
    onClose();
  }, [disconnect, onClose]);

  const handleMute = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(v => {
      const next = !v;
      isMutedRef.current = next; // síncrono — sem delay de render
      return next;
    });
  }, []);

  const handleSpeakerToggle = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeaker(v => {
      const next = !v;
      isSpeakerRef.current = next;
      applyAudioMode(next);
      return next;
    });
  }, [applyAudioMode]);

  React.useEffect(() => {
    if (isOpen) {
      connect();
    } else {
      disconnect();
    }
  }, [isOpen]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  // Android: Live Voice requer PCM16 raw. expo-audio grava AAC no Android
  // (formato comprimido incompatível com OpenAI Realtime API sem decode).
  // Suporte completo disponível após EAS build com solução de áudio nativa.
  if (Platform.OS === 'android') {
    return (
      <Modal visible={isOpen} animationType="slide" transparent={false} hardwareAccelerated statusBarTranslucent>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#07071C' }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(163,255,60,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Microphone size={36} color="#A3FF3C" weight="duotone" />
            </View>
            <AppText style={{ fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' }}>
              Live Voice
            </AppText>
            <AppText style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22 }}>
              Live Voice está disponível no iOS.{'\n'}Suporte Android chegando em breve.
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
            >
              <AppText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' }}>Fechar</AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      hardwareAccelerated
    >
      <View style={{ flex: 1, backgroundColor: '#07071C', paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 24 }}>

          {/* ── TOP: Nome + Timer ─────────────────────────────────── */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Charlotte
            </AppText>
            {status === 'connected' && (
              <AppText style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, letterSpacing: 2,
                ...(Platform.OS === 'ios'
                  ? { fontVariant: ['tabular-nums'] }
                  : { fontFamily: 'monospace' }) }}>
                {callTime}
              </AppText>
            )}
            {status === 'connecting' && (
              <AppText style={{ color: '#F97316', fontSize: 13 }}>Chamando...</AppText>
            )}
            {status === 'error' && (
              <AppText style={{ color: '#ef4444', fontSize: 13 }}>{errorMsg}</AppText>
            )}
          </View>

          {/* ── CENTER: Avatar + Wave ─────────────────────────────── */}
          <View style={{ alignItems: 'center', gap: 32 }}>
            {/* Avatar com anel */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{
                position: 'absolute',
                width: 148, height: 148, borderRadius: 74,
                borderWidth: 2, borderColor: ringColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }} />
              <View style={{
                position: 'absolute',
                width: 132, height: 132, borderRadius: 66,
                borderWidth: 1.5,
                borderColor: status === 'connected' ? 'rgba(163,255,60,0.3)' : 'rgba(249,115,22,0.25)',
              }} />
              <Image
                source={require('../../assets/charlotte-avatar.png')}
                style={{
                  width: 120, height: 120, borderRadius: 60,
                  borderWidth: 3,
                  borderColor: status === 'connected' ? '#A3FF3C' : '#F97316',
                }}
                resizeMode="cover"
              />
            </View>

            {/* Wave — responde à voz da Charlotte */}
            <CallWave state={waveState} />
          </View>

          {/* ── BOTTOM: Mute / End / Speaker ─────────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
            {/* Mute */}
            <TouchableOpacity
              onPress={handleMute}
              pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isMuted
                ? <MicrophoneSlash size={22} color="#ef4444" weight="regular" />
                : <Microphone     size={22} color="rgba(255,255,255,0.7)" weight="regular" />
              }
            </TouchableOpacity>

            {/* End call */}
            <TouchableOpacity
              onPress={handleEndCall}
              pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{
                width: 68, height: 68, borderRadius: 34,
                backgroundColor: '#ef4444',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
              }}
            >
              <PhoneSlash size={28} color="#fff" weight="fill" />
            </TouchableOpacity>

            {/* Speaker / Ouvido */}
            <TouchableOpacity
              onPress={handleSpeakerToggle}
              pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: isSpeaker ? 'rgba(163,255,60,0.15)' : 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: isSpeaker ? 'rgba(163,255,60,0.4)' : 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isSpeaker
                ? <SpeakerHigh size={22} color="#A3FF3C" weight="regular" />
                : <Ear        size={22} color="rgba(255,255,255,0.7)" weight="regular" />
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
