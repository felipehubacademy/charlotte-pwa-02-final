'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Download } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import NotificationService from '@/lib/notification-service';

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

  // Check initial state
  useEffect(() => {
    checkNotificationState();
    detectPlatform();
    checkPWAInstallation();
    
    // Check if user has already dismissed notification setup
    const dismissed = localStorage.getItem('notification-setup-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

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
      subscribed
    });
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
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

      // Create subscription
      const subscription = await notificationService.subscribe(user.entra_id);
      
      if (subscription) {
        setIsSubscribed(true);
        
        // Show success notification
        await notificationService.sendLocalNotification({
          title: '🔔 Notifications Enabled!',
          body: 'You\'ll now receive updates from Charlotte',
          url: '/chat'
        });
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">Configuração iOS Necessária</h4>
          <p className="text-sm text-blue-700 mt-1">
            Para receber notificações push no iOS, você precisa:
          </p>
          <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Adicionar Charlotte à sua Tela Inicial primeiro</li>
            <li>Abrir Safari → botão Compartilhar → "Adicionar à Tela Inicial"</li>
            <li>Depois ativar notificações do app instalado</li>
          </ol>
        </div>
      </div>
    </div>
  );

  // Main render
  if (!isSupported && platform === 'ios' && !isPWAInstalled) {
    return (
      <div className={`notification-manager ${className}`}>
        <IOSGuidance />
        <div className="text-center">
          <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Instale Charlotte como um app para ativar notificações
          </p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className={`notification-manager ${className}`}>
        <div className="text-center">
          <BellOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Notificações push não são suportadas neste dispositivo
          </p>
        </div>
      </div>
    );
  }

  // Only show when user needs to enable notifications
  if (!isSupported || (permission === 'granted' && isSubscribed) || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-setup-dismissed', 'true');
  };

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200 overflow-hidden ${className}`}>
      {platform === 'ios' && <IOSGuidance />}
      
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Ativar Notificações</h3>
              <p className="text-sm text-blue-100">
                Receba conquistas em tempo real!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex justify-center">{/* Action Button */}
          
          {permission === 'granted' ? (
            <button
              onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg ${
                isSubscribed
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
              } disabled:opacity-50 disabled:transform-none`}
            >
              {isLoading ? '🔄 Processando...' : isSubscribed ? '🔕 Desativar' : '🔔 Ativar'}
            </button>
          ) : permission === 'denied' ? (
            <div className="w-full px-6 py-3 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-lg text-center font-medium border border-red-200">
              🚫 Permissão negada
            </div>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none shadow-lg"
            >
              {isLoading ? '🔄 Solicitando...' : '🔔 Ativar Notificações'}
            </button>
          )}
        </div>

        {/* Success message when enabled */}
        {isSubscribed && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">✅ Notificações ativadas!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Você receberá notificações sobre suas conquistas
            </p>
          </div>
        )}
      </div>
      
      {/* Footer com info */}
      <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
        {platform === 'ios' && (
          <p>📱 iOS 16.4+ necessário para notificações push</p>
        )}
        {platform === 'android' && (
          <p>🤖 Funciona em todos os navegadores Android</p>
        )}
                 <p className="mt-1">Seja notificado sobre conquistas e progressos!</p>
      </div>
    </div>
  );
} 