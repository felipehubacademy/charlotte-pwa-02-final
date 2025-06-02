'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const initialViewportHeight = useRef<number>(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const isFixingRef = useRef<boolean>(false);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] Initializing ULTRA AGGRESSIVE header fix for iOS PWA');

      // Store initial viewport height
      initialViewportHeight.current = window.innerHeight;

      const forceHeaderPosition = () => {
        if (typeof window === 'undefined' || isFixingRef.current) return;
        
        const header = document.querySelector('[data-header="true"]') as HTMLElement;
        if (!header) return;

        headerRef.current = header;
        isFixingRef.current = true;

        try {
          // ULTRA AGGRESSIVE: Force position with !important via style attribute
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

          // FORCE: Override any transform that might move it
          header.style.setProperty('transform', 'translateZ(0) translateY(0px)', 'important');
          header.style.setProperty('-webkit-transform', 'translateZ(0) translateY(0px)', 'important');
          header.style.setProperty('top', '0px', 'important');

          console.log('[IOSPWAHeaderFix] Applied ULTRA AGGRESSIVE header positioning');
        } catch (error) {
          console.error('[IOSPWAHeaderFix] Error applying header fix:', error);
        } finally {
          isFixingRef.current = false;
        }
      };

      // Apply fix immediately and repeatedly
      forceHeaderPosition();
      setTimeout(forceHeaderPosition, 10);
      setTimeout(forceHeaderPosition, 50);
      setTimeout(forceHeaderPosition, 100);
      setTimeout(forceHeaderPosition, 200);

      // ULTRA AGGRESSIVE: Monitor viewport changes with immediate response
      const handleViewportChange = () => {
        // Use multiple requestAnimationFrame for immediate response
        requestAnimationFrame(() => {
          forceHeaderPosition();
          requestAnimationFrame(() => {
            forceHeaderPosition();
          });
        });
      };

      // Listen to ALL possible events that could move the header
      window.addEventListener('resize', handleViewportChange, { passive: false });
      window.addEventListener('orientationchange', handleViewportChange, { passive: false });
      window.addEventListener('scroll', handleViewportChange, { passive: false });
      document.addEventListener('focusin', handleViewportChange, { passive: false });
      document.addEventListener('focusout', handleViewportChange, { passive: false });

      // Visual Viewport API for more precise control
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }

      // HYPER AGGRESSIVE: Faster polling to catch and fix movement immediately
      const fastPollingInterval = setInterval(() => {
        if (headerRef.current && !isFixingRef.current) {
          const rect = headerRef.current.getBoundingClientRect();
          // If header moved from top, force it back IMMEDIATELY
          if (Math.abs(rect.top) > 1) { // Allow 1px tolerance
            console.log(`[IOSPWAHeaderFix] 🚨 Header moved to ${rect.top}px, FORCING back to top IMMEDIATELY`);
            forceHeaderPosition();
            // Double-fix after a tiny delay
            setTimeout(forceHeaderPosition, 5);
          }
        }
      }, 16); // Check every 16ms (60fps)

      // Secondary polling as backup
      const backupPollingInterval = setInterval(() => {
        if (headerRef.current && !isFixingRef.current) {
          const rect = headerRef.current.getBoundingClientRect();
          if (Math.abs(rect.top) > 1) {
            console.log(`[IOSPWAHeaderFix] 🔄 Backup fix: Header at ${rect.top}px`);
            forceHeaderPosition();
          }
        }
      }, 100);

      // Cleanup
      return () => {
        clearInterval(fastPollingInterval);
        clearInterval(backupPollingInterval);
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