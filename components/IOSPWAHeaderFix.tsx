'use client';

import { useEffect } from 'react';

export default function IOSPWAHeaderFix() {
  useEffect(() => {
    // Detecta iPhone PWA
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;

    if (!isIPhone || !isPWA) {
      console.log('❌ Not iPhone PWA, skipping header fix');
      return;
    }

    console.log('🍎 iPhone PWA detected - applying minimal header fixes');
    
    // USA window.innerHeight que é mais preciso para PWA
    const initialHeight = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${initialHeight}px`);
    
    console.log('✅ Set initial height:', initialHeight, 'window height:', window.innerHeight);

    // Listener para ajustar quando necessário
    const handleResize = () => {
      // Só atualiza se a diferença for significativa (não é teclado)
      const currentHeight = window.innerHeight;
      const diff = Math.abs(initialHeight - currentHeight);
      
      if (diff < 100) { // Se diferença pequena, mantém altura original
        document.documentElement.style.setProperty('--app-height', `${initialHeight}px`);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, []);

  return null; // Este componente não renderiza nada
} 