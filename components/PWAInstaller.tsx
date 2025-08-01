'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface PWAInstallerProps {
  onDismiss?: () => void;
}

export default function PWAInstaller({ onDismiss }: PWAInstallerProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    console.log('📱 [PWA] iOS detected:', iOS);

    // Detectar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalledViaChrome = (navigator as any).standalone === true;
    const hasInstalledPWA = localStorage.getItem('pwa-installed') === 'true';
    
    // ✅ NOVO: Verificar se o Chrome tem o ícone "Open in app" (PWA instalado)
    const hasChromeInstallIcon = document.querySelector('link[rel="manifest"]') !== null && 
      (window as any).chrome !== undefined && 
      (window as any).chrome.webstore === undefined; // Não é Chrome Web Store
    
    if (isStandalone || isInstalledViaChrome || hasInstalledPWA || hasChromeInstallIcon) {
      setIsInstalled(true);
      console.log('📱 [PWA] PWA detected as installed');
    }
    console.log('📱 [PWA] Installation check:', {
      isStandalone,
      isInstalledViaChrome,
      hasInstalledPWA,
      hasChromeInstallIcon,
      finalInstalled: isStandalone || isInstalledViaChrome || hasInstalledPWA || hasChromeInstallIcon
    });

    // ✅ NOVO: Mostrar banner sempre se não está instalado (BannerManager controla quando)
    if (!(isStandalone || isInstalledViaChrome || hasInstalledPWA || hasChromeInstallIcon)) {
      console.log('📱 [PWA] Ready to show banner when BannerManager allows');
      setShowBanner(true);
    }

    // Listener para prompt de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowBanner(true); // ✅ Mostrar imediatamente, BannerManager controla
      console.log('📱 [PWA] Install prompt available');
    };

    // Listener para app instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBanner(false);
      console.log('✅ [PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const registerServiceWorker = async () => {
    try {
      console.log('🔧 [PWA] Registering Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ [PWA] Service Worker registered:', registration.scope);

      // Verificar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('🔄 [PWA] New Service Worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 [PWA] New content available, will refresh on next visit');
            }
          });
        }
      });

      registration.update();

    } catch (error) {
      console.error('❌ [PWA] Service Worker registration failed:', error);
    }
  };

  const handleInstallClick = async () => {
    // ✅ FUNÇÃO AUXILIAR: Instruções do navegador
    const showBrowserInstructions = () => {
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isEdge = /Edge/.test(userAgent);
      
      let instructions = 'Para instalar Charlotte:\n\n';
      
      if (isChrome) {
        // ✅ CORRIGIDO: Instruções específicas para Chrome Mac
        instructions += '1. Clique no botão "Instalar" na barra de endereços\n';
        instructions += 'OU\n';
        instructions += '2. Menu Chrome (⋮) → "Salvar e compartilhar" → "Instalar página como app"';
      } else if (isSafari) {
        instructions += '1. Clique no botão Compartilhar (□↗)\n';
        instructions += '2. Role para baixo e toque em "Adicionar à Tela de Início"';
      } else if (isEdge) {
        instructions += '1. Clique no botão "Instalar app" na barra de endereços\n';
        instructions += 'OU\n';
        instructions += '2. Menu (⋯) → "Apps" → "Instalar este site como app"';
      } else {
        instructions += 'Procure por opção "Instalar app" ou "Adicionar à tela inicial" no menu do seu navegador.';
      }
      
      alert(instructions);
    };

    // ✅ PRIMEIRO: Verificar se já está instalado (como "Open in app")
    const currentlyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('📱 [PWA] Install button clicked, checking states:', {
      hasDeferredPrompt: !!deferredPrompt,
      isInstalled: currentlyInstalled,
      isIOS,
      userAgent: navigator.userAgent
    });
    
    // ✅ SEGUNDO: Tentar usar deferredPrompt se disponível
    if (deferredPrompt) {
      try {
        console.log('📱 [PWA] Triggering native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`📱 [PWA] Install prompt result: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('✅ [PWA] App installed successfully!');
          localStorage.setItem('pwa-installed', 'true');
          setShowBanner(false);
        } else {
          console.log('ℹ️ [PWA] Native install prompt dismissed or not accepted.');
          setShowBanner(false); // Hide banner even if dismissed
        }
        
        setDeferredPrompt(null);
        setIsInstallable(false);
        return;
      } catch (error) {
        console.error('❌ [PWA] Install prompt failed:', error);
      }
    }

    // ✅ TERCEIRO: Se já instalado, abrir PWA
    if (currentlyInstalled) {
      console.log('📱 [PWA] Already installed, redirecting to PWA');
      window.location.href = window.location.href;
      return;
    }

    // ✅ QUARTO: Verificar se tem localStorage marcado como instalado
    if (localStorage.getItem('pwa-installed') === 'true') {
      console.log('📱 [PWA] PWA marked as installed in localStorage, redirecting');
      window.location.href = window.location.href;
      return;
    }

    // ✅ QUINTO: Tentar disparo manual do prompt (para quando beforeinstallprompt não foi capturado)
    try {
      console.log('📱 [PWA] No deferredPrompt available, trying to trigger beforeinstallprompt manually');
      // Tentar forçar o evento
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
      
      // Aguardar um pouco para ver se o deferredPrompt aparece
      setTimeout(() => {
        if (!deferredPrompt) {
          console.log('📱 [PWA] Manual trigger failed, showing browser instructions');
          showBrowserInstructions();
        }
      }, 100);
      return;
    } catch (error) {
      console.log('📱 [PWA] Manual trigger failed, showing browser instructions');
      showBrowserInstructions();
    }

    // ✅ SEXTO RECURSO: INSTRUÇÕES baseadas no navegador
    showBrowserInstructions();
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // Não mostrar novamente nesta sessão
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
    // Chamar callback se fornecido
    onDismiss?.();
  };

  // Não mostrar se já foi dispensado nesta sessão
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setShowBanner(false);
    }
  }, []);

  // Banner de instalação para Desktop/Android (sempre mostrar se não está instalado)
  if (showBanner && !isInstalled && !isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Instalar App Charlotte</h3>
              <p className="text-xs text-blue-100">Tenha a experiência completa com acesso offline!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={dismissBanner}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner de instruções para iOS  
  console.log('📱 [PWA] iOS Banner Check:', { showBanner, isIOS, isInstalled });
  
  if (showBanner && isIOS && !isInstalled) {
    console.log('📱 [PWA] RENDERING iOS BANNER NOW!');
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Instalar App Charlotte</h3>
              <p className="text-xs text-gray-300 mt-1">
                Toque no botão <span className="inline-block w-4 h-4 bg-blue-500 rounded text-center text-xs leading-4">⬆️</span> Compartilhar, depois "Adicionar à Tela de Início"
              </p>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Hook para usar em outros componentes
export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('❌ [PWA] Install failed:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    install
  };
} 