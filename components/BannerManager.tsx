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
    
    // ✅ iOS PWA: Modal nativo → Subscription → Mensagem Charlotte
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && isPWA && 'Notification' in window && Notification.permission === 'default') {
      console.log('📱 [BANNER] iOS PWA detected, requesting native notification permission');
      Notification.requestPermission().then(async permission => {
        console.log('📱 [BANNER] Native permission result:', permission);
        if (permission === 'granted') {
          // Criar subscription imediatamente
          await createIOSPushSubscription();
        }
        // Fim do fluxo no PWA
        setCurrentBanner(null);
      });
    } else if (isIOS && !isPWA) {
      // iOS Safari: PWA Banner
      console.log('📱 [BANNER] iOS Safari - showing PWA banner');
      setCurrentBanner('pwa');
      setShowPWA(true);
    } else {
      // Desktop/Mac/Android: PWA direto (não mexer)
      setCurrentBanner('pwa');
      setShowPWA(true);
    }
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('onboarding-completed', 'true');
    
    // ✅ iOS PWA: Modal nativo → Subscription → Mensagem Charlotte
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && isPWA && 'Notification' in window && Notification.permission === 'default') {
      console.log('📱 [BANNER] iOS PWA detected, requesting native notification permission');
      Notification.requestPermission().then(async permission => {
        console.log('📱 [BANNER] Native permission result:', permission);
        if (permission === 'granted') {
          // Criar subscription imediatamente
          await createIOSPushSubscription();
        }
        // Fim do fluxo no PWA
        setCurrentBanner(null);
      });
    } else if (isIOS && !isPWA) {
      // iOS Safari: PWA Banner
      console.log('📱 [BANNER] iOS Safari - showing PWA banner');
      setCurrentBanner('pwa');
      setShowPWA(true);
    } else {
      // Desktop/Mac/Android: PWA direto (não mexer)
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



  // ✅ FUNÇÃO: Criar subscription e enviar mensagem da Charlotte (iOS PWA apenas)
  const createIOSPushSubscription = async () => {
    try {
      console.log('📱 [iOS] Creating push subscription...');
      
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });
      
      console.log('📱 [iOS] Subscription created:', subscription.endpoint.substring(0, 50) + '...');
      
      // Salvar no servidor
      const subscriptionData = {
        user_id: user?.entra_id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))) : '',
          auth: subscription.getKey('auth') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))) : ''
        },
        platform: 'ios',
        is_active: true,
        subscription_type: 'web_push'
      };
      
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });
      
      if (response.ok) {
        console.log('📱 [iOS] Subscription saved to server');
        
        // Enviar mensagem de confirmação da Charlotte
        await registration.showNotification('🎉 Notificações Ativadas!', {
          body: `Olá ${user?.name || 'amigo'}! As notificações da Charlotte foram ativadas com sucesso. Você receberá lembretes de prática às 8h e 20h.`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-welcome',
          requireInteraction: true,
          data: { type: 'welcome', url: '/chat' }
        });
        
        console.log('📱 [iOS] Welcome notification sent');
      } else {
        console.error('📱 [iOS] Failed to save subscription:', response.status);
      }
      
    } catch (error) {
      console.error('📱 [iOS] Error creating subscription:', error);
    }
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

  // ✅ REMOVIDO: Banner de notificação - não usamos mais

  if (currentBanner === 'pwa') {
    console.log('🎯 [BANNER] Rendering PWAInstaller component');
    return <PWAInstaller onDismiss={handlePWADismiss} />;
  }

  return null;
} 