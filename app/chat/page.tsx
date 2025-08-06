'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, Mic, Camera, Play, Pause, X } from 'lucide-react';
import ChatBox from '@/components/chat/ChatBox';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation } from '@/lib/pronunciation';
import { supabaseService } from '@/lib/supabase-service';
import EnhancedXPCounter, { EnhancedStatsModal } from '@/components/ui/EnhancedXPCounter';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import { EnhancedConversationContextManager } from '@/lib/enhanced-conversation-context';
import { improvedAudioXPService, Achievement, AudioAssessmentResult } from '@/lib/improved-audio-xp-service';
import { calculateUniversalAchievements, PracticeData } from '@/lib/universal-achievement-service';
import ChatHeader from '@/components/ChatHeader';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import BannerManager from '@/components/BannerManager';
import { PWABadgeService } from '@/lib/pwa-badge-service';

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
  xpAwarded?: number;
  nextChallenge?: string;
  tips?: string;
  encouragement?: string;
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
        userLevel: userLevel as 'Novice' | 'Inter' | 'Advanced',
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
      'Inter': `That's a good example, ${userName}! 👍 How would you use this in a business context?`,
      'Advanced': `Excellent language use, ${userName}! 🌟 Can you elaborate on that point further?`
    };

    return {
      feedback: fallbackResponses[userLevel as keyof typeof fallbackResponses] || fallbackResponses['Inter']
    };
  }
}

