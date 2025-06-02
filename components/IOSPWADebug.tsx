'use client';

import { useEffect, useState, useCallback } from 'react';

interface DebugInfo {
  isIOS: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  displayMode: string;
  windowHeight: number;
  documentHeight: number;
  bodyHeight: number;
  appHeight: string;
  keyboardHeight: string;
  safeAreaTop: string;
  safeAreaBottom: string;
  headerPosition: string;
  headerTop: string;
  headerZIndex: string;
  userAgent: string;
  bodyClasses: string;
  heightDifference: number;
}

export default function IOSPWADebug() {
  const [debugInfo, setDebugInfo] = useState({
    isIOS: false,
    isPWA: false,
    isStandalone: false,
    displayMode: '',
    windowHeight: 0,
    documentHeight: 0,
    bodyHeight: 0,
    appHeight: '',
    keyboardHeight: '',
    safeAreaTop: '',
    safeAreaBottom: '',
    headerPosition: '',
    headerTop: '',
    headerZIndex: '',
    userAgent: '',
    bodyClasses: '',
    heightDifference: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  const updateDebugInfo = useCallback(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const heightDifference = windowHeight - documentHeight;
      
      setDebugInfo({
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isPWA: window.matchMedia('(display-mode: standalone)').matches,
        isStandalone: (window.navigator as any).standalone === true,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        windowHeight,
        documentHeight,
        bodyHeight: document.body.clientHeight,
        appHeight: getComputedStyle(document.documentElement).getPropertyValue('--app-height') || 'not set',
        keyboardHeight: getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height') || 'not set',
        safeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px',
        safeAreaBottom: getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px',
        headerPosition: '',
        headerTop: '',
        headerZIndex: '',
        userAgent: navigator.userAgent,
        bodyClasses: document.body.className,
        heightDifference,
      });

      // Get header info
      const header = document.querySelector('[data-header="true"]') as HTMLElement;
      if (header) {
        const styles = getComputedStyle(header);
        const rect = header.getBoundingClientRect();
        setDebugInfo(prev => ({
          ...prev,
          headerPosition: styles.position,
          headerTop: `${styles.top} (actual: ${rect.top.toFixed(1)}px)`,
          headerZIndex: styles.zIndex,
        }));
      }
    } catch (error) {
      console.error('[IOSPWADebug] Error updating debug info:', error);
    }
  }, []);

  // Manual fix function
  const applyManualFix = useCallback(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    try {
      const windowHeight = window.innerHeight;
      
      // Set CSS custom property
      document.documentElement.style.setProperty('--app-height', `${windowHeight}px`);
      
      // Force body height to match window height
      document.body.style.height = `${windowHeight}px`;
      document.body.style.minHeight = `${windowHeight}px`;
      document.body.style.maxHeight = `${windowHeight}px`;
      
      // Ensure html height is also set
      document.documentElement.style.height = `${windowHeight}px`;
      document.documentElement.style.minHeight = `${windowHeight}px`;
      document.documentElement.style.maxHeight = `${windowHeight}px`;
      
      // Force overflow hidden
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Force header to stay fixed
      const header = document.querySelector('[data-header="true"]') as HTMLElement;
      if (header) {
        header.style.position = 'fixed';
        header.style.top = '0px';
        header.style.left = '0px';
        header.style.right = '0px';
        header.style.zIndex = '9999';
        header.style.transform = 'translateZ(0)';
        header.style.webkitTransform = 'translateZ(0)';
      }
      
      updateDebugInfo();
      console.log(`[Manual Fix] Applied window height: ${windowHeight}px`);
    } catch (error) {
      console.error('[IOSPWADebug] Error applying manual fix:', error);
    }
  }, [updateDebugInfo]);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    updateDebugInfo();

    // Atualiza a cada segundo
    const interval = setInterval(updateDebugInfo, 1000);

    // Atualiza em eventos
    window.addEventListener('resize', updateDebugInfo);
    window.addEventListener('orientationchange', updateDebugInfo);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDebugInfo);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateDebugInfo);
      window.removeEventListener('orientationchange', updateDebugInfo);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDebugInfo);
      }
    };
  }, [updateDebugInfo]);

  if (!debugInfo) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[10000] bg-red-500 text-white p-2 rounded-full text-xs font-mono"
        style={{ fontSize: '10px' }}
      >
        🐛
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed top-16 left-2 right-2 z-[10000] bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-yellow-400">iOS PWA Debug</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-1 text-xs">
            <div>iOS: {debugInfo.isIOS ? '✅' : '❌'}</div>
            <div>PWA: {debugInfo.isPWA ? '✅' : '❌'}</div>
            <div>Standalone: {debugInfo.isStandalone ? '✅' : '❌'}</div>
            <div>Display Mode: {debugInfo.displayMode}</div>
            <div>Window Height: {debugInfo.windowHeight}px</div>
            <div>Document Height: {debugInfo.documentHeight}px</div>
            <div className={debugInfo.heightDifference !== 0 ? 'text-yellow-400 font-bold' : ''}>
              Height Difference: {debugInfo.heightDifference}px
            </div>
            <div>Body Height: {debugInfo.bodyHeight}px</div>
            <div>App Height: {debugInfo.appHeight}</div>
            <div>Keyboard Height: {debugInfo.keyboardHeight}</div>
            <div>Safe Area Top: {debugInfo.safeAreaTop}</div>
            <div>Safe Area Bottom: {debugInfo.safeAreaBottom}</div>
            <div>Header Position: {debugInfo.headerPosition}</div>
            <div>Header Top: {debugInfo.headerTop}</div>
            <div>Header Z-Index: {debugInfo.headerZIndex}</div>
            <div className="text-xs break-all">UA: {debugInfo.userAgent}</div>
            <div className="text-xs break-all">Body Classes: {debugInfo.bodyClasses}</div>
            
            <div className="pt-2 space-y-1">
              <button 
                onClick={applyManualFix}
                className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                🔧 Apply Manual Fix
              </button>
              <button 
                onClick={updateDebugInfo}
                className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                🔄 Refresh Info
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 