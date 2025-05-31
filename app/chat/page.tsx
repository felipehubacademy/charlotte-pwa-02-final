'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LogOut, Send, Mic, Camera, Play, Pause, X, RotateCcw, Check } from 'lucide-react';
import ChatBox from '@/components/chat/ChatBox';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation } from '@/lib/pronunciation';
import { supabaseService } from '@/lib/supabase-service';
import XPCounter from '@/components/ui/XPCounter';
import { ConversationContextManager } from '@/lib/conversation-context';
import { calculateAudioXP, AudioAssessmentResult } from '@/lib/audio-xp-service';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { ClientAudioConverter } from '@/lib/audio-converter-client';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  audioBlob?: Blob;
  audioDuration?: number;
  timestamp: Date;
  messageType?: 'text' | 'audio' | 'image';
  technicalFeedback?: string;
}

async function getAssistantResponse(
  userMessage: string,
  userLevel: string,
  userName: string,
  messageType: 'text' | 'audio' = 'text',
  pronunciationData?: any,
  conversationContext?: string
): Promise<{ feedback: string; technicalFeedback?: string }> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription: userMessage,
        pronunciationData: pronunciationData || null,
        userLevel: userLevel as 'Novice' | 'Intermediate' | 'Advanced',
        userName: userName,
        messageType: messageType,
        conversationContext: conversationContext
      })
    });

    if (!response.ok) throw new Error(`Assistant API error: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Assistant API failed');
    
    return {
      feedback: data.result.feedback,
      technicalFeedback: data.result.technicalFeedback
    };
  } catch (error) {
    console.error('❌ Error calling Assistant API:', error);
    
    const fallbackResponses = {
      'Novice': `Great job practicing, ${userName}! 😊 Keep writing in English - you're doing well!`,
      'Intermediate': `That's a good example, ${userName}! 👍 How would you use this in a business context?`,
      'Advanced': `Excellent language use, ${userName}! 🌟 Can you elaborate on that point further?`
    };

    return {
      feedback: fallbackResponses[userLevel as keyof typeof fallbackResponses] || fallbackResponses['Intermediate']
    };
  }
}

function splitIntoMultipleMessages(response: string): string[] {
  let messages = response.split(/(?:\n\n|\|\|\||\. {2,})/);
  
  if (messages.length < 2) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      messages = [
        sentences.slice(0, mid).join('. ') + (sentences.length > 1 ? '.' : ''),
        sentences.slice(mid).join('. ') + '.'
      ];
    } else {
      messages = [response, "What else would you like to practice today? 😊"];
    }
  }

  return messages.map(msg => msg.trim()).filter(msg => msg.length > 0);
}

async function sendSequentialMessages(
  messages: string[],
  addMessageToChat: (message: any) => void,
  generateMessageId: (prefix: string) => string,
  delay: number = 1500,
  technicalFeedback?: string
) {
  for (let i = 0; i < messages.length; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const messageData = {
      id: generateMessageId(`assistant-part-${i}`),
      role: 'assistant' as const,
      content: messages[i],
      timestamp: new Date(),
      messageType: 'text' as const,
      ...(i === 0 && technicalFeedback ? { technicalFeedback } : {})
    };
    
    addMessageToChat(messageData);
  }
}

