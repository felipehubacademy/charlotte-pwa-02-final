// components/voice/LiveVoiceModal.tsx
// Live voice — WebRTC transport → OpenAI Realtime API
//
// Pool mensal: 30 min (1 800 s). Detecta inatividade:
//   45 s sem fala → aviso "Ainda está aí?"
//   +30 s → pausa automática (WebRTC fecha, timer congela)
//
// Antes (WebSocket manual):
//   expo-audio grava 400ms chunks → strip WAV header → base64 → input_audio_buffer.append
//   response.audio.delta chunks → buildWav() → createAudioPlayer
//
// Agora (WebRTC):
//   RTCPeerConnection gerencia mic input e speaker output nativamente
//   RTCDataChannel 'oai-events' substitui o WebSocket para eventos JSON
//   InCallManager controla roteamento do speaker no iOS/Android

import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestRecordingPermissionsAsync, setAudioModeAsync, createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { PhoneSlash, MicrophoneSlash, Microphone, SpeakerHigh, Ear, Pause, ArrowCounterClockwise, ArrowLeft, ChatCircle } from 'phosphor-react-native';
import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import { useCallTimer } from '@/hooks/useCallTimer';
import Constants from 'expo-constants';
import { getLiveVoiceStatus, consumeLiveVoiceSeconds, getPoolForLevel } from '@/lib/liveVoiceUsage';
import { supabase } from '@/lib/supabase';
import { track, trackDuration } from '@/lib/analytics';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';

const MODEL = 'gpt-4o-realtime-preview-2024-12-17';

// Inatividade: 45 s → aviso; 75 s → pausa
const INACTIVITY_WARN_SEC  = 45;
const INACTIVITY_PAUSE_SEC = 75;

// ── Helpers para ring tone (PCM16 gerado em JS, tocado via expo-audio) ─────────

function uint8ArrayToBase64(arr: Uint8Array): string {
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < arr.length; i += CHUNK)
    bin += String.fromCharCode.apply(null, arr.subarray(i, i + CHUNK) as any);
  return btoa(bin);
}

function buildWav(pcm: Uint8Array): string {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const sr = 24000, ch = 1, bps = 16;
  [0x52,0x49,0x46,0x46].forEach((b,i) => v.setUint8(i, b));
  v.setUint32(4, 36 + pcm.length, true);
  [0x57,0x41,0x56,0x45].forEach((b,i) => v.setUint8(8+i, b));
  [0x66,0x6D,0x74,0x20].forEach((b,i) => v.setUint8(12+i, b));
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * (bps/8), true); v.setUint16(32, ch * (bps/8), true);
  v.setUint16(34, bps, true);
  [0x64,0x61,0x74,0x61].forEach((b,i) => v.setUint8(36+i, b));
  v.setUint32(40, pcm.length, true);
  const wav = new Uint8Array(44 + pcm.length);
  wav.set(new Uint8Array(header)); wav.set(pcm, 44);
  return uint8ArrayToBase64(wav);
}

function generateRingPcm(): Uint8Array {
  const sr = 24000;
  const tone = Math.floor(sr * 1.0);
  const sil  = Math.floor(sr * 1.5);
  const pcm  = new Uint8Array((tone + sil) * 2);
  for (let i = 0; i < tone; i++) {
    const t   = i / sr;
    const amp = 0.30 * 32767;
    const s   = amp * (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 480 * t)) / 2;
    const val = Math.max(-32768, Math.min(32767, Math.round(s)));
    pcm[i * 2]     = val & 0xFF;
    pcm[i * 2 + 1] = (val >> 8) & 0xFF;
  }
  return pcm;
}

// ── Frases de saudação por nível ────────────────────────────────────────────────
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

// ── System prompts por nível ─────────────────────────────────────────────────────
// IMPORTANT: never tell the model to "fill silence" or "keep talking" — this causes
// Charlotte to monologue without user input when the VAD triggers on echo/ambient noise.
const SYSTEM_PROMPTS: Record<'Novice' | 'Inter' | 'Advanced', string> = {
  Novice: `You are Charlotte, a friendly and encouraging English tutor having a real voice conversation with a student named {NAME}. This student is a beginner — they understand some English but feel more comfortable mixing English and Portuguese.

Your personality: warm, patient, uses simple words, celebrates small wins, never makes the student feel embarrassed. Think of yourself as a friendly teacher, not a formal assistant.

How you talk:
- Keep sentences short and clear (1-2 sentences per turn max)
- Repeat or rephrase if needed, without making a big deal of it
- Mix a little Portuguese when the student seems lost (e.g., "isso mesmo!" or "tente dizer...")
- React naturally to what they say — laugh, be surprised, show genuine interest
- Never say things like "How can I assist you?" or "Certainly!" — that's too robotic
- After they respond, gently correct mistakes by modeling the right way naturally in your reply (not by saying "you made a mistake")
- End each turn with a question or short prompt and then WAIT for the student to respond. Never keep talking after asking a question.

Start with: "{GREETING}"`,

  Inter: `You are Charlotte, a friendly English conversation partner and tutor. You're having a real voice chat with {NAME}, who has intermediate English — they can hold a conversation but still make mistakes and sometimes hesitate.

Your personality: casual, genuine, fun, supportive. Like a friend who happens to be really good at English. Not a formal teacher, not a stiff assistant.

How you talk:
- Sound like a real person, not a chatbot — use contractions, natural fillers ("oh nice", "wait really?", "that's so funny"), informal expressions
- React to what they actually say — don't just redirect to "practice"
- When they make a grammar mistake, weave the correct form naturally into your response without calling it out explicitly
- Occasionally introduce a cool idiom or expression, but casually ("oh by the way, we'd usually say X here")
- Keep responses short (1-3 sentences) and end with a question — then WAIT for the user to respond. Do not continue speaking after your turn.
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
- Keep each turn to 1-3 sentences maximum, then STOP and wait for the user's response. This is a two-way conversation — do not monologue.

Start with: "{GREETING}"`,
};

