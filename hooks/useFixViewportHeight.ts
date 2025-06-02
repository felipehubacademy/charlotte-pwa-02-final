'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useFixViewportHeight() {
  const initialHeightRef = useRef<number>(0);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
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

      const applyIOSPWAFixes = () => {
        if (typeof window === 'undefined' || !isPWA) return;

        try {
          // Use window.innerHeight for iOS PWA instead of document height
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.clientHeight;
          
          // For iOS PWA, we want to use the full window height
          const targetHeight = windowHeight;
          
          // Set CSS custom property
          document.documentElement.style.setProperty('--app-height', `${targetHeight}px`);
          
          // Force body height to match window height
          document.body.style.height = `${targetHeight}px`;
          document.body.style.minHeight = `${targetHeight}px`;
          document.body.style.maxHeight = `${targetHeight}px`;
          
          // Ensure html height is also set
          document.documentElement.style.height = `${targetHeight}px`;
          document.documentElement.style.minHeight = `${targetHeight}px`;
          document.documentElement.style.maxHeight = `${targetHeight}px`;
          
          // Force overflow hidden to prevent scrolling issues
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          
          console.log(`[iOS PWA Fix] Applied height: ${targetHeight}px (window: ${windowHeight}px, doc: ${documentHeight}px)`);
        } catch (error) {
          console.error('[iOS PWA Fix] Error applying fixes:', error);
        }
      };

      applyIOSPWAFixes();

      // Listener apenas para resize
      window.addEventListener('resize', applyIOSPWAFixes);

      return () => {
        window.removeEventListener('resize', applyIOSPWAFixes);
      };
    } catch (error) {
      console.error('[useFixViewportHeight] Error:', error);
    }
  }, []);
} 