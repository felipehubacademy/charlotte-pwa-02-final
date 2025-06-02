'use client';

import { useEffect } from 'react';

export function useFixViewportHeight() {
  useEffect(() => {
    // Detecta se é iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    // Detecta se está em modo PWA
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;

    const setViewportHeight = () => {
      if (isIOS && isPWA) {
        // Define a altura do body baseada no window.innerHeight atual
        document.body.style.height = `${window.innerHeight}px`;
        
        // Também define a altura mínima para evitar problemas
        document.body.style.minHeight = `${window.innerHeight}px`;
        
        // Garante que o overflow seja controlado
        document.body.style.overflowY = 'auto';
      }
    };

    // Executa imediatamente
    setViewportHeight();

    // Adiciona listener para mudanças de tamanho
    window.addEventListener('resize', setViewportHeight);
    
    // Para iOS, também escuta mudanças no visualViewport se disponível
    if (window.visualViewport && isIOS && isPWA) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      if (window.visualViewport && isIOS && isPWA) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }
    };
  }, []);
} 