import { View, Animated, useAnimatedValue } from 'react-native';
import { useEffect } from 'react';
import { WifiSlash } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/hooks/useAuth';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const translateY = useAnimatedValue(-60);
  const isPt = (profile?.charlotte_level ?? 'Novice') === 'Novice';

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <View style={{
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}>
        <WifiSlash size={16} color="#fff" weight="fill" />
        <AppText style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
          {isPt ? 'Sem conexão com a internet' : 'No internet connection'}
        </AppText>
      </View>
    </Animated.View>
  );
}
