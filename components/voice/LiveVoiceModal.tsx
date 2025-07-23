'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX, Settings, LogOut, MessageSquare, MessageSquareOff } from 'lucide-react';
import { OpenAIRealtimeService, RealtimeConfig } from '../../lib/openai-realtime';
import { useVoiceActivityDetection } from '../../hooks/useVoiceActivityDetection';
import RealtimeOrb from './RealtimeOrb';
import EnhancedXPCounter from '../ui/EnhancedXPCounter';
import CharlotteAvatar from '../ui/CharlotteAvatar';
import { supabaseService } from '../../lib/supabase-service';
import { useOnboarding } from '../../hooks/useOnboarding';
import { calculateUniversalAchievements } from '../../lib/universal-achievement-service';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName?: string;
  user?: {
    name?: string;
    entra_id?: string;
    user_level?: string;
  };
  sessionXP?: number;
  totalXP?: number;
  onLogout?: () => void;
  onXPGained?: (amount: number) => void;
  demoMode?: boolean; // 🎭 NOVO: Modo demo para onboarding
  conversationContext?: any; // 🧠 NOVO: Contexto conversacional unificado
}

const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  userLevel,
  userName,
  user,
  sessionXP,
  totalXP,
  onLogout,
  onXPGained,
  demoMode,
  conversationContext
}) => {
  // Estados principais
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [useRealtimeAPI, setUseRealtimeAPI] = useState(true); // Ativado por padrão
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🆕 NOVO: Estados para transcrição da Charlotte (ChatGPT-like)
  const [showTranscriptions, setShowTranscriptions] = useState(false);
  const [charlotteCurrentResponse, setCharlotteCurrentResponse] = useState('');
  const [charlotteLastResponse, setCharlotteLastResponse] = useState('');
  const [userLastTranscript, setUserLastTranscript] = useState('');

  // 🆕 NOVO: Estado para histórico completo da conversa
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'charlotte';
    content: string;
    timestamp: Date;
  }>>([]);

  // 🆕 Estados para tracking de XP por tempo de conversa
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null);
  const [totalConversationTime, setTotalConversationTime] = useState(0);
  const [lastXPUpdate, setLastXPUpdate] = useState<Date | null>(null);
  const [xpAlreadyAwarded, setXpAlreadyAwarded] = useState(false);

  // Hook VAD para análise de áudio real
  const { volume, audioLevels: vadAudioLevels, start: startVAD, stop: stopVAD } = useVoiceActivityDetection();

  // Refs
  const realtimeServiceRef = useRef<OpenAIRealtimeService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  // 📝 NOVO: Refs para auto-scroll
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const charlotteMessageRef = useRef<HTMLDivElement>(null);

  // Usar dados VAD quando disponíveis, senão fallback para mock
  const effectiveAudioLevels = vadAudioLevels.length > 0 ? vadAudioLevels : audioLevels;

  // 🎤 Iniciar tracking de conversa
  const startConversationTracking = useCallback(() => {
    const now = new Date();
    setConversationStartTime(now);
    setLastXPUpdate(now);
    setXpAlreadyAwarded(false); // 🔧 Reset XP flag for new conversation
    console.log('🎤 Started conversation tracking at:', now.toISOString());
  }, []);

  // 🔧 REBALANCEADO: XP muito menor para Live Voice - máximo 40 XP total
  const calculateFinalXP = useCallback((totalSeconds: number, userLevel: string): number => {
    const durationMinutes = totalSeconds / 60;
    
    // 🎯 TAXAS REBALANCEADAS - Máximo 40 XP total
    const baseXPPerMinute = {
      'Novice': 8,        // 8 XP por minuto
      'Inter': 5,  // 5 XP por minuto  
      'Advanced': 3       // 3 XP por minuto
    };
    
    // Calcular XP base
    const baseXP = Math.floor(durationMinutes * baseXPPerMinute[userLevel as keyof typeof baseXPPerMinute]);
    
    // Bônus por duração da conversa (muito reduzidos)
    let durationBonus = 0;
    if (durationMinutes >= 15) durationBonus = 15;      // 15+ minutos - bônus pequeno
    else if (durationMinutes >= 10) durationBonus = 10; // 10+ minutos - bônus pequeno
    else if (durationMinutes >= 5) durationBonus = 5;   // 5+ minutos - bônus mínimo
    else if (durationMinutes >= 2) durationBonus = 2;   // 2+ minutos - bônus mínimo
    
    // Sem bônus por nível - manter simples
    const finalXP = Math.max(3, Math.min(40, baseXP + durationBonus)); // Entre 3-40 XP
    
    console.log('🎤 Live voice XP calculated (REBALANCED):', {
      duration: `${durationMinutes.toFixed(1)} minutes`,
      rate: `${baseXPPerMinute[userLevel as keyof typeof baseXPPerMinute]} XP/min`,
      baseXP,
      durationBonus,
      finalXP,
      userLevel
    });
    
    return finalXP;
  }, []);

  const stopConversationTracking = useCallback(async () => {
    if (!conversationStartTime || !user?.entra_id || xpAlreadyAwarded) {
      console.log('🎤 Skipping XP award - already awarded or no conversation data');
      return;
    }

    // 🔧 Mark XP as awarded to prevent multiple calls
    setXpAlreadyAwarded(true);

    try {
      const endTime = new Date();
      const totalSeconds = Math.floor((endTime.getTime() - conversationStartTime.getTime()) / 1000);
      const durationMinutes = totalSeconds / 60;
      
      console.log('🎤 Stopping live voice conversation:', {
        duration: `${durationMinutes.toFixed(1)} minutes`,
        totalSeconds,
        userLevel
      });
      
      // 🎯 USAR NOVA FUNÇÃO REBALANCEADA
      const finalXP = calculateFinalXP(totalSeconds, userLevel);
      
      // Salvar no banco de dados
      if (supabaseService.isAvailable()) {
        console.log('🚀 Starting Live Voice achievement calculation...');
        
        // 🏆 Calcular achievements para Live Voice
        const practiceData = {
          user_id: user.entra_id,
          type: 'live_voice' as const,
          text: `Live voice conversation completed (${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s)`,
          userLevel: userLevel,
          xp_awarded: finalXP,
          audio_duration: totalSeconds,
          session_date: new Date().toISOString().split('T')[0],
          streakDays: 0 // Will be calculated by the service
        };

        const achievementResult = calculateUniversalAchievements(practiceData);
        const liveAchievements = achievementResult.achievements;
        const achievementBonusXP = achievementResult.totalBonusXP;

        console.log('🏆 Live Voice achievements calculated:', {
          achievementsEarned: liveAchievements.length,
          bonusXP: achievementBonusXP,
          achievements: liveAchievements.map(a => a.title)
        });

        await supabaseService.saveAudioPractice({
          user_id: user.entra_id,
          transcription: `Live voice conversation completed (${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s)`,
          accuracy_score: null,
          fluency_score: null,
          completeness_score: null,
          pronunciation_score: null,
          feedback: `Great conversation! You practiced English for ${durationMinutes.toFixed(1)} minutes. (+${finalXP + achievementBonusXP} XP)`,
          xp_awarded: finalXP + achievementBonusXP,
          practice_type: 'live_voice',
          audio_duration: totalSeconds,
          achievement_ids: liveAchievements.map(a => a.id),
          surprise_bonus: 0,
          base_xp: finalXP,
          bonus_xp: achievementBonusXP
        });

        // 🏆 Salvar achievements se houver
        if (liveAchievements.length > 0) {
          try {
            console.log('🚀 Saving Live Voice achievements via API...');
            
            const response = await fetch('/api/achievements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.entra_id,
                achievements: liveAchievements
              })
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || 'Failed to save achievements');
            }

            console.log('✅ Live Voice achievements saved successfully!');
          } catch (error) {
            console.warn('⚠️ Failed to save Live Voice achievements:', error);
          }
        }

        console.log('✅ Live voice practice saved with achievements XP:', finalXP + achievementBonusXP);
        
        // Callback para atualizar XP na UI (incluindo bônus de achievements)
        onXPGained?.(finalXP + achievementBonusXP);
      }

    } catch (error) {
      console.error('❌ Error saving live voice practice:', error);
    }
  }, [conversationStartTime, user?.entra_id, userLevel, onXPGained, calculateFinalXP, xpAlreadyAwarded]);

  // 🎤 XP incremental a cada minuto de conversa - REMOVIDO PARA EVITAR BUG
  const updateIncrementalXP = useCallback(async () => {
    // DESABILITADO: Estava causando centenas de milhares de XP
    // Agora só damos XP no final da conversa
    return;
  }, []);

  // 🧹 Limpeza de recursos
  const cleanup = useCallback(() => {
    // 🎤 Parar tracking e calcular XP final antes da limpeza (apenas se ainda não foi feito)
    if (conversationStartTime && user?.entra_id && !xpAlreadyAwarded) {
      stopConversationTracking();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (realtimeServiceRef.current) {
      // 🔧 NOVO: Limpar todos os event listeners antes de desconectar
      console.log('🧹 Cleaning up Realtime service and event listeners...');
      
      // Remover todos os listeners para evitar vazamentos
      const service = realtimeServiceRef.current;
      service.off('session_created', () => {});
      service.off('user_speech_started', () => {});
      service.off('user_speech_stopped', () => {});
      service.off('response_created', () => {});
      service.off('transcript_delta', () => {});
      service.off('response_done', () => {});
      service.off('text_delta', () => {});
      service.off('text_done', () => {});
      service.off('audio_done', () => {});
      service.off('input_transcription_completed', () => {});
      service.off('input_transcription_failed', () => {});
      service.off('function_call_arguments_delta', () => {});
      service.off('function_call_arguments_done', () => {});
      service.off('conversation_item_created', () => {});
      service.off('error', () => {});
      service.off('disconnected', () => {});
      // 📝 NOVO: Limpar listeners de transcrição da Charlotte
      service.off('charlotte_transcript_delta', () => {});
      service.off('charlotte_transcript_completed', () => {});
      
      service.disconnect();
      realtimeServiceRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevels([]);
    setConnectionStatus('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setCurrentTranscript('');
    
    // 📝 NOVO: Limpar estados de transcrição e histórico
    setCharlotteCurrentResponse('');
    setCharlotteLastResponse('');
    setUserLastTranscript('');
    setConversationHistory([]);
    
    // 🎤 Reset tracking states
    setConversationStartTime(null);
    setTotalConversationTime(0);
    setLastXPUpdate(null);
    setXpAlreadyAwarded(false); // 🔧 Reset XP flag
  }, [conversationStartTime, user?.entra_id, xpAlreadyAwarded, stopConversationTracking]);

  // 🎤 Efeito para XP incremental
  useEffect(() => {
    if (connectionStatus === 'connected' && conversationStartTime) {
      // 🔧 CORRIGIDO: Verificar a cada 2 minutos (120 segundos) em vez de 30 segundos
      const interval = setInterval(() => {
        updateIncrementalXP();
      }, 120000); // 2 minutos

      return () => clearInterval(interval);
    }
  }, [connectionStatus, conversationStartTime]); // 🔧 FIXO: Remover updateIncrementalXP das dependências

  // 🔄 Efeito principal do modal
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      stopVAD();
      return;
    }

    // 🎭 NOVO: Modo demo - não conectar API, apenas simular estados
    if (demoMode) {
      // 🔧 CORRIGIDO: Limpar histórico primeiro para evitar duplicatas
      setConversationHistory([]);
      setCharlotteCurrentResponse('');
      setCharlotteLastResponse('');
      setUserLastTranscript('');
      
      setConnectionStatus('connected');
      setIsListening(true);
      setIsSpeaking(false);
      setShowTranscriptions(true); // Mostrar transcrições por padrão no demo
      
      // 🔧 CORRIGIDO: Usar timeouts únicos e limpar anteriores
      const demoTimeouts: NodeJS.Timeout[] = [];
      
      // Simular conversa demo com delays
      demoTimeouts.push(setTimeout(() => {
        addUserMessage('Hello Charlotte, how are you?');
      }, 1000));
      
      demoTimeouts.push(setTimeout(() => {
        setIsSpeaking(true);
        setIsListening(false);
        setCharlotteCurrentResponse('Hello! I\'m doing great, thank you for asking. How can I help you practice English today?');
      }, 2000));
      
      demoTimeouts.push(setTimeout(() => {
        addCharlotteMessage('Hello! I\'m doing great, thank you for asking. How can I help you practice English today?');
        setCharlotteCurrentResponse('');
        setIsSpeaking(false);
        setIsListening(true);
      }, 4000));
      
      // 🔧 NOVO: Cleanup function para demo mode
      return () => {
        demoTimeouts.forEach(timeout => clearTimeout(timeout));
      };
    }

    // 🔧 NOVO: Verificar se já existe uma instância ativa
    if (realtimeServiceRef.current) {
      console.log('⚠️ Realtime service already exists, cleaning up first...');
      cleanup();
    }

    const initializeModal = async () => {
      setConnectionStatus('connecting');
      setErrorMessage('');
      
      try {
        console.log('🚀 Initializing new Realtime API instance...');
        await initializeRealtimeAPI();
        await startVAD();
      } catch (error) {
        console.error('❌ Failed to initialize Realtime API:', error);
        setConnectionStatus('error');
      }
    };

    initializeModal();

    // Cleanup quando o modal fechar
    return () => {
      console.log('🧹 Modal effect cleanup triggered...');
      cleanup();
      stopVAD();
    };
  }, [isOpen, demoMode]); // 🔧 NOVO: Adicionar demoMode como dependência

  // 🔄 Efeito para análise de áudio (apenas para visualização)
  useEffect(() => {
    if (connectionStatus === 'connected') {
      if (analyserRef.current) {
        startAudioAnalysis();
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connectionStatus]); // 🔧 FIXO: Remover startAudioAnalysis das dependências

  // 🔇 Toggle mute
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    console.log('🔇 Toggling mute:', { from: isMuted, to: newMutedState });
    
    // Controlar o stream de mídia local (microfone)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
        console.log('🎤 Audio track enabled:', track.enabled);
      });
    }
    
    // Controlar o volume de saída da Charlotte via audioContext
    if (realtimeServiceRef.current && (realtimeServiceRef.current as any).audioGainNode) {
      try {
        const gainNode = (realtimeServiceRef.current as any).audioGainNode;
        if (newMutedState) {
          // Mutar: volume 0
          console.log('🔇 Muting Charlotte audio output');
          gainNode.gain.setValueAtTime(0, gainNode.context.currentTime);
        } else {
          // Desmutar: volume normal
          console.log('🔊 Unmuting Charlotte audio output');
          gainNode.gain.setValueAtTime(1.0, gainNode.context.currentTime);
        }
      } catch (error) {
        console.error('❌ Error controlling audio gain:', error);
      }
    }
    
    // Também parar/iniciar gravação se possível
    if (realtimeServiceRef.current) {
      try {
        if (newMutedState) {
          // Parar gravação quando mutado
          console.log('🔇 Stopping audio recording');
          (realtimeServiceRef.current as any).isRecording = false;
        } else {
          // Retomar gravação quando desmutado
          console.log('🔊 Resuming audio recording');
          (realtimeServiceRef.current as any).isRecording = true;
        }
      } catch (error) {
        console.error('❌ Error controlling recording:', error);
      }
    }
  };

  // 🔄 Toggle API mode
  const toggleAPIMode = () => {
    console.log('API mode toggle disabled - always using Realtime API');
  };

  // 📝 NOVO: Toggle transcrições
  const toggleTranscriptions = () => {
    const newShowTranscriptions = !showTranscriptions;
    setShowTranscriptions(newShowTranscriptions);
    console.log('🔄 Transcriptions toggled:', newShowTranscriptions);
  };

  // 📝 NOVO: Funções para gerenciar histórico da conversa
  const addUserMessage = useCallback((content: string) => {
    const message = {
      type: 'user' as const,
      content,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, message]);
    setUserLastTranscript(content);
    console.log('💬 User message added to history:', content);
  }, []);

  const addCharlotteMessage = useCallback((content: string) => {
    const message = {
      type: 'charlotte' as const,
      content,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, message]);
    setCharlotteLastResponse(content);
    console.log('💬 Charlotte message added to history:', content);
  }, []);

  const updateCharlotteCurrentMessage = useCallback((content: string) => {
    setCharlotteCurrentResponse(content);
  }, []);

  // 📝 NOVO: Auto-scroll para o final quando Charlotte estiver falando
  const scrollToBottom = useCallback(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
    if (charlotteMessageRef.current) {
      charlotteMessageRef.current.scrollTop = charlotteMessageRef.current.scrollHeight;
    }
  }, []);

  // 📝 ATUALIZADO: Auto-scroll mais agressivo
  const scrollToBottomAggressive = useCallback(() => {
    // Scroll imediato sem delay
    scrollToBottom();
    
    // Scroll adicional após pequeno delay para garantir
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  }, [scrollToBottom]);

  // 📝 NOVO: Effect para auto-scroll mais agressivo baseado no tamanho do conteúdo
  useEffect(() => {
    if (charlotteCurrentResponse && showTranscriptions) {
      const responseLength = charlotteCurrentResponse.length;
      const lineBreaks = (charlotteCurrentResponse.match(/\n/g) || []).length;
      
      // Trigger scroll em várias condições:
      // 1. A cada 50 caracteres (aproximadamente 2 linhas)
      // 2. A cada quebra de linha
      // 3. A cada 100ms durante a resposta
      if (responseLength > 50 || lineBreaks > 0) {
        scrollToBottomAggressive();
      }
    }
  }, [charlotteCurrentResponse, showTranscriptions, scrollToBottomAggressive]);

  // 📝 NOVO: Auto-scroll contínuo durante a resposta da Charlotte
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    
    if (charlotteCurrentResponse && showTranscriptions && isSpeaking) {
      // Scroll a cada 200ms durante a resposta
      scrollInterval = setInterval(() => {
        scrollToBottomAggressive();
      }, 200);
    }
    
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [charlotteCurrentResponse, showTranscriptions, isSpeaking, scrollToBottomAggressive]);

  // 🚪 Fechar modal
  const handleClose = () => {
    cleanup();
    onClose();
  };

  // ⏹️ Interromper resposta
  const interruptResponse = () => {
    console.log('🛑 [INTERRUPT DEBUG] Manual interrupt button clicked');
    console.log('🛑 [INTERRUPT DEBUG] Current state:', { 
      hasService: !!realtimeServiceRef.current, 
      isSpeaking, 
      isListening 
    });
    
    if (realtimeServiceRef.current && isSpeaking) {
      console.log('🛑 [INTERRUPT DEBUG] Calling service.interruptResponse()');
      realtimeServiceRef.current.interruptResponse();
      setIsSpeaking(false);
      setIsListening(true);
      console.log('🛑 [INTERRUPT DEBUG] State updated after interrupt');
    } else {
      console.log('🛑 [INTERRUPT DEBUG] Cannot interrupt - missing service or not speaking');
    }
  };

  // 🔊 Função para tocar som de conexão
  const playConnectionSound = useCallback(() => {
    try {
      // Criar contexto de áudio se não existir
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar um som de "ding" suave e agradável
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Conectar oscillator -> gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som - duas notas para um "ding" mais musical
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Nota principal
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1); // Harmônico
      
      // Envelope de volume para um som suave
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05); // Fade in rápido
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4); // Fade out suave
      
      // Tocar o som
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
      
      console.log('🔊 Connection sound played');
      
      // Cleanup
      setTimeout(() => {
        try {
          audioContext.close();
        } catch (e) {
          // Ignorar erros de cleanup
        }
      }, 500);
      
    } catch (error) {
      console.warn('⚠️ Could not play connection sound:', error);
      // Falhar silenciosamente - som é opcional
    }
  }, []);

  // 🔗 Inicializar OpenAI Realtime API
  const initializeRealtimeAPI = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      const config: RealtimeConfig = {
        apiKey: '', // Será obtida via API route segura
        voice: 'alloy',
        userLevel, // 🔧 NOVO: Passar nível do usuário para configuração de VAD
        userName, // 🎯 NOVO: Passar nome do usuário para personalização
        onMessage: (message) => console.log('Realtime message:', message),
        onError: (error) => {
          console.error('Realtime error:', error);
          // 🔧 ANDROID FIX: Melhorar instruções para microfone bloqueado
          if (error.message?.includes('Microfone não encontrado')) {
            alert('❌ Microfone não encontrado!\n\nVerifique se há um microfone conectado ao seu dispositivo e tente novamente.');
          } else if (error.message?.includes('Permissão negada')) {
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isChrome = /Chrome/i.test(navigator.userAgent);
            
            let instructions = '❌ Permissão de microfone negada!\n\n';
            
            if (isAndroid) {
              instructions += '📱 ANDROID - Como habilitar:\n';
              instructions += '1. Toque no ícone 🔒 ou ⓘ na barra de endereços\n';
              instructions += '2. Toque em "Permissões do site"\n';
              instructions += '3. Encontre "Microfone" e altere para "Permitir"\n';
              instructions += '4. Recarregue a página\n\n';
              instructions += 'OU:\n';
              instructions += '1. Vá em Configurações do Chrome\n';
              instructions += '2. Toque em "Configurações do site"\n';
              instructions += '3. Toque em "Microfone"\n';
              instructions += '4. Encontre este site e permita o acesso';
            } else {
              instructions += '🖥️ DESKTOP - Como habilitar:\n';
              instructions += '1. Clique no ícone do microfone na barra de endereços\n';
              instructions += '2. Selecione "Sempre permitir"\n';
              instructions += '3. Recarregue a página';
            }
            
            alert(instructions);
          } else if (error.message?.includes('sendo usado por outro aplicativo')) {
            alert('❌ Microfone ocupado!\n\nO microfone está sendo usado por outro aplicativo. Feche outros programas que possam estar usando o microfone e tente novamente.');
          }
        },
        onConnectionChange: (connected) => {
          console.log('Connection changed:', connected);
          setConnectionStatus(connected ? 'connected' : 'disconnected');
        },
        onVADStateChange: (listening) => {
          console.log('VAD state changed:', listening);
          setIsListening(listening);
        }
      };

      const service = new OpenAIRealtimeService(config);
      realtimeServiceRef.current = service;

      // 👶 NOVO: Configurar especificamente para Novice Live Voice
      if (userLevel === 'Novice') {
        console.log('👶 [NOVICE LIVE] Starting Novice-specific configuration...');
        try {
          service.configureForNoviceLiveVoice();
          console.log('👶 [NOVICE LIVE] ✅ Applied Novice-specific Live Voice configuration successfully');
        } catch (configError) {
          console.error('👶 [NOVICE LIVE] ❌ Error in Novice configuration:', configError);
          // Continuar com configuração padrão se der erro
        }
      }
      // 🎯 NOVO: Configurar especificamente para Inter Live Voice
      else if (userLevel === 'Inter') {
        service.configureForInterLiveVoice();
        console.log('🎯 [INTER LIVE] Applied Inter-specific Live Voice configuration');
      }
      // 🎓 NOVO: Configurar especificamente para Advanced Live Voice
      else if (userLevel === 'Advanced') {
        service.configureForAdvancedLiveVoice();
        console.log('🎓 [ADVANCED LIVE] Applied Advanced-specific Live Voice configuration');
      }

      // 🧠 NOVO: Função para adicionar contexto conversacional após conexão
      const addConversationContext = (service: OpenAIRealtimeService) => {
        if (conversationContext) {
          try {
            // Debug: Verificar mensagens no contexto
            const recentMessages = conversationContext.getRecentMessages(5);
            console.log('🧠 [CONTEXT DEBUG] Recent messages in context:', recentMessages);
            console.log('🧠 [CONTEXT DEBUG] Context stats:', conversationContext.getEnhancedStats());
            
            const contextPrompt = conversationContext.generateContextForAssistant();
            console.log('🧠 [CONTEXT] Adding conversation context to Live Voice:', {
              hasContext: !!contextPrompt,
              contextLength: contextPrompt?.length || 0,
              contextPreview: contextPrompt?.substring(0, 200) + '...'
            });
            console.log('🧠 [CONTEXT] Full context being sent:', contextPrompt);
            
            // Adicionar contexto como instrução inicial
            if (contextPrompt) {
              service.addContextualInstructions(contextPrompt);
            }
          } catch (error) {
            console.error('❌ Error adding conversation context:', error);
          }
        }
      };

      // 🧠 NOVO: Função para enviar saudação inicial contextual
      const sendInitialGreeting = (service: OpenAIRealtimeService) => {
        try {
          let greetingMessage = '';
          
          if (conversationContext) {
            const shouldGreet = conversationContext.shouldGreet();
            const hasRecentMessages = conversationContext.getRecentMessages(3).length > 0;
            
            if (shouldGreet || !hasRecentMessages) {
              // Primeira conversa ou sem mensagens recentes
              greetingMessage = userLevel === 'Novice' 
                ? "Hi! I'm Charlotte. What would you like to talk about?"
                : `Hi ${userName || 'there'}! I'm Charlotte, ready to practice English with you. What's on your mind?`;
            } else {
              // Continuação de conversa
              const recentMessages = conversationContext.getRecentMessages(2);
                             const lastTopic = recentMessages.find((m: any) => m.role === 'user')?.content;
              
              if (lastTopic && lastTopic.length > 10) {
                greetingMessage = userLevel === 'Novice'
                  ? "Hi again! How are you today?"
                  : `Welcome back! Earlier we were talking about ${lastTopic.substring(0, 30)}... How has your day been?`;
              } else {
                greetingMessage = userLevel === 'Novice'
                  ? "Hi! What do you want to talk about?"
                  : "Hi again! What would you like to practice today?";
              }
            }
          } else {
            // Sem contexto - saudação padrão
            greetingMessage = userLevel === 'Novice'
              ? "Hi! I'm Charlotte. What would you like to talk about?"
              : `Hi ${userName || 'there'}! Ready to practice English?`;
          }
          
          console.log('🧠 [INITIAL GREETING] Sending:', greetingMessage);
          
          // 🔧 SOLUÇÃO DEFINITIVA: Instrução + forçar resposta para Charlotte falar primeiro
          const startupInstruction = `
🎯 START THE CONVERSATION IMMEDIATELY:
Begin by saying exactly: "${greetingMessage}"

This is your opening greeting to initiate our conversation.
After this greeting, wait for the user's response and continue naturally.`;
          
          console.log('🧠 [GREETING FIX] Adding startup instruction + forcing response');
          service.addContextualInstructions(startupInstruction);
          
          // 🎯 CRÍTICO: Forçar Charlotte a falar com createResponse()
          setTimeout(() => {
            console.log('🧠 [GREETING FIX] Forcing Charlotte to speak first');
            service.createResponse();
          }, 100); // Pequeno delay para garantir que instruções foram processadas
          
          // Marcar como cumprimentado se aplicável
          if (conversationContext) {
            conversationContext.markGreetingDone();
          }
          
        } catch (error) {
          console.error('❌ Error sending initial greeting:', error);
        }
      };

      // Event listeners
      service.on('session_created', () => {
        console.log('✅ Realtime session created');
        setConnectionStatus('connected');
        setIsListening(true);
        // 🎤 Iniciar tracking de conversa quando conectar
        startConversationTracking();
        // 🔊 Tocar som de conexão
        playConnectionSound();
        
        // 🧠 NOVO: Adicionar contexto conversacional após conexão estabelecida
        setTimeout(() => {
          addConversationContext(service);
        }, 500); // Pequeno delay para garantir que a sessão está pronta
        
        // 🧠 NOVO: Enviar mensagem inicial contextual
        setTimeout(() => {
          sendInitialGreeting(service);
        }, 1000); // Pequeno delay para garantir que tudo está configurado
      });

      service.on('user_speech_started', () => {
        console.log('🎤 [INTERRUPT DEBUG] User started speaking - service will handle interrupt if needed');
        console.log('🎤 [INTERRUPT DEBUG] Current state:', { isListening, isSpeaking });
        setIsListening(true);
        setIsSpeaking(false);
        
        // 🔧 REMOVIDO: Não precisamos mais forçar interrupção aqui
        // O serviço já faz isso de forma inteligente baseado no estado real
        // if (isSpeaking) {
        //   console.log('🛑 [INTERRUPT DEBUG] Force interrupting Charlotte via VAD');
        //   service.interruptResponse();
        // }
      });

      service.on('user_speech_stopped', () => {
        console.log('🔇 [INTERRUPT DEBUG] User stopped speaking');
        console.log('🔇 [INTERRUPT DEBUG] Current state:', { isListening, isSpeaking });
        setIsListening(false);
      });

      // 🔧 CORRIGIDO: Processar transcrição do usuário ANTES da resposta da Charlotte
      service.on('input_transcription_completed', (event: any) => {
        console.log('📝 [ORDER FIX] User speech transcribed FIRST:', event.transcript);
        
        // 🔧 FILTRO ANTI-RUÍDO MELHORADO: Validar transcrição para TODOS os níveis
        if (event.transcript) {
          const cleanTranscript = event.transcript.trim();
          
          // 🔧 FILTRO 1: Ignore transcrições muito curtas ou vazias
          if (cleanTranscript.length < 2) {
            console.log('🔧 [ANTI-NOISE] Ignoring short/empty transcript:', {
              userLevel,
              original: event.transcript,
              cleaned: cleanTranscript,
              length: cleanTranscript.length
            });
            return;
          }
          
          // 🔧 FILTRO 2: Ignore transcrições que são apenas ruídos comuns
          const noisePatterns = ['shhh', 'shh', 'sh', 'hm', 'hmm', 'uh', 'um', 'ah', 'oh', 'mm', 'mhm', 'er', 'uhm'];
          if (noisePatterns.includes(cleanTranscript.toLowerCase())) {
            console.log('🔧 [ANTI-NOISE] Ignoring noise pattern:', {
              userLevel,
              transcript: cleanTranscript,
              reason: 'vocal_noise'
            });
            return;
          }
          
          // 🔧 FILTRO 3: Ignore palavras isoladas muito comuns que podem ser ruído de fundo
          const commonNoiseWords = ['you', 'and', 'the', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'with', 'on', 'at'];
          if (commonNoiseWords.includes(cleanTranscript.toLowerCase())) {
            console.log('🔧 [ANTI-NOISE] Ignoring isolated common word (likely background noise):', {
              userLevel,
              transcript: cleanTranscript,
              reason: 'background_word'
            });
            return;
          }
          
          // 🔧 FILTRO 4 NOVO: Ignore fragmentos repetitivos que indicam eco ou feedback
          const repetitivePatterns = /^(.)\1{2,}$|^(..)\2{2,}$/; // "aaa", "lalala", etc
          if (repetitivePatterns.test(cleanTranscript.toLowerCase())) {
            console.log('🔧 [ANTI-NOISE] Ignoring repetitive pattern (likely echo/feedback):', {
              userLevel,
              transcript: cleanTranscript,
              reason: 'repetitive_pattern'
            });
            return;
          }
          
          // 🔧 FILTRO 5 NOVO: Para Novice, ignore fragmentos muito confusos
          if (userLevel === 'Novice') {
            const confusedFragments = /^[^aeiou\s]{3,}$|^\W+$/; // Só consoantes ou só símbolos
            if (confusedFragments.test(cleanTranscript.toLowerCase())) {
              console.log('🔧 [ANTI-NOISE] Ignoring confused fragment for Novice:', {
                userLevel,
                transcript: cleanTranscript,
                reason: 'novice_confused_fragment'
              });
              return;
            }
          }
          
          console.log('✅ [ANTI-NOISE] Valid transcript passed all filters:', {
            userLevel,
            transcript: cleanTranscript,
            length: cleanTranscript.length
          });
          
          // 📝 PRIORIDADE: Adicionar ao histórico IMEDIATAMENTE
          addUserMessage(cleanTranscript);
          setTranscript(`You: "${cleanTranscript}"`);
          console.log('📝 [ORDER FIX] User message added to history immediately');
          
          // 🧠 NOVO: Adicionar ao contexto conversacional unificado
          if (conversationContext) {
            try {
              conversationContext.addMessage('user', cleanTranscript, 'live_voice');
              console.log('🧠 [CONTEXT] User message added to unified context');
            } catch (error) {
              console.error('❌ Error adding user message to context:', error);
            }
          }
        }
      });

      service.on('input_transcription_failed', (event: any) => {
        console.log('❌ Transcription failed');
      });

      service.on('response_created', () => {
        console.log('🤖 [ORDER FIX] Assistant response created AFTER user transcription - Charlotte starts speaking');
        console.log('🤖 [INTERRUPT DEBUG] Current state:', { isListening, isSpeaking });
        
        // 🔧 ANTI-NOISE DEBUG: Verificar se Charlotte está respondendo sem input válido
        console.log('🤖 [ANTI-NOISE DEBUG] Charlotte creating response - checking if user actually said something meaningful');
        
        // 📝 NOVO: Pequeno delay para garantir que a mensagem do usuário foi processada
        setTimeout(() => {
        setIsSpeaking(true);
        setIsListening(false);
          // 📝 NOVO: Limpar resposta anterior da Charlotte
          setCharlotteCurrentResponse('');
          console.log('🤖 [ORDER FIX] Charlotte state updated after delay');
        }, 50); // 50ms delay para garantir ordem
      });

      // 📝 NOVO: Listeners para transcrição da Charlotte via áudio (eventos corretos)
      service.on('charlotte_transcript_delta', (event: any) => {
        if (event.delta) {
          console.log('📝 [CHARLOTTE TRANSCRIPT] Delta received:', event.delta);
          setCharlotteCurrentResponse(prev => {
            const newResponse = prev + event.delta;
            console.log('📝 [CHARLOTTE TRANSCRIPT] Updated response:', newResponse);
            return newResponse;
          });
        }
      });

      service.on('charlotte_transcript_completed', (event: any) => {
        console.log('✅ [CHARLOTTE TRANSCRIPT] Completed:', event.transcript);
        if (event.transcript) {
          console.log('📝 [ORDER FIX] Adding Charlotte message from transcript:', event.transcript);
          addCharlotteMessage(event.transcript);
          setCharlotteCurrentResponse('');
          
          // 🧠 NOVO: Adicionar resposta da Charlotte ao contexto unificado
          if (conversationContext) {
            try {
              conversationContext.addMessage('assistant', event.transcript, 'live_voice');
              console.log('🧠 [CONTEXT] Charlotte message added to unified context');
            } catch (error) {
              console.error('❌ Error adding Charlotte message to context:', error);
            }
          }
        }
      });

      service.on('transcript_delta', (event: any) => {
        if (event.delta) {
          setCurrentTranscript(prev => prev + event.delta);
        }
      });

      service.on('response_done', () => {
        console.log('✅ Response completed');
        setIsSpeaking(false);
        setIsListening(true);
        if (currentTranscript) {
          setTranscript(currentTranscript);
          setCurrentTranscript('');
        }
      });

      service.on('text_delta', (event: any) => {
        if (event.delta) {
          console.log('📝 [CHARLOTTE DEBUG] Text delta received:', event.delta);
          // 📝 ATUALIZADO: Usar setState diretamente
          setCharlotteCurrentResponse(prev => {
            const newResponse = prev + event.delta;
            console.log('📝 [CHARLOTTE DEBUG] Updated Charlotte response:', newResponse);
            return newResponse;
          });
          // Manter o comportamento existente também
          setCurrentTranscript(prev => prev + event.delta);
        }
      });

      service.on('text_done', (event: any) => {
        console.log('✅ Text response completed');
        console.log('📝 [CHARLOTTE DEBUG] Final Charlotte response:', charlotteCurrentResponse);
        if (currentTranscript) {
          setTranscript(currentTranscript);
          setCurrentTranscript('');
        }
        // 📝 CORRIGIDO: Usar o estado atual da resposta para adicionar ao histórico
        setCharlotteCurrentResponse(currentResponse => {
          if (currentResponse) {
            console.log('📝 [CHARLOTTE DEBUG] Saving Charlotte response to history:', currentResponse);
            addCharlotteMessage(currentResponse);
            
            // 🧠 NOVO: Adicionar ao contexto unificado (fallback)
            if (conversationContext) {
              try {
                conversationContext.addMessage('assistant', currentResponse, 'live_voice');
                console.log('🧠 [CONTEXT] Charlotte message added to unified context (fallback)');
              } catch (error) {
                console.error('❌ Error adding Charlotte message to context (fallback):', error);
              }
            }
          }
          return ''; // Limpar após adicionar ao histórico
        });
      });

      service.on('audio_done', (event: any) => {
        console.log('✅ Audio response completed');
        setIsSpeaking(false);
          setIsListening(true);
      });

      service.on('function_call_arguments_delta', (event: any) => {
        console.log('🔧 Function call in progress:', event.delta);
      });

      service.on('function_call_arguments_done', (event: any) => {
        console.log('✅ Function call completed');
      });

      service.on('conversation_item_created', (event: any) => {
        console.log('💬 Conversation item created:', event.item?.type);
        
        // Tratar function calls
        if (event.item?.type === 'function_call') {
          const functionName = event.item.name;
          const args = JSON.parse(event.item.arguments || '{}');
          
          console.log('🔧 Function call:', functionName, args);
          
          // Simular execução das funções de ensino
          let result = '';
          
          switch (functionName) {
            case 'get_word_definition':
              result = JSON.stringify({
                word: args.word,
                definition: `A ${args.level.toLowerCase()} level definition of "${args.word}"`,
                examples: [`Example sentence with ${args.word}.`],
                pronunciation: `/pronunciation-guide/`
              });
              break;
              
            case 'check_pronunciation':
              result = JSON.stringify({
                accuracy: 85,
                feedback: 'Good pronunciation! Try to emphasize the first syllable more.',
                suggestions: ['Practice the "th" sound', 'Slow down slightly']
              });
              break;
              
            default:
              result = JSON.stringify({ error: 'Function not implemented' });
          }
          
          // Enviar resultado da função
          service.sendFunctionResult(event.item.call_id, result);
          
          // Criar nova resposta
          service.createResponse();
        }
      });

      service.on('error', (event: any) => {
        console.error('❌ Realtime API error:', event.error);
        console.error('❌ Full error event:', event);
        console.error('❌ Error details:', JSON.stringify(event, null, 2));
        
        // 🔧 NOVICE FIX: Verificar se é erro crítico antes de mostrar "indisponível"
        const isCriticalError = event.error?.message?.includes('Missing bearer or basic authentication') ||
                               event.error?.message?.includes('insufficient_quota') ||
                               event.error?.message?.includes('quota') ||
                               event.error?.message?.includes('model_not_found') ||
                               event.error?.message?.includes('realtime') ||
                               event.error?.message?.includes('access denied') ||
                               event.error?.message?.includes('unauthorized') ||
                               event.error?.code === 'invalid_api_key' ||
                               event.error?.code === 'model_access_denied';
        
        console.log('🔍 Error analysis:', {
          errorMessage: event.error?.message,
          errorCode: event.error?.code,
          isCriticalError,
          userLevel
        });
        
        // Só mostrar erro se for crítico
        if (isCriticalError) {
        setConnectionStatus('error');
        
        let errorMessage = '';
        
        if (event.error?.message?.includes('Missing bearer or basic authentication')) {
          errorMessage = 'Authentication failed. Your OpenAI account may not have access to the Realtime API yet.';
        } else if (event.error?.message?.includes('insufficient_quota') || event.error?.message?.includes('quota')) {
          errorMessage = 'Your OpenAI account has insufficient quota. Please check your billing settings.';
        } else if (event.error?.message?.includes('model_not_found') || event.error?.message?.includes('realtime')) {
          errorMessage = 'Realtime API access denied. Your account may not have access to this feature yet.';
        } else {
            // Mensagem de erro baseada no nível do usuário APENAS para erros críticos
          const errorMessages = {
            'Novice': 'Oops! Charlotte está indisponível no momento. Tente novamente mais tarde. (Charlotte is unavailable right now. Please try again later.)',
            'Inter': 'Sorry! The voice chat service is temporarily unavailable. Please try again in a few minutes.',
            'Advanced': 'The real-time conversation service is currently experiencing technical difficulties. Please attempt to reconnect shortly.'
          };
          
          errorMessage = errorMessages[userLevel] || errorMessages['Inter'];
        }
        
        setErrorMessage(errorMessage);
        } else {
          // 🔧 NOVICE FIX: Para erros menores, apenas log sem afetar a UI
          console.warn('⚠️ Non-critical error ignored:', event.error?.message || 'Unknown error');
          // Não definir connectionStatus como 'error' nem mostrar mensagem para usuário
        }
      });

      service.on('disconnected', () => {
        console.log('🔌 Disconnected from Realtime API');
        setConnectionStatus('disconnected');
        // 🎤 Parar tracking e calcular XP final
        stopConversationTracking();
      });

      // 🔧 NOVO: Conectar e inicializar áudio
      await service.connect();
      await service.initializeAudio();
      
      console.log('✅ Realtime API initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Realtime API:', error);
      setConnectionStatus('error');
      
      // 🔧 NOVO: Mensagens de erro específicas para problemas de inicialização
      let errorMessage = '';
      
      if (error instanceof Error) {
        // 🎤 ANDROID FIX: Erros específicos de microfone com instruções detalhadas
        if (error.message.includes('Microfone não encontrado')) {
          errorMessage = 'Microfone não encontrado. Verifique se há um microfone conectado ao seu dispositivo e recarregue a página.';
        } else if (error.message.includes('Permissão negada')) {
          const isAndroid = /Android/i.test(navigator.userAgent);
          if (isAndroid) {
            errorMessage = 'Permissão de microfone negada. Toque no ícone 🔒 na barra de endereços → Permissões do site → Microfone → Permitir. Depois recarregue a página.';
          } else {
            errorMessage = 'Permissão de microfone negada. Clique no ícone do microfone na barra de endereços e permita o acesso, depois recarregue a página.';
          }
        } else if (error.message.includes('sendo usado por outro aplicativo')) {
          errorMessage = 'O microfone está sendo usado por outro aplicativo. Feche outros programas que possam estar usando o microfone e tente novamente.';
        } else if (error.message.includes('Configurações do microfone não suportadas')) {
          errorMessage = 'Configurações de microfone não suportadas. Tentando configuração básica...';
        }
        // 🌐 Erros de conexão/API
        else if (error.message.includes('REALTIME_ACCESS_DENIED')) {
          errorMessage = 'Sua conta OpenAI não tem acesso à API Realtime. Atualize sua conta ou entre em contato com o suporte da OpenAI.';
        } else if (error.message.includes('Failed to get API token')) {
          errorMessage = 'Falha na autenticação com OpenAI. Verifique a configuração da sua chave API.';
        } else if (error.message.includes('Connection timeout')) {
          errorMessage = 'Timeout de conexão. Verifique sua conexão com a internet e tente novamente.';
        } else if (error.message.includes('NotFoundError')) {
          errorMessage = 'Dispositivo de áudio não encontrado. Conecte um microfone e recarregue a página.';
        } else if (error.message.includes('NotAllowedError')) {
          errorMessage = 'Acesso ao microfone foi negado pelo navegador. Permita o acesso nas configurações e recarregue a página.';
        } else if (error.message.includes('NotReadableError')) {
          errorMessage = 'Não foi possível acessar o microfone. Verifique se não está sendo usado por outro aplicativo.';
        } else {
          errorMessage = `Falha na conexão: ${error.message}`;
        }
      } else {
        errorMessage = 'Erro desconhecido ao conectar ao chat de voz.';
      }
      
      setErrorMessage(errorMessage);
      
      // 🔧 NOVO: Se for erro de microfone, tentar novamente automaticamente após delay
      if (errorMessage.includes('Configurações do microfone não suportadas')) {
        setTimeout(() => {
          console.log('🔄 Retrying with basic microphone configuration...');
          initializeRealtimeAPI();
        }, 2000);
      }
    }
  }, [userLevel, userName, startConversationTracking, stopConversationTracking, playConnectionSound]); // 🔧 FIXO: Dependências estáveis

  // 📊 Análise de áudio para visualização
  const startAudioAnalysis = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const analyze = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const levels = Array(32).fill(0).map((_, index) => {
        const start = Math.floor((index / 32) * dataArray.length);
        const end = Math.floor(((index + 1) / 32) * dataArray.length);
        const slice = dataArray.slice(start, end);
        const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
        return average / 255;
      });
      
      setAudioLevels(levels);
      
      if (connectionStatus === 'connected') {
        animationFrameRef.current = requestAnimationFrame(analyze);
      }
    };

    analyze();
  }, [connectionStatus]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full flex flex-col bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com Charlotte info, XP e controles */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative z-50 bg-secondary/95 backdrop-blur-md border-b border-white/10 pt-safe"
          >
            <div className="flex items-center justify-between px-4 py-3">
              {/* Charlotte Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative z-50 flex-shrink-0">
                  <CharlotteAvatar 
                    size="md"
                    showStatus={true}
                    isOnline={connectionStatus === 'connected'}
                    animate={true}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-white font-semibold text-base">Charlotte</h1>
                  <p className={`text-xs font-medium ${
                    connectionStatus === 'connected' 
                      ? isListening 
                        ? 'text-blue-400' 
                        : isSpeaking 
                          ? 'text-primary'
                          : 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {connectionStatus === 'connecting' && 'connecting...'}
                    {connectionStatus === 'connected' && isListening && 'listening...'}
                    {connectionStatus === 'connected' && isSpeaking && 'speaking...'}
                    {connectionStatus === 'connected' && !isListening && !isSpeaking && 'online'}
                    {connectionStatus === 'disconnected' && 'offline'}
                    {connectionStatus === 'error' && 'error'}
                  </p>
                </div>
              </div>

              {/* 📝 DESKTOP: Botão Toggle de Transcrições com texto */}
              <div className="hidden md:flex flex-1 justify-center">
                <button
                  id="transcription-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTranscriptions();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all cursor-pointer text-sm ${
                    showTranscriptions 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white/90'
                  }`}
                  title={showTranscriptions ? 'Hide transcriptions' : 'Show transcriptions'}
                >
                  {showTranscriptions ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
                  <span className="font-medium">
                    {userLevel === 'Novice' ? 'Transcrição' : 'Transcription'}
                  </span>
                </button>
              </div>
          
              {/* User Info + Close */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end">
                {/* User Info */}
                {user && (
                  <div className="flex flex-col items-center text-center min-w-[70px] sm:min-w-[80px]">
                    <p className="text-white text-xs sm:text-sm font-medium truncate max-w-16 sm:max-w-20 leading-tight">
                      {user.name?.split(' ')[0]}
                    </p>
                    <span className="inline-block text-black text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-primary rounded-full font-semibold mt-0.5 sm:mt-1">
                      {user.user_level}
                    </span>
                  </div>
                )}
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-1.5 sm:p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </motion.header>

          {/* 📱 MOBILE: Botão de transcrição flutuante no canto direito */}
          <AnimatePresence>
          <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="md:hidden absolute top-32 right-4 z-40"
            >
              <button
                id="transcription-toggle-mobile"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTranscriptions();
                }}
                className={`p-3 rounded-full transition-all cursor-pointer shadow-lg ${
                  showTranscriptions 
                    ? 'bg-primary/20 text-primary border border-primary/30 backdrop-blur-md' 
                    : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white/90 backdrop-blur-md'
                }`}
                title={showTranscriptions ? 'Hide transcriptions' : 'Show transcriptions'}
              >
                {showTranscriptions ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Main content - Layout dinâmico baseado em transcrições */}
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Layout quando transcrições estão DESATIVADAS - Orb centralizado */}
            {!showTranscriptions && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="flex-shrink-0"
                >
                  <RealtimeOrb
                    isConnected={connectionStatus === 'connected'}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    audioLevels={effectiveAudioLevels}
                    connectionStatus={connectionStatus}
                    size="normal"
                  />
                </motion.div>

                {/* Error message display - centralizado */}
                <AnimatePresence>
                  {connectionStatus === 'error' && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-w-md text-center mt-8"
                    >
                      <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-400/20">
                        <p className="text-red-300 text-sm leading-relaxed">
                          {errorMessage}
                        </p>
            </div>
          </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Layout quando transcrições estão ATIVADAS - Orb no topo + Chat embaixo */}
            {showTranscriptions && (
              <>
                {/* Orb na parte superior */}
                <div className="flex-shrink-0 flex justify-center px-8 py-10 md:py-16 pt-36 md:pt-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: 0.4,
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="flex-shrink-0"
            >
              <RealtimeOrb
                isConnected={connectionStatus === 'connected'}
                isListening={isListening}
                isSpeaking={isSpeaking}
                audioLevels={effectiveAudioLevels}
                connectionStatus={connectionStatus}
                      size="compact"
              />
            </motion.div>
                </div>

                {/* Container de transcrições na parte inferior */}
                <div className="flex-1 flex flex-col items-center justify-start overflow-hidden min-h-0 px-8">
            <AnimatePresence>
                    {(conversationHistory.length > 0 || charlotteCurrentResponse) && (
                <motion.div
                        ref={transcriptContainerRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                        className="w-full max-w-lg text-left space-y-3 overflow-y-auto scroll-smooth flex-1 pb-4"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                        }}
                      >
                        {/* Histórico completo da conversa */}
                        {conversationHistory.map((message, index) => (
                          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-2xl px-4 py-3 border max-w-[80%] ${
                              message.type === 'user'
                                ? 'bg-primary/20 backdrop-blur-sm rounded-br-sm border-primary/30'
                                : 'bg-white/10 backdrop-blur-sm rounded-bl-sm border-white/20'
                            }`}>
                              <p className={`text-sm font-medium mb-1 ${
                                message.type === 'user' ? 'text-primary/80' : 'text-primary'
                              }`}>
                                {message.type === 'user' ? 'You' : 'Charlotte'}
                              </p>
                              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                {message.type === 'user' ? message.content : message.content}
                    </p>
                  </div>
                          </div>
                        ))}

                        {/* Resposta atual da Charlotte em progresso */}
                        {charlotteCurrentResponse && (
                          <div className="flex justify-start">
                            <div 
                              ref={charlotteMessageRef}
                              className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 border border-white/20 max-w-[80%] max-h-[60vh] overflow-y-auto scroll-smooth"
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                              }}
                            >
                              <p className="text-sm font-medium text-primary mb-1">Charlotte</p>
                              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                {charlotteCurrentResponse}
                                <span className="animate-pulse">|</span>
                              </p>
                            </div>
                          </div>
                        )}
                </motion.div>
              )}
            </AnimatePresence>

                  {/* Error message display - quando transcrições ativas */}
            <AnimatePresence>
              {connectionStatus === 'error' && errorMessage && (
              <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                        className="max-w-md text-center mt-4"
                >
                  <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-400/20">
                    <p className="text-red-300 text-sm leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
              </motion.div>
            )}
            </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Controls compactos */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex-shrink-0 pb-safe"
          >
            <div className="flex justify-center items-center space-x-4 px-8 py-4">
              {/* Mute button */}
              <button
                id="audio-controls"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-red-500/10 text-red-400 border border-red-400/20' 
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating XP Counter */}
        {sessionXP !== undefined && totalXP !== undefined && (
          <div className="floating-xp-counter">
            <EnhancedXPCounter 
              sessionXP={sessionXP}
              totalXP={totalXP}
              currentLevel={Math.floor(Math.sqrt(totalXP / 50)) + 1}
              achievements={[]}
              userId={user?.entra_id}
              userLevel={user?.user_level as 'Novice' | 'Inter' | 'Advanced'}
              onXPGained={onXPGained}
              isFloating={true}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveVoiceModal;