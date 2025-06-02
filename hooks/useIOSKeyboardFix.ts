'use client';

import { useEffect, useState } from 'react';

interface KeyboardState {
  isOpen: boolean;
  height: number;
  overlaysContent: boolean;
}

// Helper function to detect iOS PWA
const isIOSPWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    ((window.navigator as any).standalone === true || 
     window.matchMedia('(display-mode: standalone)').matches) &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  );
};

export const useIOSKeyboardFix = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
    overlaysContent: false
  });

  const [isIOSPWAMode, setIsIOSPWAMode] = useState(false);

  useEffect(() => {
    const isPWA = isIOSPWA();
    setIsIOSPWAMode(isPWA);

    if (!isPWA) return;

    // Enable VirtualKeyboard API if available
    if ('virtualKeyboard' in navigator) {
      const virtualKeyboard = (navigator as any).virtualKeyboard;
      
      // Enable overlay mode to prevent viewport resize
      virtualKeyboard.overlaysContent = true;
      
      setKeyboardState(prev => ({ 
        ...prev, 
        overlaysContent: true 
      }));

      // Listen for keyboard geometry changes
      const handleGeometryChange = () => {
        const rect = virtualKeyboard.boundingRect;
        const isOpen = rect.height > 0;
        
        setKeyboardState(prev => ({
          ...prev,
          isOpen,
          height: rect.height
        }));
      };

      virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
      
      return () => {
        virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      };
    } else {
      // Fallback for older iOS versions
      const initialHeight = window.innerHeight;
      
      const handleViewportChange = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        setKeyboardState(prev => ({
          ...prev,
          isOpen: heightDiff > 150, // Threshold for keyboard detection
          height: Math.max(0, heightDiff)
        }));
      };

      // Listen for viewport changes
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        return () => {
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
        };
      }

      // Fallback: window resize
      window.addEventListener('resize', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return { keyboardState, isIOSPWAMode };
}; 