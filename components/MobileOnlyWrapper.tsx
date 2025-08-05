'use client';
import { useMobileOnly } from '@/hooks/useDeviceDetection';
import MobileOnlyPage from './MobileOnlyPage';
import { shouldBlockDesktop, shouldShowBlockPage } from '@/lib/config';

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
  const { shouldBlockDesktop: deviceShouldBlock, canAccess } = useMobileOnly(forceMobile);
  
  // Combinar configuração do app com detecção do dispositivo
  const shouldBlock = shouldBlockDesktop() || deviceShouldBlock;
  const showBlock = shouldShowBlockPage() && showBlockPage;

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