// components/ui/WelcomeModal.tsx
// Modal fullscreen de boas-vindas — exibido UMA VEZ após o primeiro login.
// Charlotte fala uma saudação com karaokê sincronizado (word-by-word highlight).

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, View, TouchableOpacity, Animated, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { AppText } from './Text';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';

const WELCOME_DONE_KEY = 'charlotte_welcome_done_v1';

// ── Greeting data ────────────────────────────────────────────────────────────

interface WordTiming { word: string; start: number; end: number; }

const GREETING_IDS: Record<string, string[]> = {
  Novice:   ['novice_01', 'novice_02', 'novice_03', 'novice_04'],
  Inter:    ['inter_01', 'inter_02', 'inter_03', 'inter_04'],
  Advanced: ['advanced_01', 'advanced_02', 'advanced_03', 'advanced_04'],
};

const SUBTITLE: Record<string, string> = {
  Novice:   'estou aqui pra te ajudar\na falar inglês de verdade.',
  Inter:    "I'm here to help you\nspeak English for real.",
  Advanced: "I'm here to help you\nspeak English for real.",
};

// ── Component ────────────────────────────────────────────────────────────────

interface WelcomeModalProps {
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName: string;
  isInstitutional?: boolean;
}

export default function WelcomeModal({ userLevel, userName, isInstitutional = false }: WelcomeModalProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [timings, setTimings] = useState<WordTiming[]>([]);
  const [currentTime, setCurrentTime] = useState(-1); // -1 = not started

  const isPt = userLevel === 'Novice';
  const firstName = userName.split(' ')[0] ?? userName;

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim     = useRef(new Animated.Value(1)).current;
  const playerRef    = useRef<AudioPlayer | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const greetingIdRef = useRef('');

  // ── Check if already seen ─────────────────────────────────────
  useEffect(() => {
    SecureStore.getItemAsync(WELCOME_DONE_KEY)
      .then(val => { if (val !== 'done') setVisible(true); })
      .catch(() => setVisible(true));
  }, []);

  // ── Poll player time for karaoke ──────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (playerRef.current?.playing) {
        setCurrentTime(playerRef.current.currentTime ?? 0);
      }
    }, 40); // 25fps for smooth highlight
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Load + play on visible ────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    const ids = GREETING_IDS[userLevel] ?? GREETING_IDS.Inter;
    const pick = ids[Math.floor(Math.random() * ids.length)];
    greetingIdRef.current = pick;

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, stiffness: 180, damping: 16, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(textFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    });

    // Load audio + timings in parallel
    loadAndPlay(pick).catch(() => {});
  }, [visible]); // eslint-disable-line

  const loadAndPlay = async (id: string) => {
    try {
      const baseUrl = `${API_BASE_URL}/tts/greetings/${id}`;

      // Download audio + timings in parallel
      const audioUri  = `${FileSystem.cacheDirectory}welcome_${id}.mp3`;
      const timingUri = `${FileSystem.cacheDirectory}welcome_${id}.json`;

      const [audioInfo, timingInfo] = await Promise.all([
        FileSystem.getInfoAsync(audioUri),
        FileSystem.getInfoAsync(timingUri),
      ]);

      const downloads: Promise<void>[] = [];
      if (!audioInfo.exists) {
        downloads.push(
          FileSystem.downloadAsync(`${baseUrl}.mp3`, audioUri).then(() => {})
        );
      }
      if (!timingInfo.exists) {
        downloads.push(
          FileSystem.downloadAsync(`${baseUrl}.json`, timingUri).then(() => {})
        );
      }
      if (downloads.length > 0) await Promise.all(downloads);

      // Parse timings
      const rawJson = await FileSystem.readAsStringAsync(timingUri);
      const wordTimings: WordTiming[] = JSON.parse(rawJson);
      setTimings(wordTimings);

      // Play audio
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});

      playerRef.current?.pause();
      playerRef.current?.remove();
      playerRef.current = createAudioPlayer({ uri: audioUri });
      playerRef.current.play();
      setCurrentTime(0);
    } catch (e) {
      console.warn('[WelcomeModal] load error:', e);
    }
  };

  const handleDismiss = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    playerRef.current?.pause();
    playerRef.current?.remove();
    playerRef.current = null;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      SecureStore.setItemAsync(WELCOME_DONE_KEY, 'done').catch(() => {});
    });
  };

  if (!visible) return null;

  // ── Karaoke rendering ─────────────────────────────────────────
  const renderKaraoke = () => {
    if (timings.length === 0) return null;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {timings.map((w, i) => {
          const isActive = currentTime >= 0 && w.start <= currentTime && currentTime < w.end;
          const isSpoken = currentTime >= 0 && w.end <= currentTime;
          const color    = isActive ? '#A3FF3C' : isSpoken ? '#FFFFFF' : 'rgba(255,255,255,0.25)';

          return (
            <AppText
              key={i}
              style={{
                fontSize: 28,
                fontWeight: '800',
                color,
                lineHeight: 40,
                letterSpacing: -0.3,
              }}
            >
              {w.word}{' '}
            </AppText>
          );
        })}
      </View>
    );
  };

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
          <Animated.View style={{ opacity: fadeAnim, marginBottom: 8 }}>
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
            marginBottom: 36,
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

          {/* Karaoke greeting text */}
          <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center', minHeight: 90 }}>
            {renderKaraoke()}
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={{ opacity: textFadeAnim, marginTop: 16 }}>
            <AppText style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {firstName}, {SUBTITLE[userLevel] ?? SUBTITLE.Inter}
            </AppText>
          </Animated.View>

          {/* Trial badge — só para não-institucionais */}
          {!isInstitutional && (
            <Animated.View style={{
              position: 'absolute',
              bottom: insets.bottom + 72,
              opacity: textFadeAnim,
              alignItems: 'center',
            }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(163,255,60,0.12)',
                borderRadius: 20, borderWidth: 1, borderColor: 'rgba(163,255,60,0.25)',
                paddingHorizontal: 16, paddingVertical: 8,
              }}>
                <View style={{
                  width: 7, height: 7, borderRadius: 4,
                  backgroundColor: '#A3FF3C',
                }} />
                <AppText style={{ color: '#A3FF3C', fontSize: 13, fontWeight: '700' }}>
                  {isPt ? '7 dias grátis ativados' : '7-day free trial activated'}
                </AppText>
              </View>
            </Animated.View>
          )}

          {/* Tap hint */}
          <Animated.View style={{
            position: 'absolute',
            bottom: insets.bottom + 40,
            opacity: textFadeAnim,
          }}>
            <AppText style={{
              color: 'rgba(255,255,255,0.2)',
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
