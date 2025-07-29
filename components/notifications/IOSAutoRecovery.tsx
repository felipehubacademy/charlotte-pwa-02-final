// components/notifications/IOSAutoRecovery.tsx
import { useEffect, useRef, useCallback } from 'react';

const IOSAutoRecovery = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Detectar iOS
  const detectIOS = useCallback(() => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  }, []);

  // Obter user ID (ajuste conforme sua implementação de auth)
  const getUserId = useCallback(() => {
    // Buscar user ID do localStorage (tokens MSAL)
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('user') || key.includes('msal')
    );
    
    for (const key of authKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const uuidMatch = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (uuidMatch) {
            return uuidMatch[0];
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }, []);

  // Verificar se subscription existe
  const checkSubscriptionExists = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return !!subscription;
    } catch (error) {
      console.warn('[iOS Auto-Recovery] Erro ao verificar subscription:', error);
      return false;
    }
  }, []);

  // Recriar subscription
  const recreateSubscription = useCallback(async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.warn('[iOS Auto-Recovery] User ID não encontrado');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Remover subscription antiga
      const oldSub = await registration.pushManager.getSubscription();
      if (oldSub) {
        await oldSub.unsubscribe();
      }
      
      // Criar nova subscription
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA'
      });
      
      // Salvar no servidor
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auto-Recovery': 'true'
        },
        body: JSON.stringify({
          user_id: userId,
          endpoint: newSub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey('auth'))))
          },
          platform: 'ios',
          subscription_type: 'web_push',
          is_active: true,
          auto_recovery: true
        })
      });
      
      if (response.ok) {
        console.log('[iOS Auto-Recovery] ✅ Subscription recriada com sucesso');
        retryCountRef.current = 0;
        return true;
      } else {
        console.warn('[iOS Auto-Recovery] ❌ Erro ao salvar no servidor');
        return false;
      }
      
    } catch (error) {
      console.error('[iOS Auto-Recovery] Erro na recriação:', error);
      return false;
    }
  }, [getUserId]);

  // Executar verificação
  const performRecoveryCheck = useCallback(async () => {
    try {
      if (!detectIOS()) return;
      
      const userId = getUserId();
      if (!userId) return;
      
      const hasSubscription = await checkSubscriptionExists();
      
      if (!hasSubscription) {
        console.log('[iOS Auto-Recovery] 🚨 Subscription perdida - recriando...');
        
        const success = await recreateSubscription();
        
        if (success) {
          console.log('[iOS Auto-Recovery] ✅ Recovery completo!');
        } else {
          retryCountRef.current++;
          if (retryCountRef.current >= maxRetries) {
            console.log('[iOS Auto-Recovery] Máximo tentativas - pausando 30min');
            stopAutoRecovery();
            setTimeout(() => startAutoRecovery(), 30 * 60 * 1000);
          }
        }
      } else {
        console.log('[iOS Auto-Recovery] ✅ Subscription OK');
        retryCountRef.current = 0;
      }
      
    } catch (error) {
      console.error('[iOS Auto-Recovery] Erro na verificação:', error);
    }
  }, [detectIOS, getUserId, checkSubscriptionExists, recreateSubscription]);

  // Iniciar auto-recovery
  const startAutoRecovery = useCallback(() => {
    if (!detectIOS() || isActiveRef.current) return;
    
    console.log('[iOS Auto-Recovery] 🚀 Sistema iniciado');
    isActiveRef.current = true;
    
    // Verificação inicial
    setTimeout(performRecoveryCheck, 3000);
    
    // Verificação a cada 5 minutos
    intervalRef.current = setInterval(performRecoveryCheck, 5 * 60 * 1000);
  }, [detectIOS, performRecoveryCheck]);

  // Parar auto-recovery
  const stopAutoRecovery = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  // Effect principal
  useEffect(() => {
    if (detectIOS()) {
      startAutoRecovery();
    }

    return stopAutoRecovery;
  }, [detectIOS, startAutoRecovery, stopAutoRecovery]);

  // Eventos de visibilidade
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && detectIOS() && !isActiveRef.current) {
        startAutoRecovery();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [detectIOS, startAutoRecovery]);

  return null;
};

export default IOSAutoRecovery;