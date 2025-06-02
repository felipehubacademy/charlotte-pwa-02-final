'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const originalHeaderRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] 🔥 FINAL ATTEMPT - Sticky viewport header');

      const createStickyHeader = () => {
        // Find original header
        const originalHeader = document.querySelector('[data-header="true"]') as HTMLElement;
        if (!originalHeader) return;

        originalHeaderRef.current = originalHeader;

        // Hide original completely
        originalHeader.style.display = 'none';

        // Remove existing sticky header
        if (stickyHeaderRef.current) {
          stickyHeaderRef.current.remove();
        }

        // Create sticky header that iOS cannot touch
        const stickyHeader = document.createElement('div');
        stickyHeader.id = 'ios-sticky-header';
        stickyHeaderRef.current = stickyHeader;

        // Copy content from original
        stickyHeader.innerHTML = originalHeader.innerHTML;

        // FINAL ATTEMPT: Use all possible CSS tricks
        stickyHeader.style.cssText = `
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100vw !important;
          height: auto !important;
          z-index: 999999 !important;
          background: var(--secondary, #16153A) !important;
          transform: translate3d(0, 0, 0) !important;
          -webkit-transform: translate3d(0, 0, 0) !important;
          will-change: transform !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          contain: layout style paint !important;
          isolation: isolate !important;
          margin: 0 !important;
          padding: env(safe-area-inset-top, 0) 1rem 1rem 1rem !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          min-height: 60px !important;
        `;

        // Insert at the very beginning of body
        document.body.insertBefore(stickyHeader, document.body.firstChild);

        // Force body to have padding-top to account for header
        document.body.style.paddingTop = '80px';

        console.log('[IOSPWAHeaderFix] ✅ Sticky header created');
      };

      // Create immediately
      createStickyHeader();

      // Recreate on any viewport change
      const handleViewportChange = () => {
        setTimeout(createStickyHeader, 10);
      };

      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('orientationchange', handleViewportChange);
      document.addEventListener('focusin', handleViewportChange);
      document.addEventListener('focusout', handleViewportChange);

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
      }

      // Monitor and recreate if moved
      const monitorInterval = setInterval(() => {
        if (stickyHeaderRef.current) {
          const rect = stickyHeaderRef.current.getBoundingClientRect();
          if (rect.top < -50 || rect.top > 100) {
            console.log(`[IOSPWAHeaderFix] 🚨 Sticky header moved to ${rect.top}px - RECREATING`);
            createStickyHeader();
          }
        }
      }, 100);

      // Cleanup
      return () => {
        clearInterval(monitorInterval);
        
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
        document.removeEventListener('focusin', handleViewportChange);
        document.removeEventListener('focusout', handleViewportChange);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
        }

        // Restore original
        if (originalHeaderRef.current) {
          originalHeaderRef.current.style.display = '';
        }

        // Remove sticky header
        if (stickyHeaderRef.current) {
          stickyHeaderRef.current.remove();
        }

        // Remove body padding
        document.body.style.paddingTop = '';
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 