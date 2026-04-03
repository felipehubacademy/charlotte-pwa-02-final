/**
 * learn-intro.tsx
 *
 * Animated slide-based module intro with Charlotte narration (TTS).
 * Shown before the first topic of a module that has an entry in MODULE_INTROS.
 *
 * Flow: learn-trail → learn-intro → learn-session
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/Audio.types';

import { AppText } from '@/components/ui/Text';
import { MODULE_INTROS } from '@/data/moduleIntros';
import { TrailLevel } from '@/data/curriculum';

// ── Config ─────────────────────────────────────────────────────
const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

// ── Palette ────────────────────────────────────────────────────
const C = {
  bg:              '#16153A',
  white:           '#FFFFFF',
  whiteAlpha:      'rgba(255,255,255,0.55)',
  violet:          '#7C3AED',
  violetLight:     '#A78BFA',
  violetHighlight: 'rgba(124,58,237,0.22)',
  violetBorder:    'rgba(124,58,237,0.45)',
  dotInactive:     'rgba(255,255,255,0.22)',
};

// ── Main screen ────────────────────────────────────────────────
export default function LearnIntroScreen() {
  const { level, moduleIndex, topicIndex } = useLocalSearchParams<{
    level: string;
    moduleIndex: string;
    topicIndex: string;
  }>();

  const mIdx  = parseInt(moduleIndex ?? '0', 10);
  const intro = MODULE_INTROS[level as TrailLevel]?.[mIdx];
  const slides = intro?.slides ?? [];

  const [slideIdx,    setSlideIdx]    = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const playerRef     = useRef<AudioPlayer | null>(null);
  const subRef        = useRef<ReturnType<AudioPlayer['addListener']> | null>(null);
  const redirectedRef = useRef(false);
  const pendingPlay    = useRef(false);
  const slideIdxRef   = useRef(0);

  // ── Audio player lifecycle ───────────────────────────────────
  useEffect(() => {
    const player = createAudioPlayer(null);
    playerRef.current = player;
    return () => {
      subRef.current?.remove();
      try { player.pause(); player.remove(); } catch {}
    };
  }, []);

  // ── TTS fetch (same pattern as learn-session) ────────────────
  const fetchTTS = useCallback(async (text: string): Promise<string | null> => {
    try {
      const cacheDir = `${FileSystem.documentDirectory}tts_cache/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
      const fileKey  = text.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const localUri = `${cacheDir}intro_${fileKey}.mp3`;

      // 1. Local cache
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) return localUri;

      // 2. Pre-generated CDN file
      const fileUrl = `${API_BASE_URL}/tts/${fileKey}.mp3`;
      const dl = await FileSystem.downloadAsync(fileUrl, localUri);
      if (dl.status === 200) return localUri;
      await FileSystem.deleteAsync(localUri, { idempotent: true });

      // 3. ElevenLabs API fallback
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.audio) return null;
      await FileSystem.writeAsStringAsync(localUri, data.audio, { encoding: 'base64' as any });
      return localUri;
    } catch { return null; }
  }, []);

  // ── Play audio for a slide ───────────────────────────────────
  const playSlideAudio = useCallback(async (idx: number) => {
    const slide = slides[idx];
    if (!slide || !playerRef.current) return;

    subRef.current?.remove();
    subRef.current = null;

    // Reset pending flag before each new slide audio
    pendingPlay.current = false;

    setAudioLoading(true);
    const uri = await fetchTTS(slide.audio);
    setAudioLoading(false);

    if (!uri || !playerRef.current) return;

    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      playerRef.current.replace({ uri });

      pendingPlay.current = true;
      const capturedIdx = idx;

      subRef.current = playerRef.current.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          // Start playback once loaded (guard with pendingPlay to fire only once)
          if (pendingPlay.current && status.isLoaded && !status.playing) {
            pendingPlay.current = false;
            try { playerRef.current?.play(); } catch {}
          }
          // Auto-advance when audio finishes — only if still on this slide
          if (status.didJustFinish
              && capturedIdx === slideIdxRef.current
              && capturedIdx < slides.length - 1) {
            subRef.current?.remove();
            subRef.current = null;
            setTimeout(() => {
              if (capturedIdx === slideIdxRef.current) goToSlide(capturedIdx + 1);
            }, 800);
          }
        },
      );

      // Fallback: play if isLoaded event is slow (expo-audio race on some devices)
      setTimeout(() => {
        if (pendingPlay.current && capturedIdx === slideIdxRef.current) {
          pendingPlay.current = false;
          try { playerRef.current?.play(); } catch {}
        }
      }, 1500);
    } catch {}
  }, [slides, fetchTTS]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Slide transition ─────────────────────────────────────────
  const goToSlide = useCallback((idx: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setSlideIdx(idx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  // Play audio whenever slideIdx changes
  useEffect(() => {
    slideIdxRef.current = slideIdx;
    playSlideAudio(slideIdx);
  }, [slideIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation helpers ───────────────────────────────────────
  const goToSession = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    subRef.current?.remove();
    try { playerRef.current?.pause(); } catch {}
    router.replace({
      pathname: '/(app)/learn-session',
      params: { level, moduleIndex, topicIndex },
    });
  }, [level, moduleIndex, topicIndex]);

  const handleNext = useCallback(() => {
    if (slideIdx < slides.length - 1) {
      subRef.current?.remove();
      subRef.current = null;
      pendingPlay.current = false;
      try { playerRef.current?.pause(); } catch {}
      goToSlide(slideIdx + 1);
    } else {
      goToSession();
    }
  }, [slideIdx, slides.length, goToSlide, goToSession]);

  // ── Safety: if no intro defined, go straight to session ─────
  useEffect(() => {
    if (!intro || slides.length === 0) goToSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!intro || slides.length === 0) return null;

  const slide  = slides[slideIdx];
  const isLast = slideIdx === slides.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Top bar: Skip ── */}
      <View style={{
        flexDirection: 'row', justifyContent: 'flex-end',
        paddingHorizontal: 20, paddingTop: 12,
      }}>
        <TouchableOpacity
          onPress={goToSession}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <AppText style={{ color: C.whiteAlpha, fontSize: 14, fontWeight: '600' }}>
            Skip
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ── Progress dots ── */}
      <View style={{
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 8, marginTop: 16,
      }}>
        {slides.map((_, i) => (
          <Animated.View
            key={i}
            style={{
              height: 7,
              width: i === slideIdx ? 28 : 7,
              borderRadius: 4,
              backgroundColor: i === slideIdx ? C.violet : C.dotInactive,
            }}
          />
        ))}
      </View>

      {/* ── Slide content (tap to advance) ── */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleNext}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}
      >
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>

          {/* Charlotte avatar */}
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(124,58,237,0.18)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: C.violetBorder,
            marginBottom: 8,
          }}>
            <AppText style={{ fontSize: 36 }}>👩🏻‍🏫</AppText>
          </View>

          <AppText style={{
            color: C.whiteAlpha, fontSize: 12, fontWeight: '700',
            marginBottom: 32,
          }}>
            Charlotte
          </AppText>

          {/* Slide label */}
          <AppText style={{
            fontSize: 11, fontWeight: '800', color: C.violet,
            textTransform: 'uppercase', letterSpacing: 1.8,
            marginBottom: 14, textAlign: 'center',
          }}>
            {slide.label}
          </AppText>

          {/* Body */}
          <AppText style={{
            fontSize: 21, fontWeight: '700', color: C.white,
            lineHeight: 31, textAlign: 'center', marginBottom: 28,
          }}>
            {slide.body}
          </AppText>

          {/* Highlighted phrase */}
          {slide.highlight && (
            <View style={{
              backgroundColor: C.violetHighlight,
              borderRadius: 14,
              borderWidth: 1, borderColor: C.violetBorder,
              paddingHorizontal: 22, paddingVertical: 14,
              alignItems: 'center',
            }}>
              <AppText style={{
                fontSize: 16, fontWeight: '700',
                color: C.violetLight, textAlign: 'center',
                lineHeight: 24,
              }}>
                {slide.highlight}
              </AppText>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* ── Bottom: loading + Next/Start button ── */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 40, gap: 10 }}>
        {audioLoading && (
          <ActivityIndicator color={C.violet} style={{ marginBottom: 4 }} />
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: C.violet,
            borderRadius: 18,
            paddingVertical: 17,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            ...Platform.select({
              ios:     { shadowColor: C.violet, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
              android: { elevation: 6 },
            }),
          }}
        >
          <AppText style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>
            {isLast ? "Let's Start!" : 'Next'}
          </AppText>
          <ArrowRight size={18} color="#FFF" weight="bold" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
