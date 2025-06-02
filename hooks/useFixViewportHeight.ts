'use client';

import { useEffect, useRef } from 'react';

export function useFixViewportHeight() {
  const initialHeightRef = useRef<number>(0);
  const isIOSRef = useRef<boolean>(false);
  const isPWARef = useRef<boolean>(false);
  const isKeyboardOpenRef = useRef<boolean>(false);

  useEffect(() => {
    // Detecta iOS de forma mais robusta
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Detecta PWA de forma mais robusta
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches ||
                  window.matchMedia('(display-mode: fullscreen)').matches ||
                  window.matchMedia('(display-mode: minimal-ui)').matches;

    isIOSRef.current = isIOS;
    isPWARef.current = isPWA;
    initialHeightRef.current = window.innerHeight;

    console.log('🔍 Viewport Fix Debug:', {
      isIOS,
      isPWA,
      initialHeight: initialHeightRef.current,
      userAgent: navigator.userAgent,
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });

    if (!isIOS || !isPWA) {
      console.log('❌ Not iOS PWA, skipping viewport fix');
      return;
    }

    // Aguarda o React carregar antes de aplicar fixes
    setTimeout(() => {
      const setViewportHeight = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeightRef.current - currentHeight;
        const wasKeyboardOpen = isKeyboardOpenRef.current;
        const isKeyboardOpen = heightDiff > 150; // Threshold para detectar teclado
        
        isKeyboardOpenRef.current = isKeyboardOpen;

        console.log('📏 Viewport Change:', {
          currentHeight,
          initialHeight: initialHeightRef.current,
          heightDiff,
          isKeyboardOpen,
          wasKeyboardOpen,
          isPWA: isPWARef.current
        });

        // Define CSS custom properties para uso nos componentes
        document.documentElement.style.setProperty('--app-height', `${initialHeightRef.current}px`);
        document.documentElement.style.setProperty('--keyboard-height', isKeyboardOpen ? `${heightDiff}px` : '0px');
        
        // Adiciona classes CSS para controle específico
        if (isKeyboardOpen) {
          document.body.classList.add('keyboard-open');
          document.body.classList.remove('keyboard-closed');
        } else {
          document.body.classList.add('keyboard-closed');
          document.body.classList.remove('keyboard-open');
        }

        // MENOS AGRESSIVO: Apenas define altura, não position fixed
        document.body.style.height = `${initialHeightRef.current}px`;
        document.body.style.minHeight = `${initialHeightRef.current}px`;
        document.body.style.maxHeight = `${initialHeightRef.current}px`;
      };

      // Executa imediatamente
      setViewportHeight();

      // ESTRATÉGIA: Múltiplos listeners para capturar todas as mudanças
      const listeners = [
        { target: window, event: 'resize' },
        { target: window, event: 'orientationchange' },
        { target: window.visualViewport, event: 'resize' },
        { target: document, event: 'focusin' },
        { target: document, event: 'focusout' }
      ];

      listeners.forEach(({ target, event }) => {
        if (target) {
          target.addEventListener(event, setViewportHeight);
        }
      });

      // ESTRATÉGIA: Polling menos agressivo
      const pollInterval = setInterval(() => {
        if (Math.abs(window.innerHeight - initialHeightRef.current) > 50) {
          setViewportHeight();
        }
      }, 1000);

      // ESTRATÉGIA: Força re-render após delays menores
      setTimeout(setViewportHeight, 500);
      setTimeout(setViewportHeight, 1000);

      // Cleanup
      return () => {
        listeners.forEach(({ target, event }) => {
          if (target) {
            target.removeEventListener(event, setViewportHeight);
          }
        });
        clearInterval(pollInterval);
        
        // Remove classes e estilos
        document.body.classList.remove('keyboard-open', 'keyboard-closed');
        if (isPWARef.current) {
          document.body.style.height = '';
          document.body.style.minHeight = '';
          document.body.style.maxHeight = '';
        }
      };
    }, 500); // Aguarda 500ms para o React carregar

  }, []);
} 