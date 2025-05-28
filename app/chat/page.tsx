'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { LogOut, Send, Mic, Camera, Phone } from 'lucide-react';
import ChatBox from '@/components/chat/ChatBox';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';
import CameraCapture from '@/components/camera/CameraCapture';
import AudioPlayer from '@/components/voice/AudioPlayer';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation, formatScoreMessage } from '@/lib/pronunciation';
import { getAssistantFeedback, formatAssistantMessage, createFallbackResponse } from '@/lib/assistant';
import { supabaseService } from '@/lib/supabase-service';
import XPCounter from '@/components/ui/XPCounter';
// ✅ NOVO IMPORT: Serviço de XP inteligente
import { calculateAudioXP, AudioAssessmentResult } from '@/lib/audio-xp-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  audioBlob?: Blob;
  audioDuration?: number;
  timestamp: Date;
  messageType?: 'text' | 'audio' | 'image';
}

// ✅ SISTEMA DE CONTEXTO DE CONVERSA
interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    type: 'text' | 'audio';
    timestamp: Date;
  }>;
  topics: string[];
  lastGreeting?: Date;
  userPreferences: {
    level: string;
    name: string;
    responseStyle: 'single' | 'multiple';
  };
}

class ConversationContextManager {
  private context: ConversationContext;

  constructor(userLevel: string, userName: string) {
    this.context = {
      messages: [],
      topics: [],
      userPreferences: {
        level: userLevel,
        name: userName,
        responseStyle: 'multiple'
      }
    };
  }

  addMessage(role: 'user' | 'assistant', content: string, type: 'text' | 'audio') {
    this.context.messages.push({
      role,
      content,
      type,
      timestamp: new Date()
    });

    // Manter apenas últimas 10 mensagens para contexto
    if (this.context.messages.length > 10) {
      this.context.messages = this.context.messages.slice(-10);
    }
  }
}

// ✅ FUNÇÃO PARA OBTER RESPOSTA DO ASSISTANT API (EXISTENTE)
async function getAssistantResponse(
  userMessage: string,
  userLevel: string,
  userName: string,
  messageType: 'text' | 'audio' = 'text',
  pronunciationData?: any
): Promise<string> {
  try {
    console.log('🤖 Calling existing Assistant API...');

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
        messageType: messageType
      })
    });

    if (!response.ok) {
      throw new Error(`Assistant API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Assistant API failed');
    }

    console.log('✅ Assistant API response received');
    return data.result.feedback;

  } catch (error) {
    console.error('❌ Error calling Assistant API:', error);
    
    // Fallback baseado no nível
    const fallbackResponses = {
      'Novice': `Great job practicing, ${userName}! 😊 Keep writing in English - you're doing well!`,
      'Intermediate': `That's a good example, ${userName}! 👍 How would you use this in a business context?`,
      'Advanced': `Excellent language use, ${userName}! 🌟 Can you elaborate on that point further?`
    };

    return fallbackResponses[userLevel as keyof typeof fallbackResponses] || fallbackResponses['Intermediate'];
  }
}

// ✅ FUNÇÃO PARA DIVIDIR RESPOSTA EM MENSAGENS MÚLTIPLAS
function splitIntoMultipleMessages(response: string): string[] {
  // Tentar dividir por separadores comuns
  let messages = response.split(/(?:\n\n|\|\|\||\. {2,})/);
  
  // Se não dividiu bem, dividir por pontos finais
  if (messages.length < 2) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length >= 2) {
      // Agrupar em 2-3 mensagens
      const mid = Math.ceil(sentences.length / 2);
      messages = [
        sentences.slice(0, mid).join('. ') + (sentences.length > 1 ? '.' : ''),
        sentences.slice(mid).join('. ') + '.'
      ];
    } else {
      // Se muito curto, criar uma segunda mensagem
      messages = [
        response,
        "What else would you like to practice today? 😊"
      ];
    }
  }

  return messages.map(msg => msg.trim()).filter(msg => msg.length > 0);
}

