// hooks/useAudioRecorder.ts — migrado de expo-av → expo-audio (SDK 54)

import { useState, useRef, useCallback } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import Constants from 'expo-constants';

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

export function useAudioRecorder(): AudioRecorderResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // expo-audio recorder instance (lifecycle managed by the hook)
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);

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
      return { uri, duration: recordedDuration };
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
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
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
