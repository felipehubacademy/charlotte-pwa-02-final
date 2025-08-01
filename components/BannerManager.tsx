'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import PWAInstaller from '@/components/PWAInstaller';
import NotificationManager from '@/components/notifications/NotificationManager';

interface BannerManagerProps {
  className?: string;
}

export default function BannerManager({ className = '' }: BannerManagerProps) {
  const { user } = useAuth();
  const [currentBanner, setCurrentBanner] = useState<'tour' | 'pwa' | 'notification' | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showPWA, setShowPWA] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // ✅ NOVO: Mostrar PWA antes do login também
    const hasDismissedPWA = sessionStorage.getItem('pwa-banner-dismissed') === 'true';
    
    console.log('🎯 [BANNER] User:', !!user, 'Dismissed PWA:', hasDismissedPWA);
    
    // Se não está logado, mostrar PWA se não foi dispensado
    if (!user && !hasDismissedPWA) {
      console.log('🎯 [BANNER] Showing PWA before login');
      setCurrentBanner('pwa');
      setShowPWA(true);
      return;
    }

    // Se está logado, seguir sequência normal
    if (!user) return;

    // Sequência: Tour → PWA → Notificação
    const hasCompletedTour = localStorage.getItem('onboarding-completed') === 'true';
    const hasCompletedNotification = localStorage.getItem('notification-setup-completed') === 'true';

    console.log('🎯 [BANNER] User logged in - Tour:', hasCompletedTour, 'Notification:', hasCompletedNotification);

    // 1. Primeiro: Tour (se não completado)
    if (!hasCompletedTour) {
      console.log('🎯 [BANNER] Showing tour');
      setCurrentBanner('tour');
      setShowTour(true);
      return;
    }

    // 2. Segundo: PWA (se tour completado e PWA não dispensado)
    if (hasCompletedTour && !hasDismissedPWA) {
      console.log('🎯 [BANNER] Showing PWA after tour');
      setCurrentBanner('pwa');
      setShowPWA(true);
      return;
    }

    // 3. Terceiro: Notificação (se tour e PWA completados)
    if (hasCompletedTour && hasDismissedPWA && !hasCompletedNotification) {
      console.log('🎯 [BANNER] Showing notification setup');
      setCurrentBanner('notification');
      setShowNotification(true);
      return;
    }

    console.log('🎯 [BANNER] No banner to show');
    // Nenhum banner para mostrar
    setCurrentBanner(null);
  }, [user]);

  const handleTourComplete = () => {
    setShowTour(false);
    setCurrentBanner('pwa');
    setShowPWA(true);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const handleTourSkip = () => {
    setShowTour(false);
    setCurrentBanner('pwa');
    setShowPWA(true);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const handlePWADismiss = () => {
    setShowPWA(false);
    // Se não está logado, apenas dispensar
    if (!user) {
      setCurrentBanner(null);
      return;
    }
    // Se está logado, seguir para notificação
    setCurrentBanner('notification');
    setShowNotification(true);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleNotificationComplete = () => {
    setShowNotification(false);
    setCurrentBanner(null);
    localStorage.setItem('notification-setup-completed', 'true');
  };

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

  if (currentBanner === 'pwa') {
    return <PWAInstaller onDismiss={handlePWADismiss} />;
  }

  if (currentBanner === 'notification') {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm lg:bottom-8 lg:left-8 lg:max-w-md">
        <NotificationManager className="w-full" onComplete={handleNotificationComplete} />
      </div>
    );
  }

  return null;
} 