// ✅ FUNÇÃO PARA ENVIAR MENSAGENS SEQUENCIAIS (KEYS CORRIGIDAS)
async function sendSequentialMessages(
  messages: string[],
  addMessageToChat: (message: any) => void,
  generateMessageId: (prefix: string) => string,
  delay: number = 1500
) {
  for (let i = 0; i < messages.length; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const messageData = {
      id: generateMessageId(`assistant-part-${i}`), // ✅ IDs únicos
      role: 'assistant' as const,
      content: messages[i],
      timestamp: new Date(),
      messageType: 'text' as const
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

  // ✅ CONTEXT MANAGER
  const [conversationContext] = useState(() => 
    new ConversationContextManager(
      user?.user_level || 'Intermediate',
      user?.name?.split(' ')[0] || 'Student'
    )
  );

  // ✅ CORRIGIDO: Generate unique message IDs
  const generateMessageId = useCallback((prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }, []);

  // Fix hydration issue
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isMounted) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router, isMounted]);

  // iOS PWA detection - only after mount
  useEffect(() => {
    if (!isMounted) return;
    
    const isIOSPWA = window.navigator.standalone === true || 
                     window.matchMedia('(display-mode: standalone)').matches;
    if (isIOSPWA) {
      document.body.classList.add('ios-pwa');
    }
  }, [isMounted]);

  // Initialize with welcome message and load XP - only after mount
  useEffect(() => {
    if (!isMounted || !user || messages.length > 0) return;
    
    const welcomeMessage: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: user.user_level === 'Novice' 
        ? `Olá ${user.name?.split(' ')[0]}! I'm Charlotte, your English assistant. You can write in Portuguese or English!`
        : `Hi ${user.name?.split(' ')[0]}! I'm Charlotte, ready to help you practice English. How can I assist you today?`,
      timestamp: new Date(),
      messageType: 'text'
    };
    setMessages([welcomeMessage]);

    // Load user XP stats
    loadUserStats();
  }, [user, messages.length, isMounted]);

  // ✅ Load user stats from Supabase
  const loadUserStats = async () => {
    if (!user?.entra_id || !supabaseService.isAvailable()) return;

    try {
      console.log('📊 Loading user stats for:', user.entra_id);
      
      const stats = await supabaseService.getUserStats(user.entra_id);
      if (stats) {
        console.log('📈 Total XP from DB:', stats.total_xp);
        setTotalXP(stats.total_xp);
      }

      // ✅ Buscar XP real de hoje
      const todayXP = await supabaseService.getTodaySessionXP(user.entra_id);
      console.log('🗓️ Today XP from DB:', todayXP);
      setSessionXP(todayXP);

    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Show loading until mounted and auth is resolved
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

  // ✅ FUNÇÃO PARA TEXTO COM ASSISTANT API EXISTENTE
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

    // Adicionar ao contexto
    conversationContext.addMessage('user', userText, 'text');

    try {
      console.log('📝 Processing text message with Assistant API:', userText);
      
      // ✅ CHAMAR ASSISTANT API EXISTENTE
      const assistantResponse = await getAssistantResponse(
        userText,
        user?.user_level || 'Intermediate',
        user?.name?.split(' ')[0] || 'Student',
        'text'
      );

      console.log('🤖 Assistant API response received');

      // ✅ DIVIDIR EM MÚLTIPLAS MENSAGENS
      const aiMessages = splitIntoMultipleMessages(assistantResponse);
      console.log('📝 Split into', aiMessages.length, 'messages');

      // ✅ ENVIAR MENSAGENS SEQUENCIAIS
      await sendSequentialMessages(
        aiMessages,
        (msg) => setMessages(prev => [...prev, msg]),
        generateMessageId,
        1200 // 1.2s entre mensagens
      );

      // Adicionar respostas ao contexto
      aiMessages.forEach(msg => 
        conversationContext.addMessage('assistant', msg, 'text')
      );

      // ✅ Salvar no Supabase e recarregar dados
      if (supabaseService.isAvailable() && user?.entra_id) {
        console.log('💾 Saving text practice...');
        await supabaseService.saveAudioPractice({
          user_id: user.entra_id,
          transcription: userText,
          accuracy_score: null,
          fluency_score: null,
          completeness_score: null,
          pronunciation_score: null,
          xp_awarded: 15,
          practice_type: 'text_message',
          audio_duration: 0,
          feedback: assistantResponse
        });
        
        // ✅ RECARREGAR dados do DB após salvar
        await loadUserStats();
      }

    } catch (error) {
      console.error('❌ Error processing text message:', error);
      
      // Fallback message
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

  // 🎯 FUNÇÃO CORRIGIDA: handleAudioWithAssistantAPI com RETRY LOGIC
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
      console.log('🎤 Starting audio processing with RETRY LOGIC...');
      
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
        
        // 🎯 CALCULAR XP COM RETRY LOGIC
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
        
        // 🔄 VERIFICAR SE PRECISA REPETIR
        if (xpResult.shouldRetry) {
          console.log('❌ Audio needs retry:', xpResult.retryReason);
          
          // 📝 MENSAGEM DE RETRY (não salvar no banco)
          const retryMessage: Message = {
            id: generateMessageId('assistant-retry'),
            role: 'assistant',
            content: xpResult.feedback,
            timestamp: new Date(),
            messageType: 'text'
          };
          
          setMessages(prev => [...prev, retryMessage]);
          
          // ⚡ PROMPT VISUAL PARA TENTAR NOVAMENTE
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
          
          return; // ⚠️ PARAR AQUI - NÃO SALVAR NO BANCO
        }
        
        // ✅ ÁUDIO VÁLIDO - CONTINUAR NORMALMENTE
        console.log('🎯 VALID AUDIO - XP calculated:', {
          oldMethod: `${scores.pronunciationScore >= 80 ? 75 : 50} XP (fixed)`,
          newMethod: `${xpResult.totalXP} XP (intelligent)`,
          scoreBreakdown: xpResult.scoreBreakdown,
          pronunciationScore: scores.pronunciationScore
        });
        
        // Adicionar ao contexto
        conversationContext.addMessage('user', transcription, 'audio');
        
        // ✅ CHAMAR ASSISTANT API COM DADOS DE PRONÚNCIA
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
          }
        );

        console.log('🤖 Assistant API audio response received');

        // ✅ DIVIDIR EM MÚLTIPLAS MENSAGENS
        const aiMessages = splitIntoMultipleMessages(assistantResponse);
        console.log('📝 Split audio response into', aiMessages.length, 'messages');

        // ✅ ENVIAR MENSAGENS SEQUENCIAIS
        await sendSequentialMessages(
          aiMessages,
          (msg) => setMessages(prev => [...prev, msg]),
          generateMessageId,
          1500
        );

        // Adicionar ao contexto
        aiMessages.forEach(msg => 
          conversationContext.addMessage('assistant', msg, 'text')
        );

        // 🎯 SALVAR NO SUPABASE COM XP INTELIGENTE (apenas áudio válido)
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
            xp_awarded: xpResult.totalXP, // 🎯 XP INTELIGENTE!
            practice_type: 'audio_message',
            audio_duration: duration,
            feedback: `${assistantResponse}\n\n${xpResult.feedback}`
          });
          
          // ✅ RECARREGAR dados do DB após salvar
          await loadUserStats();
          
          console.log('✅ Valid audio practice saved with intelligent XP successfully!');
        }
        
        // 🎉 Feedback visual do XP ganho
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
      {/* WhatsApp-style Header */}
      <header className="flex-shrink-0 bg-secondary/95 backdrop-blur-md border-b border-white/10 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Charlotte Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg relative">
              <span className="text-black text-lg font-bold">C</span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-semibold text-base">Charlotte</h1>
              <p className="text-green-400 text-xs font-medium">online</p>
            </div>
          </div>
          
          {/* User Info + XP Counter + Logout */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* ✅ XP Counter com userId corrigido */}
            <XPCounter 
              sessionXP={sessionXP}
              totalXP={totalXP}
              userId={user?.entra_id}
              onXPGained={(amount) => console.log('XP animation completed:', amount)}
            />
            
            {/* User Info */}
            <div className="text-right">
              <p className="text-white text-sm font-medium truncate max-w-20">
                {user?.name?.split(' ')[0]}
              </p>
              <span className="inline-block text-black text-xs px-2 py-0.5 bg-primary rounded-full font-semibold">
                {user?.user_level}
              </span>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ChatBox Component */}
      <ChatBox
        messages={messages}
        transcript={transcript}
        finalTranscript={finalTranscript}
        isProcessingMessage={isProcessingMessage}
        userLevel={user?.user_level || 'Novice'}
      />

      {/* Input Area */}
      <div className="flex-shrink-0 bg-secondary pb-safe">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            {/* Main Input Container */}
            <div className="flex-1 relative">
              <div className="flex items-end bg-charcoal/60 backdrop-blur-sm border border-white/10 rounded-3xl focus-within:border-primary/30 transition-colors">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything..."
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-white/50 px-4 py-3 pr-2 focus:outline-none resize-none max-h-32 text-sm"
                  style={{ minHeight: '44px' }}
                />
                
               {/* Right side buttons */}
               <div className="flex items-center space-x-1 pr-2">
                  {!message.trim() && (
                    <>
                      <AudioPlayer
                        onSendAudio={handleAudioWithAssistantAPI}
                        userLevel={user?.user_level || 'Novice'}
                      />
                      
                      {/* Camera button - Mobile only */}
                      {(typeof window !== 'undefined' && 
                        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         window.innerWidth <= 768)) && (
                        <button 
                          onClick={() => setIsCameraOpen(true)}
                          className="p-2 text-white/60 hover:text-primary transition-colors rounded-full hover:bg-white/5"
                          title="Take photo"
                        >
                          <Camera size={18} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Send button - appears when typing */}
              {message.trim() && (
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 bottom-2 p-2 bg-primary hover:bg-primary-dark rounded-full transition-all active:scale-95"
                >
                  <Send size={16} className="text-black" />
                </button>
              )}
            </div>

            {/* Live Conversation Button */}
            <button 
              onClick={() => setIsLiveVoiceOpen(true)}
              className="p-3 bg-charcoal/60 hover:bg-charcoal text-primary hover:text-primary-dark rounded-full transition-colors flex-shrink-0 border border-white/10"
              title="Start Live Conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M8 6v12M16 6v12M4 10v4M20 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        userLevel={user?.user_level || 'Novice'}
      />
      
      {/* Camera Capture Modal */}
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