function splitIntoMultipleMessages(response: string, userLevel?: string): string[] {
  // 🎯 NOVICE: Não dividir - já vem formatado corretamente
  if (userLevel === 'Novice') {
    return [response.trim()];
  }
  
  // 🎓 INTER: Dividir em 2 mensagens - conversação + correção
  if (userLevel === 'Inter') {
    // Primeiro, procurar por padrões de correção, explicação ou encorajamento
    const normalizedResponse = response.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    const grammarPatterns = [
      /^(.*?)\s+(Ah and.*?)$/i,
      /^(.*?)\s+(Oh,?\s*and.*?)$/i,
      /^(.*?)\s+(Just a tip.*?)$/i,
      /^(.*?)\s+(By the way.*?)$/i,
      /^(.*?)\s+(Good question!.*?)$/i,
      /^(.*?)\s+(Great question!.*?)$/i,
      /^(.*?)\s+(Here's the thing:.*?)$/i,
      /^(.*?)\s+(Quick explanation:.*?)$/i,
      /^(.*?)\s+(The difference is:.*?)$/i,
      /^(.*?)\s+(Great English!.*?)$/i,
      /^(.*?)\s+(Perfect grammar!.*?)$/i,
      /^(.*?)\s+(Well said!.*?)$/i,
      /^(.*?)\s+(Nice expression!.*?)$/i,
      /^(.*?)\s+(Remember to.*?)$/i,
      /^(.*?)\s+(Just say.*?)$/i,
      /^(.*?)\s+(Also.*?)$/i
    ];
    
    for (const pattern of grammarPatterns) {
      const match = normalizedResponse.match(pattern);
      if (match) {
        console.log('🔍 Split pattern matched:', pattern.source, 'Result:', [match[1].trim(), match[2].trim()]);
        return [
          match[1].trim(), // Parte da conversação
          match[2].trim()  // Parte da correção
        ].filter(msg => msg.length > 0);
      }
    }
    
    // Procurar por padrões de correção alternativos no final
    const correctionPatterns = [
      /^(.*?)\s+(Try saying.*?)$/i,
      /^(.*?)\s+(You could say.*?)$/i,
      /^(.*?)\s+(Better to say.*?)$/i,
      /^(.*?)\s+(Say.*instead.*?)$/i,
      /^(.*?)\s+(Instead of.*?)$/i,
      /^(.*?)\s+(Use.*instead.*?)$/i,
      /^(.*?)\s+(Change.*to.*?)$/i
    ];
    
    for (const pattern of correctionPatterns) {
      const match = normalizedResponse.match(pattern);
      if (match) {
        console.log('🔍 Correction pattern matched:', pattern.source, 'Result:', [match[1].trim(), match[2].trim()]);
        return [
          match[1].trim(),
          match[2].trim()
        ].filter(msg => msg.length > 0);
      }
    }
    
    // Dividir por ponto final seguido de frase que contém correção
    const sentences = response.split(/\.\s+/);
    if (sentences.length >= 2) {
      // Procurar pela primeira sentença que contém correção
      for (let i = 1; i < sentences.length; i++) {
        const sentence = sentences[i].toLowerCase();
        if (sentence.includes('tip:') || 
            sentence.includes('instead') || 
            sentence.includes('better') ||
            sentence.includes('try') ||
            sentence.includes('say') ||
            sentence.includes('example') ||
            sentence.includes('for example') ||
            sentence.includes('use') ||
            sentence.includes('change') ||
            sentence.includes('with')) {
          
          const conversationPart = sentences.slice(0, i).join('. ') + '.';
          const correctionPart = sentences.slice(i).join('. ') + (sentences[sentences.length - 1].endsWith('.') ? '' : '.');
          
          return [
            conversationPart.trim(),
            correctionPart.trim()
          ].filter(msg => msg.length > 0);
        }
      }
      
      // Se não encontrou correção específica, mas tem pergunta na primeira parte
      if (sentences[0].includes('?')) {
        const conversationPart = sentences[0] + (sentences[0].endsWith('?') ? '' : '?');
        const correctionPart = sentences.slice(1).join('. ') + '.';
        
        return [
          conversationPart.trim(),
          correctionPart.trim()
        ].filter(msg => msg.length > 0);
      }
    }
    
    // Fallback: se não conseguir dividir inteligentemente, retornar como mensagem única
    return [response.trim()];
  }
  
  // Para Advanced, manter comportamento original de divisão
  let messages = response.split(/(?:\n\n|\|\|\||\. {2,})/);
  
  if (messages.length < 2) {
    // 🔧 PRESERVE PUNCTUATION: Split while keeping punctuation marks
    const sentences = response.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      messages = [
        sentences.slice(0, mid).join(' ').trim(),
        sentences.slice(mid).join(' ').trim()
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
  
  // 🎓 NOVO: Onboarding system
  const onboarding = useOnboarding(user?.entra_id);
  const {
    showMainTour,
    completeMainTour,
    skipMainTour
  } = onboarding;
  
  // ✅ SIMPLIFIED: Just detect iOS PWA mode without complex keyboard handling
  const [isIOSPWAMode, setIsIOSPWAMode] = useState(false);
  
  useEffect(() => {
    const isPWA = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOSPWAMode(isPWA && isIOS);
  }, []);

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
  
  // ✅ NEW: Add missing state variables for EnhancedXPCounter
  const [currentLevel, setCurrentLevel] = useState(1);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  // ✅ NEW: Modal state for header XP counter
  const [isHeaderXPModalOpen, setIsHeaderXPModalOpen] = useState(false);

  // Estados de gravação UNIFICADOS
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  
  // Player state para preview
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  const [conversationContext, setConversationContext] = useState<EnhancedConversationContextManager | null>(null);
  
  // Initialize conversation context when user loads
  useEffect(() => {
    if (user) {
      console.log('👤 [CONTEXT] Initializing context with user data:', {
        userLevel: user.user_level,
        userName: user.name?.split(' ')[0],
        entraId: user.entra_id
      });
      
      const newContext = new EnhancedConversationContextManager(
        user.user_level || 'Inter',
        user.name?.split(' ')[0] || 'Student',
        user.entra_id
      );
      setConversationContext(newContext);
    }
  }, [user]);

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

  // Load user stats including achievements and level
  const loadUserStats = useCallback(async () => {
    if (!user?.entra_id || !supabaseService.isAvailable()) return;

    try {
      const stats = await supabaseService.getUserStats(user.entra_id);
      if (stats) {
        setTotalXP(stats.total_xp);
        // Calculate level from total XP using improved formula
        const level = Math.floor(Math.sqrt(stats.total_xp / 50)) + 1;
        setCurrentLevel(level);
      }

      // 🔧 CORRIGIDO: Sempre atualizar sessionXP com valor real do banco
      const todayXP = await supabaseService.getTodaySessionXP(user.entra_id);
      console.log('🔄 Loading today XP from bank:', todayXP);
      setSessionXP(todayXP);

      // Load user achievements
      const userAchievements = await supabaseService.getUserAchievements(user.entra_id);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user?.entra_id]);

  // ✅ ANDROID FIX: Cache de IDs processados fora do callback
  const processedAchievementIds = useRef(new Set<string>());

  // Handle achievement notifications - SIMPLIFIED
  const handleNewAchievements = useCallback((newAchievements: Achievement[]) => {
    if (newAchievements.length === 0) return;

    // Filtrar apenas achievements que não foram processados
    const uniqueAchievements = newAchievements.filter(a => {
      if (processedAchievementIds.current.has(a.id)) {
        return false;
      }
      processedAchievementIds.current.add(a.id);
      return true;
    });

    if (uniqueAchievements.length === 0) return;

    // Mostrar achievements na UI
    setNewAchievements(prev => [...prev, ...uniqueAchievements]);
    
    // Adicionar aos achievements permanentes
    setAchievements(prev => [...prev, ...uniqueAchievements]);
  }, []);

  const handleAchievementsDismissed = useCallback((achievementId: string) => {
    setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
  }, []);

  // Audio processing with improved XP system
  const handleAudioWithAssistantAPI = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!conversationContext || !user?.entra_id) {
      console.log('⚠️ Cannot process audio:', {
        hasContext: !!conversationContext,
        hasUser: !!user?.entra_id
      });
      return;
    }

    console.log('🎤 Starting audio processing:', { 
      blobSize: audioBlob.size, 
      duration, 
      blobType: audioBlob.type 
    });

    // ✅ CONVERSÃO REAL DE ÁUDIO NO CLIENTE
    let processedAudioBlob = audioBlob;
    
    if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
      console.log('🔄 Converting WebM/Opus to WAV using REAL conversion...');
      
      try {
        processedAudioBlob = await convertAudioToWAV(audioBlob);
        
        console.log('✅ REAL audio conversion completed:', {
          originalType: audioBlob.type,
          newType: processedAudioBlob.type,
          originalSize: audioBlob.size,
          newSize: processedAudioBlob.size,
          format: 'WAV PCM 16kHz mono'
        });
      } catch (error) {
        console.error('❌ REAL audio conversion error:', error);
        console.log('🔄 Using original audio as fallback');
        // Continuar com áudio original se conversão falhar
      }
    } else {
      console.log('✅ Audio already in compatible format:', audioBlob.type);
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
      console.log('🔄 Starting transcription and pronunciation assessment...');
      console.log('📁 Using processed audio:', { 
        type: processedAudioBlob.type, 
        size: processedAudioBlob.size 
      });
      
      const [transcriptionResult, pronunciationResult] = await Promise.allSettled([
        transcribeAudio(processedAudioBlob), // ✅ Usar áudio convertido
        assessPronunciation(processedAudioBlob) // ✅ Usar áudio convertido
      ]);
      
      console.log('📝 Transcription result:', transcriptionResult);
      console.log('🎯 Pronunciation result:', pronunciationResult);
      
      const transcriptionSuccess = transcriptionResult.status === 'fulfilled' && transcriptionResult.value.success;
      const pronunciationSuccess = pronunciationResult.status === 'fulfilled' && pronunciationResult.value.success;
      
      console.log('✅ Success status:', { transcriptionSuccess, pronunciationSuccess });
      
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
        
        // ✅ UPDATED: Use improved XP system instead of legacy calculateAudioXP
        const xpResult = await improvedAudioXPService.calculateImprovedXP(
          assessmentResult,
          duration,
          user?.user_level as 'Novice' | 'Inter' | 'Advanced' || 'Inter',
          user?.entra_id || '',
          totalXP
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
        
        conversationContext?.addMessage('user', transcription, 'audio', undefined, scores.pronunciationScore);
        const contextPrompt = conversationContext?.generateContextForAssistant();
        
        const assistantResponse = await getAssistantResponse(
          transcription,
          user?.user_level || 'Inter',
          user?.name?.split(' ')[0] || 'Student',
          'audio',
          {
            accuracyScore: scores.accuracyScore,
            fluencyScore: scores.fluencyScore,
            completenessScore: scores.completenessScore,
            pronunciationScore: scores.pronunciationScore,
            prosodyScore: scores.prosodyScore,
            xpAwarded: xpResult.totalXP,
            feedback: xpResult.feedback,
            words: scores.words || [],
            phonemes: scores.phonemes || [],
            rawResult: scores
          },
          contextPrompt
        );

        const aiMessages = splitIntoMultipleMessages(assistantResponse.feedback, user?.user_level);

        await sendSequentialMessages(
          aiMessages,
          (msg) => setMessages(prev => [...prev, msg]),
          generateMessageId,
          1500,
          assistantResponse.technicalFeedback
        );

        aiMessages.forEach(msg => 
          conversationContext?.addMessage('assistant', msg, 'audio')
        );

        if (supabaseService.isAvailable() && user?.entra_id) {
          // 🏆 NOVO: Calcular achievements universais para áudio
          let audioAchievements: Achievement[] = [];
          let achievementBonusXP = 0;

          try {
            // Obter streak atual
            const userStats = await supabaseService.getUserStats(user.entra_id);
            const streakDays = userStats?.streak_days || 0;

            // Preparar dados para o sistema universal
            const practiceData: PracticeData = {
              type: 'audio_message',
              text: transcription,
              duration: duration,
              accuracy: scores.accuracyScore,
              pronunciation: scores.pronunciationScore,
              userLevel: (user.user_level || 'Inter') as 'Novice' | 'Inter' | 'Advanced',
              streakDays
            };

            // Calcular achievements universais
            const achievementResult = calculateUniversalAchievements(practiceData);
            audioAchievements = achievementResult.achievements;
            achievementBonusXP = achievementResult.totalBonusXP;

            console.log('🏆 Audio achievements calculated:', {
              achievementsEarned: audioAchievements.length,
              bonusXP: achievementBonusXP,
              achievements: audioAchievements.map(a => a.title)
            });

          } catch (error) {
            console.error('❌ Error calculating audio achievements:', error);
          }

          // ✅ UPDATED: Save with improved XP data + universal achievements
          await supabaseService.saveAudioPractice({
            user_id: user.entra_id,
            transcription: transcription,
            accuracy_score: scores.accuracyScore,
            fluency_score: scores.fluencyScore,
            completeness_score: scores.completenessScore,
            pronunciation_score: scores.pronunciationScore,
            xp_awarded: xpResult.totalXP + achievementBonusXP, // XP total incluindo achievements universais
            practice_type: 'audio_message',
            audio_duration: duration,
            feedback: `${assistantResponse.feedback}\n\n${xpResult.feedback}`,
            technicalFeedback: assistantResponse.technicalFeedback,
            // ✅ NEW: Save improved XP system data
            achievement_ids: [...xpResult.achievements.map(a => a.id), ...audioAchievements.map(a => a.id)], // Combinar achievements
            surprise_bonus: xpResult.surpriseBonus?.amount || 0,
            base_xp: xpResult.baseXP,
            bonus_xp: xpResult.bonusXP + achievementBonusXP // Combinar bônus
          });

          // ✅ NEW: Save achievements if any were earned (combinar ambos os sistemas)
          const allAchievements = [...xpResult.achievements, ...audioAchievements];
          if (allAchievements.length > 0) {
            console.log('✅ INSIDE achievement save condition!');
            try {
              console.log('🔍 About to save achievements:', {
                userId: user.entra_id,
                achievementsCount: allAchievements.length,
                achievements: allAchievements.map(a => ({
                  id: a.id,
                  title: a.title,
                  type: typeof a,
                  keys: Object.keys(a)
                }))
              });
              
              // ✅ Usar API route em vez de chamar diretamente
              console.log('🚀 Making API call to /api/achievements...');
              
              const response = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.entra_id,
                  achievements: allAchievements
                })
              });

              console.log('📡 API Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
              }

              const result = await response.json();
              console.log('✅ API Success result:', result);
              
              if (!result.success) {
                throw new Error(result.error || 'Failed to save achievements');
              }

              console.log('✅ Achievements saved successfully, showing in UI...');
            } catch (error) {
              // 🛡️ PROTEÇÃO: Log erro mas não quebrar o fluxo principal
              console.warn('⚠️ Failed to save achievements to database, but continuing...', error);
            }
            
            // 🎯 Mostrar achievements na UI independente do resultado do salvamento
            handleNewAchievements(allAchievements);
          }
          
          setSessionXP(prev => prev + xpResult.totalXP + achievementBonusXP);
          setTotalXP(prev => prev + xpResult.totalXP + achievementBonusXP);
          
          // 🔧 CORRIGIDO: Recarregar stats para sincronizar XP diário
          setTimeout(() => {
            loadUserStats();
          }, 1000); // Aguardar 1s para garantir que salvou no banco
          
        }
        
      } else {
        console.log('❌ Audio processing failed:', {
          transcriptionSuccess,
          pronunciationSuccess,
          transcriptionError: transcriptionResult.status === 'rejected' ? transcriptionResult.reason : null,
          pronunciationError: pronunciationResult.status === 'rejected' ? pronunciationResult.reason : null,
          transcriptionValue: transcriptionResult.status === 'fulfilled' ? transcriptionResult.value : null,
          pronunciationValue: pronunciationResult.status === 'fulfilled' ? pronunciationResult.value : null
        });
        
        const errorMessage = user?.user_level === 'Novice'
          ? "I apologize, I had technical issues with your audio. Please try recording again!"
          : "I apologize, I had technical issues with your audio. Please try again!";
        
        const errorResponse: Message = {
          id: generateMessageId('assistant-error'),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          messageType: 'text'
        };
        
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      
      const errorMessage = user?.user_level === 'Novice'
        ? "I apologize, I'm having technical difficulties!"
        : "I apologize, I'm having technical difficulties!";
      
      const errorResponse: Message = {
        id: generateMessageId('assistant-error'),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        messageType: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessingMessage(false);
    }
  }, [generateMessageId, user, conversationContext, loadUserStats, totalXP, handleNewAchievements]);

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
    
    const shouldGreet = conversationContext?.shouldGreet();
    
    const welcomeMessage: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: shouldGreet 
        ? (user.user_level === 'Novice' 
          ? `Hi ${user.name?.split(' ')[0]}! I'm Charlotte, your English assistant. You can write in Portuguese or English!`
          : `Hi ${user.name?.split(' ')[0]}! I'm Charlotte, ready to help you practice English. How can I assist you today?`)
        : `Welcome back! Let's continue our English practice. What would you like to work on?`,
      timestamp: new Date(),
      messageType: 'text'
    };
    
    setMessages([welcomeMessage]);
    
    if (shouldGreet) {
      conversationContext?.markGreetingDone();
    }

    loadUserStats();
  }, [user, messages.length, isMounted, conversationContext, loadUserStats]);

  // Load user stats on mount
  useEffect(() => {
    if (user?.entra_id && supabaseService.isAvailable()) {
      loadUserStats();
      
      // 🔍 DEBUG: Verificar estrutura das tabelas (DESABILITADO)
      // console.log('🔍 Running table structure debug...');
      // supabaseService.debugTableStructures();
      
      // 🔧 FORCE: Atualizar cache do leaderboard para corrigir nomes
      console.log('🔄 Force refreshing leaderboard cache...');
      supabaseService.forceRefreshLeaderboard().then((success) => {
        if (success) {
          console.log('✅ Leaderboard cache refreshed successfully');
        } else {
          console.log('❌ Failed to refresh leaderboard cache');
        }
      });
    }
  }, [user?.entra_id, loadUserStats]);

  // ✅ Update level when totalXP changes
  useEffect(() => {
    const newLevel = Math.floor(Math.sqrt(totalXP / 50)) + 1;
    if (newLevel !== currentLevel) {
      setCurrentLevel(newLevel);
      console.log('📈 Level updated:', { oldLevel: currentLevel, newLevel, totalXP });
    }
  }, [totalXP, currentLevel]);

  // ✅ SIMPLIFIED: iOS PWA Setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isIOSPWAMode) {
      console.log('🍎 iOS PWA Mode Active - Applying aggressive fixes');
      
      // Add CSS classes for iOS PWA mode
      document.body.classList.add('ios-pwa');
      
      // AGGRESSIVE: Disable VirtualKeyboard API completely
      if ('virtualKeyboard' in navigator) {
        try {
          (navigator as any).virtualKeyboard.overlaysContent = false;
        } catch (e) {
          console.log('VirtualKeyboard API not available');
        }
      }
      
      // FORCE: Set viewport to prevent any resizing
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute(
          'content', 
          'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-visual'
        );
      }
      
      // PREVENT: Any scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      // FORCE: Lock viewport height
      const lockViewport = () => {
        document.documentElement.style.height = '100vh';
        document.documentElement.style.height = '100dvh';
        document.body.style.height = '100vh';
        document.body.style.height = '100dvh';
      };
      
      lockViewport();
      window.addEventListener('resize', lockViewport);
      window.addEventListener('orientationchange', lockViewport);
      
      return () => {
        document.body.classList.remove('ios-pwa');
        window.removeEventListener('resize', lockViewport);
        window.removeEventListener('orientationchange', lockViewport);
      };
    }
  }, [isIOSPWAMode]);

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

        setMessages(prev => [...prev, imageMessage]);
        setIsProcessingMessage(true);

        try {
          // Create optimized prompt for vocabulary learning with XP system - ALWAYS IN ENGLISH
          const vocabularyPrompt = `Look at this image and help me learn English vocabulary.

Identify the main object and teach me:
- The English name
- A clear definition in English
- An example sentence showing proper usage

Be natural and conversational, as if teaching a friend. Then ask me to practice using this word in a sentence.

IMPORTANT: End your response with: VOCABULARY_WORD:[english_word]`;

          // Call assistant API for vocabulary analysis
          const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcription: vocabularyPrompt,
              pronunciationData: null,
              userLevel: user?.user_level as 'Novice' | 'Inter' | 'Advanced' || 'Inter',
              userName: user?.name?.split(' ')[0] || 'Student',
              messageType: 'image',
              imageData: imageData, // Send full image data to assistant
              conversationContext: conversationContext?.generateContextForAssistant()
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

          // Split response into multiple messages (Novice gets single message)
          const aiMessages = splitIntoMultipleMessages(assistantFeedback, user?.user_level);

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
            conversationContext?.addMessage('assistant', msg, 'audio')
          );

          // Save practice with vocabulary XP and achievements
          if (supabaseService.isAvailable() && user?.entra_id) {
            const baseXP = (assistantResult.xpAwarded || 3) + vocabularyXP; // Base XP + vocabulary XP
            
            // 🏆 Calcular achievements para Photo
            const practiceData = {
              user_id: user.entra_id,
              type: 'camera_object' as const,
              text: `Image analysis: ${discoveredWord || 'object identification'}`,
              userLevel: user?.user_level as 'Novice' | 'Inter' | 'Advanced' || 'Inter',
              xp_awarded: baseXP,
              audio_duration: 0,
              session_date: new Date().toISOString().split('T')[0],
              streakDays: 0 // Will be calculated by the service
            };

            const achievementResult = calculateUniversalAchievements(practiceData);
            const photoAchievements = achievementResult.achievements;
            const achievementBonusXP = achievementResult.totalBonusXP;
            const totalXPAwarded = baseXP + achievementBonusXP;

            console.log('🏆 Photo achievements calculated:', {
              achievementsEarned: photoAchievements.length,
              bonusXP: achievementBonusXP,
              achievements: photoAchievements.map(a => a.title)
            });
            
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
              technicalFeedback: assistantResult.technicalFeedback,
              achievement_ids: photoAchievements.map(a => a.id),
              surprise_bonus: 0,
              base_xp: baseXP,
              bonus_xp: achievementBonusXP
            });

            // 🏆 Salvar achievements se houver
            if (photoAchievements.length > 0) {
              try {
                console.log('🚀 Saving Photo achievements via API...');
                
                const response = await fetch('/api/achievements', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.entra_id,
                    achievements: photoAchievements
                  })
                });

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (!result.success) {
                  throw new Error(result.error || 'Failed to save achievements');
                }

                console.log('✅ Photo achievements saved successfully!');
              } catch (error) {
                console.warn('⚠️ Failed to save Photo achievements:', error);
              }
            }
            
            setSessionXP(prev => prev + totalXPAwarded);
            setTotalXP(prev => prev + totalXPAwarded);
            
            // 🔧 CORRIGIDO: Recarregar stats para sincronizar XP diário
            setTimeout(() => {
              loadUserStats();
            }, 1000); // Aguardar 1s para garantir que salvou no banco
            
          }

        } catch (error) {
          console.error('Error processing image with assistant:', error);
          
          // Fallback response
          const errorMessage = user.user_level === 'Novice'
            ? "I apologize, I had trouble analyzing your photo. Please try taking another picture!"
            : "I apologize, I had trouble analyzing your photo. Please try again!";
          
          const fallbackResponse: Message = {
            id: generateMessageId('assistant-image-error'),
            role: 'assistant',
            content: errorMessage,
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
    console.log('🎵 Starting REAL audio conversion in browser...');
    console.log('📋 Input:', { type: audioBlob.type, size: audioBlob.size });

    try {
      // ✅ USAR WEB AUDIO API PARA CONVERSÃO REAL
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decodificar áudio WebM/Opus
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('✅ Audio decoded:', {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration
      });

      // ✅ CONVERTER PARA 16kHz MONO PCM
      const targetSampleRate = 16000;
      const targetChannels = 1;
      
      let processedBuffer = audioBuffer;
      
      // Resample se necessário
      if (audioBuffer.sampleRate !== targetSampleRate) {
        processedBuffer = await resampleAudio(audioBuffer, targetSampleRate, audioContext);
        console.log(`🔄 Resampled from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);
      }
      
      // Converter para mono se necessário
      if (processedBuffer.numberOfChannels > 1) {
        processedBuffer = convertToMono(processedBuffer, audioContext);
        console.log('🔄 Converted to mono');
      }

      // ✅ CONVERTER PARA WAV PCM
      const wavBuffer = audioBufferToWav(processedBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        
      console.log('✅ REAL conversion completed:', {
        originalSize: audioBlob.size,
        convertedSize: wavBlob.size,
        format: 'WAV PCM 16kHz mono'
      });

      // Cleanup
      audioContext.close();
      
      return wavBlob;

    } catch (error) {
      console.error('❌ REAL audio conversion failed:', error);
      console.log('🔄 Returning original audio as fallback');
      return audioBlob;
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

  // Initialize PWA Badge Service when app opens
  useEffect(() => {
    const initializeBadgeService = async () => {
      try {
        await PWABadgeService.initialize();
        // Clear badge when app is opened
        await PWABadgeService.clearBadgeOnAppOpen();
      } catch (error) {
        console.error('❌ Error initializing Badge Service:', error);
      }
    };

    initializeBadgeService();
  }, []);

  // Loading
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Text message handler
  const handleSendMessage = async () => {
    if (!message.trim() || isProcessingMessage || !user?.entra_id || !conversationContext) {
      console.log('⚠️ Cannot send message:', {
        hasMessage: !!message.trim(),
        isProcessing: isProcessingMessage,
        hasUser: !!user?.entra_id,
        hasContext: !!conversationContext
      });
      return;
    }

    const userText = message.trim();
    setMessage('');
    setIsProcessingMessage(true);

    // Add user message to chat
    const userMessage: Message = {
      id: generateMessageId('user'),
      role: 'user',
      content: userText,
      timestamp: new Date(),
      messageType: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Add user message to context
      conversationContext?.addMessage('user', userText, 'text');
      
      // Get conversation context
      const context = conversationContext?.generateContextForAssistant();
      console.log('🧠 [CONTEXT DEBUG] Sending context to API:', {
        hasContext: !!context,
        contextLength: context?.length || 0,
        recentMessages: conversationContext?.getRecentMessages(2).map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })) || [],
        userLevel: user.user_level,
        userName: user.name?.split(' ')[0]
      });
      
      // Call assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: userText,
          pronunciationData: null,
          userLevel: user.user_level || 'Inter',
          userName: user.name?.split(' ')[0] || 'Student',
          messageType: 'text',
          conversationContext: context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get assistant response');
      }

      const assistantResult = data.result;

      // 🏆 NOVO: Calcular achievements universais para texto
      let textAchievements: Achievement[] = [];
      let achievementBonusXP = 0;

      if (user?.entra_id && supabaseService.isAvailable()) {
        try {
          // Obter streak atual
          const userStats = await supabaseService.getUserStats(user.entra_id);
          const streakDays = userStats?.streak_days || 0;

          // Preparar dados para o sistema universal
          const practiceData: PracticeData = {
            type: 'text_message',
            text: userText,
            grammar: assistantResult.grammarScore || undefined,
            wordCount: userText.split(' ').filter(word => word.trim()).length,
            userLevel: (user.user_level || 'Inter') as 'Novice' | 'Inter' | 'Advanced',
            streakDays
          };

          // Calcular achievements universais
          const achievementResult = calculateUniversalAchievements(practiceData);
          textAchievements = achievementResult.achievements;
          achievementBonusXP = achievementResult.totalBonusXP;

          console.log('🏆 Text achievements calculated:', {
            achievementsEarned: textAchievements.length,
            bonusXP: achievementBonusXP,
            achievements: textAchievements.map(a => a.title),
            fullAchievements: textAchievements
          });

        } catch (error) {
          console.error('❌ Error calculating text achievements:', error);
        }
      }

      // Split response into multiple messages (Novice sempre 1 mensagem)
      const aiMessages = splitIntoMultipleMessages(assistantResult.feedback, user?.user_level);

      // Send messages sequentially with XP info in first message
      await sendSequentialMessages(
        aiMessages,
        (msg) => {
          // Add XP info to first message
          if (msg.id.includes('part-0')) {
            msg.xpAwarded = assistantResult.xpAwarded + achievementBonusXP;
            msg.nextChallenge = assistantResult.nextChallenge;
            msg.tips = assistantResult.tips;
            msg.encouragement = assistantResult.encouragement;
          }
          setMessages(prev => [...prev, msg]);
        },
        generateMessageId,
        1200,
        assistantResult.technicalFeedback
      );

      // Update conversation context
      aiMessages.forEach(msg => 
        conversationContext?.addMessage('assistant', msg, 'text')
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
          xp_awarded: assistantResult.xpAwarded + achievementBonusXP, // XP total incluindo achievements
          practice_type: 'text_message',
          audio_duration: 0,
          feedback: assistantResult.feedback,
          grammar_score: assistantResult.grammarScore || null,
          grammar_errors: assistantResult.grammarErrors || null,
          text_complexity: assistantResult.textComplexity || null,
          word_count: wordCount,
          // 🏆 NOVO: Salvar dados de achievements
          achievement_ids: textAchievements.map(a => a.id),
          surprise_bonus: 0, // Texto não tem surprise bonus por enquanto
          base_xp: assistantResult.xpAwarded,
          bonus_xp: achievementBonusXP
        });

        // 🏆 NOVO: Salvar achievements se houver
        console.log('🔍 DEBUG: textAchievements before save check:', {
          length: textAchievements.length,
          achievements: textAchievements,
          type: typeof textAchievements,
          isArray: Array.isArray(textAchievements),
          stringified: JSON.stringify(textAchievements)
        });
        
        console.log('🔍 Checking if textAchievements.length > 0:', textAchievements.length > 0);
        
        if (textAchievements.length > 0) {
          console.log('✅ INSIDE achievement save condition!');
          try {
            console.log('🔍 About to save achievements:', {
              userId: user.entra_id,
              achievementsCount: textAchievements.length,
              achievements: textAchievements.map(a => ({
                id: a.id,
                title: a.title,
                type: typeof a,
                keys: Object.keys(a)
              }))
            });
            
            // ✅ Usar API route em vez de chamar diretamente
            console.log('🚀 Making API call to /api/achievements...');
            
            const response = await fetch('/api/achievements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.entra_id,
                achievements: textAchievements
              })
            });

            console.log('📡 API Response received:', {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ API Error response:', errorText);
              throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ API Success result:', result);
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to save achievements');
            }

            console.log('✅ Text achievements saved successfully, showing in UI...');
          } catch (error) {
            // 🛡️ PROTEÇÃO: Log erro mas não quebrar o fluxo principal
            console.warn('⚠️ Failed to save achievements to database, but continuing...', error);
          }
          
          // 🎯 Mostrar achievements na UI independente do resultado do salvamento
          handleNewAchievements(textAchievements);
        }
          
        setSessionXP(prev => prev + assistantResult.xpAwarded + achievementBonusXP);
        setTotalXP(prev => prev + assistantResult.xpAwarded + achievementBonusXP);
        
        // 🔧 CORRIGIDO: Recarregar stats para sincronizar XP diário
        setTimeout(() => {
          loadUserStats();
        }, 1000); // Aguardar 1s para garantir que salvou no banco
          
      }

    } catch (error) {
      console.error('❌ Error processing text message:', error);
      
      const fallbackMessage = user?.user_level === 'Novice'
        ? `I apologize, ${user?.name?.split(' ')[0] || 'there'}! I had a small technical issue, but I can see you're practicing English! Keep writing - it really helps improve your skills! 😊`
        : `Thank you for your message, ${user?.name?.split(' ')[0] || 'there'}! I had a technical issue, but I appreciate your English practice. Please try again!`;
        
      const aiResponse: Message = {
        id: generateMessageId('assistant-fallback'),
        role: 'assistant',
        content: fallbackMessage,
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
    <div className={`h-screen bg-secondary flex flex-col relative ${
        typeof window !== 'undefined' && 
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
       window.innerWidth <= 768) 
        ? 'mobile-chat-container' 
        : ''
    }`}>
      <ChatHeader 
        userName={user?.name}
        userLevel={user?.user_level}
        onLogout={logout}
        totalXP={totalXP}
        sessionXP={sessionXP}
        onXPCounterClick={() => {
          // Abrir o modal diretamente do header
          setIsHeaderXPModalOpen(true);
        }}
      />

        <ChatBox
          messages={messages}
          transcript={transcript}
          finalTranscript={finalTranscript}
          isProcessingMessage={isProcessingMessage}
          userLevel={user?.user_level || 'Novice'}
        />

      {/* ✅ FIXED: Footer now truly fixed at bottom, independent of ChatBox and keyboard */}
      <div 
        className={`fixed-footer bg-secondary border-t border-white/5 ${
          isIOSPWAMode ? 'ios-pwa-fixed-footer' : ''
        } ${
        typeof window !== 'undefined' && 
          ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768) ||
          ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches))
            ? 'pb-safe' 
          : 'pb-safe'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-3">
            
            {/* Interface normal */}
            <div className="flex-1 relative">
              <div className="flex items-end bg-charcoal/60 backdrop-blur-sm border border-white/10 rounded-3xl focus-within:border-primary/30 transition-colors">
                <textarea
                  ref={textareaRef}
                  id="message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything..."
                  rows={1}
                  className={`flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none resize-none text-sm overflow-hidden select-none ${
                    typeof window !== 'undefined' && 
                    ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768) ||
                    ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches))
                      ? 'px-4 py-3' // Mobile: altura restaurada
                      : 'px-4 py-3'   // Desktop: altura normal
                  } ${message.trim() ? 'pr-14' : 'pr-3'}`}
                  style={{ 
                    minHeight: typeof window !== 'undefined' && 
                      ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       window.innerWidth <= 768) ||
                      ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches))
                        ? '44px' // Mobile: altura adequada restaurada
                        : '44px', // Desktop: altura normal
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
                              id="voice-button"
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
                                className="absolute right-[136px] bottom-2 p-2 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors rounded-full select-none"
                                title="Cancel recording"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={togglePlayback}
                                className="absolute right-24 bottom-2 p-2 text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 transition-colors rounded-full select-none"
                                title={isPlaying ? "Pause preview" : "Play preview"}
                              >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <span className="absolute right-12 bottom-1/2 transform translate-y-1/2 text-white/70 font-mono text-sm font-semibold px-1 min-w-10 text-center">
                                {isPlaying ? formatTime(playTime) : formatTime(recordedDuration)}
                              </span>
                              <button
                                onClick={sendRecordedAudio}
                                className="absolute right-2 bottom-2 p-2 bg-primary text-black rounded-full hover:bg-primary-dark transition-colors select-none"
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
                              id="photo-button"
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
                              id="voice-button"
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
              id="live-voice-button"
              onClick={() => {
                setIsLiveVoiceOpen(true);
                // 🎓 RESTAURADO: Ativar tour ao abrir Live Voice (melhor UX)
                console.log('🎓 Live Voice button clicked - starting tour check...');
                if ('debugOnboardingState' in onboarding) {
                  (onboarding as any).debugOnboardingState();
                }
                if ('startLiveVoiceTour' in onboarding) {
                  (onboarding as any).startLiveVoiceTour();
                }
              }}
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

      {/* Floating XP Counter */}
      {sessionXP !== undefined && totalXP !== undefined && !isLiveVoiceOpen && (
        <div id="xp-counter" className="floating-xp-counter" data-xp-counter>
          <EnhancedXPCounter 
            sessionXP={sessionXP}
            totalXP={totalXP}
            currentLevel={Math.floor(Math.sqrt(totalXP / 50)) + 1}
            achievements={achievements}
            onAchievementsDismissed={() => handleAchievementsDismissed('')}
            userId={user?.entra_id}
            userLevel={user?.user_level as 'Novice' | 'Inter' | 'Advanced'}
            onXPGained={(amount) => {
              console.log('XP animation completed:', amount);
            }}
            isFloating={true}
          />
        </div>
      )}

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        userLevel={user?.user_level || 'Novice'}
        userName={user?.name?.split(' ')[0]}
        user={user || undefined}
        sessionXP={sessionXP}
        totalXP={totalXP}
        onLogout={logout}
        onXPGained={(amount) => {
          console.log('Live Voice XP gained:', amount);
          // 🔧 CORRIGIDO: Atualizar estado local e recarregar stats
          setSessionXP(prev => prev + amount);
          setTotalXP(prev => prev + amount);
          
          // 🔧 CORRIGIDO: Recarregar stats para sincronizar XP diário
          setTimeout(() => {
            loadUserStats();
          }, 1000); // Aguardar 1s para garantir que salvou no banco
        }}
        conversationContext={conversationContext}
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

      {/* Header XP Modal - MESMO modal que o Enhanced usa */}
      {isHeaderXPModalOpen && (
        <EnhancedStatsModal
          isOpen={isHeaderXPModalOpen}
          onClose={() => setIsHeaderXPModalOpen(false)}
          sessionXP={sessionXP}
          totalXP={totalXP}
          currentLevel={Math.floor(Math.sqrt(totalXP / 50)) + 1}
          achievements={achievements}
          realAchievements={achievements}
          onAchievementsDismissed={() => handleAchievementsDismissed('')}
          userId={user?.entra_id}
          userLevel={user?.user_level as 'Novice' | 'Inter' | 'Advanced'}
        />
      )}

      {/* ✅ NEW: Achievement Notifications */}
      <AchievementNotification
        achievements={newAchievements}
        onDismiss={handleAchievementsDismissed}
      />



      {/* 🎯 Banner Manager - Gerencia sequência: Tour → PWA → Notificação */}
      <BannerManager />
    </div>
  );
}

