'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
}

// Siri-like magical orb with fluid animations
const MagicalOrb: React.FC<{ 
  isListening: boolean; 
  isSpeaking: boolean; 
  isActive: boolean;
  audioLevels: number[];
}> = ({ isListening, isSpeaking, isActive, audioLevels }) => {
  
  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Multiple outer glow rings */}
      {Array.from({ length: 4 }).map((_, ringIndex) => (
        <motion.div
          key={`ring-${ringIndex}`}
          className={`absolute rounded-full border transition-all duration-700 ${
            isListening 
              ? 'border-blue-400/20 shadow-lg shadow-blue-400/10' 
              : isSpeaking 
                ? 'border-primary/20 shadow-lg shadow-primary/10' 
                : 'border-white/10'
          }`}
          style={{
            width: `${240 + (ringIndex * 20)}px`,
            height: `${240 + (ringIndex * 20)}px`,
          }}
          animate={isActive ? { 
            scale: [1, 1.05 + (ringIndex * 0.02), 1], 
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, ringIndex % 2 === 0 ? 360 : -360]
          } : { opacity: 0.05 }}
          transition={{ 
            duration: 8 + (ringIndex * 2), 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: ringIndex * 0.5
          }}
        />
      ))}

      {/* Main orb */}
      <div className="relative w-48 h-48 rounded-full overflow-hidden">
        {/* Dynamic gradient background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isListening 
              ? 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.7), rgba(29, 78, 216, 0.5), rgba(30, 58, 138, 0.3))'
              : isSpeaking 
                ? 'radial-gradient(circle at 30% 30%, rgba(163, 255, 60, 0.9), rgba(143, 230, 26, 0.7), rgba(101, 163, 13, 0.5), rgba(77, 124, 15, 0.3))'
                : 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
          }}
          animate={isActive ? {
            background: isListening 
              ? [
                  'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.7), rgba(29, 78, 216, 0.5), rgba(30, 58, 138, 0.3))',
                  'radial-gradient(circle at 70% 40%, rgba(96, 165, 250, 0.9), rgba(59, 130, 246, 0.7), rgba(37, 99, 235, 0.5), rgba(29, 78, 216, 0.3))',
                  'radial-gradient(circle at 50% 70%, rgba(147, 197, 253, 0.9), rgba(96, 165, 250, 0.7), rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.3))',
                  'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.7), rgba(29, 78, 216, 0.5), rgba(30, 58, 138, 0.3))'
                ]
              : [
                  'radial-gradient(circle at 30% 30%, rgba(163, 255, 60, 0.9), rgba(143, 230, 26, 0.7), rgba(101, 163, 13, 0.5), rgba(77, 124, 15, 0.3))',
                  'radial-gradient(circle at 70% 40%, rgba(217, 249, 157, 0.9), rgba(163, 255, 60, 0.7), rgba(143, 230, 26, 0.5), rgba(101, 163, 13, 0.3))',
                  'radial-gradient(circle at 50% 70%, rgba(254, 240, 138, 0.9), rgba(217, 249, 157, 0.7), rgba(163, 255, 60, 0.5), rgba(143, 230, 26, 0.3))',
                  'radial-gradient(circle at 30% 30%, rgba(163, 255, 60, 0.9), rgba(143, 230, 26, 0.7), rgba(101, 163, 13, 0.5), rgba(77, 124, 15, 0.3))'
                ]
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Flowing particle system */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {audioLevels.map((level, index) => {
            const size = 2 + (level * 6);
            const intensity = 0.3 + (level * 0.7);
            
            return (
              <motion.div
                key={`particle-${index}`}
                className={`absolute rounded-full blur-sm ${
                  isListening 
                    ? 'bg-white/90' 
                    : isSpeaking 
                      ? 'bg-yellow-200/90' 
                      : 'bg-white/40'
                }`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${20 + (index * 3)}%`,
                  top: `${30 + Math.sin(index * 0.5) * 40}%`,
                }}
                animate={isActive ? {
                  x: [0, Math.sin(index * 0.5) * 30, Math.cos(index * 0.3) * 40, 0],
                  y: [0, Math.cos(index * 0.7) * 35, Math.sin(index * 0.2) * 25, 0],
                  scale: [0.5, intensity * 1.5, 0.8, intensity * 1.2, 0.7],
                  opacity: [0.3, intensity, 0.5, intensity * 0.8, 0.4],
                } : { opacity: 0.1 }}
                transition={{
                  duration: 3 + (index * 0.2),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1,
                }}
              />
            );
          })}
        </div>

        {/* Animated mesh/grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 192 192">
          <defs>
            <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isListening ? "#DBEAFE" : isSpeaking ? "#FEF3C7" : "#F9FAFB"} stopOpacity="0.8" />
              <stop offset="50%" stopColor={isListening ? "#93C5FD" : isSpeaking ? "#FDE68A" : "#E5E7EB"} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isListening ? "#3B82F6" : isSpeaking ? "#F59E0B" : "#9CA3AF"} stopOpacity="0.1" />
            </radialGradient>
          </defs>
          
          {/* Animated concentric circles */}
          {Array.from({ length: 6 }).map((_, ringIndex) => {
            const radius = 20 + (ringIndex * 15);
            
            return (
              <motion.circle
                key={`mesh-${ringIndex}`}
                cx="96"
                cy="96"
                r={radius}
                fill="none"
                stroke="url(#meshGradient)"
                strokeWidth="0.5"
                animate={isActive ? {
                  r: [radius, radius + (level => audioLevels[ringIndex] * 20 || 5), radius],
                  opacity: [0.2, 0.8, 0.3],
                  strokeWidth: [0.5, 1.5, 0.5],
                } : { opacity: 0.1 }}
                transition={{
                  duration: 2 + (ringIndex * 0.3),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: ringIndex * 0.2,
                }}
              />
            );
          })}

          {/* Flowing curves */}
          {Array.from({ length: 8 }).map((_, curveIndex) => {
            const angle = (curveIndex / 8) * 360;
            
            return (
              <motion.path
                key={`curve-${curveIndex}`}
                d={`M 96 96 Q ${96 + Math.cos(angle * Math.PI / 180) * 40} ${96 + Math.sin(angle * Math.PI / 180) * 40} ${96 + Math.cos(angle * Math.PI / 180) * 70} ${96 + Math.sin(angle * Math.PI / 180) * 70}`}
                fill="none"
                stroke="url(#meshGradient)"
                strokeWidth="1"
                opacity="0.6"
                animate={isActive ? {
                  d: [
                    `M 96 96 Q ${96 + Math.cos(angle * Math.PI / 180) * 40} ${96 + Math.sin(angle * Math.PI / 180) * 40} ${96 + Math.cos(angle * Math.PI / 180) * 70} ${96 + Math.sin(angle * Math.PI / 180) * 70}`,
                    `M 96 96 Q ${96 + Math.cos(angle * Math.PI / 180) * 60} ${96 + Math.sin(angle * Math.PI / 180) * 30} ${96 + Math.cos(angle * Math.PI / 180) * 80} ${96 + Math.sin(angle * Math.PI / 180) * 60}`,
                    `M 96 96 Q ${96 + Math.cos(angle * Math.PI / 180) * 30} ${96 + Math.sin(angle * Math.PI / 180) * 50} ${96 + Math.cos(angle * Math.PI / 180) * 75} ${96 + Math.sin(angle * Math.PI / 180) * 75}`,
                    `M 96 96 Q ${96 + Math.cos(angle * Math.PI / 180) * 40} ${96 + Math.sin(angle * Math.PI / 180) * 40} ${96 + Math.cos(angle * Math.PI / 180) * 70} ${96 + Math.sin(angle * Math.PI / 180) * 70}`
                  ],
                  opacity: [0.3, 0.8, 0.5, 0.3],
                } : { opacity: 0.1 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: curveIndex * 0.2,
                }}
              />
            );
          })}
        </svg>

        {/* Central core with pulse */}
        <motion.div
          className="absolute inset-0 m-auto w-12 h-12 rounded-full"
          style={{
            background: isListening 
              ? 'radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.8), rgba(59, 130, 246, 0.3))'
              : isSpeaking 
                ? 'radial-gradient(circle, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7), rgba(163, 255, 60, 0.3))'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
            boxShadow: isListening 
              ? '0 0 30px rgba(59, 130, 246, 0.5)'
              : isSpeaking 
                ? '0 0 30px rgba(163, 255, 60, 0.5)'
                : '0 0 20px rgba(255, 255, 255, 0.3)'
          }}
          animate={isActive ? {
            scale: [1, 1.4, 0.9, 1.3, 1],
            opacity: [0.8, 1, 0.7, 0.95, 0.8],
          } : { scale: 1, opacity: 0.5 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Orbiting elements */}
      {isActive && Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * 360;
        const radius = 140 + (index % 3 * 15);
        const size = 2 + (audioLevels[index] || 0) * 4;
        
        return (
          <motion.div
            key={`orbit-${index}`}
            className={`absolute w-1 h-1 rounded-full ${
              isListening ? 'bg-blue-400/80' : isSpeaking ? 'bg-primary/80' : 'bg-white/40'
            }`}
            style={{
              left: '50%',
              top: '50%',
              width: `${size}px`,
              height: `${size}px`,
            }}
            animate={{
              x: Math.cos(angle * Math.PI / 180) * radius,
              y: Math.sin(angle * Math.PI / 180) * radius,
              scale: [0.5, 1.5, 0.8, 1.2, 0.7],
              opacity: [0.3, 0.9, 0.5, 0.8, 0.4],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8 + (index * 0.3),
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.2,
            }}
          />
        );
      })}
    </div>
  );
};

const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  userLevel 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(32).fill(0));

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const speakingIntervalRef = useRef<NodeJS.Timeout>();

  // Mock TTS function
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = isMuted ? 0 : 0.7;
      
      // Find a female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.lang.includes('en')
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Create mock waveform for TTS
        speakingIntervalRef.current = setInterval(() => {
          setAudioLevels(Array(32).fill(0).map((_, i) => {
            const wave1 = Math.sin((Date.now() / 200) + (i * 0.2)) * 0.3;
            const wave2 = Math.sin((Date.now() / 150) + (i * 0.1)) * 0.4;
            const wave3 = Math.sin((Date.now() / 300) + (i * 0.15)) * 0.2;
            return Math.abs(wave1 + wave2 + wave3) * (0.8 + Math.random() * 0.4);
          }));
        }, 80);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (speakingIntervalRef.current) {
          clearInterval(speakingIntervalRef.current);
        }
        // Return to listening mode
        setTimeout(() => {
          setIsListening(true);
          startAudioAnalysis();
        }, 500);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [isMuted]);

  // Initialize audio context and microphone
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.85;

      startAudioAnalysis();
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      // Create mock waveform if no microphone
      createMockWaveform();
    }
  }, []);

  // Create beautiful mock waveform
  const createMockWaveform = useCallback(() => {
    const interval = setInterval(() => {
      if (!isListening) return;
      
      setAudioLevels(Array(32).fill(0).map((_, i) => {
        const time = Date.now() / 1000;
        const wave1 = Math.sin(time * 2 + i * 0.3) * 0.3;
        const wave2 = Math.sin(time * 1.5 + i * 0.2) * 0.4;
        const wave3 = Math.sin(time * 3 + i * 0.1) * 0.2;
        const combined = Math.abs(wave1 + wave2 + wave3);
        return combined * (0.3 + Math.random() * 0.7);
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  // Analyze real audio levels
  const startAudioAnalysis = useCallback(() => {
    if (!analyserRef.current || !isListening) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const analyze = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Create smooth waveform from frequency data
      const levels = Array(32).fill(0).map((_, index) => {
        const start = Math.floor((index / 32) * dataArray.length);
        const end = Math.floor(((index + 1) / 32) * dataArray.length);
        const slice = dataArray.slice(start, end);
        const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
        return average / 255;
      });
      
      setAudioLevels(levels);
      
      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(analyze);
      }
    };

    analyze();
  }, [isListening]);

  // Clean up audio resources
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    window.speechSynthesis.cancel();
    analyserRef.current = null;
    setAudioLevels(Array(32).fill(0));
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      
      connectionTimeoutRef.current = setTimeout(async () => {
        setIsConnected(true);
        await initializeAudio();
        setIsListening(true);
        playConnectSound();
      }, 1500);
    } else {
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      setTranscript('');
      cleanupAudio();
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    }

    return cleanupAudio;
  }, [isOpen, initializeAudio, cleanupAudio]);

  // Start audio analysis when listening
  useEffect(() => {
    if (isListening && isConnected) {
      if (analyserRef.current) {
        startAudioAnalysis();
      } else {
        createMockWaveform();
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isConnected, startAudioAnalysis, createMockWaveform]);

  // Subtle connection sound that doesn't interfere
const playConnectSound = () => {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01); // Mais baixo
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
    
    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 200);
  } catch (error) {
    console.log('Sound effect disabled');
  }
};

  const handleClose = () => {
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Demo conversation with TTS
  const simulateConversation = () => {
    setIsListening(false);
    setTranscript("I want to practice my presentation skills...");
    
    setTimeout(() => {
      setTranscript("That's great! Let's work on your presentation. What topic would you like to present about?");
      speakText("That's great! Let's work on your presentation. What topic would you like to present about?");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Background with subtle animation */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary-light to-secondary opacity-95" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-blue-500/5"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          {/* Status indicator */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 left-0 right-0 text-center pt-safe"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                isConnected 
                  ? isListening 
                    ? 'bg-blue-400 animate-pulse' 
                    : isSpeaking 
                      ? 'bg-primary animate-pulse'
                      : 'bg-green-400'
                  : 'bg-yellow-400 animate-pulse'
              }`} />
              <span className="text-white text-sm font-medium">
                {!isConnected 
                  ? 'Connecting...' 
                  : isListening 
                    ? 'Listening...' 
                    : isSpeaking 
                      ? 'Charlotte is speaking...' 
                      : 'Connected'
                }
              </span>
            </div>
          </motion.div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8">
            {/* Beautiful waveform */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <MagicalOrb
                isListening={isListening}
                isSpeaking={isSpeaking}
                isActive={isConnected}
                audioLevels={audioLevels}
              />
            </motion.div>

            {/* Transcript display */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md text-center mb-8"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-white text-sm leading-relaxed">
                      {transcript}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            {isConnected && !transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center max-w-sm"
              >
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {userLevel === 'Novice' 
                    ? 'Fale naturalmente - as ondas respondem à sua voz!'
                    : 'Speak naturally - the waves respond to your voice!'
                  }
                </p>
                
                <button
                  onClick={simulateConversation}
                  className="px-6 py-2 bg-primary/20 hover:bg-primary/30 rounded-full text-primary text-sm transition-all active:scale-95 border border-primary/30"
                >
                  Try demo conversation
                </button>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 pb-safe px-8 w-full"
          >
            <div className="flex justify-center space-x-6 mb-6">
              <button
                onClick={toggleMute}
                disabled={!isConnected}
                className={`p-4 rounded-full transition-all active:scale-95 ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 border border-red-400/30' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                } disabled:opacity-50`}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <button
                onClick={handleClose}
                className="p-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-all active:scale-95 border border-red-400/30"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center">
              <p className="text-white/40 text-xs">
                Beautiful waves respond to your voice • Click demo to hear Charlotte speak
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveVoiceModal;