'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Share, Plus, Bell, X } from 'lucide-react';

interface IOSInstallGuideProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function IOSInstallGuide({ onComplete, onDismiss }: IOSInstallGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isIPadOS = /iPad/.test(userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIOS(isIOSDevice || isIPadOS);

    // Verificar se PWA já está instalado
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (navigator as any).standalone === true;
    setIsPWAInstalled(isPWA);

    // Só mostrar se for iOS e PWA não estiver instalado
    setIsVisible((isIOSDevice || isIPadOS) && !isPWA);
  }, []);

  const steps = [
    {
      title: "Abra o menu do Safari",
      description: "Toque no botão 'Compartilhar' na parte inferior da tela",
      icon: <Share className="w-8 h-8 text-blue-500" />,
      visual: "📱 👆 Procure pelo ícone ⬆️ (seta para cima)"
    },
    {
      title: "Adicionar à Tela Inicial",
      description: "Role para baixo e toque em 'Adicionar à Tela Inicial'",
      icon: <Plus className="w-8 h-8 text-green-500" />,
      visual: "📱 ➕ 'Adicionar à Tela Inicial'"
    },
    {
      title: "Confirmar Instalação",
      description: "Toque em 'Adicionar' para instalar Charlotte como app",
      icon: <Smartphone className="w-8 h-8 text-purple-500" />,
      visual: "✅ Charlotte aparecerá na sua tela inicial"
    },
    {
      title: "Ativar Notificações",
      description: "Abra o Charlotte instalado e ative as notificações push",
      icon: <Bell className="w-8 h-8 text-orange-500" />,
      visual: "🔔 Agora você pode receber notificações!"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      setIsVisible(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onDismiss?.();
    setIsVisible(false);
    localStorage.setItem('ios-install-guide-dismissed', 'true');
  };

  if (!isVisible || !isIOS || isPWAInstalled) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {currentStepData.icon}
            </div>
            <h2 className="text-xl font-bold">Instalar Charlotte no iOS</h2>
            <p className="text-blue-100 text-sm mt-1">
              Para receber notificações push
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-500 mb-4">
            Passo {currentStep + 1} de {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentStepData.description}
            </p>
            
            {/* Visual Guide */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-2xl mb-2">{currentStepData.visual}</div>
              {currentStep === 0 && (
                <div className="bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded-lg">
                  💡 O botão fica na parte inferior do Safari
                </div>
              )}
              {currentStep === 1 && (
                <div className="bg-green-100 text-green-800 text-xs px-3 py-2 rounded-lg">
                  💡 Role a lista de opções para encontrar
                </div>
              )}
              {currentStep === 2 && (
                <div className="bg-purple-100 text-purple-800 text-xs px-3 py-2 rounded-lg">
                  💡 O nome será "Charlotte" por padrão
                </div>
              )}
              {currentStep === 3 && (
                <div className="bg-orange-100 text-orange-800 text-xs px-3 py-2 rounded-lg">
                  💡 Funciona apenas no app instalado, não no Safari
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
            >
              {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              Pular este tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}