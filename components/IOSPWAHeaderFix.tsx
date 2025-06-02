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
    
    // APENAS define a altura inicial - não força estilos
    const initialHeight = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${initialHeight}px`);
    
    console.log('✅ Set initial height:', initialHeight);

  }, []);

  return null; // Este componente não renderiza nada
} 