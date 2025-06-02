'use client';

import { useEffect, useRef } from 'react';

export default function IOSPWAHeaderFix() {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      // Only run on iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isIOS || !isPWA) return;

      console.log('[IOSPWAHeaderFix] 🎯 SIMPLE SOLUTION - Fixed overlay header');

      const createSimpleOverlay = () => {
        // Remove existing overlay
        if (overlayRef.current) {
          overlayRef.current.remove();
        }

        // Create simple overlay
        const overlay = document.createElement('div');
        overlay.id = 'simple-header-overlay';
        overlayRef.current = overlay;

        // Simple fixed overlay that iOS hopefully can't touch
        overlay.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          height: 80px !important;
          z-index: 999999 !important;
          background: #16153A !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 1rem !important;
          box-sizing: border-box !important;
          pointer-events: auto !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        `;

        // Add simple content
        overlay.innerHTML = `
          <div style="display: flex; align-items: center; color: white;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #A3FF3C; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <span style="color: black; font-weight: bold;">C</span>
            </div>
            <div>
              <div style="font-weight: bold; font-size: 16px;">Charlotte</div>
              <div style="font-size: 12px; color: #A3FF3C;">online</div>
            </div>
          </div>
          <div style="color: white; font-size: 24px; cursor: pointer;" onclick="window.history.back()">×</div>
        `;

        // Add to body
        document.body.appendChild(overlay);

        console.log('[IOSPWAHeaderFix] ✅ Simple overlay created');
      };

      // Create once and leave it alone
      createSimpleOverlay();

      // Only recreate if it gets completely removed
      const checkInterval = setInterval(() => {
        if (!document.getElementById('simple-header-overlay')) {
          console.log('[IOSPWAHeaderFix] 🔄 Overlay removed, recreating');
          createSimpleOverlay();
        }
      }, 5000); // Check every 5 seconds, not constantly

      // Cleanup
      return () => {
        clearInterval(checkInterval);
        
        if (overlayRef.current) {
          overlayRef.current.remove();
        }
      };
    } catch (error) {
      console.error('[IOSPWAHeaderFix] Error:', error);
    }
  }, []);

  return null;
} 