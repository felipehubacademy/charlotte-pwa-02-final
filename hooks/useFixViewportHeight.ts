'use client';

import { useEffect, useRef } from 'react';

export function useFixViewportHeight() {
  const initialHeightRef = useRef<number>(0);

  useEffect(() => {
    // Detecta iOS PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;

    if (!isIOS || !isPWA) {
      console.log('❌ Not iOS PWA, skipping viewport fix');
      return;
    }

    console.log('🔍 iOS PWA detected - applying minimal viewport fix');
    
    initialHeightRef.current = window.innerHeight;

    // APENAS define a altura customizada - nada mais
    const setHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${initialHeightRef.current}px`);
    };

    setHeight();

    // Listener apenas para resize
    window.addEventListener('resize', setHeight);

    return () => {
      window.removeEventListener('resize', setHeight);
    };
  }, []);
} 