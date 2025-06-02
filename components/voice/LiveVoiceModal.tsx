'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX, Settings, LogOut } from 'lucide-react';
import { OpenAIRealtimeService, RealtimeConfig } from '../../lib/openai-realtime';
import { useVoiceActivityDetection } from '../../hooks/useVoiceActivityDetection';
import RealtimeOrb from './RealtimeOrb';
import EnhancedXPCounter from '../ui/EnhancedXPCounter';
import CharlotteAvatar from '../ui/CharlotteAvatar';
import { supabaseService } from '../../lib/supabase-service';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
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
  onXPGained
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

  // 🆕 Estados para tracking de XP por tempo de conversa
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null);
  const [totalConversationTime, setTotalConversationTime] = useState(0);
  const [lastXPUpdate, setLastXPUpdate] = useState<Date | null>(null);
  const [xpAlreadyAwarded, setXpAlreadyAwarded] = useState(false); // 🔧 NEW: Prevent multiple XP awards

  // Hook VAD para análise de áudio real
  const { volume, audioLevels: vadAudioLevels, start: startVAD, stop: stopVAD } = useVoiceActivityDetection();

  // Refs
  const realtimeServiceRef = useRef<OpenAIRealtimeService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

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
      'Intermediate': 5,  // 5 XP por minuto  
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
        await supabaseService.saveAudioPractice({
          user_id: user.entra_id,
          transcription: `Live voice conversation completed (${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s)`,
          accuracy_score: null,
          fluency_score: null,
          completeness_score: null,
          pronunciation_score: null,
          feedback: `Great conversation! You practiced English for ${durationMinutes.toFixed(1)} minutes. (+${finalXP} XP)`,
          xp_awarded: finalXP,
          practice_type: 'live_voice',
          audio_duration: totalSeconds
        });

        console.log('✅ Live voice practice saved with REBALANCED XP:', finalXP);
        
        // Callback para atualizar XP na UI
        onXPGained?.(finalXP);
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
  }, [isOpen]); // 🔧 FIXO: Apenas isOpen como dependência

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
    setIsMuted(!isMuted);
  };

  // 🔄 Toggle API mode
  const toggleAPIMode = () => {
    console.log('API mode toggle disabled - always using Realtime API');
  };

  // 🚪 Fechar modal
  const handleClose = () => {
    cleanup();
    onClose();
  };

  // ⏹️ Interromper resposta
  const interruptResponse = () => {
    if (realtimeServiceRef.current && isSpeaking) {
      realtimeServiceRef.current.interruptResponse();
      setIsSpeaking(false);
      setIsListening(true);
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
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        userLevel,
        userName
      };

      const service = new OpenAIRealtimeService(config);
      realtimeServiceRef.current = service;

      // Event listeners
      service.on('session_created', () => {
        console.log('✅ Realtime session created');
        setConnectionStatus('connected');
        setIsListening(true);
        // 🎤 Iniciar tracking de conversa quando conectar
        startConversationTracking();
        // 🔊 Tocar som de conexão
        playConnectionSound();
      });

      service.on('user_speech_started', () => {
        console.log('🎤 User started speaking');
        setIsListening(true);
        setIsSpeaking(false);
      });

      service.on('user_speech_stopped', () => {
        console.log('🔇 User stopped speaking');
        setIsListening(false);
      });

      service.on('response_created', () => {
        console.log('🤖 Assistant response created');
        setIsSpeaking(true);
        setIsListening(false);
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
          setCurrentTranscript(prev => prev + event.delta);
        }
      });

      service.on('text_done', (event: any) => {
        console.log('✅ Text response completed');
        if (currentTranscript) {
          setTranscript(currentTranscript);
          setCurrentTranscript('');
        }
      });

      service.on('audio_done', (event: any) => {
        console.log('✅ Audio response completed');
        setIsSpeaking(false);
          setIsListening(true);
      });

      service.on('input_transcription_completed', (event: any) => {
        console.log('📝 User speech transcribed:', event.transcript);
        setTranscript(`You: "${event.transcript}"`);
      });

      service.on('input_transcription_failed', (event: any) => {
        console.log('❌ Transcription failed');
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
        setConnectionStatus('error');
        
        // Mensagens de erro específicas para problemas de WebSocket
        let errorMessage = '';
        
        if (event.error?.message?.includes('Missing bearer or basic authentication')) {
          errorMessage = 'Authentication failed. Your OpenAI account may not have access to the Realtime API yet.';
        } else if (event.error?.message?.includes('insufficient_quota') || event.error?.message?.includes('quota')) {
          errorMessage = 'Your OpenAI account has insufficient quota. Please check your billing settings.';
        } else if (event.error?.message?.includes('model_not_found') || event.error?.message?.includes('realtime')) {
          errorMessage = 'Realtime API access denied. Your account may not have access to this feature yet.';
        } else {
          // Mensagem de erro baseada no nível do usuário
          const errorMessages = {
            'Novice': 'Oops! Charlotte está indisponível no momento. Tente novamente mais tarde. (Charlotte is unavailable right now. Please try again later.)',
            'Intermediate': 'Sorry! The voice chat service is temporarily unavailable. Please try again in a few minutes.',
            'Advanced': 'The real-time conversation service is currently experiencing technical difficulties. Please attempt to reconnect shortly.'
          };
          
          errorMessage = errorMessages[userLevel] || errorMessages['Intermediate'];
        }
        
        setErrorMessage(errorMessage);
      });

      service.on('disconnected', () => {
        console.log('🔌 Disconnected from Realtime API');
        setConnectionStatus('disconnected');
        // 🎤 Parar tracking e calcular XP final
        stopConversationTracking();
      });

      // Conectar e inicializar áudio
      await service.connect();
      await service.initializeAudio();
      
    } catch (error) {
      console.error('❌ Failed to initialize Realtime API:', error);
      setConnectionStatus('error');
      
      // Mensagens de erro específicas para problemas de inicialização
      let errorMessage = '';
      
      if (error instanceof Error) {
        if (error.message.includes('REALTIME_ACCESS_DENIED')) {
          errorMessage = 'Your OpenAI account does not have access to the Realtime API. Please upgrade your account or contact OpenAI support.';
        } else if (error.message.includes('Failed to get API token')) {
          errorMessage = 'Failed to authenticate with OpenAI. Please check your API key configuration.';
        } else if (error.message.includes('Connection timeout')) {
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else {
          errorMessage = `Connection failed: ${error.message}`;
        }
      } else {
        errorMessage = 'Unknown error occurred while connecting to voice chat.';
      }
      
      setErrorMessage(errorMessage);
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
          className="relative w-full h-full grid grid-rows-[auto_auto_1fr_auto] bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com Charlotte info, XP e controles */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative z-30 bg-secondary/95 backdrop-blur-md border-b border-white/10 pt-safe"
          >
            <div className="flex items-center justify-between px-4 py-3">
              {/* Charlotte Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative z-40 flex-shrink-0">
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
          
              {/* User Info + Close */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
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

          {/* Status Bar - Simplificado */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="z-20 bg-charcoal/30 backdrop-blur-sm border-b border-white/5"
          >
            <div className="flex items-center justify-center px-4 py-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' 
                  ? isListening 
                    ? 'bg-blue-400 animate-pulse' 
                    : isSpeaking 
                      ? 'bg-primary animate-pulse'
                      : 'bg-green-400'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-400 animate-pulse'
                      : connectionStatus === 'error'
                        ? 'bg-red-400'
                        : 'bg-gray-400'
              }`} />
                <span className="text-white/80 text-xs font-medium">
                  {connectionStatus === 'connecting' && 'Connecting to Realtime API...'}
                  {connectionStatus === 'connected' && isListening && 'Listening for your voice...'}
                  {connectionStatus === 'connected' && isSpeaking && 'Charlotte is speaking...'}
                  {connectionStatus === 'connected' && !isListening && !isSpeaking && 'Ready for conversation'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                  {connectionStatus === 'error' && 'Connection Error'}
              </span>
              </div>
            </div>
          </motion.div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-8">
            {/* Orb melhorado */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <RealtimeOrb
                isConnected={connectionStatus === 'connected'}
                isListening={isListening}
                isSpeaking={isSpeaking}
                audioLevels={effectiveAudioLevels}
                connectionStatus={connectionStatus}
              />
            </motion.div>

            {/* Transcript display */}
            <AnimatePresence>
              {(transcript || currentTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md text-center mb-8"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-white text-sm leading-relaxed">
                      {currentTranscript || transcript}
                      {currentTranscript && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message display */}
            <AnimatePresence>
              {connectionStatus === 'error' && errorMessage && (
              <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md text-center mb-8"
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

          {/* Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="z-20 pb-safe"
          >
            <div className="flex justify-center items-center space-x-4 px-8 py-6">
              {/* Mute button */}
              <button
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

              {/* Interrupt button - only show when Charlotte is speaking */}
              {isSpeaking && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    interruptResponse();
                  }}
                  className="p-3 rounded-full transition-all cursor-pointer bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20"
                  title="Interrupt Charlotte"
                >
                  <X size={20} />
                </motion.button>
              )}
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
              userLevel={user?.user_level as 'Novice' | 'Intermediate' | 'Advanced'}
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