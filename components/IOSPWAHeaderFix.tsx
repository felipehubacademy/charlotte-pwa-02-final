'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const initialViewportHeight = useRef<number>(0);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] Initializing AGGRESSIVE header fix for iOS PWA');

      // Store initial viewport height
      initialViewportHeight.current = window.innerHeight;

      const forceHeaderPosition = () => {
        if (typeof window === 'undefined') return;
        
        const header = document.querySelector('[data-header="true"]') as HTMLElement;
        if (!header) return;

        headerRef.current = header;

        try {
          // ULTRA AGGRESSIVE: Force position with !important via style attribute
          header.style.cssText = `
            position: fixed !important;
            top: 0px !important;
            left: 0px !important;
            right: 0px !important;
            z-index: 9999 !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
            -webkit-backface-visibility: hidden !important;
            backface-visibility: hidden !important;
            will-change: transform !important;
            width: 100% !important;
            max-width: 100vw !important;
          `;

          // Force the header to stay at the top of the VISUAL viewport
          if (window.visualViewport) {
            header.style.top = `${window.visualViewport.offsetTop}px !important`;
          }

          console.log('[IOSPWAHeaderFix] Applied AGGRESSIVE header positioning');
        } catch (error) {
          console.error('[IOSPWAHeaderFix] Error applying header fix:', error);
        }
      };

      // Apply fix immediately
      forceHeaderPosition();

      // Apply fix after DOM is ready
      setTimeout(forceHeaderPosition, 50);
      setTimeout(forceHeaderPosition, 100);
      setTimeout(forceHeaderPosition, 200);

      // AGGRESSIVE: Monitor viewport changes
      const handleViewportChange = () => {
        requestAnimationFrame(() => {
          forceHeaderPosition();
          
          // Double-check after a short delay
          setTimeout(forceHeaderPosition, 10);
        });
      };

      // Listen to ALL possible events that could move the header
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('orientationchange', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange);
      document.addEventListener('focusin', handleViewportChange);
      document.addEventListener('focusout', handleViewportChange);

      // Visual Viewport API for more precise control
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }

      // ULTRA AGGRESSIVE: Polling to ensure header stays in place
      const pollingInterval = setInterval(() => {
        if (headerRef.current) {
          const rect = headerRef.current.getBoundingClientRect();
          // If header moved from top, force it back
          if (rect.top !== 0) {
            console.log(`[IOSPWAHeaderFix] Header moved to ${rect.top}px, forcing back to top`);
            forceHeaderPosition();
          }
        }
      }, 100); // Check every 100ms

      // Cleanup
      return () => {
        clearInterval(pollingInterval);
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange);
        document.removeEventListener('focusin', handleViewportChange);
        document.removeEventListener('focusout', handleViewportChange);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 