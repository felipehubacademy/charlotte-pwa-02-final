'use client';

import { useState, useEffect } from 'react';

interface OnboardingState {
  hasCompletedMainTour: boolean;
  isFirstVisit: boolean;
  lastVisitDate: string | null;
}

interface UseOnboardingReturn {
  // Estado
  showMainTour: boolean;
  isFirstVisit: boolean;
  
  // Ações
  completeMainTour: () => void;
  skipMainTour: () => void;
  resetOnboarding: () => void; // Para debug/testing
  
  // Checkers
  shouldShowMainTour: () => boolean;
}

const ONBOARDING_STORAGE_KEY = 'charlotte-onboarding-state';

export const useOnboarding = (userId?: string): UseOnboardingReturn => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedMainTour: false,
    isFirstVisit: true,
    lastVisitDate: null
  });

  const [showMainTour, setShowMainTour] = useState(false);

  // Carregar estado do localStorage
  useEffect(() => {
    const loadOnboardingState = () => {
      try {
        const storageKey = userId ? `${ONBOARDING_STORAGE_KEY}-${userId}` : ONBOARDING_STORAGE_KEY;
        
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
          const parsed: OnboardingState = JSON.parse(saved);
          setOnboardingState(parsed);
          
          // Verificar se deve mostrar o tour principal
          if (!parsed.hasCompletedMainTour && parsed.isFirstVisit) {
            // Delay para garantir que a página carregou completamente
            setTimeout(() => {
              setShowMainTour(true);
            }, 1000);
          }
        } else {
          // Primeira visita - mostrar tour principal após delay
          setTimeout(() => {
            setShowMainTour(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
        // Em caso de erro, tratar como primeira visita
        setTimeout(() => {
          setShowMainTour(true);
        }, 1000);
      }
    };

    loadOnboardingState();
  }, [userId]);

  // Salvar estado no localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    try {
      const storageKey = userId ? `${ONBOARDING_STORAGE_KEY}-${userId}` : ONBOARDING_STORAGE_KEY;
      const updatedState = {
        ...onboardingState,
        ...newState,
        lastVisitDate: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
      setOnboardingState(updatedState);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  // Completar tour principal
  const completeMainTour = () => {
    saveOnboardingState({
      hasCompletedMainTour: true,
      isFirstVisit: false
    });
    setShowMainTour(false);
  };

  // Pular tour principal
  const skipMainTour = () => {
    saveOnboardingState({
      hasCompletedMainTour: true,
      isFirstVisit: false
    });
    setShowMainTour(false);
  };

  // Reset onboarding (para debug/testing)
  const resetOnboarding = () => {
    const storageKey = userId ? `${ONBOARDING_STORAGE_KEY}-${userId}` : ONBOARDING_STORAGE_KEY;
    localStorage.removeItem(storageKey);
    
    const resetState: OnboardingState = {
      hasCompletedMainTour: false,
      isFirstVisit: true,
      lastVisitDate: null
    };
    
    setOnboardingState(resetState);
    setShowMainTour(false);
  };

  // Verificar se deve mostrar tour principal
  const shouldShowMainTour = (): boolean => {
    return !onboardingState.hasCompletedMainTour && onboardingState.isFirstVisit;
  };

  return {
    // Estado
    showMainTour,
    isFirstVisit: onboardingState.isFirstVisit,
    
    // Ações
    completeMainTour,
    skipMainTour,
    resetOnboarding,
    
    // Checkers
    shouldShowMainTour
  };
}; 