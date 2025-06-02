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

    console.log('🍎 iPhone PWA detected - applying header fixes');
    
    // Aguarda um pouco para o React carregar completamente
    setTimeout(() => {
      initialHeightRef.current = window.innerHeight;

      const forceHeaderFixed = () => {
        // FOCA APENAS nos headers - não mexe no html/body
        const headers = document.querySelectorAll('header, [data-header="true"], .ios-pwa-fixed-header');
        
        headers.forEach((header) => {
          const headerElement = header as HTMLElement;
          
          // FORÇA posicionamento fixo APENAS do header
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

        // Define apenas a altura customizada - NÃO força position fixed no html/body
        document.documentElement.style.setProperty('--app-height', `${initialHeightRef.current}px`);
      };

      // Aplica fixes imediatamente
      forceHeaderFixed();

      // FORÇA re-aplicação menos frequente para não travar
      fixIntervalRef.current = setInterval(forceHeaderFixed, 500);

      // Listeners para eventos importantes
      const events = ['resize', 'orientationchange', 'focusin', 'focusout'];
      events.forEach(event => {
        window.addEventListener(event, forceHeaderFixed);
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', forceHeaderFixed);
      }

      // Observer mais específico - apenas para mudanças de estilo nos headers
      const observer = new MutationObserver((mutations) => {
        let shouldFix = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' &&
              mutation.target instanceof HTMLElement &&
              (mutation.target.tagName === 'HEADER' || 
               mutation.target.hasAttribute('data-header'))) {
            shouldFix = true;
          }
        });
        if (shouldFix) {
          forceHeaderFixed();
        }
      });
      
      observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style']
      });

      // Cleanup
      return () => {
        if (fixIntervalRef.current) {
          clearInterval(fixIntervalRef.current);
        }
        
        events.forEach(event => {
          window.removeEventListener(event, forceHeaderFixed);
        });

        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', forceHeaderFixed);
        }

        observer.disconnect();
      };
    }, 1000); // Aguarda 1 segundo para o React carregar

  }, []);

  return null; // Este componente não renderiza nada
} 