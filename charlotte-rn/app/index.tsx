import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { View, Animated, Platform, Image, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui/Text';

// ── Branded loading screen ────────────────────────────────────────────────────
// Shown while AuthProvider resolves session on cold boot.
// Uses the same dot-texture background as the ChatBox.

function LoadingScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F3FA' }}>
      {/* Dot texture — same as ChatBox */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1.1" fill="rgba(22,21,58,0.055)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <Animated.View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeIn,
      }}>
        {/* Avatar estático sobre fundo navy para contraste com borda verde */}
        <View style={{
          marginBottom: 24,
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: '#16153A',
          borderWidth: 3,
          borderColor: '#A3FF3C',
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#A3FF3C',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            },
            android: { elevation: 6 },
          }),
        }}>
          <Image
            source={require('../assets/charlotte-avatar.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Wordmark */}
        <AppText style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#16153A',
          letterSpacing: -0.5,
          marginBottom: 6,
        }}>
          Charlotte
        </AppText>

        <AppText style={{
          fontSize: 13,
          color: '#9896B8',
          fontWeight: '500',
          letterSpacing: 0.3,
        }}>
          AI English Teacher
        </AppText>

        {/* Spinner */}
        <ActivityIndicator
          size="small"
          color="#16153A"
          style={{ marginTop: 32 }}
        />
      </Animated.View>
    </View>
  );
}

// ── Root index ────────────────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  // Hold on the branded loading screen while auth OR profile is still resolving.
  // This prevents the intermediate (isAuthenticated=true, profile=null) state
  // from ever reaching /(app)/_layout.tsx and triggering the dot-spinner loop.
  if (isLoading || (isAuthenticated && profile === null)) return <LoadingScreen />;
  if (isAuthenticated) return <Redirect href="/(app)" />;
  return <Redirect href="/(auth)/login" />;
}
