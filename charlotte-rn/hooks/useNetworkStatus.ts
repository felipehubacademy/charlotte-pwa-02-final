import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Detecta status de rede via polling simples.
 * - Pinga connectivitycheck.gstatic.com/generate_204 (retorna 204 quando online)
 * - Requer 3 falhas consecutivas antes de marcar offline
 * - Polling a cada 30s; delay inicial de 4s para não atrapalhar o cold start
 * - Reseta otimisticamente ao voltar do background (AppState active)
 *
 * NÃO usa window.addEventListener('online'/'offline') — em React Native / Hermes
 * o objeto window existe mas não implementa EventTarget de browser, causando crash.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // otimista — evita flash no cold start
  const failureCountRef = useRef(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);
  const isOnlineRef     = useRef(true); // espelho do state para uso dentro do callback

  async function checkConnectivity() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!mountedRef.current) return;
      if (res.status === 204 || res.ok) {
        failureCountRef.current = 0;
        if (!isOnlineRef.current) {
          isOnlineRef.current = true;
          setIsOnline(true);
        }
      } else {
        failureCountRef.current++;
        if (failureCountRef.current >= 3 && isOnlineRef.current) {
          isOnlineRef.current = false;
          setIsOnline(false);
        }
      }
    } catch {
      clearTimeout(timer);
      if (!mountedRef.current) return;
      failureCountRef.current++;
      if (failureCountRef.current >= 3 && isOnlineRef.current) {
        isOnlineRef.current = false;
        setIsOnline(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    const startTimer = setTimeout(() => {
      checkConnectivity();
      intervalRef.current = setInterval(checkConnectivity, 30_000);
    }, 4000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        failureCountRef.current = 0;
        isOnlineRef.current = true;
        setIsOnline(true); // otimista — poll confirmará logo em seguida
        checkConnectivity();
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return isOnline;
}
