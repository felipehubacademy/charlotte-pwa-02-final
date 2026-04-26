'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Share, Plus, Bell, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface IOSInstallGuideProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function IOSInstallGuide({ onComplete, onDismiss }: IOSInstallGuideProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // 🌍 Determinar idioma baseado no nível do usuário
  const isPortuguese = user?.user_level === 'Novice';
  
  // 🌍 Traduções dinâmicas
  const t = {
    openSafariMenu: isPortuguese ? 'Abra o menu do Safari' : 'Open Safari menu',
    shareButton: isPortuguese ? 'Toque no botão \'Compartilhar\' na parte inferior da tela' : 'Tap the \'Share\' button at the bottom of the screen',
    lookForIcon: isPortuguese ? '📱 👆 Procure pelo ícone ⬆️ (seta para cima)' : '📱 👆 Look for the ⬆️ icon (up arrow)',
    addToHomeScreen: isPortuguese ? 'Adicionar à Tela Inicial' : 'Add to Home Screen',
    scrollAndTap: isPortuguese ? 'Role para baixo e toque em \'Adicionar à Tela Inicial\'' : 'Scroll down and tap \'Add to Home Screen\'',
    addToHomeScreenText: isPortuguese ? 'Adicionar à Tela Inicial' : 'Add to Home Screen',
    confirmInstallation: isPortuguese ? 'Confirmar Instalação' : 'Confirm Installation',
    tapAdd: isPortuguese ? 'Toque em \'Adicionar\' para instalar Charlotte como app' : 'Tap \'Add\' to install Charlotte as an app',
    charlotteAppears: isPortuguese ? '✅ Charlotte aparecerá na sua tela inicial' : '✅ Charlotte will appear on your home screen',
    activateNotifications: isPortuguese ? 'Ativar Notificações' : 'Enable Notifications',
    openInstalled: isPortuguese ? 'Abra o Charlotte instalado e ative as notificações push' : 'Open the installed Charlotte and enable push notifications',
    nowReceiveNotifications: isPortuguese ? '🔔 Agora você pode receber notificações!' : '🔔 Now you can receive notifications!',
    installCharlotte: isPortuguese ? 'Instalar Charlotte no iOS' : 'Install Charlotte on iOS',
    toReceiveNotifications: isPortuguese ? 'Para receber notificações push' : 'To receive push notifications',
    step: isPortuguese ? 'Passo' : 'Step',
    of: isPortuguese ? 'de' : 'of',
    tipButton: isPortuguese ? '💡 O botão fica na parte inferior do Safari' : '💡 The button is at the bottom of Safari',
    tipScroll: isPortuguese ? '💡 Role a lista de opções para encontrar' : '💡 Scroll the options list to find',
    tipName: isPortuguese ? '💡 O nome será "Charlotte" por padrão' : '💡 The name will be "Charlotte" by default',
    tipAppOnly: isPortuguese ? '💡 Funciona apenas no app instalado, não no Safari' : '💡 Works only in the installed app, not in Safari',
    previous: isPortuguese ? 'Anterior' : 'Previous',
    next: isPortuguese ? 'Próximo' : 'Next',
    finish: isPortuguese ? 'Finalizar' : 'Finish'
  };

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
      title: t.openSafariMenu,
      description: t.shareButton,
      icon: <Share className="w-8 h-8 text-blue-500" />,
      visual: t.lookForIcon
    },
    {
      title: t.addToHomeScreen,
      description: t.scrollAndTap,
      icon: <Plus className="w-8 h-8 text-green-500" />,
      visual: `📱 ➕ '${t.addToHomeScreenText}'`
    },
    {
      title: t.confirmInstallation,
      description: t.tapAdd,
      icon: <Smartphone className="w-8 h-8 text-purple-500" />,
      visual: t.charlotteAppears
    },
    {
      title: t.activateNotifications,
      description: t.openInstalled,
      icon: <Bell className="w-8 h-8 text-orange-500" />,
      visual: t.nowReceiveNotifications
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
            <h2 className="text-xl font-bold">{t.installCharlotte}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {t.toReceiveNotifications}
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
            {t.step} {currentStep + 1} {t.of} {steps.length}
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
                  {t.tipButton}
                </div>
              )}
              {currentStep === 1 && (
                <div className="bg-green-100 text-green-800 text-xs px-3 py-2 rounded-lg">
                  {t.tipScroll}
                </div>
              )}
              {currentStep === 2 && (
                <div className="bg-purple-100 text-purple-800 text-xs px-3 py-2 rounded-lg">
                  {t.tipName}
                </div>
              )}
              {currentStep === 3 && (
                <div className="bg-orange-100 text-orange-800 text-xs px-3 py-2 rounded-lg">
                  {t.tipAppOnly}
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
                {t.previous}
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
            >
              {currentStep === steps.length - 1 ? t.finish : t.next}
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              {isPortuguese ? 'Pular este tutorial' : 'Skip this tutorial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}