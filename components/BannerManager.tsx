'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import PWAInstaller from '@/components/PWAInstaller';

interface BannerManagerProps {
  className?: string;
}

export default function BannerManager({ className = '' }: BannerManagerProps) {
  const { user } = useAuth();
  const [currentBanner, setCurrentBanner] = useState<'tour' | 'pwa' | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showPWA, setShowPWA] = useState(false);

  useEffect(() => {
    // ✅ NOVO: Mostrar PWA antes do login também
    // ✅ REMOVIDO: Não verificar se foi dispensado para sempre
    // const hasDismissedPWA = sessionStorage.getItem('pwa-banner-dismissed') === 'true';
    
    console.log('🎯 [BANNER] User:', !!user);
    
    // Se não está logado, mostrar PWA sempre
    if (!user) {
      console.log('🎯 [BANNER] Showing PWA before login');
      setCurrentBanner('pwa');
      setShowPWA(true);
      return;
    }

    // Se está logado, seguir sequência normal
    if (!user) return;

    // Sequência: Tour → PWA
    const hasCompletedTour = localStorage.getItem('onboarding-completed') === 'true';

    console.log('🎯 [BANNER] User logged in - Tour:', hasCompletedTour);

    // 1. Primeiro: Tour (se não completado)
    if (!hasCompletedTour) {
      console.log('🎯 [BANNER] Showing tour');
      setCurrentBanner('tour');
      setShowTour(true);
      return;
    }

    // ✅ SIMPLIFICADO: Apenas PWA, sem banner de notificação
    // 2. PWA (se tour completado e PWA não instalado)
    const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                           localStorage.getItem('pwa-installed') === 'true';
    
    if (hasCompletedTour && !isPWAInstalled) {
      console.log('🎯 [BANNER] Showing PWA after tour (not installed)');
      setCurrentBanner('pwa');
      setShowPWA(true);
      return;
    }



    console.log('🎯 [BANNER] No banner to show');
    // Nenhum banner para mostrar
    setCurrentBanner(null);
  }, [user]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('onboarding-completed', 'true');
    
    // ✅ NOVO: Solicitar permissão nativa no iOS após tour
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && 'Notification' in window && Notification.permission === 'default') {
      console.log('📱 [BANNER] iOS detected, requesting native notification permission');
      Notification.requestPermission().then(permission => {
        console.log('📱 [BANNER] Native permission result:', permission);
        // Após permissão, mostrar PWA
        setCurrentBanner('pwa');
        setShowPWA(true);
      });
    } else {
      // Para outras plataformas, mostrar PWA direto
      setCurrentBanner('pwa');
      setShowPWA(true);
    }
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('onboarding-completed', 'true');
    
    // ✅ NOVO: Solicitar permissão nativa no iOS após tour
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && 'Notification' in window && Notification.permission === 'default') {
      console.log('📱 [BANNER] iOS detected, requesting native notification permission');
      Notification.requestPermission().then(permission => {
        console.log('📱 [BANNER] Native permission result:', permission);
        // Após permissão, mostrar PWA
        setCurrentBanner('pwa');
        setShowPWA(true);
      });
    } else {
      // Para outras plataformas, mostrar PWA direto
      setCurrentBanner('pwa');
      setShowPWA(true);
    }
  };

  const handlePWADismiss = () => {
    setShowPWA(false);
    setCurrentBanner(null); // PWA é o último, apenas fechar
    // ✅ REMOVIDO: Não marcar como dispensado para sempre
    // sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };



  // ✅ REMOVIDO: handleNotificationComplete - não usamos mais banner de notificação

  // Renderizar apenas o banner atual
  if (currentBanner === 'tour') {
    return (
      <OnboardingTour
        isOpen={showTour}
        onClose={handleTourSkip}
        userLevel={user?.user_level as 'Novice' | 'Inter' | 'Advanced' || 'Inter'}
        isMobile={typeof window !== 'undefined' && (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))}
        onComplete={handleTourComplete}
      />
    );
  }

  // ✅ REMOVIDO: Banner de notificação - não usamos mais

  if (currentBanner === 'pwa') {
    console.log('🎯 [BANNER] Rendering PWAInstaller component');
    return <PWAInstaller onDismiss={handlePWADismiss} />;
  }

  return null;
} 