'use client';

import { ReactNode, useEffect, useState } from 'react';

interface MainContentProps {
  children: ReactNode;
  className?: string;
  hasHeader?: boolean;
}

export default function MainContent({ 
  children, 
  className = "",
  hasHeader = true
}: MainContentProps) {
  const [isIOSPWA, setIsIOSPWA] = useState(false);

  useEffect(() => {
    // Detecta iOS PWA de forma robusta
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches ||
                  window.matchMedia('(display-mode: fullscreen)').matches ||
                  window.matchMedia('(display-mode: minimal-ui)').matches;

    setIsIOSPWA(isIOS && isPWA);
    
    console.log('🔍 MainContent Debug:', {
      isIOS,
      isPWA,
      isIOSPWA: isIOS && isPWA
    });
  }, []);

  if (isIOSPWA) {
    // iOS PWA: Layout fixo e agressivo
    return (
      <main 
        className={`fixed top-0 left-0 right-0 bottom-0 overflow-y-auto ${className}`}
        style={{
          paddingTop: hasHeader 
            ? `calc(3.5rem + env(safe-area-inset-top))` 
            : 'env(safe-area-inset-top)',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          willChange: 'scroll-position',
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
        {children}
      </main>
    );
  }

  // Layout normal para outros casos
  return (
    <main 
      className={`flex-1 overflow-hidden ${className}`}
      style={{
        paddingTop: hasHeader 
          ? `calc(3.5rem + env(safe-area-inset-top))` 
          : 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {children}
    </main>
  );
} 