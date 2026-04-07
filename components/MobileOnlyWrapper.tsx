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
  
  // 🔓 PERMITIR POPUPS: Detectar se é um popup (janela pequena ou opener)
  const isPopup = typeof window !== 'undefined' && (
    window.opener || 
    window.innerWidth < 600 || 
    window.innerHeight < 600 ||
    window.location.search.includes('popup=true')
  );
  
  // 🔍 DEBUG: Log detalhado
  console.log('🔍 [MobileOnlyWrapper] Debug:', {
    pathname,
    isMobile,
    isPWA,
    isDesktop,
    shouldBlockDesktop: deviceShouldBlock,
    shouldBlockMobileBrowser,
    canAccess,
    isPopup
  });

  const isPublicPage = pathname === '/landing' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/privacidade' || pathname === '/termos';

  // ✅ NOVO: Redirecionar mobile browser para /install (exceto se já estiver lá ou for páginas públicas)
  useEffect(() => {
    if (shouldBlockMobileBrowser && pathname !== '/install' && !isPublicPage) {
      console.log('📱 Mobile browser detected, redirecting to /install');
      router.push('/install');
    }
  }, [shouldBlockMobileBrowser, router, pathname]);

  // ✅ PERMITIR POPUPS (login, auth, etc)
  if (isPopup) {
    console.log('🔓 Popup detected, allowing access for login/auth');
    return <>{children}</>;
  }

  // ✅ PERMITIR /install e páginas públicas no mobile browser
  if (shouldBlockMobileBrowser && (pathname === '/install' || isPublicPage)) {
    console.log('📱 Mobile browser on allowed page, allowing access');
    return <>{children}</>;
  }

  // ✅ BLOQUEAR DESKTOP (exceto popups e páginas públicas)
  if (deviceShouldBlock && !isPublicPage) {
    console.log('🖥️ Desktop detected, showing block page');
    return <MobileOnlyPage />;
  }

  // ✅ PERMITIR páginas públicas em qualquer dispositivo
  if (isPublicPage) {
    console.log('🔓 Public page detected, allowing access on any device');
    return <>{children}</>;
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