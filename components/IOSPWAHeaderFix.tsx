'use client';

import { useEffect } from 'react';

export default function IOSPWAHeaderFix() {
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] Initializing for iOS PWA');

      const applyHeaderFix = () => {
        if (typeof window === 'undefined') return;
        
        const header = document.querySelector('[data-header="true"]') as HTMLElement;
        if (!header) return;

        try {
          // Apply minimal but effective fixes
          header.style.position = 'fixed';
          header.style.top = '0px';
          header.style.left = '0px';
          header.style.right = '0px';
          header.style.zIndex = '9999';
          header.style.transform = 'translateZ(0)';
          header.style.webkitTransform = 'translateZ(0)';
          header.style.webkitBackfaceVisibility = 'hidden';
          header.style.backfaceVisibility = 'hidden';
        } catch (error) {
          console.error('[IOSPWAHeaderFix] Error applying header fix:', error);
        }
      };

      // Apply fix immediately
      applyHeaderFix();

      // Apply fix after a short delay to ensure DOM is ready
      const timeoutId = setTimeout(applyHeaderFix, 100);

      // Listen for resize events (keyboard open/close)
      const handleResize = () => {
        requestAnimationFrame(applyHeaderFix);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 