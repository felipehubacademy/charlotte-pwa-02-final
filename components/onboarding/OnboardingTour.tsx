'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Camera, Mic, MessageCircle, Star, MessageSquare, ChevronRight, Type, Volume2, Eye } from 'lucide-react';
import LiveVoiceModal from '../voice/LiveVoiceModal';

interface OnboardingStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  mobileOnly?: boolean;
  isLiveVoiceStep?: boolean; // Nova propriedade para identificar steps do Live Voice
  requiresFakeModal?: boolean; // Se precisa abrir o modal fake
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  isMobile: boolean;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  userLevel,
  isMobile,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showDemoLiveVoiceModal, setShowDemoLiveVoiceModal] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 🔧 CORRIGIDO: Memoizar steps para evitar loop infinito
  const steps = useMemo(() => {
    const isNovice = userLevel === 'Novice';
    
    const baseSteps: OnboardingStep[] = [
      // Step 1: Text Messages (PRIMEIRO - mais importante)
      {
        id: 'text',
        targetId: 'message-input',
        title: isNovice ? 'Escreva Mensagens' : 'Write Messages',
        description: isNovice
          ? 'Digite suas mensagens e Charlotte vai te ajudar a melhorar sua escrita e gramática!'
          : 'Type your messages. Charlotte will help you improve your writing and grammar!',
        icon: <Type size={24} />,
        position: 'center'
      },
      // Step 2: Photo (Mobile only)
      {
        id: 'photo',
        targetId: 'photo-button',
        title: isNovice ? 'Tire uma Foto' : 'Take a Photo',
        description: isNovice 
          ? 'Fotografe textos ou objetos em inglês e receba explicações detalhadas instantâneas.'
          : 'Capture English texts or objects and get instant detailed explanations.',
        icon: <Camera size={24} />,
        position: 'center',
        mobileOnly: true
      },
      // Step 3: Voice Recording
      {
        id: 'voice',
        targetId: 'voice-button',
        title: isNovice ? 'Pratique sua Pronúncia' : 'Practice Your Pronunciation',
        description: isNovice
          ? 'Grave sua voz praticando inglês e receba feedback detalhado sobre sua pronúncia.'
          : 'Record your voice practicing English and get detailed pronunciation feedback.',
        icon: <Mic size={24} />,
        position: 'center'
      },
      // Step 4: Live Voice Mode (abre o modal real em demo)
      {
        id: 'live-voice',
        targetId: 'live-voice-button',
        title: isNovice ? 'Conversação ao Vivo' : 'Live Voice Chat',
        description: isNovice
          ? 'Converse em tempo real com Charlotte usando sua voz. Vamos ver como funciona!'
          : 'Have real-time voice conversations with Charlotte. Let\'s see how it works!',
        icon: <MessageCircle size={24} />,
        position: 'center',
        requiresFakeModal: true
      },
      // Step 5: Live Voice - Transcrições (dentro do modal real)
      {
        id: 'live-voice-transcriptions',
        targetId: isMobile ? 'transcription-toggle-mobile' : 'transcription-toggle', // Usar ID correto baseado no dispositivo
        title: isNovice ? 'Veja as Transcrições' : 'View Transcriptions',
        description: isNovice
          ? 'Ative este botão para ver em tempo real tudo que você e Charlotte estão falando. Perfeito para aprender!'
          : 'Toggle this button to see real-time transcriptions of everything you and Charlotte say. Perfect for learning!',
        icon: <Eye size={24} />,
        position: 'center',
        isLiveVoiceStep: true
      },
      // Step 6: Live Voice - Controles de Áudio (dentro do modal real)
      {
        id: 'live-voice-controls',
        targetId: 'audio-controls', // Usar os controles reais
        title: isNovice ? 'Controles de Áudio' : 'Audio Controls',
        description: isNovice
          ? 'Use estes controles para silenciar seu microfone ou o áudio da Charlotte durante a conversa.'
          : 'Use these controls to mute your microphone or Charlotte\'s audio during the conversation.',
        icon: <Volume2 size={24} />,
        position: 'center',
        isLiveVoiceStep: true
      },
      // Step 7: Live Voice - Orb de Conversa (dentro do modal real)
      {
        id: 'live-voice-orb',
        targetId: 'realtime-orb', // Usar o orb real
        title: isNovice ? 'Orb de Conversa' : 'Conversation Orb',
        description: isNovice
          ? 'Este orb visual mostra quando você está falando (azul) ou quando Charlotte está respondendo (verde). Fale naturalmente!'
          : 'This visual orb shows when you\'re speaking (blue) or when Charlotte is responding (green). Speak naturally!',
        icon: <MessageSquare size={24} />,
        position: 'center',
        isLiveVoiceStep: true
      },
      // Step 8: XP System (volta para tela principal) - 🔧 WORKAROUND para mobile
      {
        id: 'xp',
        targetId: 'xp-counter',
        title: isNovice ? 'Sistema de XP' : 'XP System',
        description: isNovice
          ? 'Ganhe pontos de experiência praticando inglês e acompanhe seu progresso! O contador de XP aparece no canto superior direito.'
          : 'Earn experience points by practicing English and track your progress! The XP counter appears in the top right corner.',
        icon: <Star size={24} />,
        position: 'center' // 🔧 SEMPRE centralizar para mobile
      }
    ];

    // Filtrar steps mobile-only se não estiver no mobile
    return baseSteps.filter(step => !step.mobileOnly || isMobile);
  }, [userLevel, isMobile]);

  // 🔧 NOVO: Função para calcular posição do tooltip de forma centralizada
  const calculateTooltipPosition = useCallback((element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Estimativa
    const padding = 20;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        y = rect.top - tooltipHeight - padding;
        break;
      case 'bottom':
        x = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - tooltipWidth - padding;
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'right':
        x = rect.right + padding;
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'center':
      default:
        x = (window.innerWidth / 2) - (tooltipWidth / 2);
        y = (window.innerHeight / 2) - (tooltipHeight / 2);
        break;
    }

    // Garantir que o tooltip não saia da tela
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    return { x, y };
  }, []);

  // Encontrar elemento target e calcular posições
  useEffect(() => {
    if (!isOpen || currentStep >= steps.length) return;

    const step = steps[currentStep];
    
    // Se é um step do Live Voice e o modal demo não está aberto, não procurar elemento
    if (step.isLiveVoiceStep && !showDemoLiveVoiceModal) return;
    
    // 🔧 NOVO: Função para encontrar elemento com retry
    const findElementWithRetry = (attempts = 0, maxAttempts = 5) => {
      let element = document.getElementById(step.targetId);
      
      // Fallback para textarea se não encontrar message-input
      if (!element && step.targetId === 'message-input') {
        element = document.querySelector('textarea[placeholder*="Ask"]') as HTMLElement;
      }
      
      // 🔧 NOVO: Workaround especial para XP counter móvel
      if (!element && step.targetId === 'xp-counter') {
        // Tentar múltiplos seletores para o XP counter
        element = document.querySelector('#xp-counter, .floating-xp-counter, [class*="xp-counter"], [class*="XPCounter"]') as HTMLElement;
        
        // Se ainda não encontrou, usar posição fixa no canto superior direito
        if (!element && isMobile) {
          console.log('🔧 XP Counter not found on mobile - using fixed position');
          // Não definir elemento, mas usar posição fixa
          setTargetElement(null);
          setTooltipPosition({
            x: window.innerWidth - 340, // 320px tooltip + 20px padding
            y: 80 // Posição no topo, abaixo do header
          });
          return;
        }
      }
      
      // 🔧 NOVO: Fallbacks para elementos do Live Voice modal
      if (!element && step.isLiveVoiceStep) {
        // Tentar múltiplos seletores para o botão de transcrição
        if (step.targetId === 'transcription-toggle' || step.targetId === 'transcription-toggle-mobile') {
          // Tentar múltiplos seletores para o botão de transcrição
          element = document.getElementById('transcription-toggle') || 
                   document.getElementById('transcription-toggle-mobile') ||
                   document.querySelector('[title*="transcription"]') as HTMLElement ||
                   document.querySelector('[title*="Transcription"]') as HTMLElement ||
                   document.querySelector('button:has([class*="MessageSquare"])') as HTMLElement ||
                   document.querySelector('button[class*="transcr"]') as HTMLElement;
        } else if (step.targetId === 'audio-controls') {
          element = document.querySelector('#audio-controls, button[title*="mute"], button[title*="volume"]') as HTMLElement;
        } else if (step.targetId === 'realtime-orb') {
          element = document.querySelector('#realtime-orb, [class*="orb"], [class*="Orb"]') as HTMLElement;
        }
      }
      
      if (element) {
        setTargetElement(element);
        const positions = calculateTooltipPosition(element, step.position);
        setTooltipPosition(positions);
      } else if (attempts < maxAttempts && (step.isLiveVoiceStep || step.targetId === 'xp-counter')) {
        // 🔧 NOVO: Retry após delay se for step do Live Voice ou XP counter
        setTimeout(() => findElementWithRetry(attempts + 1, maxAttempts), 500);
      } else {
        // Se não encontrar elemento, centralizar tooltip
        setTargetElement(null);
        setTooltipPosition({
          x: (window.innerWidth / 2) - 160,
          y: (window.innerHeight / 2) - 100
        });
      }
    };
    
    // 🔧 NOVO: Delay inicial para steps do Live Voice
    if (step.isLiveVoiceStep) {
      setTimeout(() => findElementWithRetry(), 200);
    } else {
      findElementWithRetry();
    }
  }, [currentStep, isOpen, steps, calculateTooltipPosition, showDemoLiveVoiceModal]);

  // 🔧 CORRIGIDO: Memoizar funções de controle
  const handleComplete = useCallback(() => {
    setShowDemoLiveVoiceModal(false); // Fechar modal demo se estiver aberto
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  const skipTour = useCallback(() => {
    setShowDemoLiveVoiceModal(false); // Fechar modal demo se estiver aberto
    onClose();
  }, [onClose]);

  const nextStep = useCallback(() => {
    const currentStepData = steps[currentStep];
    
    // Se o step atual requer modal demo, abrir
    if (currentStepData.requiresFakeModal) {
      setShowDemoLiveVoiceModal(true);
      
      // 🔧 NOVO: Delay para garantir que o modal carregue antes de procurar elementos
      if (currentStep < steps.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 1500); // 1.5s delay para modal carregar
        return;
      }
    }
    
    // Se estamos saindo dos steps do Live Voice, fechar modal demo
    if (currentStepData.isLiveVoiceStep && currentStep < steps.length - 1) {
      const nextStepData = steps[currentStep + 1];
      if (!nextStepData.isLiveVoiceStep) {
        setShowDemoLiveVoiceModal(false);
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps, handleComplete]);

  if (!isOpen || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto" />
        
        {/* Highlight do elemento target */}
        {targetElement && (
          <motion.div
            key="element-highlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: targetElement.getBoundingClientRect().left - 4,
              top: targetElement.getBoundingClientRect().top - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
              border: '3px solid #3B82F6',
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              zIndex: 10000
            }}
          />
        )}

        <motion.div
          key="tooltip"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="absolute pointer-events-auto z-[10000]"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            width: 320
          }}
        >
          <div className="relative">
            {/* Tooltip principal */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 shadow-2xl border border-blue-400/30">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {currentStepData.title}
                    </h3>
                    <p className="text-blue-200 text-sm">
                      {currentStep + 1} de {steps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={skipTour}
                  className="p-1 text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Descrição */}
              <p className="text-white/90 text-sm leading-relaxed mb-6">
                {currentStepData.description}
              </p>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-blue-200 mb-2">
                  <span>Progresso</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-yellow-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-between items-center">
                <button
                  onClick={skipTour}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  {userLevel === 'Novice' ? 'Pular Tour' : 'Skip Tour'}
                </button>
                
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <span>
                    {isLastStep 
                      ? (userLevel === 'Novice' ? 'Finalizar' : 'Finish')
                      : (userLevel === 'Novice' ? 'Próximo' : 'Next')
                    }
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal Real do Live Voice em Modo Demo */}
      {showDemoLiveVoiceModal && (
        <LiveVoiceModal
          key="demo-live-voice-modal"
          isOpen={showDemoLiveVoiceModal}
          onClose={() => {}} // Não permitir fechar durante o tour
          userLevel={userLevel}
          user={{
            name: 'Demo User',
            entra_id: 'demo',
            user_level: userLevel
          }}
          demoMode={true} // 🎭 Ativar modo demo
        />
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour; 