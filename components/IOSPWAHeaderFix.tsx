'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const originalHeaderRef = useRef<HTMLElement | null>(null);
  const clonedHeaderRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isRecreatingRef = useRef<boolean>(false);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] 🚀 ULTIMATE SOLUTION - Recreating header every frame');

      const createHeaderContainer = () => {
        // Create a container that iOS cannot touch
        if (!containerRef.current) {
          const container = document.createElement('div');
          container.id = 'ultimate-header-container';
          container.style.cssText = `
            position: fixed !important;
            top: 0px !important;
            left: 0px !important;
            right: 0px !important;
            z-index: 10000 !important;
            pointer-events: none !important;
            width: 100% !important;
            height: auto !important;
          `;
          document.body.appendChild(container);
          containerRef.current = container;
        }
        return containerRef.current;
      };

      const recreateHeader = () => {
        if (isRecreatingRef.current) return;
        isRecreatingRef.current = true;

        try {
          // Find the original header
          const originalHeader = document.querySelector('[data-header="true"]') as HTMLElement;
          if (!originalHeader) {
            isRecreatingRef.current = false;
            return;
          }

          originalHeaderRef.current = originalHeader;

          // Hide the original header completely
          originalHeader.style.cssText = `
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          `;

          // Create container
          const container = createHeaderContainer();

          // Remove any existing cloned header
          if (clonedHeaderRef.current) {
            clonedHeaderRef.current.remove();
          }

          // Clone the original header
          const clonedHeader = originalHeader.cloneNode(true) as HTMLElement;
          clonedHeaderRef.current = clonedHeader;

          // Force the cloned header to be at the top
          clonedHeader.style.cssText = `
            position: relative !important;
            top: 0px !important;
            left: 0px !important;
            right: 0px !important;
            z-index: 10000 !important;
            pointer-events: auto !important;
            width: 100% !important;
            margin: 0px !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
            transform: none !important;
            -webkit-transform: none !important;
            background: var(--secondary, #16153A) !important;
          `;

          // Add the cloned header to our container
          container.appendChild(clonedHeader);

          console.log('[IOSPWAHeaderFix] ✅ Header recreated and positioned at top');
        } catch (error) {
          console.error('[IOSPWAHeaderFix] Error recreating header:', error);
        } finally {
          isRecreatingRef.current = false;
        }
      };

      // Initial recreation
      setTimeout(recreateHeader, 100);

      // ULTIMATE: Recreate header every frame when keyboard events happen
      let isKeyboardOpen = false;
      
      const handleKeyboardEvents = () => {
        const currentHeight = window.innerHeight;
        const wasKeyboardOpen = isKeyboardOpen;
        isKeyboardOpen = currentHeight < window.screen.height * 0.75;

        if (isKeyboardOpen !== wasKeyboardOpen) {
          console.log(`[IOSPWAHeaderFix] Keyboard ${isKeyboardOpen ? 'opened' : 'closed'} - recreating header`);
          recreateHeader();
          
          // Recreate multiple times to ensure it sticks
          setTimeout(recreateHeader, 10);
          setTimeout(recreateHeader, 50);
          setTimeout(recreateHeader, 100);
        }
      };

      // Monitor all possible events
      window.addEventListener('resize', handleKeyboardEvents);
      window.addEventListener('orientationchange', recreateHeader);
      document.addEventListener('focusin', handleKeyboardEvents);
      document.addEventListener('focusout', handleKeyboardEvents);

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleKeyboardEvents);
      }

      // ULTIMATE: Continuous recreation during keyboard usage
      const ultimateInterval = setInterval(() => {
        if (isKeyboardOpen && !isRecreatingRef.current) {
          recreateHeader();
        }
      }, 100);

      // Monitor if our cloned header gets moved and recreate immediately
      const monitorInterval = setInterval(() => {
        if (clonedHeaderRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          if (containerRect.top !== 0) {
            console.log(`[IOSPWAHeaderFix] 🚨 Container moved to ${containerRect.top}px - RECREATING`);
            recreateHeader();
          }
        }
      }, 50);

      // Cleanup
      return () => {
        clearInterval(ultimateInterval);
        clearInterval(monitorInterval);
        
        window.removeEventListener('resize', handleKeyboardEvents);
        window.removeEventListener('orientationchange', recreateHeader);
        document.addEventListener('focusin', handleKeyboardEvents);
        document.removeEventListener('focusout', handleKeyboardEvents);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleKeyboardEvents);
        }

        // Restore original header
        if (originalHeaderRef.current) {
          originalHeaderRef.current.style.cssText = '';
        }

        // Remove our container
        if (containerRef.current) {
          containerRef.current.remove();
        }
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 