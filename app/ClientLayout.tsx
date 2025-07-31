'use client';

import { ReactNode, useEffect } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // ✅ Função para limpar badge
    const clearBadge = () => {
      // Garantir que o badge seja limpo
      if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(0).then(() => {
          console.log('🏷️ Badge cleared successfully');
        }).catch((error: any) => {
          console.log('🏷️ Badge clear error:', error);
        });
      }
      
      // Limpar badge via clearAppBadge também
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().then(() => {
          console.log('🏷️ Badge cleared via clearAppBadge');
        }).catch((error: any) => {
          console.log('🏷️ clearAppBadge error:', error);
        });
      }
    };

    // ✅ LISTENER GLOBAL: Service Worker messages (para badge cleanup)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('🏷️ Notification clicked - clearing badge');
        clearBadge();
      }
    };

    // ✅ LISTENER GLOBAL: App focus (para garantir limpeza do badge)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🏷️ App gained focus - clearing badge as safety measure');
        // Delay pequeno para garantir que o service worker processou primeiro
        setTimeout(clearBadge, 100);
      }
    };

    // Adicionar listeners
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
} 