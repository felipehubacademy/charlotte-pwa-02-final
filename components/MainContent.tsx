'use client';

import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
  className?: string;
  hasHeader?: boolean;
  useIOSPWALayout?: boolean;
}

export default function MainContent({ 
  children, 
  className = "",
  hasHeader = true,
  useIOSPWALayout = false
}: MainContentProps) {
  // Detecta se está em modo PWA iOS
  const isIOSPWA = typeof window !== 'undefined' && 
    ((window.navigator as any).standalone === true || 
     window.matchMedia('(display-mode: standalone)').matches) &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOSPWA || useIOSPWALayout) {
    return (
      <main 
        className={`ios-pwa-content ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: hasHeader 
            ? `calc(3.5rem + env(safe-area-inset-top))` 
            : 'env(safe-area-inset-top)',
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </main>
    );
  }

  return (
    <main 
      className={`${hasHeader ? 'pt-14' : ''} flex-1 flex flex-col ${className}`}
      style={{
        paddingTop: hasHeader 
          ? `calc(3.5rem + env(safe-area-inset-top))` 
          : 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        minHeight: hasHeader 
          ? `calc(100vh - 3.5rem - env(safe-area-inset-top))` 
          : `calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))`
      }}
    >
      {children}
    </main>
  );
} 