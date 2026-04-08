import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * Detecta status de rede.
 *
 * Estratégia:
 * 1. `navigator.onLine` + eventos `online`/`offline` da window — instantâneo,
 *    usa o status de rede real do sistema operacional.
 * 2. Fallback de polling (para versões RN que não propagam os eventos):
 *    - Pinga `connectivitycheck.gstatic.com/generate_204` (retorna 204 = ok)
 *    - Requer 3 falhas consecutivas para marcar offline
 *    - Polling a cada 30s
 *    - 4s delay inicial + otimismo ao voltar do background
 */
export function useNetworkStatus() {
  // Começa como true — evita qualquer flash de banner no cold start.
  // Os eventos online/offline ou o primeiro poll vão corrigir se necessário.
  const [isOnline, setIsOnline] = useState(true);
  const failureCountRef = useRef(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);

  async function checkConnectivity() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      // generate_204 foi feito para connectivity checks:
      // retorna 204 No Content quando online, redirect quando atrás de captive portal.
      // Muito mais confiável que captive.apple.com para requisições HEAD.
      const res = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!mountedRef.current) return;
      // 204 = definitivamente online
      if (res.status === 204 || res.ok) {
        failureCountRef.current = 0;
        if (!isOnline) setIsOnline(true);
      } else {
        failureCountRef.current++;
        if (failureCountRef.current >= 3) setIsOnline(false);
      }
    } catch {
      clearTimeout(timer);
      if (!mountedRef.current) return;
      failureCountRef.current++;
      // Só marca offline após 3 falhas consecutivas
      if (failureCountRef.current >= 3) setIsOnline(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    // ── Eventos de janela (funcionam no Hermes / RN) ──────────────────
    const handleOnline  = () => { failureCountRef.current = 0; setIsOnline(true);  };
    const handleOffline = () => { setIsOnline(false); };
    // @ts-ignore — window events disponíveis no runtime JS do RN
    if (typeof window !== 'undefined') {
      window.addEventListener('online',  handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // ── Polling de fallback ────────────────────────────────────────────
    const startTimer = setTimeout(() => {
      checkConnectivity();
      intervalRef.current = setInterval(checkConnectivity, 30_000);
    }, 4000);

    // Ao voltar do background, reseta e re-verifica
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        failureCountRef.current = 0;
        setIsOnline(true); // otimista — poll confirmará em seguida
        checkConnectivity();
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online',  handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return isOnline;
}
