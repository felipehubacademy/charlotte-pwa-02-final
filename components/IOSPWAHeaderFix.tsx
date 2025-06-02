'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const initialViewportHeight = useRef<number>(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const isFixingRef = useRef<boolean>(false);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] 🚀 NUCLEAR SOLUTION - Preventing header movement entirely');

      // Store initial viewport height
      initialViewportHeight.current = window.innerHeight;

      const lockHeaderPosition = () => {
        if (typeof window === 'undefined') return;
        
        const header = document.querySelector('[data-header="true"]') as HTMLElement;
        if (!header) return;

        headerRef.current = header;

        try {
          // NUCLEAR: Create a style lock that cannot be overridden
          const styleId = 'nuclear-header-lock';
          let styleElement = document.getElementById(styleId) as HTMLStyleElement;
          
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
          }

          // NUCLEAR CSS: Override everything with maximum specificity
          styleElement.textContent = `
            [data-header="true"] {
              position: fixed !important;
              top: 0px !important;
              left: 0px !important;
              right: 0px !important;
              z-index: 9999 !important;
              transform: translateZ(0) translateY(0px) !important;
              -webkit-transform: translateZ(0) translateY(0px) !important;
              margin: 0px !important;
              width: 100% !important;
              max-width: 100vw !important;
            }
            
            /* NUCLEAR: Override any possible iOS interference */
            html[data-ios-pwa] [data-header="true"],
            body[data-ios-pwa] [data-header="true"],
            .ios-pwa [data-header="true"] {
              position: fixed !important;
              top: 0px !important;
              transform: translateZ(0) translateY(0px) !important;
              -webkit-transform: translateZ(0) translateY(0px) !important;
            }
          `;

          // NUCLEAR: Force inline styles that override everything
          header.style.cssText = `
            position: fixed !important;
            top: 0px !important;
            left: 0px !important;
            right: 0px !important;
            z-index: 9999 !important;
            transform: translateZ(0) translateY(0px) !important;
            -webkit-transform: translateZ(0) translateY(0px) !important;
            -webkit-backface-visibility: hidden !important;
            backface-visibility: hidden !important;
            will-change: transform !important;
            width: 100% !important;
            max-width: 100vw !important;
            margin: 0px !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
          `;

          // NUCLEAR: Lock individual properties
          header.style.setProperty('position', 'fixed', 'important');
          header.style.setProperty('top', '0px', 'important');
          header.style.setProperty('transform', 'translateZ(0) translateY(0px)', 'important');
          header.style.setProperty('-webkit-transform', 'translateZ(0) translateY(0px)', 'important');

          // NUCLEAR: Add data attributes for CSS targeting
          document.documentElement.setAttribute('data-ios-pwa', 'true');
          document.body.setAttribute('data-ios-pwa', 'true');
          header.setAttribute('data-nuclear-locked', 'true');

          console.log('[IOSPWAHeaderFix] 🔒 NUCLEAR LOCK applied to header');
        } catch (error) {
          console.error('[IOSPWAHeaderFix] Error applying nuclear lock:', error);
        }
      };

      // NUCLEAR: Watch for ANY changes to the header and block them
      const createMutationObserver = () => {
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        }

        mutationObserverRef.current = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.target === headerRef.current) {
              if (mutation.attributeName === 'style') {
                console.log('[IOSPWAHeaderFix] 🚫 BLOCKED: iOS tried to change header style');
                lockHeaderPosition();
              }
            }
          });
        });

        if (headerRef.current) {
          mutationObserverRef.current.observe(headerRef.current, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: false
          });
        }
      };

      // Apply nuclear lock immediately and repeatedly
      lockHeaderPosition();
      setTimeout(lockHeaderPosition, 10);
      setTimeout(lockHeaderPosition, 50);
      setTimeout(lockHeaderPosition, 100);
      setTimeout(() => {
        lockHeaderPosition();
        createMutationObserver();
      }, 200);

      // NUCLEAR: Intercept viewport changes and re-lock immediately
      const handleViewportChange = () => {
        // Triple lock with multiple frames
        requestAnimationFrame(() => {
          lockHeaderPosition();
          requestAnimationFrame(() => {
            lockHeaderPosition();
            requestAnimationFrame(() => {
              lockHeaderPosition();
            });
          });
        });
      };

      // Listen to ALL possible events
      window.addEventListener('resize', handleViewportChange, { passive: false });
      window.addEventListener('orientationchange', handleViewportChange, { passive: false });
      window.addEventListener('scroll', handleViewportChange, { passive: false });
      document.addEventListener('focusin', handleViewportChange, { passive: false });
      document.addEventListener('focusout', handleViewportChange, { passive: false });

      // Visual Viewport API
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }

      // NUCLEAR: Ultra-fast polling with immediate re-lock
      const nuclearPollingInterval = setInterval(() => {
        if (headerRef.current && !isFixingRef.current) {
          const rect = headerRef.current.getBoundingClientRect();
          if (Math.abs(rect.top) > 1) {
            console.log(`[IOSPWAHeaderFix] 💥 NUCLEAR RESPONSE: Header at ${rect.top}px - RE-LOCKING`);
            isFixingRef.current = true;
            lockHeaderPosition();
            // Triple re-lock
            setTimeout(lockHeaderPosition, 1);
            setTimeout(lockHeaderPosition, 5);
            setTimeout(() => {
              lockHeaderPosition();
              isFixingRef.current = false;
            }, 10);
          }
        }
      }, 8); // Check every 8ms (120fps)

      // Cleanup
      return () => {
        clearInterval(nuclearPollingInterval);
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        }
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange);
        document.removeEventListener('focusin', handleViewportChange);
        document.removeEventListener('focusout', handleViewportChange);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }

        // Remove nuclear styles
        const styleElement = document.getElementById('nuclear-header-lock');
        if (styleElement) {
          styleElement.remove();
        }
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 