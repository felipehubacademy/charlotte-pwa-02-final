'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, X, Pause, Play } from 'lucide-react';

interface AudioPlayerProps {
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  isProcessing?: boolean;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  onSendAudio,
  isProcessing = false,
  userLevel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Initialize audio recording
  const initializeRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      audioStreamRef.current = stream;

      // Setup audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
        setRecordedBlob(audioBlob);
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize recording:', error);
      return false;
    }
  }, []);

  // Analyze audio levels
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Create waveform levels
    const levels = Array(20).fill(0).map((_, index) => {
      const start = Math.floor((index / 20) * dataArray.length);
      const end = Math.floor(((index + 1) / 20) * dataArray.length);
      const slice = dataArray.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      return average / 255;
    });

    setAudioLevels(levels);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    const initialized = await initializeRecording();
    if (!initialized) return;

    setIsRecording(true);
    setRecordingTime(0);
    setRecordedBlob(null);

    mediaRecorderRef.current?.start();
    analyzeAudio();

    // Recording timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 60) { // Max 60 seconds
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [initializeRecording, analyzeAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setAudioLevels(Array(20).fill(0));
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  // Send audio
  const sendAudio = useCallback(() => {
    if (recordedBlob && recordingTime > 0) {
      onSendAudio(recordedBlob, recordingTime);
      setRecordedBlob(null);
      setRecordingTime(0);
    }
  }, [recordedBlob, recordingTime, onSendAudio]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
  }, []);

  // Play/Pause recorded audio
  const togglePlayback = useCallback(() => {
    if (!recordedBlob) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(recordedBlob));
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [recordedBlob, isPlaying]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mouse/Touch handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRecording && !recordedBlob) {
      startRecording();
    }
  }, [isRecording, recordedBlob, startRecording]);

  const handleMouseUp = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording && !recordedBlob) {
      startRecording();
    }
  }, [isRecording, recordedBlob, startRecording]);

  const handleTouchEnd = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Recording UI
  if (isRecording) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center space-x-3 bg-red-500/10 backdrop-blur-sm rounded-3xl px-4 py-2 border border-red-500/30 ${
          typeof window !== 'undefined' && 
          ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches)
            ? 'audio-recording-container' 
            : ''
        }`}
      >
        {/* Waveform */}
        <div className="flex items-center space-x-1">
          {audioLevels.map((level, index) => (
            <motion.div
              key={index}
              className="w-1 bg-red-500 rounded-full"
              animate={{ 
                height: `${Math.max(4, level * 24)}px` 
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        {/* Recording time */}
        <span className="text-red-500 font-mono text-sm min-w-12">
          {formatTime(recordingTime)}
        </span>

        {/* Stop recording button - SEMPRE VISÍVEL */}
        <button
          onMouseUp={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          className="p-2 bg-red-500 rounded-full text-white active:scale-95 transition-transform flex-shrink-0"
          style={{ minWidth: '32px', minHeight: '32px' }}
        >
          <div className="w-4 h-4 bg-white rounded-sm mx-auto" />
        </button>
      </motion.div>
    );
  }

  // Recorded audio preview
  if (recordedBlob) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center space-x-3 bg-primary/10 backdrop-blur-sm rounded-3xl px-4 py-2 border border-primary/30"
      >
        {/* Play/Pause button */}
        <button
          onClick={togglePlayback}
          className="p-2 bg-primary/20 rounded-full text-primary hover:bg-primary/30 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Duration */}
        <span className="text-primary font-mono text-sm">
          {formatTime(recordingTime)}
        </span>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={cancelRecording}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
          <button
            onClick={sendAudio}
            disabled={isProcessing}
            className="p-1 text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Default mic button
  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="p-2 text-white/60 hover:text-primary transition-colors rounded-full hover:bg-white/5 active:scale-95 select-none"
      title={userLevel === 'Novice' ? 'Segurar para gravar' : 'Hold to record'}
    >
      <Mic size={18} />
    </button>
  );
};

export default AudioPlayer;