export default function ChatPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  // Estados de gravação UNIFICADOS
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  
  // Player state para preview
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  const [conversationContext] = useState(() => 
    new ConversationContextManager(
      user?.user_level || 'Intermediate',
      user?.name?.split(' ')[0] || 'Student'
    )
  );

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const recordingStartTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const playTimerRef = useRef<NodeJS.Timeout>();

  // Camera states - simplified
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Funções básicas
  const generateMessageId = useCallback((prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
    }
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = undefined;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  }, []);

  // Load user stats
  const loadUserStats = useCallback(async () => {
    if (!user?.entra_id || !supabaseService.isAvailable()) return;

    try {
      const stats = await supabaseService.getUserStats(user.entra_id);
      if (stats) {
        setTotalXP(stats.total_xp);
      }

      const todayXP = await supabaseService.getTodaySessionXP(user.entra_id);
      setSessionXP(todayXP);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user?.entra_id]);

  // Audio processing
  const handleAudioWithAssistantAPI = useCallback(async (audioBlob: Blob, duration: number) => {
    // ✅ CONVERSÃO REAL DE ÁUDIO NO CLIENTE
    let processedAudioBlob = audioBlob;
    
    if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
      try {
        processedAudioBlob = await convertAudioToWAV(audioBlob);
      } catch (error) {
        console.error('❌ REAL audio conversion error:', error);
        // Continuar com áudio original se conversão falhar
      }
    }

    const audioMessage: Message = {
      id: generateMessageId('user-audio'),
      role: 'user',
      content: '',
      audioBlob: processedAudioBlob, // ✅ Usar áudio convertido
      audioDuration: duration,
      timestamp: new Date(),
      messageType: 'audio'
    };

    setMessages(prev => [...prev, audioMessage]);
    setIsProcessingMessage(true);

    try {
      const [transcriptionResult, pronunciationResult] = await Promise.allSettled([
        transcribeAudio(processedAudioBlob), // ✅ Usar áudio convertido
        assessPronunciation(processedAudioBlob) // ✅ Usar áudio convertido
      ]);
      
      const transcriptionSuccess = transcriptionResult.status === 'fulfilled' && transcriptionResult.value.success;
      const pronunciationSuccess = pronunciationResult.status === 'fulfilled' && pronunciationResult.value.success;
      
      if (transcriptionSuccess && pronunciationSuccess) {
        const transcription = transcriptionResult.value.transcription;
        const scores = pronunciationResult.value.result!;
        
        const assessmentResult: AudioAssessmentResult = {
          text: transcription,
          accuracyScore: scores.accuracyScore,
          fluencyScore: scores.fluencyScore,
          completenessScore: scores.completenessScore,
          pronunciationScore: scores.pronunciationScore,
          feedback: scores.feedback || []
        };
        
        const xpResult = calculateAudioXP(
          assessmentResult,
          duration,
          user?.user_level as 'Novice' | 'Intermediate' | 'Advanced' || 'Intermediate'
        );
        
        if (xpResult.shouldRetry) {
          const retryMessage: Message = {
            id: generateMessageId('assistant-retry'),
            role: 'assistant',
            content: xpResult.feedback,
            timestamp: new Date(),
            messageType: 'text'
          };
          
          setMessages(prev => [...prev, retryMessage]);
          return;
        }
        
        conversationContext.addMessage('user', transcription, 'audio', scores.pronunciationScore);
        const contextPrompt = conversationContext.generateContextForAssistant();
        
        const assistantResponse = await getAssistantResponse(
          transcription,
          user?.user_level || 'Intermediate',
          user?.name?.split(' ')[0] || 'Student',
          'audio',
          {
            accuracyScore: scores.accuracyScore,
            fluencyScore: scores.fluencyScore,
            completenessScore: scores.completenessScore,
            pronunciationScore: scores.pronunciationScore,
            xpAwarded: xpResult.totalXP,
            feedback: xpResult.feedback
          },
          contextPrompt
        );

        const aiMessages = splitIntoMultipleMessages(assistantResponse.feedback);

        await sendSequentialMessages(
          aiMessages,
          (msg) => setMessages(prev => [...prev, msg]),
          generateMessageId,
          1500,
          assistantResponse.technicalFeedback
        );

        aiMessages.forEach(msg => 
          conversationContext.addMessage('assistant', msg, 'text')
        );

        if (supabaseService.isAvailable() && user?.entra_id) {
          await supabaseService.saveAudioPractice({
            user_id: user.entra_id,
            transcription: transcription,
            accuracy_score: scores.accuracyScore,
            fluency_score: scores.fluencyScore,
            completeness_score: scores.completenessScore,
            pronunciation_score: scores.pronunciationScore,
            xp_awarded: xpResult.totalXP,
            practice_type: 'audio_message',
            audio_duration: duration,
            feedback: `${assistantResponse.feedback}\n\n${xpResult.feedback}`,
            technicalFeedback: assistantResponse.technicalFeedback
          });
          
          setSessionXP(prev => prev + xpResult.totalXP);
          setTotalXP(prev => prev + xpResult.totalXP);
          
          setTimeout(() => loadUserStats(), 1000);
        }
        
      } else {
        console.error('❌ Audio processing failed:', {
          transcriptionSuccess,
          pronunciationSuccess,
          transcriptionError: transcriptionResult.status === 'rejected' ? transcriptionResult.reason : null,
          pronunciationError: pronunciationResult.status === 'rejected' ? pronunciationResult.reason : null
        });
        
        const errorResponse: Message = {
          id: generateMessageId('assistant-error'),
          role: 'assistant',
          content: user?.user_level === 'Novice'
            ? "Desculpe, tive problemas técnicos com seu áudio. Sorry, I had technical issues with your audio. Please try again!"
            : "I'm sorry, I had trouble processing your audio. Please try speaking more clearly and ensure you're in a quiet environment.",
          timestamp: new Date(),
          messageType: 'text'
        };
        
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      
      const errorResponse: Message = {
        id: generateMessageId('assistant-error'),
        role: 'assistant',
        content: user?.user_level === 'Novice'
          ? "Desculpe, tive dificuldades técnicas. Sorry, I'm having technical difficulties!"
          : "Sorry, I'm having technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
        messageType: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessingMessage(false);
    }
  }, [generateMessageId, user, conversationContext, loadUserStats]);

  // Initialize recording
  const initializeRecording = useCallback(async (): Promise<boolean> => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioStreamRef.current = stream;

      // Setup audio analysis para mobile
      if (isMobileDevice()) {
        audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        
        if (audioContextRef.current) {
          // iOS fix
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          
          if (analyserRef.current) {
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 64;
            analyserRef.current.smoothingTimeConstant = 0.8;
          }
        }
      }

      // MediaRecorder
      let mimeType = 'audio/mp4';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
          
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || mimeType 
          });
          
          const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          
          // Sempre usar preview (mobile e desktop)
          if (duration >= 1) {
            setRecordedBlob(audioBlob);
            setRecordedDuration(duration);
            setRecordingState('preview');
          } else {
            // Gravação muito curta, voltar ao idle
            setRecordingState('idle');
          }
        }
        
        audioChunksRef.current = [];
      };

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize recording:', error);
      return false;
    }
  }, [handleAudioWithAssistantAPI]);

  // Analyze audio for mobile waveform
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || recordingState !== 'recording') return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const levels = Array(20).fill(0).map((_, index) => {
      const start = Math.floor((index / 20) * dataArray.length);
      const end = Math.floor(((index + 1) / 20) * dataArray.length);
      const slice = dataArray.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      return Math.min(average / 255, 1);
    });

    setAudioLevels(levels);

    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [recordingState]);

  // Start recording
  const startRecording = useCallback(async () => {
    const initialized = await initializeRecording();
    if (!initialized) return;

    setRecordingState('recording');
    setRecordingTime(0);
    recordingStartTimeRef.current = Date.now();

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.start(100);
      } catch (error) {
        console.error('❌ Failed to start MediaRecorder:', error);
        setRecordingState('idle');
        return;
      }
    }

    if (isMobileDevice()) {
      analyzeAudio();
    }

    recordingTimerRef.current = setInterval(() => {
      const currentTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      setRecordingTime(currentTime);
      
      if (currentTime >= 60) {
        stopRecording();
      }
    }, 1000);
  }, [initializeRecording, analyzeAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recordingState !== 'recording') return;
    
    setAudioLevels(Array(20).fill(0));
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('❌ Error stopping MediaRecorder:', error);
      }
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  }, [recordingState]);

  // Desktop preview controls
  const togglePlayback = useCallback(() => {
    if (!recordedBlob) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(URL.createObjectURL(recordedBlob));
      
      audioPlayerRef.current.onloadedmetadata = () => {
        // Audio loaded
      };

      audioPlayerRef.current.onended = () => {
        setIsPlaying(false);
        setPlayTime(0);
        if (playTimerRef.current) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = undefined;
        }
      };
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = undefined;
      }
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
      
      playTimerRef.current = setInterval(() => {
        if (audioPlayerRef.current) {
          setPlayTime(Math.floor(audioPlayerRef.current.currentTime));
        }
      }, 1000);
    }
  }, [recordedBlob, isPlaying]);

  const sendRecordedAudio = useCallback(() => {
    if (recordedBlob && recordedDuration > 0) {
      handleAudioWithAssistantAPI(recordedBlob, recordedDuration);
      
      // Reset
      setRecordedBlob(null);
      setRecordedDuration(0);
      setRecordingState('idle');
      setRecordingTime(0);
      setIsPlaying(false);
      setPlayTime(0);
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    }
  }, [recordedBlob, recordedDuration, handleAudioWithAssistantAPI]);

  const cancelRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedDuration(0);
    setRecordingState('idle');
    setRecordingTime(0);
    setIsPlaying(false);
    setPlayTime(0);
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  }, []);

  // Mobile touch handlers - SIMPLIFICADOS
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    console.log('📱 Touch start');
    startRecording();
  }, [startRecording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    console.log('📱 Touch end');
    stopRecording();
  }, [stopRecording]);

  // Effects
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isMounted) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    
    const isIOSPWA = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isIOSPWA) {
      document.body.classList.add('ios-pwa');
    }
    
    return cleanup;
  }, [isMounted, cleanup]);

  useEffect(() => {
    if (!isMounted || !user || messages.length > 0) return;
    
    const shouldGreet = conversationContext.shouldGreet();
    
    const welcomeMessage: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: shouldGreet 
        ? (user.user_level === 'Novice' 
          ? `Olá ${user.name?.split(' ')[0]}! I'm Charlotte, your English assistant. You can write in Portuguese or English!`
          : `Hi ${user.name?.split(' ')[0]}! I'm Charlotte, ready to help you practice English. How can I assist you today?`)
        : `Welcome back! Let's continue our English practice. What would you like to work on?`,
      timestamp: new Date(),
      messageType: 'text'
    };
    
    setMessages([welcomeMessage]);
    
    if (shouldGreet) {
      conversationContext.markGreetingDone();
    }

    loadUserStats();
  }, [user, messages.length, isMounted, conversationContext, loadUserStats]);

  // Handle image capture from camera
  const handleImageCapture = useCallback(async (imageData: string) => {
    if (!user?.entra_id) return;

    try {
      // Create a thumbnail for chat display
      const img = new Image();
      img.onload = async () => {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate thumbnail size (max 200px width)
        const maxWidth = 200;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw thumbnail
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.7);

        // Add image message to chat (separate balloon)
        const imageMessage: Message = {
          id: generateMessageId('user-image'),
          role: 'user',
          content: '', // No text, just image
          messageType: 'image',
          timestamp: new Date(),
          audioUrl: thumbnailData // Using audioUrl field to store image data
        };

        // Add question message (separate balloon)
        const questionMessage: Message = {
          id: generateMessageId('user-question'),
      role: 'user',
          content: user.user_level === 'Novice' 
            ? 'O que você vê nesta foto?' 
            : 'What do you see in this photo?',
          messageType: 'text',
          timestamp: new Date()
    };

        setMessages(prev => [...prev, imageMessage, questionMessage]);
    setIsProcessingMessage(true);

        try {
          // Create optimized prompt for vocabulary learning with XP system
          const vocabularyPrompt = user.user_level === 'Novice' 
            ? `Olhe esta imagem e me ajude a aprender vocabulário em inglês. 

Identifique o objeto principal e me ensine:
- O nome em inglês
- A tradução em português  
- Uma frase de exemplo

Seja natural e conversacional, como se estivesse ensinando um amigo. Depois me peça para praticar usando esta palavra em uma frase.

IMPORTANTE: Termine sua resposta com: VOCABULARY_WORD:[palavra_em_inglês]`
            : user.user_level === 'Intermediate'
            ? `Look at this image and help me learn English vocabulary.

Identify the main object and teach me:
- The English name
- Portuguese translation
- An example sentence

Be natural and conversational, as if teaching a friend. Then ask me to practice using this word in a sentence.

IMPORTANT: End your response with: VOCABULARY_WORD:[english_word]`
            : `Look at this image and help me expand my English vocabulary.

Identify the main object and provide:
- The English name
- A clear definition in English
- An example sentence showing proper usage

Be natural and conversational. Then challenge me to use this word in a creative sentence.

IMPORTANT: End your response with: VOCABULARY_WORD:[english_word]`;

          // Call assistant API for vocabulary analysis
      const response = await fetch('/api/assistant', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
              transcription: vocabularyPrompt,
          pronunciationData: null,
          userLevel: user?.user_level as 'Novice' | 'Intermediate' | 'Advanced' || 'Intermediate',
          userName: user?.name?.split(' ')[0] || 'Student',
              messageType: 'image',
              imageData: imageData, // Send full image data to assistant
              conversationContext: conversationContext.generateContextForAssistant()
        })
      });

          if (!response.ok) throw new Error(`Assistant API error: ${response.status}`);
      const data = await response.json();
          if (!data.success) throw new Error(data.error || 'Assistant API failed');

      const assistantResult = data.result;
          let assistantFeedback = assistantResult.feedback;
          
          // Extract vocabulary word from response - improved regex
          const vocabularyMatch = assistantFeedback.match(/VOCABULARY_WORD:\s*\[?(\w+)\]?/i);
          let discoveredWord = null;
          let vocabularyXP = 0;
          
          if (vocabularyMatch) {
            discoveredWord = vocabularyMatch[1].toLowerCase();
            // Remove the VOCABULARY_WORD tag from the response completely - improved regex
            assistantFeedback = assistantFeedback
              .replace(/\s*VOCABULARY_WORD:\s*\[?\w+\]?\s*/gi, '')
              .replace(/VOCABULARY_WORD:\s*\[?\w+\]?/gi, '')
              .replace(/\n\s*VOCABULARY_WORD.*$/gim, '')
              // Remove markdown formatting for natural conversation
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .trim();
            
            // Check if word already exists for this user
            if (supabaseService.isAvailable()) {
              try {
                const { vocabularyService } = await import('@/lib/supabase-service');
                const existingWord = await vocabularyService.checkWordExists(user.entra_id, discoveredWord);
                
                if (!existingWord) {
                  // New vocabulary word discovered! +5 XP
                  vocabularyXP = 5;
                  
                  // Extract vocabulary data from assistant response - more flexible parsing
                  const vocabularyData = {
                    word: discoveredWord,
                    translation: undefined, // Will be extracted from natural response
                    definition: `English word: ${discoveredWord}`,
                    example_sentence: undefined, // Will be extracted from natural response
                    image_data: thumbnailData
                  };
                  
                  // Try to extract translation and example from natural response
                  const lines = assistantFeedback.split('\n').filter((line: string) => line.trim());
                  for (const line of lines) {
                    // Look for translation patterns
                    if (line.includes('português') || line.includes('Portuguese') || line.includes('tradução')) {
                      const translationMatch = line.match(/[:\-]\s*(.+)/);
                      if (translationMatch) {
                        vocabularyData.translation = translationMatch[1].trim();
                      }
                    }
                    // Look for example patterns
                    if (line.includes('example') || line.includes('exemplo') || line.includes('"')) {
                      const exampleMatch = line.match(/["\"]([^"\"]+)["\"]/) || line.match(/example[:\-]\s*(.+)/i);
                      if (exampleMatch) {
                        vocabularyData.example_sentence = exampleMatch[1].trim();
                      }
                    }
                  }
                  
                  // Save vocabulary to database
                  await vocabularyService.saveVocabulary(user.entra_id, vocabularyData);
                  
                  console.log('✅ New vocabulary saved:', discoveredWord, '+5 XP');
                } else {
                  console.log('📚 Word already known:', discoveredWord);
                  // Update practice count for existing word
                  await vocabularyService.updatePracticeCount(existingWord.id);
                }
              } catch (vocabError) {
                console.error('Error handling vocabulary:', vocabError);
              }
            }
          }

          // Split response into multiple messages
          const aiMessages = splitIntoMultipleMessages(assistantFeedback);

          // Don't add vocabulary XP notification - keep conversation natural
          // The XP is already awarded silently in the background

      await sendSequentialMessages(
        aiMessages,
        (msg) => setMessages(prev => [...prev, msg]),
        generateMessageId,
        1200,
            undefined // No technical feedback for image messages
      );

          // Add to conversation context
      aiMessages.forEach(msg => 
        conversationContext.addMessage('assistant', msg, 'text')
      );

          // Save practice with vocabulary XP
      if (supabaseService.isAvailable() && user?.entra_id) {
            const totalXPAwarded = (assistantResult.xpAwarded || 3) + vocabularyXP; // Base XP + vocabulary XP
        
        await supabaseService.saveAudioPractice({
          user_id: user.entra_id,
              transcription: `Image analysis: ${discoveredWord || 'object identification'}`,
          accuracy_score: null,
          fluency_score: null,
          completeness_score: null,
          pronunciation_score: null,
              xp_awarded: totalXPAwarded,
              practice_type: 'camera_object',
          audio_duration: 0,
              feedback: assistantFeedback,
              technicalFeedback: assistantResult.technicalFeedback
        });
        
            setSessionXP(prev => prev + totalXPAwarded);
            setTotalXP(prev => prev + totalXPAwarded);
        
        setTimeout(() => loadUserStats(), 1000);
      }

    } catch (error) {
          console.error('Error processing image with assistant:', error);
          
          // Fallback response
          const fallbackResponse: Message = {
            id: generateMessageId('assistant-image-error'),
        role: 'assistant',
            content: user.user_level === 'Novice'
              ? "Desculpe, tive problemas para analisar sua foto. Sorry, I had trouble analyzing your photo. Please try again!"
              : "I'm sorry, I had trouble analyzing your photo. Please try taking another picture with better lighting.",
        timestamp: new Date(),
        messageType: 'text'
      };
      
          setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsProcessingMessage(false);
    }
  };

      img.src = imageData;
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessingMessage(false);
    }
  }, [user?.entra_id, user?.user_level, user?.name, generateMessageId, conversationContext, loadUserStats]);

  // Camera functions
  const handleCameraClick = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        // Process image directly - no preview modal
        handleImageCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [handleImageCapture]);

  // 🎯 CONVERSÃO DE ÁUDIO REAL NO CLIENTE
  const convertAudioToWAV = async (audioBlob: Blob): Promise<Blob> => {
    try {
      // ✅ USAR WEB AUDIO API PARA CONVERSÃO REAL
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decodificar áudio WebM/Opus
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // ✅ CONVERTER PARA 16kHz MONO PCM
      const targetSampleRate = 16000;
      const targetChannels = 1;
      
      let processedBuffer = audioBuffer;
      
      // Resample se necessário
      if (audioBuffer.sampleRate !== targetSampleRate) {
        processedBuffer = await resampleAudio(audioBuffer, targetSampleRate, audioContext);
      }
      
      // Converter para mono se necessário
      if (processedBuffer.numberOfChannels > 1) {
        processedBuffer = convertToMono(processedBuffer, audioContext);
      }

      // ✅ CONVERTER PARA WAV PCM
      const wavBuffer = audioBufferToWav(processedBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      // Cleanup
      audioContext.close();
      
      return wavBlob;

    } catch (error) {
      console.error('❌ Audio conversion failed:', error);
      throw error;
    }
  };

  // 🔄 RESAMPLE ÁUDIO
  const resampleAudio = async (
    audioBuffer: AudioBuffer, 
    targetSampleRate: number, 
    audioContext: AudioContext
  ): Promise<AudioBuffer> => {
    
    const ratio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.round(audioBuffer.length * ratio);
    const newBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index + 1 < inputData.length) {
          outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          outputData[i] = inputData[index] || 0;
        }
      }
    }

    return newBuffer;
  };

  // 🎵 CONVERTER PARA MONO
  const convertToMono = (audioBuffer: AudioBuffer, audioContext: AudioContext): AudioBuffer => {
    const monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
    const monoData = monoBuffer.getChannelData(0);

    // Misturar todos os canais
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / audioBuffer.numberOfChannels;
    }

    return monoBuffer;
  };

  // 📦 CONVERTER AudioBuffer para WAV
  const audioBufferToWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const channelData = audioBuffer.getChannelData(0);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  };

  // Loading
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto mb-3"></div>
          <p className="text-white/70 text-sm">Loading Charlotte...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Text message handler
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: generateMessageId('user'),
      role: 'user',
      content: message.trim(),
              timestamp: new Date(),
              messageType: 'text'
            };

    setMessages(prev => [...prev, userMessage]);
    const userText = message.trim();
    setMessage('');
    setIsProcessingMessage(true);
        
    conversationContext.addMessage('user', userText, 'text');
        
    try {
        const contextPrompt = conversationContext.generateContextForAssistant();
        
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: userText,
          pronunciationData: null,
          userLevel: user?.user_level as 'Novice' | 'Intermediate' | 'Advanced' || 'Intermediate',
          userName: user?.name?.split(' ')[0] || 'Student',
          messageType: 'text',
          conversationContext: contextPrompt
        })
      });

      if (!response.ok) throw new Error(`Assistant API error: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Assistant API failed');

      const assistantResult = data.result;
      const aiMessages = splitIntoMultipleMessages(assistantResult.feedback);

        await sendSequentialMessages(
          aiMessages,
          (msg) => setMessages(prev => [...prev, msg]),
          generateMessageId,
        1200,
        assistantResult.technicalFeedback
        );

        aiMessages.forEach(msg => 
          conversationContext.addMessage('assistant', msg, 'text')
        );

        if (supabaseService.isAvailable() && user?.entra_id) {
        const wordCount = userText.split(' ').filter(word => word.trim()).length;
          
          await supabaseService.saveAudioPractice({
            user_id: user.entra_id,
          transcription: userText,
          accuracy_score: null,
          fluency_score: null,
          completeness_score: null,
          pronunciation_score: null,
          xp_awarded: assistantResult.xpAwarded,
          practice_type: 'text_message',
          audio_duration: 0,
          feedback: assistantResult.feedback,
          grammar_score: assistantResult.grammarScore || null,
          grammar_errors: assistantResult.grammarErrors || null,
          text_complexity: assistantResult.textComplexity || null,
          word_count: wordCount
          });
          
        setSessionXP(prev => prev + assistantResult.xpAwarded);
        setTotalXP(prev => prev + assistantResult.xpAwarded);
          
          setTimeout(() => loadUserStats(), 1000);
      }
    } catch (error) {
      console.error('❌ Error processing text message:', error);
      
      const fallbackResponse = user?.user_level === 'Novice' 
        ? `Desculpe, ${user?.name?.split(' ')[0] || 'there'}! I had a small technical issue, but I can see you're practicing English! Keep writing - it really helps improve your skills! 😊`
        : `I apologize for the technical hiccup, ${user?.name?.split(' ')[0] || 'there'}! Your English practice is valuable regardless. What would you like to talk about next?`;
        
      const aiResponse: Message = {
        id: generateMessageId('assistant-fallback'),
          role: 'assistant',
        content: fallbackResponse,
          timestamp: new Date(),
          messageType: 'text'
        };
        
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-secondary flex flex-col overflow-hidden">
      <header className={`flex-shrink-0 bg-secondary/95 backdrop-blur-md border-b border-white/10 ${
        typeof window !== 'undefined' && 
        ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches)
          ? 'ios-fixed-header' 
          : 'pt-safe'
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <CharlotteAvatar 
              size="md"
              showStatus={true}
              isOnline={true}
              animate={true}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-semibold text-base">Charlotte</h1>
              <p className="text-green-400 text-xs font-medium">online</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2 sm:space-x-3 flex-shrink-0">
            <XPCounter 
              sessionXP={sessionXP}
              totalXP={totalXP}
              userId={user?.entra_id}
              onXPGained={(amount) => console.log('XP animation completed:', amount)}
            />
            
            <div className="flex flex-col items-center text-center min-w-[70px] sm:min-w-[80px]">
              <p className="text-white text-xs sm:text-sm font-medium truncate max-w-16 sm:max-w-20 leading-tight">
                {user?.name?.split(' ')[0]}
              </p>
              <span className="inline-block text-black text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-primary rounded-full font-semibold mt-0.5 sm:mt-1">
                {user?.user_level}
              </span>
            </div>
            
            <button 
              onClick={logout}
              className="p-1.5 sm:p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <ChatBox
        messages={messages}
        transcript={transcript}
        finalTranscript={finalTranscript}
        isProcessingMessage={isProcessingMessage}
        userLevel={user?.user_level || 'Novice'}
      />

      {/* Interface de input SIMPLIFICADA */}
      <div className={`flex-shrink-0 bg-secondary ${
        typeof window !== 'undefined' && 
        ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches)
          ? 'ios-fixed-footer pb-safe' 
          : 'pb-safe'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-end space-x-3">
            
            {/* Interface normal */}
            <div className="flex-1 relative">
              <div className="flex items-end bg-charcoal/60 backdrop-blur-sm border border-white/10 rounded-3xl focus-within:border-primary/30 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything..."
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-white/50 px-4 py-3 pr-2 focus:outline-none resize-none text-sm overflow-hidden select-none"
                  style={{ 
                    minHeight: '44px',
                    maxHeight: '120px'
                  }}
                />
                
                <div className="flex items-center space-x-1 pr-2">
                  {!message.trim() && (
                    <>
                      {/* DESKTOP: Interface de gravação com preview */}
                      {!isMobileDevice() && (
                        <>
                          {recordingState === 'idle' && (
                            <button
                              onClick={startRecording}
                              className="absolute right-2 bottom-[7px] p-2 text-white/60 hover:text-primary bg-white/5 hover:bg-primary/10 transition-colors rounded-full select-none"
                              title="Click to start recording"
                            >
                              <Mic size={16} />
                            </button>
                          )}
                          
                          {recordingState === 'recording' && (
                            <>
                              <span className="absolute right-[44px] bottom-1/2 transform translate-y-1/2 text-red-500 font-mono text-sm font-semibold px-2">
                                {formatTime(recordingTime)}
                              </span>
                        <button 
                                onClick={stopRecording}
                                className="absolute right-2 bottom-2 p-2 text-red-500 bg-red-500/20 rounded-full animate-pulse transition-colors select-none"
                                title="Click to stop recording"
                              >
                                <Mic size={16} />
                              </button>
                            </>
                          )}
                          
                          {recordingState === 'preview' && recordedBlob && (
                            <>
                              <button
                                onClick={cancelRecording}
                                className="absolute right-[136px] bottom-[7px] p-2 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors rounded-full select-none"
                                title="Cancel recording"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={togglePlayback}
                                className="absolute right-24 bottom-[7px] p-2 text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 transition-colors rounded-full select-none"
                                title={isPlaying ? "Pause preview" : "Play preview"}
                              >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <span className="absolute right-12 bottom-1/2 transform translate-y-1/2 text-white/70 font-mono text-sm font-semibold px-1 min-w-10 text-center">
                                {isPlaying ? formatTime(playTime) : formatTime(recordedDuration)}
                              </span>
                              <button
                                onClick={sendRecordedAudio}
                                className="absolute right-[7px] bottom-[7px] p-2 bg-primary text-black rounded-full hover:bg-primary-dark transition-colors select-none"
                                title="Send audio"
                              >
                                <Send size={16} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      
                      {/* MOBILE: Interface de gravação */}
                      {isMobileDevice() && recordingState === 'recording' && (
                        <div className="flex items-center space-x-1 pb-1.5">
                          <span className="text-red-500 font-mono text-xs font-semibold ml-1 mt-0.5 min-w-8 text-center">
                            {formatTime(recordingTime)}
                          </span>
                          <button
                            onClick={stopRecording}
                            className="p-2 text-red-500 bg-red-500/20 rounded-full animate-pulse transition-colors select-none"
                            title={user?.user_level === 'Novice' ? 'Parar gravação' : 'Stop recording'}
                          >
                            <Mic size={16} />
                          </button>
                        </div>
                      )}

                      {!message.trim() && (
                        <>
                          {/* Camera button para mobile - PRIMEIRO */}
                          {isMobileDevice() && recordingState === 'idle' && (
                            <button 
                              onClick={handleCameraClick}
                              className="p-2 text-white/60 hover:text-primary bg-white/5 hover:bg-primary/10 transition-colors rounded-full select-none mb-1.5"
                          title="Take photo"
                        >
                              <Camera size={16} />
                            </button>
                          )}

                          {/* MOBILE: Botão click to record - SEGUNDO */}
                          {isMobileDevice() && recordingState === 'idle' && (
                            <button
                              onClick={startRecording}
                              className="p-2 text-white/60 hover:text-primary bg-white/5 hover:bg-primary/10 transition-colors rounded-full select-none mb-1.5"
                              title={user?.user_level === 'Novice' ? 'Toque para gravar' : 'Tap to record'}
                            >
                              <Mic size={16} />
                        </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* MOBILE: Interface de preview - posicionada fora da textarea */}
              {isMobileDevice() && recordingState === 'preview' && recordedBlob && !message.trim() && (
                <div className="absolute right-2 bottom-2 flex items-center space-x-0.5">
                  <button
                    onClick={cancelRecording}
                    className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors rounded-full select-none"
                    title={user?.user_level === 'Novice' ? 'Cancelar' : 'Cancel'}
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={togglePlayback}
                    className="p-2 text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 transition-colors rounded-full select-none"
                    title={isPlaying ? (user?.user_level === 'Novice' ? 'Pausar' : 'Pause') : (user?.user_level === 'Novice' ? 'Reproduzir' : 'Play')}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <span className="text-white/70 font-mono text-xs font-semibold px-1 min-w-8 text-center mt-1">
                    {isPlaying ? formatTime(playTime) : formatTime(recordedDuration)}
                  </span>
                  <button
                    onClick={sendRecordedAudio}
                    className="p-2 bg-primary text-black rounded-full hover:bg-primary-dark transition-colors select-none"
                    title={user?.user_level === 'Novice' ? 'Enviar áudio' : 'Send audio'}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
              
              {/* Send button when there's text */}
              {message.trim() && (
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 bottom-2 p-2 bg-primary hover:bg-primary-dark rounded-full transition-all active:scale-95 select-none"
                >
                  <Send size={16} className="text-black" />
                </button>
              )}
            </div>

            {/* Live conversation button */}
            <button 
              onClick={() => setIsLiveVoiceOpen(true)}
              className="p-3 bg-charcoal/60 hover:bg-charcoal text-primary hover:text-primary-dark rounded-full transition-colors flex-shrink-0 border border-white/10 select-none"
              title="Start Live Conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M8 6v12M16 6v12M4 10v4M20 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        userLevel={user?.user_level || 'Novice'}
        userName={user?.name}
        user={user || undefined}
        sessionXP={sessionXP}
        totalXP={totalXP}
        onLogout={logout}
        onXPGained={(amount) => {
          console.log('Live Voice XP gained:', amount);
          setSessionXP(prev => prev + amount);
          setTotalXP(prev => prev + amount);
        }}
      />
      
      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

