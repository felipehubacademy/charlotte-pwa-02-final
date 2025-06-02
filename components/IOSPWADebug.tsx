'use client';

import { useEffect, useState } from 'react';

interface DebugInfo {
  isIOS: boolean;
  isPWA: boolean;
  userAgent: string;
  standalone: boolean;
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
}

export default function IOSPWADebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      const isPWA = (window.navigator as any).standalone === true || 
                    window.matchMedia('(display-mode: standalone)').matches ||
                    window.matchMedia('(display-mode: fullscreen)').matches ||
                    window.matchMedia('(display-mode: minimal-ui)').matches;

      const getComputedStyleValue = (property: string): string => {
        return window.getComputedStyle(document.documentElement).getPropertyValue(property) || 'not set';
      };

      // Get header info
      const header = document.querySelector('header, [data-header="true"]') as HTMLElement;
      const headerPosition = header ? window.getComputedStyle(header).position : 'not found';
      const headerTop = header ? window.getComputedStyle(header).top : 'not found';
      const headerZIndex = header ? window.getComputedStyle(header).zIndex : 'not found';

      setDebugInfo({
        isIOS,
        isPWA,
        userAgent: navigator.userAgent,
        standalone: (window.navigator as any).standalone === true,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        windowHeight: window.innerHeight,
        documentHeight: document.documentElement.clientHeight,
        bodyHeight: document.body.clientHeight,
        appHeight: getComputedStyleValue('--app-height'),
        keyboardHeight: getComputedStyleValue('--keyboard-height'),
        safeAreaTop: getComputedStyleValue('--safe-area-inset-top'),
        safeAreaBottom: getComputedStyleValue('--safe-area-inset-bottom'),
        headerPosition,
        headerTop,
        headerZIndex
      });
    };

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
  }, []);

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
          
          <div className="space-y-1">
            <div className={`${debugInfo.isIOS ? 'text-green-400' : 'text-red-400'}`}>
              iOS: {debugInfo.isIOS ? '✅' : '❌'}
            </div>
            <div className={`${debugInfo.isPWA ? 'text-green-400' : 'text-red-400'}`}>
              PWA: {debugInfo.isPWA ? '✅' : '❌'}
            </div>
            <div className={`${debugInfo.standalone ? 'text-green-400' : 'text-red-400'}`}>
              Standalone: {debugInfo.standalone ? '✅' : '❌'}
            </div>
            <div>Display Mode: {debugInfo.displayMode}</div>
            <div>Window Height: {debugInfo.windowHeight}px</div>
            <div>Document Height: {debugInfo.documentHeight}px</div>
            <div>Body Height: {debugInfo.bodyHeight}px</div>
            <div>App Height: {debugInfo.appHeight}</div>
            <div>Keyboard Height: {debugInfo.keyboardHeight}</div>
            <div>Safe Area Top: {debugInfo.safeAreaTop}</div>
            <div>Safe Area Bottom: {debugInfo.safeAreaBottom}</div>
            <div>Header Position: {debugInfo.headerPosition}</div>
            <div>Header Top: {debugInfo.headerTop}</div>
            <div>Header Z-Index: {debugInfo.headerZIndex}</div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-gray-400 text-[10px] break-all">
                UA: {debugInfo.userAgent}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-yellow-400 text-[10px]">
                Body Classes: {document.body.className}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 