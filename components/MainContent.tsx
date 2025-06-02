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
        className={`flex-1 overflow-hidden ${className}`}
        style={{
          paddingTop: hasHeader 
            ? `calc(3.5rem + env(safe-area-inset-top))` 
            : 'env(safe-area-inset-top)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // Espaço para footer fixo
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
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
        paddingBottom: 'calc(120px + env(safe-area-inset-bottom))', // Espaço para footer fixo
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {children}
    </main>
  );
} 