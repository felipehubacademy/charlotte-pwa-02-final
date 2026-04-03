// hooks/useAudioRecorder.ts — migrado de expo-av → expo-audio (SDK 54)

import { useState, useRef, useCallback } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// ── WAV/PCM preset for Azure Speech SDK ─────────────────────────
// Azure Pronunciation Assessment requires PCM audio (16kHz, 16-bit, mono).
// On iOS, LinearPCM output satisfies this directly without any server-side
// conversion. On Android we keep M4A since Azure support there is secondary.
export const PRONUNCIATION_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  ios: {
    extension: '.wav',
    outputFormat: 'lpcm' as any,  // IOSOutputFormat.LINEARPCM
    audioQuality: 127,            // IOSAudioQuality.MAX
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
} as typeof RecordingPresets.HIGH_QUALITY;

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

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

export function useAudioRecorder(
  options: typeof RecordingPresets.HIGH_QUALITY = RecordingPresets.HIGH_QUALITY
): AudioRecorderResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // expo-audio recorder instance (lifecycle managed by the hook)
  const recorder = useExpoAudioRecorder(options);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

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

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);
    } catch (error) {
      console.error('❌ startRecording error:', error);
    }
  }, [hasPermission, requestPermission, recorder]);

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

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
    const isWav = audioUri.toLowerCase().endsWith('.wav');
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: isWav ? 'recording.wav' : 'recording.m4a',
      type: isWav ? 'audio/wav' : 'audio/m4a',
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
