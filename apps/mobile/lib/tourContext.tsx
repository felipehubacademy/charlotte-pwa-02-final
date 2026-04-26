import React, {
  createContext, useContext, useState, useRef, useCallback, ReactNode,
} from 'react';
import { View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TourOverlay } from '@/components/ui/TourOverlay';

export interface TourStep {
  ref: React.RefObject<any>;
  title: string;
  description: string;
  spotlightRadius?: number;
  onBeforeMeasure?: () => Promise<void>;
}

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextType {
  startTour: (tourId: string, steps: TourStep[], lang?: 'pt' | 'en') => Promise<void>;
  resetTour: (tourId: string) => Promise<void>;
}

const TourContext = createContext<TourContextType>({
  startTour: async () => {},
  resetTour:  async () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive]             = useState(false);
  const [currentStep, setCurrentStep]       = useState(0);
  const [steps, setSteps]                   = useState<TourStep[]>([]);
  const [spotlightRect, setSpotlightRect]   = useState<SpotlightRect | null>(null);
  const [lang, setLang]                     = useState<'pt' | 'en'>('pt');
  const tourIdRef    = useRef<string>('');
  const activeIdRef  = useRef<string | null>(null);
  const anchorRef    = useRef<View>(null);
  const anchorOffset = useRef({ x: 0, y: 0 });

  const measureStep = useCallback((step: TourStep): Promise<void> =>
    new Promise((resolve) => {
      if (!step.ref?.current) { resolve(); return; }

      const doMeasure = () => {
        step.ref.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            const pad = 8;
            const { x: ax, y: ay } = anchorOffset.current;
            setSpotlightRect({
              x: x - ax - pad,
              y: y - ay - pad,
              width:  width  + pad * 2,
              height: height + pad * 2,
            });
            resolve();
          },
        );
      };

      // Measure the overlay anchor first to get coordinate offset
      if (anchorRef.current) {
        anchorRef.current.measureInWindow((ax: number, ay: number) => {
          anchorOffset.current = { x: ax, y: ay };
          doMeasure();
        });
      } else {
        doMeasure();
      }
    }),
  []);

  const startTour = useCallback(async (
    tourId: string,
    tourSteps: TourStep[],
    tourLang: 'pt' | 'en' = 'pt',
  ) => {
    if (activeIdRef.current === tourId) return;
    const done = await SecureStore.getItemAsync(`TOUR_${tourId}_DONE`).catch(() => null);
    if (done) return;
    activeIdRef.current = tourId;
    tourIdRef.current = tourId;
    setSteps(tourSteps);
    setCurrentStep(0);
    setLang(tourLang);
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
      activeIdRef.current = null;
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
    activeIdRef.current = null;
    setIsActive(false);
    setSpotlightRect(null);
  }, []);

  const resetTour = useCallback(async (tourId: string) => {
    await SecureStore.deleteItemAsync(`TOUR_${tourId}_DONE`).catch(() => {});
    activeIdRef.current = null;
  }, []);

  return (
    <TourContext.Provider value={{ startTour, resetTour }}>
      <View style={{ flex: 1 }}>
        {children}
        {/* Anchor at top-left of overlay space — used to calibrate coordinate offset */}
        <View
          ref={anchorRef}
          collapsable={false}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1 }}
        />
        {isActive && spotlightRect && (
          <TourOverlay
            step={steps[currentStep]}
            stepIndex={currentStep}
            totalSteps={steps.length}
            spotlightRect={spotlightRect}
            lang={lang}
            onNext={nextStep}
            onSkip={skipTour}
          />
        )}
      </View>
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
