'use client';
import { useMobileOnly } from '@/hooks/useDeviceDetection';
import MobileOnlyPage from './MobileOnlyPage';
import { shouldBlockDesktop, shouldShowBlockPage } from '@/lib/config';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface MobileOnlyWrapperProps {
  children: React.ReactNode;
  forceMobile?: boolean;
  showBlockPage?: boolean;
}

export default function MobileOnlyWrapper({ 
  children, 
  forceMobile = false,
  showBlockPage = true 
}: MobileOnlyWrapperProps) {
  const { shouldBlockDesktop: deviceShouldBlock, shouldBlockMobileBrowser, canAccess, isMobile, isPWA, isDesktop } = useMobileOnly(forceMobile);
  const router = useRouter();
  const pathname = usePathname();
  
  // 🔍 DEBUG: Log detalhado
  console.log('🔍 [MobileOnlyWrapper] Debug:', {
    pathname,
    isMobile,
    isPWA,
    isDesktop,
    shouldBlockDesktop: deviceShouldBlock,
    shouldBlockMobileBrowser,
    canAccess
  });

  // ✅ NOVO: Redirecionar mobile browser para /install (exceto se já estiver lá)
  useEffect(() => {
    if (shouldBlockMobileBrowser && pathname !== '/install') {
      console.log('📱 Mobile browser detected, redirecting to /install');
      router.push('/install');
    }
  }, [shouldBlockMobileBrowser, router, pathname]);

  // ✅ PERMITIR /install no mobile browser
  if (shouldBlockMobileBrowser && pathname === '/install') {
    console.log('📱 Mobile browser on /install page, allowing access');
    return <>{children}</>;
  }

  // ✅ BLOQUEAR DESKTOP (sempre)
  if (deviceShouldBlock) {
    console.log('🖥️ Desktop detected, showing block page');
    return <MobileOnlyPage />;
  }

  // ✅ PWA MOBILE - ACESSO NORMAL
  if (isMobile && isPWA) {
    console.log('📱 Mobile PWA detected, allowing access');
    return <>{children}</>;
  }

  // ✅ MOBILE BROWSER - BLOQUEAR (exceto /install já tratado acima)
  if (shouldBlockMobileBrowser) {
    console.log('📱 Mobile browser blocked');
    return null; // Já redirecionou no useEffect
  }

  // ✅ ACESSO PERMITIDO
  console.log('✅ Access allowed');
  return <>{children}</>;
} 