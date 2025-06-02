'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const IOSPWAHeaderFix = dynamic(() => import('@/components/IOSPWAHeaderFix'), {
  ssr: false,
  loading: () => null,
});

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only apply viewport fix on client side
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Import and apply the viewport fix manually
    import('@/hooks/useFixViewportHeight').then(({ useFixViewportHeight }) => {
      // Since we can't use hooks conditionally, we'll manually apply the logic
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      const isPWA = (window.navigator as any).standalone === true || 
                    window.matchMedia('(display-mode: standalone)').matches;

      if (!isIOS || !isPWA) {
        console.log('❌ Not iOS PWA, skipping viewport fix');
        return;
      }

      console.log('🔍 iOS PWA detected - applying minimal viewport fix');
      
      const applyIOSPWAFixes = () => {
        if (typeof window === 'undefined' || !isPWA) return;

        try {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.clientHeight;
          const targetHeight = windowHeight;
          
          document.documentElement.style.setProperty('--app-height', `${targetHeight}px`);
          document.body.style.height = `${targetHeight}px`;
          document.body.style.minHeight = `${targetHeight}px`;
          document.body.style.maxHeight = `${targetHeight}px`;
          document.documentElement.style.height = `${targetHeight}px`;
          document.documentElement.style.minHeight = `${targetHeight}px`;
          document.documentElement.style.maxHeight = `${targetHeight}px`;
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          
          console.log(`[iOS PWA Fix] Applied height: ${targetHeight}px (window: ${windowHeight}px, doc: ${documentHeight}px)`);
        } catch (error) {
          console.error('[iOS PWA Fix] Error applying fixes:', error);
        }
      };

      applyIOSPWAFixes();
      window.addEventListener('resize', applyIOSPWAFixes);

      return () => {
        window.removeEventListener('resize', applyIOSPWAFixes);
      };
    }).catch(error => {
      console.error('Error loading viewport fix:', error);
    });
  }, [isClient]);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <>
      <IOSPWAHeaderFix />
      {children}
    </>
  );
} 