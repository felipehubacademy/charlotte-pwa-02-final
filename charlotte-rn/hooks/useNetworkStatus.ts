import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Detecta status de rede sem dependência nativa.
 * Usa polling via fetch com lógica anti-falso-positivo:
 * - Inicia como online (true) para evitar flash de banner no cold start
 * - Delay de 4s antes da primeira verificação (aguarda app inicializar)
 * - Requer 2 falhas consecutivas antes de marcar offline
 * - Usa URL confiável (Apple captive portal check)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const failureCountRef = useRef(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);

  async function checkConnectivity() {
    const controller = new AbortController();
    // Manual timeout — mais compatível que AbortSignal.timeout em todas versões RN
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch('https://captive.apple.com/hotspot-detect.html', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!mountedRef.current) return;
      if (res.ok) {
        failureCountRef.current = 0;
        setIsOnline(true);
      } else {
        failureCountRef.current++;
        if (failureCountRef.current >= 2) setIsOnline(false);
      }
    } catch {
      clearTimeout(timer);
      if (!mountedRef.current) return;
      failureCountRef.current++;
      // Só marca offline após 2 falhas consecutivas (evita falsos positivos no cold start)
      if (failureCountRef.current >= 2) setIsOnline(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    // Delay inicial de 4s — evita false-negative enquanto o app está inicializando
    const startTimer = setTimeout(() => {
      checkConnectivity();
      intervalRef.current = setInterval(checkConnectivity, 20000);
    }, 4000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        // Ao retornar ao foreground, reseta contador e re-verifica imediatamente
        failureCountRef.current = 0;
        setIsOnline(true); // otimista — se falhar 2x, banner aparece
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
