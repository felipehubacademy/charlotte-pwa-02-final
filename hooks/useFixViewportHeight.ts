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

    // ESTRATÉGIA PRINCIPAL: Força altura fixa IMEDIATAMENTE
    const applyIOSPWAFixes = () => {
      console.log('🔧 Applying iOS PWA fixes...');
      
      // FORÇA altura fixa do viewport
      document.documentElement.style.setProperty('--app-height', `${initialHeightRef.current}px`);
      document.documentElement.style.height = `${initialHeightRef.current}px`;
      document.documentElement.style.minHeight = `${initialHeightRef.current}px`;
      document.documentElement.style.maxHeight = `${initialHeightRef.current}px`;
      document.documentElement.style.overflow = 'hidden';
      
      // FORÇA altura fixa do body
      document.body.style.height = `${initialHeightRef.current}px`;
      document.body.style.minHeight = `${initialHeightRef.current}px`;
      document.body.style.maxHeight = `${initialHeightRef.current}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // FORÇA todos os headers a ficarem fixos
      const headers = document.querySelectorAll('header, [data-header="true"]');
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        headerElement.style.position = 'fixed';
        headerElement.style.top = '0';
        headerElement.style.left = '0';
        headerElement.style.right = '0';
        headerElement.style.zIndex = '9999';
        headerElement.style.transform = 'translateZ(0)';
        headerElement.style.willChange = 'transform';
        headerElement.style.backfaceVisibility = 'hidden';
      });
      
      console.log('✅ iOS PWA fixes applied');
    };

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

      // SEMPRE aplica fixes em iOS PWA, independente do teclado
      applyIOSPWAFixes();
      
      // Define CSS custom properties para uso nos componentes
      document.documentElement.style.setProperty('--keyboard-height', isKeyboardOpen ? `${heightDiff}px` : '0px');
      
      // Adiciona classes CSS para controle específico
      if (isKeyboardOpen) {
        document.body.classList.add('keyboard-open');
        document.body.classList.remove('keyboard-closed');
      } else {
        document.body.classList.add('keyboard-closed');
        document.body.classList.remove('keyboard-open');
      }

      // FORÇA re-aplicação dos fixes após mudança de teclado
      if (wasKeyboardOpen !== isKeyboardOpen) {
        setTimeout(applyIOSPWAFixes, 100);
        setTimeout(applyIOSPWAFixes, 300);
        setTimeout(applyIOSPWAFixes, 500);
      }
    };

    // Executa imediatamente
    applyIOSPWAFixes();
    setViewportHeight();

    // ESTRATÉGIA: Múltiplos listeners para capturar todas as mudanças
    const listeners = [
      { target: window, event: 'resize' },
      { target: window, event: 'orientationchange' },
      { target: window.visualViewport, event: 'resize' },
      { target: window.visualViewport, event: 'scroll' },
      { target: document, event: 'focusin' },
      { target: document, event: 'focusout' },
      { target: window, event: 'scroll' }
    ];

    listeners.forEach(({ target, event }) => {
      if (target) {
        target.addEventListener(event, setViewportHeight);
      }
    });

    // ESTRATÉGIA: Polling agressivo como backup
    const pollInterval = setInterval(() => {
      if (Math.abs(window.innerHeight - initialHeightRef.current) > 50) {
        setViewportHeight();
      }
      // Re-aplica fixes periodicamente
      applyIOSPWAFixes();
    }, 500);

    // ESTRATÉGIA: Força re-render após delays (iOS às vezes demora)
    setTimeout(applyIOSPWAFixes, 100);
    setTimeout(applyIOSPWAFixes, 500);
    setTimeout(applyIOSPWAFixes, 1000);
    setTimeout(applyIOSPWAFixes, 2000);

    // ESTRATÉGIA: Observa mudanças no DOM
    const observer = new MutationObserver(() => {
      applyIOSPWAFixes();
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Cleanup
    return () => {
      listeners.forEach(({ target, event }) => {
        if (target) {
          target.removeEventListener(event, setViewportHeight);
        }
      });
      clearInterval(pollInterval);
      observer.disconnect();
      
      // Remove classes e estilos
      document.body.classList.remove('keyboard-open', 'keyboard-closed');
      if (isPWARef.current) {
        document.body.style.height = '';
        document.body.style.minHeight = '';
        document.body.style.maxHeight = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.documentElement.style.height = '';
        document.documentElement.style.minHeight = '';
        document.documentElement.style.maxHeight = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, []);
} 