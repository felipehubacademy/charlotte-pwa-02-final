// components/ui/WelcomeModal.tsx
// Modal de boas-vindas — exibido 1x por dia no primeiro login do dia.
//
// Primeiro acesso (first_welcome_done = false): tratado pelo vídeo charlotte-intro.tsx
//   — este modal NÃO é exibido nesse caso.
//
// Acessos seguintes (first_welcome_done = true):
//   Pool aleatório do nivel atual (novice_01..04 / inter_01..04 / advanced_01..04)
//   Exibe no máximo 1x por dia (SecureStore guarda a data da última exibição).
//
// Persistencia: SecureStore com chave welcome_last_shown_${userId}.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, Animated, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { AppText } from './Text';
import { useAuth } from '@/hooks/useAuth';

// Returns "YYYY-MM-DD" in local timezone
function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte.hubacademybr.com';

// ── Greeting data ────────────────────────────────────────────────────────────

interface WordTiming { word: string; start: number; end: number; }

// Pool aleatorio por nivel — retornando
const GREETING_IDS_POOL: Record<string, string[]> = {
  Novice:   ['novice_01', 'novice_02', 'novice_03', 'novice_04'],
  Inter:    ['inter_01', 'inter_02', 'inter_03', 'inter_04'],
  Advanced: ['advanced_01', 'advanced_02', 'advanced_03', 'advanced_04'],
};

const SUBTITLE_RETURNING: Record<string, string> = {
  Novice:   'estou aqui pra te ajudar\na falar inglês de verdade.',
  Inter:    "I'm here to help you\nspeak English for real.",
  Advanced: "I'm here to help you\nspeak English for real.",
};

// ── Component ────────────────────────────────────────────────────────────────

interface WelcomeModalProps {
  userId: string;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName: string;
}

