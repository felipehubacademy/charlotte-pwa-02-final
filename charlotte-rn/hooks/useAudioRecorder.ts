// hooks/useAudioRecorder.ts — migrado de expo-av → expo-audio (SDK 54)

import { useState, useRef, useCallback } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// ── Preset otimizado para Azure Speech SDK ────────────────────────
// iOS  → WAV LinearPCM 16kHz mono  → servidor declara getWaveFormatPCM(16000,16,1)
// Android → AMR-WB 16kHz mono      → servidor declara getCompressedFormat(AMR_WB)
//
// Por que AMR-WB: expo-audio (SDK 54) so aceita encoders em
// {'default','amr_nb','amr_wb','aac','he_aac','aac_eld'}. Desses, apenas
// AMR_WB esta na lista oficial do Azure Speech SDK getCompressedFormat
// (PCM, MuLaw, Siren, MP3, OGG_OPUS, WEBM_OPUS, ALaw, FLAC, OPUS, AMR_WB,
// G722). AAC nao esta na lista, entao nao daria pra fazer pronunciation
// assessment sem transcoding.
//
// OpenAI Whisper nao aceita AMR diretamente — o /api/transcribe detecta
// Content-Type 'audio/amr' e roteia pra Azure Speech SDK (recognizeOnceAsync)
// em vez do Whisper. Resultado: transcricao + pronunciation ambos funcionam
// no Android com um unico formato de gravacao.
export const PRONUNCIATION_RECORDING_OPTIONS: any = Platform.select({
  ios: {
    extension: '.wav',
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    ios: {
      outputFormat: IOSOutputFormat.LINEARPCM,
      audioQuality: AudioQuality.MAX,
      linearPCMBitDepth: 16 as 8 | 16 | 24 | 32,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  },
  android: {
    extension: '.amr',
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 23850, // AMR-WB max bitrate
    android: {
      outputFormat: 'amrwb',
      audioEncoder: 'amr_wb',
    },
  },
  default: RecordingPresets.HIGH_QUALITY,
});

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';

type RecordingState = 'idle' | 'recording' | 'processing';

export interface AudioRecordingResult {
  uri: string;
  duration: number; // seconds
}

interface AudioRecorderResult {
  state: RecordingState;
  duration: number; // seconds elapsed while recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioRecordingResult | null>;
  cancelRecording: () => Promise<void>;
  hasPermission: boolean | null;
}

// Max recording duration per mode (seconds)
export const MAX_RECORDING_DURATION: Record<string, number> = {
  chat:          30,
  pronunciation: 10,
  'learn':       10,
};

export function useAudioRecorder(
  options: typeof RecordingPresets.HIGH_QUALITY = RecordingPresets.HIGH_QUALITY,
  maxDuration = 30,
): AudioRecorderResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // expo-audio recorder instance (lifecycle managed by the hook)
  const recorder = useExpoAudioRecorder(options);

  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef    = useRef(0);
  const autoStopRef    = useRef<(() => void) | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { granted } = await requestRecordingPermissionsAsync();
    setHasPermission(granted);
    return granted;
  }, []);

  const startRecording = useCallback(async () => {
    const permitted = hasPermission ?? (await requestPermission());
    if (!permitted) return;

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      durationRef.current = 0;
      setState('recording');
      setDuration(0);

      // Register auto-stop callback so the timer can call it without circular dep
      autoStopRef.current = () => stopRecording();

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        // Auto-stop when max duration reached
        if (durationRef.current >= maxDuration) {
          autoStopRef.current?.();
        }
      }, 1000);
    } catch (error) {
      console.error('❌ startRecording error:', error);
    }
  }, [hasPermission, requestPermission, recorder]);

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    // Guard: prevent double-invocation from auto-stop + manual release
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    autoStopRef.current = null;

    setState('processing');

    try {
      const recordedDuration = durationRef.current;
      await recorder.stop();

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const uri = recorder.uri;
      setState('idle');
      setDuration(0);

      if (!uri) return null;

      // expo-audio's useAudioRecorder reuses a single native recorder instance,
      // meaning recorder.uri always points to the same file path and gets
      // overwritten on every new recording. Copy to a unique path so each
      // message keeps its own audio file intact for later playback.
      const ext = uri.split('.').pop() ?? 'm4a';
      const uniqueUri = `${FileSystem.cacheDirectory}rec_${Date.now()}.${ext}`;
      try {
        await FileSystem.copyAsync({ from: uri, to: uniqueUri });
        return { uri: uniqueUri, duration: recordedDuration };
      } catch {
        // Fallback to original URI if copy fails
        return { uri, duration: recordedDuration };
      }
    } catch (error) {
      console.error('❌ stopRecording error:', error);
      setState('idle');
      return null;
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (recorder.isRecording) await recorder.stop();
    } catch { /* ignore */ }

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    setState('idle');
    setDuration(0);
    durationRef.current = 0;
  }, [recorder]);

  return { state, duration, startRecording, stopRecording, cancelRecording, hasPermission };
}

/**
 * Envia o áudio gravado para /api/transcribe e retorna o texto.
 */
export async function transcribeAudio(audioUri: string): Promise<string | null> {
  try {
    const lower = audioUri.toLowerCase();
    const isWav = lower.endsWith('.wav');
    const isOgg = lower.endsWith('.ogg');
    const isAmr = lower.endsWith('.amr');
    const formData = new FormData();
    formData.append('audio', {
      uri:  audioUri,
      name: isWav ? 'recording.wav' : isAmr ? 'recording.amr' : isOgg ? 'recording.ogg' : 'recording.m4a',
      type: isWav ? 'audio/wav'     : isAmr ? 'audio/amr'     : isOgg ? 'audio/ogg'     : 'audio/m4a',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`Transcribe error: ${response.status}`);

    const data = await response.json();
    // API returns { transcription: "...", success: true }
    return data.transcription ?? data.text ?? null;
  } catch (error) {
    console.error('❌ transcribeAudio error:', error);
    return null;
  }
}
