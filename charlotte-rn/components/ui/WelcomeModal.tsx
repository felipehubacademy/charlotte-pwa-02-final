// components/ui/WelcomeModal.tsx
// Modal fullscreen de boas-vindas — exibido UMA VEZ após o primeiro login/placement test.
// Charlotte fala uma saudação via TTS pré-gerado e o usuário toca para fechar.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, Animated, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { AppText } from './Text';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';

const WELCOME_DONE_KEY = 'charlotte_welcome_done_v1';

const GREETING_FILES: Record<string, string[]> = {
  Novice:   ['novice_01', 'novice_02', 'novice_03', 'novice_04'],
  Inter:    ['inter_01', 'inter_02', 'inter_03', 'inter_04'],
  Advanced: ['advanced_01', 'advanced_02', 'advanced_03', 'advanced_04'],
};

const GREETING_TEXT: Record<string, string[]> = {
  Novice: [
    'Oi! Que bom te ver!\nBora praticar?',
    'Oi! Estou te esperando.\nVamos lá!',
    'Ei, que bom que voltou!\nBora pro inglês?',
    'Oi! Pronta pra mais\numa sessão?',
  ],
  Inter: [
    "Hey! Good to see you —\nlet's get started!",
    "Hey! Ready for\nsome practice?",
    "Oh hey! Welcome back —\nlet's do this!",
    "Hey! I've been waiting.\nLet's go!",
  ],
  Advanced: [
    "Hey! What's on your\nmind today?",
    "Oh hey! Ready to\ndive in?",
    "Hey! Let's make this\nsession count.",
    "What's up? Good to\nsee you again.",
  ],
};

interface WelcomeModalProps {
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName: string;
}

export default function WelcomeModal({ userLevel, userName }: WelcomeModalProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [greetingIdx, setGreetingIdx] = useState(0);

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim     = useRef(new Animated.Value(1)).current;

  const isPt = userLevel === 'Novice';

  // ── Check se já viu o welcome ─────────────────────────────────
  useEffect(() => {
    SecureStore.getItemAsync(WELCOME_DONE_KEY)
      .then(val => {
        if (val !== 'done') setVisible(true);
      })
      .catch(() => setVisible(true)); // se falhar leitura, mostra
  }, []);

  // ── Animação + TTS ao abrir ───────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    const idx = Math.floor(Math.random() * 4);
    setGreetingIdx(idx);

    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, stiffness: 180, damping: 16, useNativeDriver: true }),
    ]).start(() => {
      // Texto aparece após avatar
      Animated.timing(textFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      // Pulso suave no avatar
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    });

    // TTS pré-gerado
    playWelcomeAudio(idx).catch(() => {});
  }, [visible]); // eslint-disable-line

  const playWelcomeAudio = async (idx: number) => {
    try {
      const files = GREETING_FILES[userLevel] ?? GREETING_FILES.Inter;
      const pick = files[idx] ?? files[0];
      const remoteUrl = `${API_BASE_URL}/tts/greetings/${pick}.mp3`;
      const localUri = `${FileSystem.cacheDirectory}welcome_${pick}.mp3`;

      const info = await FileSystem.getInfoAsync(localUri);
      if (!info.exists) {
        await FileSystem.downloadAsync(remoteUrl, localUri);
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});

      const player = createAudioPlayer({ uri: localUri });
      player.play();
      setTimeout(() => { try { player.pause(); player.remove(); } catch {} }, 10000);
    } catch { /* silencioso */ }
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      SecureStore.setItemAsync(WELCOME_DONE_KEY, 'done').catch(() => {});
    });
  };

  if (!visible) return null;

  const texts = GREETING_TEXT[userLevel] ?? GREETING_TEXT.Inter;
  const greetingText = texts[greetingIdx] ?? texts[0];
  const firstName = userName.split(' ')[0] ?? userName;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={{
        flex: 1,
        backgroundColor: '#07071C',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        opacity: fadeAnim,
      }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}
        >
          {/* Charlotte badge */}
          <Animated.View style={{
            opacity: fadeAnim,
            marginBottom: 8,
          }}>
            <View style={{
              backgroundColor: '#A3FF3C',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}>
              <AppText style={{ color: '#16153A', fontSize: 13, fontWeight: '800', letterSpacing: -0.3 }}>
                Charlotte
              </AppText>
            </View>
          </Animated.View>

          {/* Avatar com ring pulsante */}
          <Animated.View style={{
            transform: [{ scale: scaleAnim }],
            marginBottom: 32,
          }}>
            <Animated.View style={{
              position: 'absolute',
              width: 168, height: 168, borderRadius: 84,
              borderWidth: 2, borderColor: 'rgba(163,255,60,0.3)',
              top: -14, left: -14,
              transform: [{ scale: ringAnim }],
            }} />
            <Image
              source={require('../../assets/charlotte-avatar.png')}
              style={{
                width: 140, height: 140, borderRadius: 70,
                borderWidth: 3, borderColor: '#A3FF3C',
              }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Greeting text */}
          <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
            <AppText style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
              lineHeight: 38,
              letterSpacing: -0.5,
              marginBottom: 12,
            }}>
              {greetingText}
            </AppText>

            <AppText style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {isPt
                ? `${firstName}, estou aqui pra te ajudar\na falar inglês de verdade.`
                : `${firstName}, I'm here to help you\nspeak English for real.`}
            </AppText>
          </Animated.View>

          {/* Tap hint */}
          <Animated.View style={{
            position: 'absolute',
            bottom: insets.bottom + 40,
            opacity: textFadeAnim,
          }}>
            <AppText style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 13,
              letterSpacing: 0.5,
            }}>
              {isPt ? 'toque para continuar' : 'tap to continue'}
            </AppText>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
