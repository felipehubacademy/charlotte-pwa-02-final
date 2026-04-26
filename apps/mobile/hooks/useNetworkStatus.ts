import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Detecta status de rede via @react-native-community/netinfo.
 * Usa a API nativa do iOS/Android — sem fetch, sem false positives.
 * Retorna true quando há conexão com internet (isInternetReachable).
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true); // otimista no cold start

  useEffect(() => {
    // Checa estado atual imediatamente
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    // Assina mudanças em tempo real
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}