export default function WelcomeModal({ userId, userLevel, userName }: WelcomeModalProps) {
  const insets         = useSafeAreaInsets();
  const { isFreshLogin, clearFreshLogin, profile, hasAccess } = useAuth();

  const [visible, setVisible]         = useState(false);
  const [timings, setTimings]         = useState<WordTiming[]>([]);
  const [currentTime, setCurrentTime] = useState(-1);

  const isPt       = userLevel === 'Novice';
  const firstName  = userName.split(' ')[0] ?? userName;

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim     = useRef(new Animated.Value(1)).current;
  const playerRef    = useRef<AudioPlayer | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioEndedRef = useRef(false);
  const dismissedRef  = useRef(false);

  // Mostrar apenas em logins reais (SIGNED_IN), nunca na abertura do app.
  // Primeiro acesso: tratado pelo vídeo — este modal só exibe quando first_welcome_done = true.
  // Acessos seguintes: no maximo 1x por dia (compara data atual com SecureStore).
  // IMPORTANTE: nunca exibir quando user nao tem acesso (paywall ativo) —
  // senao welcome abre em cima do paywall e bloqueia a compra.
  useEffect(() => {
    if (!isFreshLogin || !profile) return;
    // Nunca exibir para usuários que ainda não viram o vídeo de intro
    if (!profile.first_welcome_done) {
      clearFreshLogin();
      return;
    }
    // Nunca exibir se o paywall vai bloquear o app (trial expirado, sub expirada, etc)
    if (!hasAccess) {
      clearFreshLogin();
      return;
    }
    const LAST_SHOWN_KEY = `welcome_last_shown_${userId}`;
    SecureStore.getItemAsync(LAST_SHOWN_KEY).then(lastDate => {
      if (lastDate === todayDateKey()) {
        clearFreshLogin();
        return;
      }
      setVisible(true);
    }).catch(() => {
      setVisible(true);
    });
  }, [isFreshLogin, profile, hasAccess]); // eslint-disable-line

  // handleDismiss declarado antes dos useEffects que o referenciam
  const handleDismiss = () => {
    // Idempotent — auto-dismiss timers + manual tap podem chamar em paralelo
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    if (pollRef.current) clearInterval(pollRef.current);
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    playerRef.current?.pause();
    playerRef.current?.remove();
    playerRef.current = null;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      clearFreshLogin();
      // Salva data de hoje para nao mostrar de novo até amanhã
      const LAST_SHOWN_KEY = `welcome_last_shown_${userId}`;
      SecureStore.setItemAsync(LAST_SHOWN_KEY, todayDateKey()).catch(() => {});
    });
  };

  // Poll player time for karaoke + detect audio end for auto-dismiss
  useEffect(() => {
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      if (p.playing) {
        setCurrentTime(p.currentTime ?? 0);
      }
      // Audio ended — schedule auto-dismiss after 2.5s grace period
      // so user can read the subtitle. Guards against Apple "unresponsive"
      // rejection when reviewer doesn't tap the small hint.
      const duration = p.duration ?? 0;
      if (!audioEndedRef.current && duration > 0 && (p.currentTime ?? 0) >= duration - 0.1 && !p.playing) {
        audioEndedRef.current = true;
        if (!autoDismissTimerRef.current) {
          autoDismissTimerRef.current = setTimeout(() => { handleDismiss(); }, 2500);
        }
      }
    }, 40);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, []);

  // Load + play on visible — always returning user (pool)
  useEffect(() => {
    if (!visible) return;

    const id = (() => {
      const pool = GREETING_IDS_POOL[userLevel ?? 'Novice'] ?? GREETING_IDS_POOL.Novice;
      return pool[Math.floor(Math.random() * pool.length)];
    })();

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

    loadAndPlay(id).catch(() => {});

    // Hard fallback: dismiss automatically after 12s regardless of audio state.
    // This guarantees the modal never blocks the app if the network is slow
    // or the audio fails to load on the reviewer's device (Apple rejection
    // reason "unresponsive after launch" was caused by reviewer not tapping
    // the low-contrast hint).
    const hardTimer = setTimeout(() => { handleDismiss(); }, 12000);
    return () => clearTimeout(hardTimer);
  }, [visible]); // eslint-disable-line

  const loadAndPlay = async (id: string) => {
    try {
      const baseUrl   = `${API_BASE_URL}/tts/greetings/${id}`;
      const audioUri  = `${FileSystem.cacheDirectory}welcome_${id}.mp3`;
      const timingUri = `${FileSystem.cacheDirectory}welcome_${id}.json`;

      const [audioInfo, timingInfo] = await Promise.all([
        FileSystem.getInfoAsync(audioUri),
        FileSystem.getInfoAsync(timingUri),
      ]);

      const downloads: Promise<void>[] = [];
      if (!audioInfo.exists) {
        downloads.push(FileSystem.downloadAsync(`${baseUrl}.mp3`, audioUri).then(() => {}));
      }
      if (!timingInfo.exists) {
        downloads.push(FileSystem.downloadAsync(`${baseUrl}.json`, timingUri).then(() => {}));
      }
      if (downloads.length > 0) await Promise.all(downloads);

      const rawJson = await FileSystem.readAsStringAsync(timingUri);
      const wordTimings: WordTiming[] = JSON.parse(rawJson);
      setTimings(wordTimings);

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

  if (!visible) return null;

  // ── Karaoke rendering ─────────────────────────────────────────
  // Modal is only shown for returning users (first access handled by charlotte-intro video)
  const subtitle = `${firstName}, ${SUBTITLE_RETURNING[userLevel ?? 'Novice'] ?? SUBTITLE_RETURNING.Novice}`;

  const renderKaraoke = () => {
    if (timings.length === 0) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {timings.map((w, i) => {
          const isActive = currentTime >= 0 && w.start <= currentTime && currentTime < w.end;
          const isSpoken = currentTime >= 0 && w.end <= currentTime;
          const color    = isActive ? '#A3FF3C' : isSpoken ? '#FFFFFF' : 'rgba(255,255,255,0.25)';
          return (
            <AppText key={i} style={{ fontSize: 28, fontWeight: '800', color, lineHeight: 40, letterSpacing: -0.3 }}>
              {w.word}{' '}
            </AppText>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {/* Force light status bar icons on the dark modal background */}
      <StatusBar barStyle="light-content" />
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
          {/* Avatar com ring pulsante */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 36 }}>
            <Animated.View style={{
              position: 'absolute',
              width: 168, height: 168, borderRadius: 84,
              borderWidth: 2, borderColor: 'rgba(163,255,60,0.3)',
              top: -14, left: -14,
              transform: [{ scale: ringAnim }],
            }} />
            <Image
              source={require('../../assets/charlotte-avatar.png')}
              style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#A3FF3C' }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Karaoke greeting */}
          <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center', minHeight: 90 }}>
            {renderKaraoke()}
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={{ opacity: textFadeAnim, marginTop: 16 }}>
            <AppText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {subtitle}
            </AppText>
          </Animated.View>

          {/* Continue button — visivel e obvio (evita rejeicao Apple "unresponsive") */}
          <Animated.View style={{ position: 'absolute', bottom: insets.bottom + 48, opacity: textFadeAnim }}>
            <View style={{
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: 'rgba(163,255,60,0.15)',
              borderWidth: 1.5,
              borderColor: '#A3FF3C',
            }}>
              <AppText style={{ color: '#A3FF3C', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                {isPt ? 'Toque para continuar' : 'Tap to continue'}
              </AppText>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
