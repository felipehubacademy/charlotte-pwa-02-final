// components/voice/LiveVoiceModal.tsx
// Live voice — WebRTC transport → OpenAI Realtime API
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
import { PhoneSlash, MicrophoneSlash, Microphone, SpeakerHigh, Ear } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import { useCallTimer } from '@/hooks/useCallTimer';
import Constants from 'expo-constants';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

const MODEL = 'gpt-4o-realtime-preview-2024-12-17';

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
  return SYSTEM_PROMPTS[level].replace('{NAME}', name).replace('{GREETING}', greeting);
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
  const [isSpeaker, setIsSpeaker] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [charlotteSpeaking, setCharlotteSpeaking] = React.useState(false);
  const [userSpeaking, setUserSpeaking] = React.useState(false);

  // ── WebRTC refs ────────────────────────────────────────────────────────────
  const pcRef             = React.useRef<InstanceType<typeof RTCPeerConnection> | null>(null);
  const dcRef             = React.useRef<any>(null); // RTCDataChannel
  const localStreamRef    = React.useRef<any>(null); // MediaStream

  // ── Ring tone ref (expo-audio — só usado durante connecting) ──────────────
  const ringPlayerRef     = React.useRef<AudioPlayer | null>(null);

  // ── State refs (síncronos — evitam stale closure nos handlers) ────────────
  const isMutedRef              = React.useRef(false);
  const isSpeakerRef            = React.useRef(true);
  const charlotteSpeakingRef    = React.useRef(false);
  const responseActiveRef       = React.useRef(false);
  const lastCharlotteDoneRef    = React.useRef(0);

  const callTime = useCallTimer(status === 'connected');

  // ── Audio mode (ringtone phase only — WebRTC não usa isso) ───────────────
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

  // ── Ring tone ──────────────────────────────────────────────────────────────
  const startRingTone = React.useCallback(async () => {
    try {
      // Necessário para tocar no modo silencioso antes do WebRTC assumir o AVAudioSession
      await applyAudioMode();
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
  }, [applyAudioMode]);

  const stopRingTone = React.useCallback(() => {
    ringPlayerRef.current?.pause();
    ringPlayerRef.current?.remove();
    ringPlayerRef.current = null;
  }, []);

  // ── Mute: desabilita o mic track local ────────────────────────────────────
  const applyMute = React.useCallback((muted: boolean) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track: any) => {
      track.enabled = !muted;
    });
  }, []);

  // ── Enviar evento via data channel ─────────────────────────────────────────
  const sendEvent = React.useCallback((event: object) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify(event));
    }
  }, []);

  // ── Avatar ring animations — driven pela Charlotte (não pelo usuário) ────────
  const ringScale   = React.useRef(new Animated.Value(1)).current;
  const ringOpacity = React.useRef(new Animated.Value(0.5)).current;
  const loopRef     = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    loopRef.current?.stop();

    if (status === 'connecting') {
      // Pulso laranja suave — aguardando conexão
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
    } else if (status === 'connected' && charlotteSpeaking) {
      // Pulso verde vivo — Charlotte está falando
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
    } else if (status === 'connected') {
      // Respiração suave — idle, aguardando usuário
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
  }, [status, charlotteSpeaking]);

  const ringColor = status === 'connecting' ? '#F97316' : '#A3FF3C';

  // ── Connect via WebRTC ─────────────────────────────────────────────────────
  const connect = React.useCallback(async () => {
    setStatus('connecting');
    setErrorMsg('');

    try {
      // 1. Permissão de microfone
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setErrorMsg(userLevel === 'Novice' ? 'Permissão de microfone negada' : 'Microphone permission denied');
        setStatus('error');
        return;
      }

      // 2. Ring tone enquanto busca o token (antes de getUserMedia para não conflitar com AVAudioSession)
      await startRingTone();

      // 3. Ephemeral session token (servidor — API key nunca sai do backend)
      const tokenRes = await fetch(`${API_BASE_URL}/api/realtime-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLevel, userName }),
      });
      if (!tokenRes.ok) throw new Error('Failed to get session token');
      const { clientSecret } = await tokenRes.json();
      if (!clientSecret) throw new Error('No client secret returned');

      // 4. Para ring tone antes de getUserMedia (evita conflito AVAudioSession)
      stopRingTone();

      // 5. Stream de microfone local (WebRTC toma conta do AVAudioSession a partir daqui)
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // 6. RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Adiciona track de áudio local (mic → OpenAI)
      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      // Áudio remoto (Charlotte → speaker) é roteado automaticamente pelo WebRTC
      pc.ontrack = () => {
        // WebRTC toca o áudio remoto automaticamente no speaker
        // O InCallManager já configurou o roteamento correto
      };

      // 7. Data channel para eventos JSON (substitui WebSocket)
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        stopRingTone();
        setStatus('connected');

        // Configura sessão: VAD, voz, instruções
        const greeting = getRandomGreeting(userLevel);
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: getSystemPrompt(userLevel, userName, greeting),
            voice: 'coral',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            max_response_output_tokens: 150,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.95,
              prefix_padding_ms: 600,
              silence_duration_ms: 800,
            },
          },
        }));

        // Dispara saudação inicial
        setTimeout(() => {
          if (dcRef.current?.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'response.create' }));
          }
        }, 500);

        // InCallManager: configura speaker e modo de chamada
        InCallManager.start({ media: 'audio' });
        InCallManager.setForceSpeakerphoneOn(isSpeakerRef.current);
      };

      dc.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            // Em WebRTC o áudio vai pela track — response.created é o sinal confiável
            // de que Charlotte começou a responder
            case 'response.created':
              responseActiveRef.current = true;
              if (!charlotteSpeakingRef.current) {
                charlotteSpeakingRef.current = true;
                setCharlotteSpeaking(true);
                setUserSpeaking(false);
                // Muta mic para evitar echo com speakerphone
                localStreamRef.current?.getAudioTracks()
                  .forEach((t: any) => { t.enabled = false; });
                sendEvent({ type: 'input_audio_buffer.clear' });
              }
              break;

            case 'response.audio.delta':
              // Fallback: caso o servidor envie este evento no modo WebRTC
              responseActiveRef.current = true;
              if (!charlotteSpeakingRef.current) {
                charlotteSpeakingRef.current = true;
                setCharlotteSpeaking(true);
                setUserSpeaking(false);
                localStreamRef.current?.getAudioTracks()
                  .forEach((t: any) => { t.enabled = false; });
                sendEvent({ type: 'input_audio_buffer.clear' });
              }
              break;

            case 'response.done':
              responseActiveRef.current = false;
              // Cooldown 900ms antes de reativar mic — deixa o eco dissipar
              setTimeout(() => {
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);
                lastCharlotteDoneRef.current = Date.now();
                localStreamRef.current?.getAudioTracks()
                  .forEach((t: any) => { t.enabled = !isMutedRef.current; });
              }, 900);
              break;

            case 'response.audio.done':
              responseActiveRef.current = false;
              break;

            case 'input_audio_buffer.speech_started':
              setUserSpeaking(true);
              // Garante mic ativo (pode ter sido mutado pelo echo guard)
              localStreamRef.current?.getAudioTracks()
                .forEach((t: any) => { t.enabled = !isMutedRef.current; });
              // Interrupção: Charlotte ainda falando → cancela resposta
              if (charlotteSpeakingRef.current) {
                charlotteSpeakingRef.current = false;
                setCharlotteSpeaking(false);
                if (responseActiveRef.current) {
                  responseActiveRef.current = false;
                  sendEvent({ type: 'response.cancel' });
                }
              }
              break;

            case 'input_audio_buffer.speech_stopped':
              setUserSpeaking(false);
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

      // 8. SDP offer → OpenAI → SDP answer
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

      // Conexão estabelecida — data channel onopen dispara em seguida

    } catch (error: any) {
      stopRingTone();
      console.error('[LiveVoice] connect error:', error);
      setStatus('error');
      setErrorMsg(
        userLevel === 'Novice'
          ? 'Não foi possível conectar. Tente novamente.'
          : 'Could not connect. Please try again.'
      );
    }
  }, [userLevel, userName, startRingTone, stopRingTone, sendEvent, applyAudioMode]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = React.useCallback(() => {
    // Para mic local
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;

    // Fecha data channel e peer connection
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;

    // Para ring tone e InCallManager
    stopRingTone();
    InCallManager.stop();

    // Reseta audio mode para playback normal após a chamada
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

    charlotteSpeakingRef.current = false;
    responseActiveRef.current    = false;
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

  React.useEffect(() => {
    if (isOpen) {
      connect();
    } else {
      disconnect();
    }
  }, [isOpen]);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  // Android agora suportado via WebRTC (PCM nativo — sem problema de AAC)
  // UI idêntica em iOS e Android

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      hardwareAccelerated
    >
      <StatusBar barStyle="light-content" backgroundColor="#07071C" />
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
              <AppText style={{ color: '#F97316', fontSize: 13 }}>
                {userLevel === 'Novice' ? 'Chamando...' : 'Calling...'}
              </AppText>
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
