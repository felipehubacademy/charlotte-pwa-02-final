'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Download } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import NotificationService from '@/lib/notification-service';
import { getFCMToken } from '@/lib/firebase-config-optimized';
import IOSInstallGuide from '@/components/IOSInstallGuide';

interface NotificationManagerProps {
  className?: string;
}

export default function NotificationManager({ className = '' }: NotificationManagerProps) {
  const { user } = useAuth();
  const [notificationService] = useState(() => NotificationService.getInstance());
  
  // State
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasFCMToken, setHasFCMToken] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [iosCapabilities, setIOSCapabilities] = useState<any>(null);

  // Check initial state
  useEffect(() => {
    initializeNotificationState();
  }, []);

  const initializeNotificationState = async () => {
    try {
      setIsInitializing(true);
      
      // Aguardar a verificação de estado do service
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await checkNotificationState();
      await checkFCMTokenStatus();
      detectPlatform();
      checkPWAInstallation();
      
      // Check if user has already dismissed notification setup
      const dismissed = localStorage.getItem('notification-setup-dismissed');
      setIsDismissed(dismissed === 'true');
    } finally {
      setIsInitializing(false);
    }
  };

  const checkNotificationState = async () => {
    const supported = notificationService.supported;
    const currentPermission = await notificationService.checkPermission();
    const subscribed = notificationService.subscribed;

    setIsSupported(supported);
    setPermission(currentPermission);
    setIsSubscribed(subscribed);

    console.log('🔔 Notification state:', {
      supported,
      permission: currentPermission,
      subscribed,
      isDismissed: localStorage.getItem('notification-setup-dismissed') === 'true'
    });
  };

  const checkFCMTokenStatus = async () => {
    if (!user) {
      setHasFCMToken(false);
      return;
    }

    try {
      // Verificar se há FCM token no banco de dados
      const response = await fetch('/api/notifications/check-fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.entra_id })
      });

      if (response.ok) {
        const result = await response.json();
        setHasFCMToken(result.hasFCMToken || false);
        console.log('🔥 FCM token status:', result.hasFCMToken ? 'Found' : 'Not found');
      } else {
        setHasFCMToken(false);
        console.log('❌ Failed to check FCM token status');
      }
    } catch (error) {
      console.error('❌ Error checking FCM token:', error);
      setHasFCMToken(false);
    }
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
      
      // Verificar capacidades iOS
      const capabilities = (notificationService as any).iOSCapabilities;
      setIOSCapabilities(capabilities);
      
      // Mostrar guia se necessário
      const guideDismissed = localStorage.getItem('ios-install-guide-dismissed');
      if (!capabilities.isPWAInstalled && !guideDismissed) {
        setShowIOSGuide(true);
      }
    } else if (/Android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  };

  const checkPWAInstallation = () => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (navigator as any).standalone === true;
    setIsPWAInstalled(isInstalled);
  };

  const setupFCMToken = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔥 Setting up FCM token...');
      
      // Get FCM token
      const fcmToken = await getFCMToken();
      
      if (!fcmToken) {
        console.log('❌ Failed to get FCM token');
        return false;
      }

      console.log('✅ FCM token received:', fcmToken.substring(0, 20) + '...');

      // Save FCM token to database
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: fcmToken,
          keys: {
            p256dh: 'fcm-placeholder-p256dh',
            auth: 'fcm-placeholder-auth'
          },
          platform: platform,
          user_id: userId,
          subscription_type: 'fcm'
        })
      });

      if (response.ok) {
        console.log('✅ FCM token saved to database');
        return true;
      } else {
        console.error('❌ Failed to save FCM token to database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up FCM token:', error);
      return false;
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const granted = await notificationService.requestPermission();
      
      if (!granted) {
        setPermission('denied');
        setIsLoading(false);
        return;
      }

      setPermission('granted');

      // Setup dual notification system: Web Push + FCM
      const results = await Promise.allSettled([
        // 1. Setup Web Push subscription
        notificationService.subscribe(user.entra_id),
        // 2. Setup FCM token
        setupFCMToken(user.entra_id)
      ]);

      const webPushSuccess = results[0].status === 'fulfilled' && results[0].value;
      const fcmSuccess = results[1].status === 'fulfilled' && results[1].value;

      console.log('📊 Notification setup results:', {
        webPush: webPushSuccess ? 'success' : 'failed',
        fcm: fcmSuccess ? 'success' : 'failed'
      });

      if (webPushSuccess || fcmSuccess) {
        setIsSubscribed(!!webPushSuccess);
        setHasFCMToken(!!fcmSuccess);
        
        // Show success notification
        await notificationService.sendLocalNotification({
          title: '🔔 Notifications Enabled!',
          body: `${fcmSuccess ? 'FCM + ' : ''}${webPushSuccess ? 'Web Push' : 'Basic'} notifications configured`,
          url: '/chat'
        });
      } else {
        console.error('❌ Both notification systems failed');
      }

    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      await notificationService.unsubscribe();
      setIsSubscribed(false);
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;

    try {
      await notificationService.sendLocalNotification({
        title: '🧪 Test Notification',
        body: 'This is a test from Charlotte!',
        url: '/chat'
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  // iOS specific guidance component
  const IOSGuidance = () => (
    <div className="bg-secondary/60 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white">Push Notifications no iOS</h4>
          
          {!isPWAInstalled ? (
            <div>
              <p className="text-sm text-white/70 mt-1">
                Para receber notificações, você precisa instalar Charlotte como PWA:
              </p>
              <ol className="text-sm text-white/60 mt-2 space-y-1 list-decimal list-inside">
                <li>Safari → Compartilhar → "Adicionar à Tela Inicial"</li>
                <li>Abrir Charlotte da tela inicial (não pelo Safari)</li>
                <li>Ativar notificações no app instalado</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(true)}
                className="mt-2 text-xs bg-primary/20 text-primary px-3 py-1 rounded-lg hover:bg-primary/30 transition-colors"
              >
                📖 Ver tutorial completo
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-green-300 mt-1">
                ✅ PWA instalado! Agora você pode ativar notificações.
              </p>
              {iosCapabilities && (
                <p className="text-xs text-white/50 mt-1">
                  iOS {iosCapabilities.version} • Push notifications suportadas
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-setup-dismissed', 'true');
  };

  const handleResetDismiss = () => {
    setIsDismissed(false);
    localStorage.removeItem('notification-setup-dismissed');
  };

  // Show iOS Install Guide
  if (showIOSGuide) {
    return (
      <IOSInstallGuide
        onComplete={() => {
          setShowIOSGuide(false);
          setIsPWAInstalled(true);
          // Recheck capabilities after installation
          setTimeout(() => {
            initializeNotificationState();
          }, 1000);
        }}
        onDismiss={() => setShowIOSGuide(false)}
      />
    );
  }

  // Don't render if iOS and not installed as PWA
  if (platform === 'ios' && !isPWAInstalled && !showIOSGuide) {
    return (
      <div className={`notification-manager ${className}`}>
        <div className="bg-secondary/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <IOSGuidance />
          <div className="text-center mt-4">
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors"
            >
              📱 Como instalar no iPhone
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className={`notification-manager ${className}`}>
        <div className="bg-secondary/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="text-center">
            <div className="bg-white/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <BellOff className="w-6 h-6 text-white/60" />
            </div>
            <p className="text-sm text-white/70">
              Notificações push não são suportadas neste dispositivo
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything while initializing
  if (isInitializing) {
    return null;
  }

  // Only show when user needs to enable notifications
  const hasCompleteNotificationSetup = (permission === 'granted' && isSubscribed && hasFCMToken);
  
  if (!isSupported || hasCompleteNotificationSetup || isDismissed) {
    return null;
  }

  // Debug helper - expor no console para facilitar debug
  if (typeof window !== 'undefined') {
    (window as any).debugNotifications = {
      state: {
        isSupported,
        permission,
        isSubscribed,
        hasFCMToken,
        hasCompleteSetup: (permission === 'granted' && isSubscribed && hasFCMToken),
        isDismissed,
        isInitializing,
        platform,
        isPWAInstalled
      },
      actions: {
        resetDismiss: handleResetDismiss,
        checkState: checkNotificationState,
        checkFCM: checkFCMTokenStatus,
        forceShow: () => setIsDismissed(false),
        showIOSGuide: () => setShowIOSGuide(true)
      }
    };
  }

  return (
    <div 
      className={`bg-secondary/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${className}`}
      style={{
        // Garantir que o banner funciona bem em PWA iOS
        marginBottom: platform === 'ios' && isPWAInstalled ? 'env(safe-area-inset-bottom)' : '0'
      }}
    >
      {platform === 'ios' && <IOSGuidance />}
      
      {/* Header redesenhado com gradiente da marca */}
      <div className="bg-gradient-to-r from-primary/80 via-primary to-primary/80 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 border border-white/20 flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-base sm:text-lg">Ativar Notificações</h3>
              <p className="text-sm text-white/80 truncate">
                Receba conquistas em tempo real!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 text-lg font-light flex-shrink-0 ml-2"
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Content redesenhado */}
      <div className="p-4 sm:p-5">
        <div className="flex justify-center">
          {permission === 'granted' ? (
            <button
              onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading}
              className={`w-full px-6 py-3 sm:py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg backdrop-blur-sm border text-sm sm:text-base ${
                isSubscribed
                  ? 'bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white hover:from-red-600/90 hover:to-orange-600/90 border-red-500/30'
                  : 'bg-gradient-to-r from-primary/80 to-primary text-white hover:from-primary hover:to-primary/90 border-primary/30'
              } disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Configurando...</span>
                  <span className="sm:hidden">⚙️</span>
                </div>
              ) : isSubscribed ? '🔕 Desativar' : '🔔 Ativar Notificações'}
            </button>
          ) : permission === 'denied' ? (
            <div className="w-full px-6 py-3 sm:py-4 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-center font-medium backdrop-blur-sm text-sm sm:text-base">
              🚫 Permissão negada
            </div>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/80 to-primary text-white rounded-xl font-medium hover:from-primary hover:to-primary/90 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg backdrop-blur-sm border border-primary/30 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Configurando...</span>
                  <span className="sm:hidden">⚙️</span>
                </div>
              ) : '🔔 Ativar Notificações'}
            </button>
          )}
        </div>

        {/* Success message redesenhado */}
        {isSubscribed && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="font-medium text-sm sm:text-base">✅ Notificações ativadas!</span>
            </div>
            <p className="text-xs sm:text-sm text-green-300/80 mt-1">
              Você receberá notificações sobre suas conquistas
            </p>
          </div>
        )}
      </div>
      
      {/* Footer redesenhado */}
      <div className="bg-secondary/60 backdrop-blur-sm px-4 py-3 text-xs text-white/50 border-t border-white/10">
        <div className="flex items-center space-x-2">
          {platform === 'ios' && (
            <>
              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
              <p className="truncate">iOS 16.4+ necessário para notificações push</p>
            </>
          )}
          {platform === 'android' && (
            <>
              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
              <p className="truncate">Funciona em todos os navegadores Android</p>
            </>
          )}
        </div>
        <p className="mt-1 text-white/40 text-xs">Seja notificado sobre conquistas e progressos!</p>
      </div>
    </div>
  );
}