import { useEffect, useRef, useState } from "react";

export const useVoiceActivityDetection = () => {
  const [volume, setVolume] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;

        // Análise de volume (time domain)
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setVolume(rms);

        // Análise de frequência para visualização
        analyser.getByteFrequencyData(frequencyData);
        const levels = Array(32).fill(0).map((_, index) => {
          const start = Math.floor((index / 32) * frequencyData.length);
          const end = Math.floor(((index + 1) / 32) * frequencyData.length);
          const slice = frequencyData.slice(start, end);
          const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
          return average / 255;
        });
        setAudioLevels(levels);

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      // Fallback para dados mock
      createMockAudioData();
    }
  };

  const createMockAudioData = () => {
    const mockTick = () => {
      const time = Date.now() / 1000;
      
      // Volume mock
      const mockVolume = Math.abs(Math.sin(time * 2)) * 0.5;
      setVolume(mockVolume);

      // Níveis de áudio mock
      const mockLevels = Array(32).fill(0).map((_, i) => {
        const wave1 = Math.sin(time * 2 + i * 0.3) * 0.3;
        const wave2 = Math.sin(time * 1.5 + i * 0.2) * 0.4;
        const wave3 = Math.sin(time * 3 + i * 0.1) * 0.2;
        return Math.abs(wave1 + wave2 + wave3) * (0.3 + Math.random() * 0.7);
      });
      setAudioLevels(mockLevels);

      animationFrameRef.current = requestAnimationFrame(mockTick);
    };

    mockTick();
    setIsListening(true);
  };

  const stop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    mediaStreamRef.current = null;

    setIsListening(false);
    setVolume(0);
    setAudioLevels([]);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { volume, isListening, audioLevels, start, stop };
}; 