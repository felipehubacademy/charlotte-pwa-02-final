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
    if (!user) return;

    // Sequência: Tour → PWA → Notificação
    const hasCompletedTour = localStorage.getItem('onboarding-completed') === 'true';
    const hasDismissedPWA = sessionStorage.getItem('pwa-banner-dismissed') === 'true';
    const hasCompletedNotification = localStorage.getItem('notification-setup-completed') === 'true';

    // 1. Primeiro: Tour (se não completado)
    if (!hasCompletedTour) {
      setCurrentBanner('tour');
      setShowTour(true);
      return;
    }

    // 2. Segundo: PWA (se tour completado e PWA não dispensado)
    if (hasCompletedTour && !hasDismissedPWA) {
      setCurrentBanner('pwa');
      setShowPWA(true);
      return;
    }

    // 3. Terceiro: Notificação (se tour e PWA completados)
    if (hasCompletedTour && hasDismissedPWA && !hasCompletedNotification) {
      setCurrentBanner('notification');
      setShowNotification(true);
      return;
    }

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
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm lg:bottom-8 lg:left-8 lg:max-w-md">
        <PWAInstaller onDismiss={handlePWADismiss} />
      </div>
    );
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