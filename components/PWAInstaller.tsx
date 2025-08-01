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
    console.log('📱 [PWA] User Agent:', navigator.userAgent);

    // Detectar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }
    console.log('📱 [PWA] Is installed (standalone):', isStandalone);

    // Verificar URL parameters para forçar instalação
    const urlParams = new URLSearchParams(window.location.search);
    const forceInstall = urlParams.get('install') === 'true';
    const installPrompt = urlParams.get('prompt') === 'pwa';

    // Para iOS, mostrar banner automaticamente (não há beforeinstallprompt)
    if (iOS && !isStandalone) {
      const delay = forceInstall || installPrompt ? 0 : 3000;
      console.log('📱 [PWA] iOS banner will show in', delay, 'ms');
      setTimeout(() => {
        // Temporariamente ignorar sessionStorage para debug
        console.log('📱 [PWA] Showing iOS banner (debug mode)');
        setShowBanner(true);
      }, delay);
    }

    // Listener para prompt de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Mostrar banner imediatamente se forçado via URL, senão após 3 segundos
      const delay = forceInstall || installPrompt ? 0 : 3000;
      setTimeout(() => {
        if (!isInstalled) {
          setShowBanner(true);
        }
      }, delay);
      
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
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`📱 [PWA] Install prompt result: ${outcome}`);
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowBanner(false);
    } catch (error) {
      console.error('❌ [PWA] Install prompt failed:', error);
    }
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

  // Banner de instalação para Android/Chrome
  if (showBanner && isInstallable && !isInstalled && !isIOS) {
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
  if (showBanner && isIOS && !isInstalled) {
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