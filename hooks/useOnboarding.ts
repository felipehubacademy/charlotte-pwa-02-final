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
        
        console.log('🎓 Loading onboarding state for key:', storageKey);
        const saved = localStorage.getItem(storageKey);
        console.log('🎓 Saved onboarding data:', saved);
        
        if (saved) {
          const parsed: OnboardingState = JSON.parse(saved);
          console.log('🎓 Parsed onboarding state:', parsed);
          setOnboardingState(parsed);
          
          // 🔧 CORRIGIDO: Verificação mais rigorosa - só mostrar se NUNCA completou
          if (!parsed.hasCompletedMainTour) {
            console.log('🎓 Tour not completed - showing tour');
            // Delay para garantir que a página carregou completamente
            setTimeout(() => {
              setShowMainTour(true);
            }, 1000);
          } else {
            console.log('🎓 Tour already completed - not showing');
            setShowMainTour(false);
          }
        } else {
          console.log('🎓 No saved state - first visit, showing tour');
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

    // 🔧 NOVO: Só carregar se tiver userId (evitar problemas de timing)
    if (userId) {
      loadOnboardingState();
    } else {
      // Se não tem userId ainda, aguardar um pouco
      const timer = setTimeout(() => {
        loadOnboardingState();
      }, 500);
      
      return () => clearTimeout(timer);
    }
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
      
      console.log('🎓 Saving onboarding state:', { storageKey, updatedState });
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
      setOnboardingState(updatedState);
      
      // 🔧 NOVO: Verificar se foi salvo corretamente
      const verification = localStorage.getItem(storageKey);
      console.log('🎓 Verification - saved data:', verification);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  // Completar tour principal
  const completeMainTour = () => {
    console.log('🎓 Completing main tour');
    saveOnboardingState({
      hasCompletedMainTour: true,
      isFirstVisit: false
    });
    setShowMainTour(false);
  };

  // Pular tour principal
  const skipMainTour = () => {
    console.log('🎓 Skipping main tour');
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