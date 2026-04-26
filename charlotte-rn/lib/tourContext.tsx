import React, {
  createContext, useContext, useState, useRef, useCallback, ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { TourOverlay } from '@/components/ui/TourOverlay';

export interface TourStep {
  ref: React.RefObject<any>;
  title: string;
  description: string;
  onBeforeMeasure?: () => Promise<void>;
}

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextType {
  startTour: (tourId: string, steps: TourStep[]) => Promise<void>;
  resetTour: (tourId: string) => Promise<void>;
}

const TourContext = createContext<TourContextType>({
  startTour: async () => {},
  resetTour:  async () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive]         = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);
  const [steps, setSteps]               = useState<TourStep[]>([]);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const tourIdRef = useRef<string>('');

  const measureStep = useCallback((step: TourStep): Promise<void> =>
    new Promise((resolve) => {
      if (!step.ref?.current) { resolve(); return; }
      step.ref.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          const pad = 8;
          setSpotlightRect({ x: x - pad, y: y - pad, width: width + pad * 2, height: height + pad * 2 });
          resolve();
        },
      );
    }),
  []);

  const startTour = useCallback(async (tourId: string, tourSteps: TourStep[]) => {
    const done = await SecureStore.getItemAsync(`TOUR_${tourId}_DONE`).catch(() => null);
    if (done) return;
    tourIdRef.current = tourId;
    setSteps(tourSteps);
    setCurrentStep(0);
    setTimeout(async () => {
      const first = tourSteps[0];
      if (!first) return;
      if (first.onBeforeMeasure) await first.onBeforeMeasure();
      await measureStep(first);
      setIsActive(true);
    }, 700);
  }, [measureStep]);

  const nextStep = useCallback(async () => {
    const next = currentStep + 1;
    if (next >= steps.length) {
      await SecureStore.setItemAsync(`TOUR_${tourIdRef.current}_DONE`, '1').catch(() => {});
      setIsActive(false);
      setSpotlightRect(null);
      return;
    }
    setCurrentStep(next);
    const step = steps[next];
    if (step.onBeforeMeasure) await step.onBeforeMeasure();
    await measureStep(step);
  }, [currentStep, steps, measureStep]);

  const skipTour = useCallback(async () => {
    await SecureStore.setItemAsync(`TOUR_${tourIdRef.current}_DONE`, '1').catch(() => {});
    setIsActive(false);
    setSpotlightRect(null);
  }, []);

  const resetTour = useCallback(async (tourId: string) => {
    await SecureStore.deleteItemAsync(`TOUR_${tourId}_DONE`).catch(() => {});
  }, []);

  return (
    <TourContext.Provider value={{ startTour, resetTour }}>
      {children}
      {isActive && spotlightRect && (
        <TourOverlay
          step={steps[currentStep]}
          stepIndex={currentStep}
          totalSteps={steps.length}
          spotlightRect={spotlightRect}
          onNext={nextStep}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
