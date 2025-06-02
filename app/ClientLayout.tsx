'use client';

import { ReactNode } from 'react';
import { useFixViewportHeight } from '@/hooks/useFixViewportHeight';
import IOSPWAHeaderFix from '@/components/IOSPWAHeaderFix';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Aplica o fix de viewport para iOS PWA
  useFixViewportHeight();

  return (
    <>
      <IOSPWAHeaderFix />
      {children}
    </>
  );
} 