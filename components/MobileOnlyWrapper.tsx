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
  const { shouldBlockDesktop: deviceShouldBlock, shouldBlockMobileBrowser, canAccess } = useMobileOnly(forceMobile);
  const router = useRouter();
  const pathname = usePathname();
  
  // Combinar configuração do app com detecção do dispositivo
  const shouldBlock = shouldBlockDesktop() || deviceShouldBlock;
  const showBlock = shouldShowBlockPage() && showBlockPage;

  // ✅ NOVO: Redirecionar mobile browser para /install (exceto se já estiver lá)
  useEffect(() => {
    if (shouldBlockMobileBrowser && pathname !== '/install') {
      console.log('📱 Mobile browser detected, redirecting to /install');
      router.push('/install');
    }
  }, [shouldBlockMobileBrowser, router, pathname]);

  // Se deve bloquear desktop e mostrar página de bloqueio
  if (shouldBlock && showBlock) {
    return <MobileOnlyPage />;
  }

  // Se deve bloquear mas não mostrar página (apenas não renderizar)
  if (shouldBlock && !showBlock) {
    return null;
  }

  // Se pode acessar, renderizar normalmente
  return <>{children}</>;
} 