function getSystemPrompt(level: 'Novice' | 'Inter' | 'Advanced', name: string, greeting: string): string {
  return SYSTEM_PROMPTS[level].replace('{NAME}', name).replace('{GREETING}', greeting);
}

function getRandomGreeting(level: 'Novice' | 'Inter' | 'Advanced'): string {
  const list = GREETINGS[level];
  return list[Math.floor(Math.random() * list.length)];
}

function formatSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

type ConnectionStatus = 'idle' | 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

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
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeaker, setIsSpeaker] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [charlotteSpeaking, setCharlotteSpeaking] = React.useState(false);
  const [userSpeaking, setUserSpeaking] = React.useState(false);

  // ── Pool de minutos ────────────────────────────────────────────────────────
  const [poolLoading, setPoolLoading]             = React.useState(true);
  const levelPool = getPoolForLevel(userLevel);
  const [poolRemaining, setPoolRemaining]         = React.useState(levelPool);
  const [poolExhausted, setPoolExhausted]         = React.useState(false);

  // ── Inatividade ───────────────────────────────────────────────────────────
  const [inactivityWarning, setInactivityWarning] = React.useState(false);
  const [warningCountdown, setWarningCountdown]   = React.useState(30);
  const [isPaused, setIsPaused]                   = React.useState(false);

  // ── Transcription ──────────────────────────────────────────────────────────
  const [conversationTurns, setConversationTurns] = React.useState<ConversationTurn[]>([]);
  const [showTranscript, setShowTranscript]       = React.useState(false);
  const charlotteTextAccRef = React.useRef(''); // accumulates Charlotte's text deltas
  const wasConnectedRef     = React.useRef(false); // tracks if call ever reached connected state
  const farewellActiveRef      = React.useRef(false); // true when Charlotte is delivering the pool-exhausted farewell
  const farewellAudioStartRef  = React.useRef(0);     // Date.now() do primeiro response.audio.delta da despedida
  const speechStartedAtRef  = React.useRef(0);     // Date.now() when VAD detected speech_started — used to filter short echo artifacts
  const poolBaseRef         = React.useRef(levelPool); // secondsRemaining from DB at session start — used by session timer to count down correctly

  // ── WebRTC refs ────────────────────────────────────────────────────────────
  const pcRef             = React.useRef<InstanceType<typeof RTCPeerConnection> | null>(null);
  const dcRef             = React.useRef<any>(null);
  const localStreamRef    = React.useRef<any>(null);

  // ── Ring tone ref ─────────────────────────────────────────────────────────
  const ringPlayerRef     = React.useRef<AudioPlayer | null>(null);

  // ── State refs ────────────────────────────────────────────────────────────
  const isMutedRef              = React.useRef(false);
  const isSpeakerRef            = React.useRef(true);
  const charlotteSpeakingRef    = React.useRef(false);
  const responseActiveRef       = React.useRef(false);
  const lastCharlotteDoneRef    = React.useRef(0);
  // Cooldown: timestamp do ultimo response.create enviado.
  // Impede que eco em loop dispare multiplos response.creates seguidos.
  const lastResponseCreateRef   = React.useRef(0);

  // ── Session tracking refs ─────────────────────────────────────────────────
  const sessionStartRef         = React.useRef<number>(0);      // Date.now() when segment started
  const sessionAccumSecs        = React.useRef<number>(0);      // total accumulated secs (all segments)
  const sessionIntervalRef      = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Inactivity tracking refs ──────────────────────────────────────────────
  const lastActivityRef         = React.useRef<number>(Date.now());
  const inactivityIntervalRef   = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const warnStartRef            = React.useRef<number>(0);

  const callTime = useCallTimer(status === 'connected' && !isPaused);

  // ── Helpers: clear timers ─────────────────────────────────────────────────
  const clearSessionInterval = React.useCallback(() => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  }, []);

  const clearInactivityInterval = React.useCallback(() => {
    if (inactivityIntervalRef.current) {
      clearInterval(inactivityIntervalRef.current);
      inactivityIntervalRef.current = null;
    }
  }, []);

  // ── Audio mode ────────────────────────────────────────────────────────────
  // NOTA: deixamos InCallManager ser o único dono do AVAudioSession durante
  // a chamada. setAudioModeAsync não é chamado no fluxo de call porque sobrescreve
  // o mode .voiceChat necessário para o AEC hardware do iOS. Essa função fica
  // apenas como utilitária caso precise ser chamada fora do fluxo da chamada.
  const applyAudioMode = React.useCallback(async (speakerOn?: boolean) => {
    try {
      const useSpeaker = speakerOn !== undefined ? speakerOn : isSpeakerRef.current;
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: !useSpeaker,
      });
    } catch (e) { console.warn('applyAudioMode:', e); }
  }, []);

  // ── Ring tone ─────────────────────────────────────────────────────────────
  // Toca dentro do AVAudioSession já configurado pelo InCallManager (mode .voiceChat).
  // Não chama setAudioModeAsync para não quebrar o AEC.
  const startRingTone = React.useCallback(async () => {
    try {
      const wavBase64 = buildWav(generateRingPcm());
      const path = `${FileSystem.cacheDirectory}ring.wav`;
      await FileSystem.writeAsStringAsync(path, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      ringPlayerRef.current?.pause();
      ringPlayerRef.current?.remove();
      ringPlayerRef.current = createAudioPlayer({ uri: path });
      ringPlayerRef.current.loop = true;
      ringPlayerRef.current.play();
    } catch (e) { console.warn('startRingTone:', e); }
  }, []);

  const stopRingTone = React.useCallback(() => {
    ringPlayerRef.current?.pause();
    ringPlayerRef.current?.remove();
    ringPlayerRef.current = null;
  }, []);

  // ── Mute ──────────────────────────────────────────────────────────────────
  // No react-native-webrtc, desabilitar o track via stream nao para o envio.
  // É necessário desabilitar via RTCPeerConnection senders E via stream.
  const applyMute = React.useCallback((muted: boolean) => {
    // Via stream (fallback)
    localStreamRef.current?.getAudioTracks().forEach((track: any) => {
      track.enabled = !muted;
    });
    // Via PC senders (método confiável no react-native-webrtc)
    pcRef.current?.getSenders?.()?.forEach?.((sender: any) => {
      if (sender?.track?.kind === 'audio') {
        sender.track.enabled = !muted;
      }
    });
  }, []);

  // ── Enviar evento via data channel ────────────────────────────────────────
  const sendEvent = React.useCallback((event: object) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify(event));
    }
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
    } else if (status === 'connected' && charlotteSpeaking && !isPaused) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.20, duration: 350, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.6,  duration: 350, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.06, duration: 350, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.25, duration: 350, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else if (status === 'connected' && !isPaused) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1.05, duration: 1800, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.22, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 1, duration: 1800, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.10, duration: 1800, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else {
      ringScale.setValue(1);
      ringOpacity.setValue(0);
    }

    return () => loopRef.current?.stop();
  }, [status, charlotteSpeaking, isPaused]);

  const ringColor = status === 'connecting' ? '#F97316' : '#A3FF3C';

  // ── Pool: carregar ao abrir o modal ───────────────────────────────────────
  const loadPool = React.useCallback(async () => {
    setPoolLoading(true);
    setPoolExhausted(false);
    try {
      const { secondsRemaining } = await getLiveVoiceStatus(userLevel);
      setPoolRemaining(secondsRemaining);
      poolBaseRef.current = secondsRemaining; // base para o session timer contar a partir do restante real
      if (secondsRemaining <= 0) {
        setPoolExhausted(true);
        setStatus('error');
        setErrorMsg(
          userLevel === 'Novice'
            ? `Você usou seus ${Math.floor(levelPool / 60)} min de Live Voice deste mês. Volta no mês que vem!`
            : `You've used your ${Math.floor(levelPool / 60)}-min monthly Live Voice allowance. Come back next month!`
        );
      }
      return secondsRemaining;
    } catch (e) {
      console.warn('[LiveVoice] loadPool error:', e);
      return levelPool; // fallback: allow call
    } finally {
      setPoolLoading(false);
    }
  }, [userLevel]);

  // ── Session timer: conta segundos enquanto conectado ─────────────────────
  const startSessionTimer = React.useCallback(() => {
    sessionStartRef.current = Date.now();
    clearSessionInterval();
    sessionIntervalRef.current = setInterval(() => {
      // Usa poolBaseRef (segundos restantes do DB ao abrir o modal) como base,
      // não o pool total — assim o timer conta a partir do que realmente sobra.
      const elapsedInSession = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, poolBaseRef.current - elapsedInSession);
      setPoolRemaining(remaining);
      if (remaining <= 0) {
        setPoolExhausted(true);
      }
    }, 1000);
  }, [clearSessionInterval]);

  // ── Inactivity timer ──────────────────────────────────────────────────────
  const resetActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    if (inactivityWarning) {
      setInactivityWarning(false);
      setWarningCountdown(30);
    }
  }, [inactivityWarning]);

  const startInactivityTimer = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    clearInactivityInterval();
    inactivityIntervalRef.current = setInterval(() => {
      const idleSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (idleSec >= INACTIVITY_PAUSE_SEC) {
        // Pausar por inatividade
        return; // será tratado pelo useEffect abaixo
      }
      if (idleSec >= INACTIVITY_WARN_SEC) {
        if (!warnStartRef.current) warnStartRef.current = Date.now();
        const secsUntilPause = Math.max(0, INACTIVITY_PAUSE_SEC - idleSec);
        setInactivityWarning(true);
        setWarningCountdown(secsUntilPause);
      } else {
        if (inactivityWarning) {
          setInactivityWarning(false);
          setWarningCountdown(30);
          warnStartRef.current = 0;
        }
      }
    }, 1000);
  }, [clearInactivityInterval, inactivityWarning]);

  // ── Auto-pause quando inatividade atingir limite ─────────────────────────
  React.useEffect(() => {
    if (!inactivityWarning) return;
    if (warningCountdown <= 0) {
      // Disparar pausa
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      pauseSession();
    }
  }, [warningCountdown, inactivityWarning]); // eslint-disable-line

  // ── Auto-encerrar quando pool esgotado — Charlotte diz adeus antes ────────
  React.useEffect(() => {
    if (!poolExhausted || status !== 'connected') return;
    if (farewellActiveRef.current) return; // já em andamento
    farewellActiveRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Parar timers (não desconectar ainda)
    clearSessionInterval();
    clearInactivityInterval();

    if (dcRef.current?.readyState !== 'open') {
      // Data channel fechado — fallback imediato
      farewellActiveRef.current = false;
      const secsUsed = sessionAccumSecs.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
      consumeLiveVoiceSeconds(secsUsed).catch(console.warn);
      sessionAccumSecs.current = 0;
      disconnectWebRTC();
      setStatus('error');
      setErrorMsg(
        userLevel === 'Novice'
          ? `Seus ${Math.floor(levelPool / 60)} min de Live Voice deste mês acabaram. Volta no mês que vem!`
          : `Your ${Math.floor(levelPool / 60)}-min monthly allowance is up. See you next month!`
      );
      return;
    }

    // 1. Cancelar resposta ativa (se houver)
    if (responseActiveRef.current) {
      sendEvent({ type: 'response.cancel' });
      responseActiveRef.current = false;
    }
    charlotteSpeakingRef.current = false;
    setCharlotteSpeaking(false);

    // 2. Desativar VAD — Charlotte não deve responder a mais nada do user
    sendEvent({
      type: 'session.update',
      session: {
        turn_detection: null,
      },
    });

    // 3. Criar resposta com instructions override — sem poluir o histórico
    const farewellInstruction = userLevel === 'Novice'
      ? `Diga exatamente isto, com calor e naturalidade, como sua última mensagem: "Poxa ${userName}, seu tempo mensal de conversa ao vivo esgotou, mas logo você já volta a praticar. Te vejo em breve!" Não diga mais nada além disso.`
      : `Say exactly this, warmly and naturally, as your last message: "Oh ${userName}, your monthly live conversation time is up — but you'll be back practising before you know it. See you soon!" Say nothing else.`;

    setTimeout(() => {
      if (dcRef.current?.readyState === 'open') {
        charlotteSpeakingRef.current = true;
        setCharlotteSpeaking(true);
        sendEvent({
          type: 'response.create',
          response: {
            modalities: ['text', 'audio'],
            instructions: farewellInstruction,
            max_output_tokens: 80,
          },
        });
      }
    }, 200);
  }, [poolExhausted]); // eslint-disable-line

  // ── Disconnect WebRTC (sem fechar modal) ─────────────────────────────────
  const disconnectWebRTC = React.useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    stopRingTone();
    InCallManager.stop(); // devolve o AVAudioSession ao estado anterior
    charlotteSpeakingRef.current = false;
    responseActiveRef.current    = false;
    setCharlotteSpeaking(false);
    setUserSpeaking(false);
  }, [stopRingTone]);

  // ── Pause por inatividade ─────────────────────────────────────────────────
  const pauseSession = React.useCallback(() => {
    const segSecs = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const totalSecs = sessionAccumSecs.current + segSecs;
    // Salvar no DB (fire-and-forget)
    consumeLiveVoiceSeconds(totalSecs).catch(console.warn);
    sessionAccumSecs.current = 0;
    clearSessionInterval();
    clearInactivityInterval();
    setInactivityWarning(false);
    setWarningCountdown(30);
    warnStartRef.current = 0;
    disconnectWebRTC();
    setIsPaused(true);
    setStatus('disconnected');
  }, [disconnectWebRTC, clearSessionInterval, clearInactivityInterval]);

  // ── Connect via WebRTC ────────────────────────────────────────────────────
  const connect = React.useCallback(async () => {
    setStatus('connecting');
    setErrorMsg('');
    setIsPaused(false);
    setInactivityWarning(false);
    setWarningCountdown(30);

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setErrorMsg(userLevel === 'Novice' ? 'Permissão de microfone negada' : 'Microphone permission denied');
        setStatus('error');
        return;
      }

      // CAMINHO A: InCallManager é a PRIMEIRA coisa a tocar no AVAudioSession.
      // Ele configura category=.playAndRecord + mode=.voiceChat, que é o que o
      // iOS precisa para ativar o Voice Processing I/O unit (AEC hardware).
      // Nenhum setAudioModeAsync é chamado no fluxo de chamada para não sobrescrever.
      InCallManager.start({ media: 'audio' });
      InCallManager.setForceSpeakerphoneOn(isSpeakerRef.current);

      // 500ms para o AVAudioSession estabilizar no mode .voiceChat antes do
      // getUserMedia. Sem esse delay, o audio unit do mic pode ser criado
      // durante a transição e acabar sem AEC.
      await new Promise(resolve => setTimeout(resolve, 500));

      await startRingTone();

      // Passa o access token para validação server-side do pool
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const tokenRes = await fetch(`${API_BASE_URL}/api/realtime-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLevel,
          userName,
          accessToken: authSession?.access_token,
        }),
      });
      if (tokenRes.status === 403) {
        const { error: serverErr } = await tokenRes.json().catch(() => ({ error: '' }));
        if (serverErr === 'monthly_pool_exhausted') {
          setPoolExhausted(true);
          setStatus('error');
          setErrorMsg(
            userLevel === 'Novice'
              ? `Você usou seus ${Math.floor(levelPool / 60)} min de Live Voice deste mês. Volta no mês que vem!`
              : `You've used your ${Math.floor(levelPool / 60)}-min monthly Live Voice allowance. Come back next month!`
          );
          stopRingTone();
          return;
        }
        throw new Error('Failed to get session token (403)');
      }
      if (!tokenRes.ok) throw new Error('Failed to get session token');
      const { clientSecret } = await tokenRes.json();
      if (!clientSecret) throw new Error('No client secret returned');

      stopRingTone();

      // echoCancellation removes Charlotte's speaker output from the mic signal
      // before it reaches the server VAD — this is the correct way to prevent
      // Charlotte from "hearing herself". noiseSuppression and autoGainControl
      // improve speech quality on mobile.
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      pc.ontrack = () => {};

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        stopRingTone();
        setStatus('connected');
        wasConnectedRef.current = true;
        // Inicializar o echo guard com timestamp atual — evita que o guard
        // passe imediatamente (ref=0 → msSinceDone=∞) antes do primeiro
        // audio da Charlotte terminar, o que causava eco da abertura virar
        // turno do usuario.
        lastCharlotteDoneRef.current = Date.now();

        const greeting = getRandomGreeting(userLevel);
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: getSystemPrompt(userLevel, userName, greeting),
            voice: 'coral',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            max_response_output_tokens: 400,
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.90,
              prefix_padding_ms: 400,
              silence_duration_ms: 1500,
              // Disable auto-response: the app sends response.create manually
              // after speech_stopped so Charlotte never self-triggers on echo.
              create_response: false,
            },
          },
        }));

        setTimeout(() => {
          if (dcRef.current?.readyState === 'open') {
            // Marcar Charlotte como falando ANTES do response.create —
            // garante que charlotteSpeakingRef=true quando o VAD capturar
            // o eco da abertura, bloqueando speech_stopped corretamente.
            // Apenas o ref — sem setCharlotteSpeaking para evitar re-render
            // que pode interferir no pipeline de audio no iOS.
            charlotteSpeakingRef.current = true;
            dc.send(JSON.stringify({ type: 'response.create' }));
          }
        }, 500);

        // InCallManager.start foi chamado antes do getUserMedia para garantir
        // que o AVAudioSession esteja em .voiceChat mode quando o WebRTC
        // inicializa o audio unit do mic (ativa AEC hardware no iOS).
        // setForceSpeakerphoneOn também foi chamado antes, mas repetimos aqui
        // para Android que pode precisar depois do setup completo do audio session.
        if (Platform.OS === 'android') {
          setTimeout(() => {
            InCallManager.setForceSpeakerphoneOn(isSpeakerRef.current);
          }, 300);
        }

        // Iniciar timers
        startSessionTimer();
        startInactivityTimer();
        track('live_voice_started', { level: userLevel });
      };

      dc.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'response.audio.delta':
              // Charlotte started sending audio.
              // Do NOT disable the mic — the user must be able to interrupt at any
              // moment by speaking. InCallManager (call mode) provides AEC so
              // Charlotte's speaker audio is suppressed before reaching the VAD.
              // Echo protection is handled by the 700ms time-guard in speech_stopped
              // and by create_response:false (VAD events can't auto-trigger responses).
              responseActiveRef.current = true;
              lastActivityRef.current = Date.now();
              if (!charlotteSpeakingRef.current) {
                charlotteSpeakingRef.current = true;
                setCharlotteSpeaking(true);
                setUserSpeaking(false);
                sendEvent({ type: 'input_audio_buffer.clear' });
              }
              // Registrar quando o áudio da despedida começou a chegar
              if (farewellActiveRef.current && farewellAudioStartRef.current === 0) {
                farewellAudioStartRef.current = Date.now();
              }
              break;

            case 'response.text.delta':
              // Accumulate deltas as primary source
              charlotteTextAccRef.current += (msg.delta ?? '');
              break;

            case 'response.done':
              // Lifecycle complete — extract Charlotte's text from the response payload.
              // Primary: accumulated deltas from response.text.delta events.
              // Fallback: msg.response.output (response.done always carries the full output).
              responseActiveRef.current = false;
              lastActivityRef.current = Date.now();
              {
                let charlotteText = charlotteTextAccRef.current.trim();
                charlotteTextAccRef.current = '';

                // Fallback: extract from response.done payload (more reliable in WebRTC mode)
                if (!charlotteText) {
                  const output = msg.response?.output ?? [];
                  for (const item of output) {
                    if (item.role === 'assistant' || item.type === 'message') {
                      for (const c of item.content ?? []) {
                        if (c.type === 'text' && c.text) charlotteText += c.text;
                        if (c.type === 'audio' && c.transcript) charlotteText += c.transcript;
                      }
                    }
                  }
                  charlotteText = charlotteText.trim();
                }

                if (charlotteText) {
                  setConversationTurns(prev => [...prev, { role: 'assistant', text: charlotteText }]);
                }

                // Despedida: fechamento é feito por response.audio.done (que
                // dispara quando todo áudio foi enviado ao WebRTC). Este aqui
                // é apenas um fallback de segurança de 10s caso audio.done
                // nunca chegue por algum motivo.
                if (farewellActiveRef.current) {
                  setTimeout(() => {
                    if (farewellActiveRef.current) {
                      farewellActiveRef.current = false;
                      farewellAudioStartRef.current = 0;
                      const secsUsed = sessionAccumSecs.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
                      consumeLiveVoiceSeconds(secsUsed).catch(console.warn);
                      sessionAccumSecs.current = 0;
                      disconnect();
                      setShowTranscript(true);
                    }
                  }, 10000);
                }
              }
              break;

            case 'conversation.item.input_audio_transcription.completed':
              // User's speech transcription
              if (msg.transcript?.trim()) {
                setConversationTurns(prev => [...prev, { role: 'user', text: msg.transcript.trim() }]);
              }
              break;

            case 'response.audio.done':
              // Último chunk de áudio entregue ao WebRTC.
              // Estratégia anti-eco de 3 camadas:
              //   1. Stampar lastCharlotteDoneRef agora (guard de 6000ms no speech_stopped)
              //   2. Mutar fisicamente o mic por 2000ms — bloqueia eco de loudspeaker
              //   3. Manter charlotteSpeakingRef=true por 500ms extras (drain do jitter buffer)
              responseActiveRef.current = false;
              lastCharlotteDoneRef.current = Date.now();
              applyMute(true);
              setTimeout(() => {
                if (!isMutedRef.current) applyMute(false);
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);
              }, 2000);
              // Despedida: servidor terminou de enviar o áudio. O playback ainda
              // está acontecendo no device (jitter buffer tem ~300-800ms).
              // Aguardar 4s para garantir que o playback termine antes de desconectar.
              if (farewellActiveRef.current) {
                setTimeout(() => {
                  if (farewellActiveRef.current) {
                    farewellActiveRef.current = false;
                    farewellAudioStartRef.current = 0;
                    const secsUsed = sessionAccumSecs.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
                    consumeLiveVoiceSeconds(secsUsed).catch(console.warn);
                    sessionAccumSecs.current = 0;
                    disconnect();
                    setShowTranscript(true);
                  }
                }, 4000);
              }
              break;

            case 'input_audio_buffer.speech_started':
              // Usuario falou — pode ser interrupcao real ou eco da Charlotte.
              speechStartedAtRef.current = Date.now(); // registrar início para cálculo de duração
              lastActivityRef.current = Date.now();
              setUserSpeaking(true);
              setInactivityWarning(false);
              setWarningCountdown(30);
              warnStartRef.current = 0;
              if (charlotteSpeakingRef.current) {
                // Interrupcao (ou eco enquanto Charlotte fala): cancelar
                // resposta atual. lastCharlotteDone = now para que o echo guard
                // em speech_stopped bloqueie eco subsequente.
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);
                lastCharlotteDoneRef.current = Date.now();
                if (responseActiveRef.current) {
                  responseActiveRef.current = false;
                  sendEvent({ type: 'response.cancel' });
                }
              }
              break;

            case 'input_audio_buffer.speech_stopped':
              setUserSpeaking(false);
              // create_response:false — disparar response.create manualmente.
              // Três guards devem passar para filtrar eco e ruído ambiente:
              //   1. Charlotte não pode estar falando (charlotteSpeakingRef).
              //   2. Duração mínima de fala >= 500ms — eco e reverb duram < 200ms;
              //      fala real dura > 500ms. Este é o filtro mais eficaz.
              //   3. >= 6000ms desde que o áudio da Charlotte terminou — reverb
              //      em ambiente fechado com loudspeaker pode durar 4-5s.
              //   4. Cooldown de 3000ms entre response.creates consecutivos.
              if (!charlotteSpeakingRef.current) {
                const speechDuration  = Date.now() - speechStartedAtRef.current;
                const msSinceDone     = Date.now() - lastCharlotteDoneRef.current;
                const msSinceLast     = Date.now() - lastResponseCreateRef.current;
                if (speechDuration > 500 && msSinceDone > 6000 && msSinceLast > 3000) {
                  lastResponseCreateRef.current = Date.now();
                  setTimeout(() => {
                    if (dcRef.current?.readyState === 'open') {
                      sendEvent({ type: 'response.create' });
                    }
                  }, 150);
                }
              }
              break;

            case 'response.cancelled':
              responseActiveRef.current = false;
              charlotteSpeakingRef.current = false;
              setCharlotteSpeaking(false);
              break;

            case 'error':
              console.error('[LiveVoice] server error:', msg.error);
              break;
          }
        } catch { /* ignora erros de parse */ }
      };

      dc.onerror = (e: any) => console.warn('[LiveVoice] data channel error:', e);

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.warn('[LiveVoice] ICE', pc.iceConnectionState);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        const err = await sdpRes.text();
        throw new Error(`SDP exchange failed: ${err}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp } as any);

    } catch (error: any) {
      // Limpar recursos parcialmente alocados (mic, peer connection)
      localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
      dcRef.current?.close(); dcRef.current = null;
      pcRef.current?.close(); pcRef.current = null;
      stopRingTone();
      console.error('[LiveVoice] connect error:', error);
      setStatus('error');
      setErrorMsg(
        userLevel === 'Novice'
          ? 'Não foi possível conectar. Tente novamente.'
          : 'Could not connect. Please try again.'
      );
    }
  }, [userLevel, userName, startRingTone, stopRingTone, sendEvent, applyAudioMode, startSessionTimer, startInactivityTimer]);

  // ── Disconnect completo (fecha modal) ────────────────────────────────────
  const disconnect = React.useCallback(() => {
    clearSessionInterval();
    clearInactivityInterval();
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    stopRingTone();
    InCallManager.stop(); // devolve o AVAudioSession ao estado anterior
    charlotteSpeakingRef.current = false;
    responseActiveRef.current    = false;
    setStatus('disconnected');
    setCharlotteSpeaking(false);
    setUserSpeaking(false);
    setIsPaused(false);
    setInactivityWarning(false);
    setWarningCountdown(30);
    warnStartRef.current = 0;
  }, [stopRingTone, clearSessionInterval, clearInactivityInterval]);

  const handleEndCall = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Registrar analytics
    const segSecsForTrack = sessionStartRef.current > 0
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0;
    trackDuration('live_voice_ended', sessionAccumSecs.current + segSecsForTrack, { level: userLevel });
    // Salvar segundos acumulados
    const segSecs = sessionStartRef.current > 0
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    const totalSecs = sessionAccumSecs.current + segSecs;
    if (totalSecs > 0) {
      consumeLiveVoiceSeconds(totalSecs).catch(console.warn);
      sessionAccumSecs.current = 0;
    }
    // Flush any accumulated Charlotte text before disconnecting
    if (charlotteTextAccRef.current.trim()) {
      setConversationTurns(prev => [
        ...prev,
        { role: 'assistant', text: charlotteTextAccRef.current.trim() },
      ]);
      charlotteTextAccRef.current = '';
    }
    const wasConnected = wasConnectedRef.current;
    disconnect();
    // Always show transcript if call was ever connected (even if empty — helps debug)
    if (wasConnected) {
      setShowTranscript(true);
    } else {
      onClose();
    }
  }, [disconnect, onClose]);

  const handleMute = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(v => {
      const next = !v;
      isMutedRef.current = next;
      applyMute(next);
      return next;
    });
  }, [applyMute]);

  const handleSpeakerToggle = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeaker(v => {
      const next = !v;
      isSpeakerRef.current = next;
      InCallManager.setForceSpeakerphoneOn(next);
      return next;
    });
  }, []);

  const handleResume = React.useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const remaining = await loadPool();
    if (remaining > 0) {
      connect();
    }
  }, [loadPool, connect]);

  // ── Lifecycle: abrir/fechar modal ─────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setIsPaused(false);
      setPoolExhausted(false);
      setInactivityWarning(false);
      setWarningCountdown(30);
      setShowTranscript(false);
      setConversationTurns([]);
      charlotteTextAccRef.current = '';
      wasConnectedRef.current = false;
      farewellActiveRef.current = false;
      farewellAudioStartRef.current = 0;
      sessionAccumSecs.current = 0;
      warnStartRef.current = 0;
      loadPool().then(remaining => {
        if (remaining > 0) connect();
      });
    } else {
      // Salvar segundos ao fechar
      if (sessionStartRef.current > 0 && status === 'connected') {
        const segSecs = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        const totalSecs = sessionAccumSecs.current + segSecs;
        if (totalSecs > 0) {
          consumeLiveVoiceSeconds(totalSecs).catch(console.warn);
          sessionAccumSecs.current = 0;
        }
      }
      disconnect();
    }
  }, [isOpen]); // eslint-disable-line

  // ── RENDER ─────────────────────────────────────────────────────────────────

  const poolMins = Math.ceil(poolRemaining / 60);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      hardwareAccelerated
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Transcript screen ─────────────────────────────────────────────── */}
      {showTranscript ? (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Safe area top — white, matches header */}
          <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />

          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, height: 56,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1, borderBottomColor: 'rgba(22,21,58,0.10)',
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.10)', alignItems: 'center', justifyContent: 'center' }}>
              <ChatCircle size={20} color="#7C3AED" weight="fill" />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AppText style={{ fontSize: 9, fontWeight: '700', color: '#9896B8', textTransform: 'uppercase', letterSpacing: 1 }}>Charlotte</AppText>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#16153A', letterSpacing: -0.3 }}>
                {userLevel === 'Novice' ? 'Transcrição da Chamada' : 'Call Transcript'}
              </AppText>
            </View>
            {/* Spacer to balance the icon on the left */}
            <View style={{ width: 36 }} />
          </View>

          {/* Bubbles */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#F4F3FA' }}
            contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {conversationTurns.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
                <AppText style={{ color: '#9896B8', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  {userLevel === 'Novice'
                    ? 'Transcrição não disponível para esta chamada.'
                    : 'No transcript available for this call.'}
                </AppText>
              </View>
            ) : (
              conversationTurns.map((turn, i) => {
                const isUser = turn.role === 'user';
                return (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                    {!isUser && (
                      <Image
                        source={require('../../assets/charlotte-avatar.png')}
                        style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, marginTop: 2, flexShrink: 0 }}
                      />
                    )}
                    <View style={{
                      maxWidth: '78%',
                      backgroundColor: isUser ? '#A3FF3C' : '#FFFFFF',
                      borderRadius: 18,
                      borderBottomRightRadius: isUser ? 4 : 18,
                      borderBottomLeftRadius: isUser ? 18 : 4,
                      paddingHorizontal: 14, paddingVertical: 10,
                      shadowColor: 'rgba(22,21,58,0.08)', shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}>
                      <AppText style={{ fontSize: 14, fontWeight: '500', color: isUser ? '#16153A' : '#16153A', lineHeight: 20 }}>
                        {turn.text}
                      </AppText>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Close button in bottom safe area */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1, borderTopColor: 'rgba(22,21,58,0.08)',
            paddingBottom: insets.bottom,
          }}>
            <TouchableOpacity
              onPress={() => { setShowTranscript(false); onClose(); }}
              style={{
                marginHorizontal: 24, marginTop: 12, marginBottom: 12,
                backgroundColor: '#7C3AED',
                borderRadius: 14, paddingVertical: 15,
                alignItems: 'center',
              }}
            >
              <AppText style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                {userLevel === 'Novice' ? 'Fechar' : 'Close'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
      <>
      <StatusBar barStyle="light-content" backgroundColor="#07071C" />
      <View style={{ flex: 1, backgroundColor: '#07071C', paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 24 }}>

          {/* ── TOP: Nome + Timer + Pool badge ─────────────────────── */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Charlotte
            </AppText>
            {status === 'connected' && !isPaused && (
              <AppText style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, letterSpacing: 2,
                ...(Platform.OS === 'ios'
                  ? { fontVariant: ['tabular-nums'] }
                  : { fontFamily: 'monospace' }) }}>
                {callTime}
              </AppText>
            )}
            {status === 'connecting' && (
              <AppText style={{ color: '#F97316', fontSize: 13 }}>
                {userLevel === 'Novice' ? 'Chamando...' : 'Calling...'}
              </AppText>
            )}
            {isPaused && (
              <AppText style={{ color: '#F97316', fontSize: 13, letterSpacing: 0.5 }}>
                {userLevel === 'Novice' ? 'Pausado por inatividade' : 'Paused — inactive'}
              </AppText>
            )}
            {status === 'error' && (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <AppText style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', paddingHorizontal: 8 }}>
                  {errorMsg}
                </AppText>
                {!poolExhausted && (
                  <TouchableOpacity
                    onPress={() => connect()}
                    style={{
                      backgroundColor: '#A3FF3C', borderRadius: 20,
                      paddingHorizontal: 20, paddingVertical: 8,
                    }}
                  >
                    <AppText style={{ color: '#07071C', fontSize: 13, fontWeight: '700' }}>
                      {userLevel === 'Novice' ? 'Tentar novamente' : 'Try again'}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {poolLoading && status === 'idle' && (
              <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>...</AppText>
            )}
            {/* Aviso crítico apenas quando < 2 min — sem exibir créditos no header */}
            {!poolLoading && !poolExhausted && poolRemaining < 120 && (
              <AppText style={{
                marginTop: 5, fontSize: 12, fontWeight: '500', letterSpacing: 0.2,
                color: poolRemaining < 60 ? '#ef4444' : 'rgba(249,115,22,0.85)',
              }}>
                {userLevel === 'Novice'
                  ? `${poolMins} min restante${poolMins !== 1 ? 's' : ''}`
                  : `${poolMins} min left`}
              </AppText>
            )}
          </View>

          {/* ── CENTER: Avatar + Wave ─────────────────────────────── */}
          <View style={{ alignItems: 'center', gap: 32 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{
                position: 'absolute',
                width: 148, height: 148, borderRadius: 74,
                borderWidth: 2, borderColor: isPaused ? '#F97316' : ringColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }} />
              <View style={{
                position: 'absolute',
                width: 132, height: 132, borderRadius: 66,
                borderWidth: 1.5,
                borderColor: isPaused
                  ? 'rgba(249,115,22,0.25)'
                  : status === 'connected'
                    ? 'rgba(163,255,60,0.3)'
                    : 'rgba(249,115,22,0.25)',
              }} />
              <Image
                source={require('../../assets/charlotte-avatar.png')}
                style={{
                  width: 120, height: 120, borderRadius: 60,
                  borderWidth: 3,
                  borderColor: isPaused
                    ? '#F97316'
                    : status === 'connected'
                      ? '#A3FF3C'
                      : '#F97316',
                  opacity: isPaused ? 0.6 : 1,
                }}
                resizeMode="cover"
              />
              {isPaused && (
                <View style={{
                  position: 'absolute',
                  backgroundColor: 'rgba(7,7,28,0.7)',
                  width: 120, height: 120, borderRadius: 60,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Pause size={36} color="#F97316" weight="fill" />
                </View>
              )}
            </View>
          </View>

          {/* ── BOTTOM: controles ou pausa ───────────────────────── */}
          {isPaused ? (
            /* ── Estado pausado ── */
            <View style={{ alignItems: 'center', gap: 16 }}>
              <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                {userLevel === 'Novice'
                  ? 'Chamada pausada. O timer não correu enquanto esteve ausente.'
                  : 'Call paused. Timer stopped while you were away.'}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity
                  onPress={handleResume}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: '#A3FF3C', borderRadius: 28,
                    paddingHorizontal: 28, paddingVertical: 14,
                    shadowColor: '#A3FF3C', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  }}
                >
                  <ArrowCounterClockwise size={20} color="#07071C" weight="bold" />
                  <AppText style={{ color: '#07071C', fontSize: 15, fontWeight: '800' }}>
                    {userLevel === 'Novice' ? 'Retomar' : 'Resume'}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { disconnect(); onClose(); }}
                  style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <PhoneSlash size={22} color="#ef4444" weight="regular" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Controles normais ── */
            <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
              {/* Banner de inatividade */}
              {inactivityWarning && (
                <View style={{
                  backgroundColor: 'rgba(249,115,22,0.15)',
                  borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)',
                  paddingHorizontal: 20, paddingVertical: 10,
                  alignItems: 'center',
                }}>
                  <AppText style={{ color: '#F97316', fontSize: 13, fontWeight: '700' }}>
                    {userLevel === 'Novice'
                      ? `Ainda está aí? Pausando em ${warningCountdown}s`
                      : `Still there? Pausing in ${warningCountdown}s`}
                  </AppText>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
                {/* Mute */}
                <TouchableOpacity
                  onPress={handleMute}
                  pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  accessibilityLabel={isMuted
                    ? (userLevel === 'Novice' ? 'Ativar microfone / Unmute' : 'Unmute microphone')
                    : (userLevel === 'Novice' ? 'Silenciar microfone / Mute' : 'Mute microphone')}
                  accessibilityRole="button"
                  style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isMuted
                    ? <MicrophoneSlash size={24} color="#ef4444" weight="regular" />
                    : <Microphone     size={24} color="rgba(255,255,255,0.7)" weight="regular" />
                  }
                </TouchableOpacity>

                {/* End call */}
                <TouchableOpacity
                  onPress={handleEndCall}
                  pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  accessibilityLabel={userLevel === 'Novice' ? 'Encerrar chamada / End call' : 'End call'}
                  accessibilityRole="button"
                  style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: '#ef4444',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#ef4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
                  }}
                >
                  <PhoneSlash size={26} color="#fff" weight="fill" />
                </TouchableOpacity>

                {/* Speaker / Ouvido */}
                <TouchableOpacity
                  onPress={handleSpeakerToggle}
                  pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  accessibilityLabel={isSpeaker
                    ? (userLevel === 'Novice' ? 'Usar fone de ouvido / Switch to earpiece' : 'Switch to earpiece')
                    : (userLevel === 'Novice' ? 'Usar alto-falante / Switch to speaker' : 'Switch to speaker')}
                  accessibilityRole="button"
                  style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: isSpeaker ? 'rgba(163,255,60,0.15)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: isSpeaker ? 'rgba(163,255,60,0.4)' : 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isSpeaker
                    ? <SpeakerHigh size={24} color="#A3FF3C" weight="regular" />
                    : <Ear        size={24} color="rgba(255,255,255,0.7)" weight="regular" />
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </View>
      </>
      )} {/* end showTranscript ternary */}
    </Modal>
  );
}
