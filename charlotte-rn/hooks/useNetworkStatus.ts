import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Detecta status de rede sem dependência nativa (@react-native-community/netinfo).
 * Usa polling leve via fetch para verificar conectividade real.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkConnectivity() {
    try {
      const res = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      setIsOnline(res.ok || res.status === 204);
    } catch {
      setIsOnline(false);
    }
  }

  useEffect(() => {
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, 15000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkConnectivity();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return isOnline;
}
