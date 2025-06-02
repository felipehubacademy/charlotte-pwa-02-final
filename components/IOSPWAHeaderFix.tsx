'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const fixIntervalRef = useRef<NodeJS.Timeout>();
  const initialHeightRef = useRef<number>(0);

  useEffect(() => {
    // Detecta iPhone PWA
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;

    if (!isIPhone || !isPWA) {
      console.log('❌ Not iPhone PWA, skipping header fix');
      return;
    }

    console.log('🍎 iPhone PWA detected - applying aggressive header fixes');
    
    initialHeightRef.current = window.innerHeight;

    const forceHeaderFixed = () => {
      // FORÇA todos os headers a ficarem fixos
      const headers = document.querySelectorAll('header, [data-header="true"], .ios-pwa-fixed-header');
      
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        
        // FORÇA posicionamento fixo
        headerElement.style.setProperty('position', 'fixed', 'important');
        headerElement.style.setProperty('top', '0', 'important');
        headerElement.style.setProperty('left', '0', 'important');
        headerElement.style.setProperty('right', '0', 'important');
        headerElement.style.setProperty('z-index', '9999', 'important');
        headerElement.style.setProperty('transform', 'translateZ(0)', 'important');
        headerElement.style.setProperty('will-change', 'transform', 'important');
        headerElement.style.setProperty('backface-visibility', 'hidden', 'important');
        headerElement.style.setProperty('margin', '0', 'important');
        headerElement.style.setProperty('margin-top', '0', 'important');
        
        // FORÇA hardware acceleration
        headerElement.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
        headerElement.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');
        headerElement.style.setProperty('-webkit-perspective', '1000', 'important');
        
        // FORÇA safe areas
        headerElement.style.setProperty('padding-top', 'env(safe-area-inset-top)', 'important');
        headerElement.style.setProperty('padding-left', 'env(safe-area-inset-left)', 'important');
        headerElement.style.setProperty('padding-right', 'env(safe-area-inset-right)', 'important');
      });

      // FORÇA viewport fixo
      document.documentElement.style.setProperty('--app-height', `${initialHeightRef.current}px`);
      document.documentElement.style.setProperty('position', 'fixed', 'important');
      document.documentElement.style.setProperty('width', '100%', 'important');
      document.documentElement.style.setProperty('height', `${initialHeightRef.current}px`, 'important');
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      
      document.body.style.setProperty('position', 'fixed', 'important');
      document.body.style.setProperty('top', '0', 'important');
      document.body.style.setProperty('left', '0', 'important');
      document.body.style.setProperty('width', '100%', 'important');
      document.body.style.setProperty('height', `${initialHeightRef.current}px`, 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
    };

    // Aplica fixes imediatamente
    forceHeaderFixed();

    // FORÇA re-aplicação constante
    fixIntervalRef.current = setInterval(forceHeaderFixed, 100);

    // Listeners para eventos
    const events = ['resize', 'orientationchange', 'focusin', 'focusout', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, forceHeaderFixed);
      document.addEventListener(event, forceHeaderFixed);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', forceHeaderFixed);
      window.visualViewport.addEventListener('scroll', forceHeaderFixed);
    }

    // Observer para mudanças no DOM
    const observer = new MutationObserver(forceHeaderFixed);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });

    // Cleanup
    return () => {
      if (fixIntervalRef.current) {
        clearInterval(fixIntervalRef.current);
      }
      
      events.forEach(event => {
        window.removeEventListener(event, forceHeaderFixed);
        document.removeEventListener(event, forceHeaderFixed);
      });

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', forceHeaderFixed);
        window.visualViewport.removeEventListener('scroll', forceHeaderFixed);
      }

      observer.disconnect();
    };
  }, []);

  return null; // Este componente não renderiza nada
} 