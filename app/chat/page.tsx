'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LogOut, Send, Mic, Camera, Phone } from 'lucide-react';
import ChatBox from '@/components/chat/ChatBox';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import CameraCapture from '@/components/camera/CameraCapture';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation } from '@/lib/pronunciation';
import { getAssistantFeedback, formatAssistantMessage, createFallbackResponse } from '@/lib/assistant';
import { supabaseService } from '@/lib/supabase-service';
import XPCounter from '@/components/ui/XPCounter';
import { ConversationContextManager } from '@/lib/conversation-context';
import { calculateAudioXP, AudioAssessmentResult } from '@/lib/audio-xp-service';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import { grammarAnalysisService } from '@/lib/grammar-analysis';

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
    console.log('🤖 Calling Assistant API with context...');

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcription: userMessage,
        pronunciationData: pronunciationData || null,
        userLevel: userLevel as 'Novice' | 'Intermediate' | 'Advanced',
        userName: userName,
        messageType: messageType,
        conversationContext: conversationContext
      })
    });

    if (!response.ok) {
      throw new Error(`Assistant API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Assistant API failed');
    }

    console.log('✅ Assistant API response with context received');
    
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
      messages = [
        response,
        "What else would you like to practice today? 😊"
      ];
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

  // Estados para gravação corrigidos
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));

  const [conversationContext] = useState(() => 
    new ConversationContextManager(
      user?.user_level || 'Intermediate',
      user?.name?.split(' ')[0] || 'Student'
    )
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Refs para controle de gravação corrigidos
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const recordingStartTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Blob[]>([]);

  const generateMessageId = useCallback((prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }, []);

  // Cleanup function corrigida
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
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
  }, []);

  // Initialize recording corrigido
  const initializeRecording = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎤 Initializing recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      audioStreamRef.current = stream;

      // Setup audio analysis for waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';
          
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      // Reset chunks array
      audioChunksRef.current = [];

      // Setup event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📦 Data available:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('⏹️ Recording stopped, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || mimeType 
          });
          
          const recordingDuration = recordingTime;
          console.log('📊 Recording duration:', recordingDuration, 'seconds');
          
          // Auto-send if recording was longer than 1 second
          if (recordingDuration >= 1) {
            console.log('✅ Auto-sending audio...');
            handleAudioWithAssistantAPI(audioBlob, recordingDuration);
          } else {
            console.log('⚠️ Recording too short, discarded');
          }
        }
        
        // Reset state
        setRecordingTime(0);
        audioChunksRef.current = [];
      };

      console.log('✅ Recording initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize recording:', error);
      return false;
    }
  }, [recordingTime]);

  // Analyze audio levels for waveform
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
      return Math.min(average / 255, 1);
    });

    setAudioLevels(levels);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording]);

  // Start recording corrigido
  const startRecording = useCallback(async () => {
    console.log('🎬 Starting recording...');
    
    const initialized = await initializeRecording();
    if (!initialized) {
      console.error('❌ Failed to initialize recording');
      return;
    }

    setIsRecording(true);
    setRecordingTime(0);
    recordingStartTimeRef.current = Date.now();

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.start(100); // Collect data every 100ms
        console.log('📹 MediaRecorder started');
      } catch (error) {
        console.error('❌ Failed to start MediaRecorder:', error);
        setIsRecording(false);
        return;
      }
    }

    // Start audio analysis
    analyzeAudio();

    // Recording timer
    recordingTimerRef.current = setInterval(() => {
      const currentTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      setRecordingTime(currentTime);
      
      // Max 60 seconds
      if (currentTime >= 60) {
        console.log('⏰ Max recording time reached');
        stopRecording();
      }
    }, 1000);
  }, [initializeRecording, analyzeAudio]);

  // Stop recording corrigido
  const stopRecording = useCallback(() => {
    console.log('⏹️ Stopping recording...');
    
    if (!isRecording) {
      console.log('⚠️ Not currently recording');
      return;
    }
    
    setIsRecording(false);
    setAudioLevels(Array(20).fill(0));
    
    // Clear timers and animations
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        console.log('📹 MediaRecorder stopped');
      } catch (error) {
        console.error('❌ Error stopping MediaRecorder:', error);
      }
    }
    
    // Stop audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped');
      });
      audioStreamRef.current = null;
    }
  }, [isRecording]);

  // Handle all recording events (mouse + touch) corrigido
  const handleRecordingStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('👆 Recording start triggered');
    
    if (!isRecording) {
      startRecording();
    }
  }, [isRecording, startRecording]);

  const handleRecordingEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('👆 Recording end triggered');
    
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

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
    
    // Cleanup on unmount
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
  }, [user, messages.length, isMounted, conversationContext]);

  const loadUserStats = async () => {
    if (!user?.entra_id || !supabaseService.isAvailable()) return;

    try {
      console.log('📊 Loading user stats for:', user.entra_id);
      
      const stats = await supabaseService.getUserStats(user.entra_id);
      if (stats) {
        console.log('📈 Total XP from DB:', stats.total_xp);
        setTotalXP(stats.total_xp);
      }

      const todayXP = await supabaseService.getTodaySessionXP(user.entra_id);
      console.log('🗓️ Today XP from DB:', todayXP);
      setSessionXP(todayXP);

    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

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
      console.log('📝 Processing text message with Assistant API and context:', userText);
      
      const contextPrompt = conversationContext.generateContextForAssistant();
      console.log('🧵 Generated conversation context');
      
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: userText,
          pronunciationData: null,
          userLevel: user?.user_level as 'Novice' | 'Intermediate' | 'Advanced' || 'Intermediate',
          userName: user?.name?.split(' ')[0] || 'Student',
          messageType: 'text',
          conversationContext: contextPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Assistant API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Assistant API failed');
      }

      const assistantResult = data.result;
      console.log('🤖 Assistant API response with context received:', {
        hasGrammarScore: !!assistantResult.grammarScore,
        grammarScore: assistantResult.grammarScore,
        grammarErrors: assistantResult.grammarErrors,
        xpAwarded: assistantResult.xpAwarded
      });

      const aiMessages = splitIntoMultipleMessages(assistantResult.feedback);
      console.log('📝 Split into', aiMessages.length, 'messages');

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
        console.log('💾 Saving text practice with grammar data...');
        
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

  const handleAudioWithAssistantAPI = async (audioBlob: Blob, duration: number) => {
    const audioMessage: Message = {
      id: generateMessageId('user-audio'),
      role: 'user',
      content: '',
      audioBlob: audioBlob,
      audioDuration: duration,
      timestamp: new Date(),
      messageType: 'audio'
    };

    setMessages(prev => [...prev, audioMessage]);
    setIsProcessingMessage(true);

    try {
      console.log('🎤 Starting audio processing with RETRY LOGIC and context...');
      
      const transcriptionPromise = transcribeAudio(audioBlob);
      const pronunciationPromise = assessPronunciation(audioBlob);
      
      const [transcriptionResult, pronunciationResult] = await Promise.allSettled([
        transcriptionPromise,
        pronunciationPromise
      ]);
      
      const transcriptionSuccess = transcriptionResult.status === 'fulfilled' && transcriptionResult.value.success;
      const pronunciationSuccess = pronunciationResult.status === 'fulfilled' && pronunciationResult.value.success;
      
      if (transcriptionSuccess && pronunciationSuccess) {
        const transcription = transcriptionResult.value.transcription;
        const scores = pronunciationResult.value.result!;
        
        console.log('🎯 Audio processed - Raw scores:', { 
          transcription, 
          pronunciationScore: scores.pronunciationScore,
          accuracyScore: scores.accuracyScore,
          fluencyScore: scores.fluencyScore,
          completenessScore: scores.completenessScore
        });
        
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
          console.log('❌ Audio needs retry:', xpResult.retryReason);
          
          const retryMessage: Message = {
            id: generateMessageId('assistant-retry'),
            role: 'assistant',
            content: xpResult.feedback,
            timestamp: new Date(),
            messageType: 'text'
          };
          
          setMessages(prev => [...prev, retryMessage]);
          
          setTimeout(() => {
            const encouragementMessage: Message = {
              id: generateMessageId('assistant-encourage'),
              role: 'assistant',
              content: user?.user_level === 'Novice' 
                ? "🎤 Pronto para tentar novamente? Just hold the microphone button and speak clearly!" 
                : "🎤 Ready to try again? Just hold the microphone button and speak clearly!",
              timestamp: new Date(),
              messageType: 'text'
            };
            setMessages(prev => [...prev, encouragementMessage]);
          }, 1500);
          
          return;
        }
        
        console.log('🎯 VALID AUDIO - XP calculated:', {
          oldMethod: `${scores.pronunciationScore >= 80 ? 75 : 50} XP (fixed)`,
          newMethod: `${xpResult.totalXP} XP (intelligent)`,
          scoreBreakdown: xpResult.scoreBreakdown,
          pronunciationScore: scores.pronunciationScore
        });
        
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

        console.log('🤖 Assistant API audio response with context received');

        const aiMessages = splitIntoMultipleMessages(assistantResponse.feedback);
        console.log('📝 Split audio response into', aiMessages.length, 'messages');

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
          console.log('💾 Saving VALID audio practice with INTELLIGENT XP:', {
            xpAwarded: xpResult.totalXP,
            pronunciationScore: scores.pronunciationScore,
            breakdown: xpResult.scoreBreakdown
          });
          
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
          
          console.log('✅ Valid audio practice saved with intelligent XP successfully!');
        }
        
        if (xpResult.totalXP >= 100) {
          console.log('🎉 Excellent performance! High XP awarded:', xpResult.totalXP);
        } else if (xpResult.totalXP >= 60) {
          console.log('👍 Good performance! Solid XP awarded:', xpResult.totalXP);
        } else {
          console.log('💪 Keep practicing! XP awarded:', xpResult.totalXP);
        }
        
      } else {
        console.error('Audio processing failed completely');
        
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
          ? "Desculpe, tive dificuldades técnicas. Sorry, I'm having technical difficulties. Please try again in a moment!"
          : "Sorry, I'm having technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
        messageType: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessingMessage(false);
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

      {/* Interface de input corrigida */}
      <div className={`flex-shrink-0 bg-secondary ${
        typeof window !== 'undefined' && 
        ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches)
          ? 'ios-fixed-footer' 
          : 'pb-safe'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            {isRecording ? (
              /* WhatsApp-style Recording Interface */
              <div className="flex-1 relative">
                <div className="flex items-center bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-3xl px-4 py-3">
                  {/* Waveform */}
                  <div className="flex items-center space-x-1 mr-3">
                    {audioLevels.map((level, index) => (
                      <div
                        key={index}
                        className="w-1 bg-red-500 rounded-full transition-all duration-100"
                        style={{ 
                          height: `${Math.max(4, level * 24)}px`,
                          minHeight: '4px'
                        }}
                      />
                    ))}
                  </div>

                  {/* Recording time */}
                  <span className="text-red-500 font-mono text-sm min-w-12 mr-3">
                    {formatTime(recordingTime)}
                  </span>

                  {/* Release to send indicator */}
                  <span className="text-red-400 text-xs flex-1">
                    {user?.user_level === 'Novice' ? 'Solte para enviar' : 'Release to send'}
                  </span>
                </div>
              </div>
            ) : (
              /* Normal Input Interface */
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
                        <button
                          // Mouse events
                          onMouseDown={handleRecordingStart}
                          onMouseUp={handleRecordingEnd}
                          onMouseLeave={handleRecordingEnd}
                          
                          // Touch events
                          onTouchStart={handleRecordingStart}
                          onTouchEnd={handleRecordingEnd}
                          onTouchCancel={handleRecordingEnd}
                          
                          className={`p-2 transition-all rounded-full select-none ${
                            isRecording 
                              ? 'text-red-500 bg-red-500/20 scale-110' 
                              : 'text-white/60 hover:text-primary hover:bg-white/5'
                          }`}
                          title={user?.user_level === 'Novice' ? 'Segurar para gravar' : 'Hold to record'}
                          style={{ touchAction: 'none' }}
                        >
                          <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                        </button>
                        
                        {/* Camera button for mobile */}
                        {(typeof window !== 'undefined' && 
                          (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           window.innerWidth <= 768)) && (
                          <button 
                            onClick={() => setIsCameraOpen(true)}
                            className="p-2 text-white/60 hover:text-primary transition-colors rounded-full hover:bg-white/5 select-none"
                            title="Take photo"
                          >
                            <Camera size={18} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
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
            )}

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
      
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(imageData) => {
          console.log('Photo captured:', imageData);
          setIsCameraOpen(false);
        }}
        userLevel={user?.user_level || 'Novice'}
      />
    </div>
  );
}
