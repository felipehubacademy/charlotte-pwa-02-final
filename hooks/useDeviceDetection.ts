import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  userAgent: string;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isPWA: false,
    userAgent: ''
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      
      // Detectar mobile
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // Detectar tablet (iPad ou Android tablet)
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
      
      // Detectar desktop
      const isDesktop = !isMobile && !isTablet;
      
      // Detectar PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   (navigator as any).standalone === true;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isPWA,
        userAgent
      });
    };

    detectDevice();
    
    // Re-detectar se a orientação mudar
    window.addEventListener('orientationchange', detectDevice);
    window.addEventListener('resize', detectDevice);
    
    return () => {
      window.removeEventListener('orientationchange', detectDevice);
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return deviceInfo;
}

// Hook específico para controle de acesso
export function useMobileOnly(forceMobile: boolean = false) {
  const deviceInfo = useDeviceDetection();
  
  const shouldBlockDesktop = forceMobile && deviceInfo.isDesktop;
  
  return {
    ...deviceInfo,
    shouldBlockDesktop,
    canAccess: !shouldBlockDesktop
  };
} 