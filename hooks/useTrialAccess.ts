// hooks/useTrialAccess.ts
// Hook para gerenciar acesso temporário (trial)

import { useState, useEffect } from 'react';
import { TrialAccessService, TrialStatus } from '@/lib/trial-access-service';

export interface UseTrialAccessReturn {
  trialStatus: TrialStatus;
  isLoading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  daysRemaining: number;
  refreshTrialStatus: () => Promise<void>;
}

export function useTrialAccess(userId?: string): UseTrialAccessReturn {
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    hasTrial: false,
    isExpired: false,
    daysRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshTrialStatus = async () => {
    if (!userId) {
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
      return;
    }

    setIsLoading(true);
    try {
      const status = await TrialAccessService.getTrialStatus(userId);
      setTrialStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status do trial:', error);
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTrialStatus();
  }, [userId]);

  return {
    trialStatus,
    isLoading,
    hasAccess: trialStatus.hasTrial && !trialStatus.isExpired,
    isExpired: trialStatus.isExpired,
    daysRemaining: trialStatus.daysRemaining,
    refreshTrialStatus
  };
}
