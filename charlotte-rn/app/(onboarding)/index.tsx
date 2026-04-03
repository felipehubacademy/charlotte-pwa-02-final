// app/(onboarding)/index.tsx
// 4-slide onboarding shown once on first launch (before login)

import React, { useRef, useState, useEffect } from 'react';
import {
  View, ScrollView, TouchableOpacity, Dimensions,
  Animated, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
  ArrowRight, ChatCircle, Lightning, Flame,
  MedalMilitary, CheckCircle,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';

const { width: W } = Dimensions.get('window');
export const ONBOARDING_KEY = 'onboarding_v2';

const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.08)',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  shadow: Platform.select({
    ios: {
      shadowColor: 'rgba(22,21,58,0.10)',
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 4 },
  }),
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function markOnboardingDone() {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'done');
}

function goToLogin() {
  router.replace('/(auth)/login');
}

// ── Dot indicator ─────────────────────────────────────────────────────────────

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? C.navy : 'rgba(22,21,58,0.18)',
          }}
        />
      ))}
    </View>
  );
}

// ── Slide 1 — Meet Charlotte ──────────────────────────────────────────────────

function Slide1() {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const bubbleY = useRef(new Animated.Value(8)).current;
  const bubbleO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Avatar pulse rings
    const ring = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
    ring(pulse1, 0).start();
    ring(pulse2, 450).start();

    // Speech bubble entrance
    Animated.parallel([
      Animated.timing(bubbleO, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }),
      Animated.timing(bubbleY, { toValue: 0, duration: 400, delay: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>

      {/* Avatar + pulse rings */}
      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <Animated.View style={{
          position: 'absolute',
          width: 140, height: 140, borderRadius: 70,
          backgroundColor: 'rgba(163,255,60,0.10)',
          transform: [{ scale: pulse1 }],
        }} />
        <Animated.View style={{
          position: 'absolute',
          width: 116, height: 116, borderRadius: 58,
          backgroundColor: 'rgba(163,255,60,0.14)',
          transform: [{ scale: pulse2 }],
        }} />
        <CharlotteAvatar size="xxl" />
      </View>

      {/* Speech bubble */}
      <Animated.View style={{
        opacity: bubbleO,
        transform: [{ translateY: bubbleY }],
        backgroundColor: C.navy,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 40,
        alignSelf: 'center',
        ...C.shadow,
      }}>
        <AppText style={{ color: C.green, fontSize: 15, fontWeight: '700' }}>
          Oi! Eu sou a Charlotte.
        </AppText>
      </Animated.View>

      {/* Headline */}
      <AppText style={{
        fontSize: 34, fontWeight: '800', color: C.navy,
        textAlign: 'center', lineHeight: 40, letterSpacing: -0.5,
        marginBottom: 14,
      }}>
        Sua professora{'\n'}de inglês com IA.
      </AppText>

      <AppText style={{
        fontSize: 15, color: C.navyMid, textAlign: 'center',
        lineHeight: 22, maxWidth: 280,
      }}>
        Conversas reais que te ensinam a falar inglês de verdade.
      </AppText>

    </View>
  );
}

// ── Slide 2 — Practice by talking ────────────────────────────────────────────

const CHAT_ITEMS = [
  { from: 'charlotte', text: 'How was your weekend?' },
  { from: 'user',      text: 'It was great, I went to the beach' },
  { from: 'score',     text: 'Nota 94 · Fluência ótima!' },
];

function Slide2({ active }: { active: boolean }) {
  const anims = useRef(CHAT_ITEMS.map(() => ({
    opacity: new Animated.Value(0),
    y:       new Animated.Value(10),
  }))).current;

  useEffect(() => {
    if (!active) return;
    // reset
    anims.forEach(a => { a.opacity.setValue(0); a.y.setValue(10); });
    // stagger entrance
    const seq = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 320, delay: i * 520, useNativeDriver: true }),
        Animated.timing(a.y,       { toValue: 0, duration: 320, delay: i * 520, useNativeDriver: true }),
      ])
    );
    Animated.sequence(seq).start();
  }, [active]);

  return (
    <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>

      {/* Mock chat */}
      <View style={{
        width: '100%', backgroundColor: C.card, borderRadius: 20,
        padding: 16, marginBottom: 36,
        borderWidth: 1, borderColor: C.border, ...C.shadow,
      }}>
        {CHAT_ITEMS.map((item, i) => {
          const a = anims[i];
          const isCharlotte = item.from === 'charlotte';
          const isScore     = item.from === 'score';

          return (
            <Animated.View
              key={i}
              style={{
                opacity: a.opacity,
                transform: [{ translateY: a.y }],
                marginBottom: i < CHAT_ITEMS.length - 1 ? 10 : 0,
                alignItems: isCharlotte ? 'flex-start' : 'flex-end',
              }}
            >
              {isScore ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(163,255,60,0.12)',
                  borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
                  borderWidth: 1, borderColor: 'rgba(163,255,60,0.25)',
                  alignSelf: 'flex-start',
                }}>
                  <CheckCircle size={14} color={C.greenDark} weight="fill" />
                  <AppText style={{ fontSize: 13, fontWeight: '700', color: C.greenDark }}>
                    {item.text}
                  </AppText>
                </View>
              ) : (
                <View style={{
                  backgroundColor: isCharlotte ? C.navy : 'rgba(22,21,58,0.07)',
                  borderRadius: 14,
                  borderBottomLeftRadius: isCharlotte ? 3 : 14,
                  borderBottomRightRadius: isCharlotte ? 14 : 3,
                  paddingHorizontal: 12, paddingVertical: 8,
                  maxWidth: '80%',
                }}>
                  <AppText style={{ fontSize: 13, color: isCharlotte ? '#FFFFFF' : C.navy, lineHeight: 18 }}>
                    {item.text}
                  </AppText>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Text */}
      <AppText style={{
        fontSize: 32, fontWeight: '800', color: C.navy,
        textAlign: 'center', lineHeight: 38, letterSpacing: -0.5, marginBottom: 14,
      }}>
        Pratique{'\n'}falando.
      </AppText>
      <AppText style={{
        fontSize: 15, color: C.navyMid, textAlign: 'center', lineHeight: 22, maxWidth: 280,
      }}>
        A Charlotte corrige sua gramática, avalia sua pronúncia e ensina enquanto você fala.
      </AppText>

    </View>
  );
}

// ── Slide 3 — Stay consistent ─────────────────────────────────────────────────

function Slide3({ active }: { active: boolean }) {
  const xpAnim  = useRef(new Animated.Value(0)).current;
  const statO   = useRef(new Animated.Value(0)).current;
  const statY   = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!active) return;
    xpAnim.setValue(0); statO.setValue(0); statY.setValue(12);
    Animated.parallel([
      Animated.timing(statO, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(statY, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(xpAnim, { toValue: 1, duration: 900, delay: 500, useNativeDriver: false }),
    ]).start();
  }, [active]);

  const xpWidth = xpAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '68%'] });

  const stats = [
    { icon: <Flame      size={18} color="#F97316" weight="fill" />, value: '12', label: 'dias seguidos' },
    { icon: <Lightning  size={18} color={C.greenDark} weight="fill" />, value: '340', label: 'XP hoje'     },
    { icon: <MedalMilitary size={18} color="#7C3AED" weight="fill" />, value: '#3',  label: 'ranking'      },
  ];

  return (
    <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>

      {/* Stats card */}
      <Animated.View style={{
        opacity: statO, transform: [{ translateY: statY }],
        width: '100%', backgroundColor: C.card, borderRadius: 20,
        padding: 20, marginBottom: 20,
        borderWidth: 1, borderColor: C.border, ...C.shadow,
      }}>
        {/* Stat pills */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
          {stats.map((s, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(22,21,58,0.06)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </View>
              <AppText style={{ fontSize: 17, fontWeight: '900', color: C.navy, letterSpacing: -0.5 }}>
                {s.value}
              </AppText>
              <AppText style={{ fontSize: 10, color: C.navyLight, fontWeight: '600' }}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* XP bar */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <AppText style={{ fontSize: 11, fontWeight: '700', color: C.navyLight }}>XP do dia</AppText>
            <AppText style={{ fontSize: 11, fontWeight: '700', color: C.greenDark }}>340 / 500</AppText>
          </View>
          <View style={{ height: 8, backgroundColor: 'rgba(22,21,58,0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <Animated.View style={{
              height: '100%', width: xpWidth,
              backgroundColor: C.green, borderRadius: 4,
            }} />
          </View>
        </View>
      </Animated.View>

      {/* Missions preview */}
      <Animated.View style={{
        opacity: statO, transform: [{ translateY: statY }],
        width: '100%', backgroundColor: C.card, borderRadius: 16,
        paddingHorizontal: 20, paddingVertical: 14, marginBottom: 32,
        borderWidth: 1, borderColor: C.border, ...C.shadow,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <ChatCircle size={20} color={C.navyMid} weight="duotone" />
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 13, fontWeight: '700', color: C.navy }}>
            Enviar 10 mensagens
          </AppText>
          <AppText style={{ fontSize: 11, color: C.navyLight, marginTop: 1 }}>
            7 / 10 · +50 XP
          </AppText>
        </View>
        <View style={{
          height: 6, width: 60, backgroundColor: 'rgba(22,21,58,0.08)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <View style={{ height: '100%', width: '70%', backgroundColor: C.green, borderRadius: 3 }} />
        </View>
      </Animated.View>

      {/* Text */}
      <AppText style={{
        fontSize: 32, fontWeight: '800', color: C.navy,
        textAlign: 'center', lineHeight: 38, letterSpacing: -0.5, marginBottom: 14,
      }}>
        Seja{'\n'}consistente.
      </AppText>
      <AppText style={{
        fontSize: 15, color: C.navyMid, textAlign: 'center', lineHeight: 22, maxWidth: 280,
      }}>
        Sequências, XP e missões diárias te mantêm no caminho. 5 minutos por dia já fazem diferença.
      </AppText>

    </View>
  );
}

// ── Slide 4 — Get started ─────────────────────────────────────────────────────

function Slide4() {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }).start();
  }, []);

  const perks = [
    'Acesso completo desde o primeiro dia',
    'Gramática, pronúncia e conversação ao vivo',
    'Cancele quando quiser',
  ];

  return (
    <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>

      <Animated.View style={{ opacity: fadeIn, alignItems: 'center', width: '100%' }}>

        {/* Charlotte + bubble */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 36 }}>
          <CharlotteAvatar size="lg" />
          <View style={{
            backgroundColor: C.navy, borderRadius: 14, borderBottomLeftRadius: 3,
            paddingHorizontal: 14, paddingVertical: 9, maxWidth: 220,
            ...C.shadow,
          }}>
            <AppText style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
              Estarei aqui todos os dias.{'\n'}Pronta quando você estiver.
            </AppText>
          </View>
        </View>

        {/* Headline */}
        <AppText style={{
          fontSize: 32, fontWeight: '800', color: C.navy,
          textAlign: 'center', lineHeight: 38, letterSpacing: -0.5, marginBottom: 8,
        }}>
          Comece sua jornada.
        </AppText>
        <AppText style={{
          fontSize: 14, color: C.navyLight, textAlign: 'center',
          marginBottom: 28, fontWeight: '600',
        }}>
          7 days free, then R$49/month.
        </AppText>

        {/* Perks */}
        <View style={{ width: '100%', gap: 10, marginBottom: 32 }}>
          {perks.map((perk, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color={C.greenDark} weight="fill" />
              <AppText style={{ fontSize: 14, color: C.navyMid, fontWeight: '500' }}>
                {perk}
              </AppText>
            </View>
          ))}
        </View>

      </Animated.View>

    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TOTAL = 4;

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide]   = useState(0);
  const [ready, setReady]   = useState(false);

  // fade in whole screen
  const screenO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenO, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setReady(true);
  }, []);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / W);
    if (idx !== slide) setSlide(idx);
  };

  const goNext = async () => {
    if (slide < TOTAL - 1) {
      scrollRef.current?.scrollTo({ x: (slide + 1) * W, animated: true });
    } else {
      await markOnboardingDone();
      goToLogin();
    }
  };

  const skip = async () => {
    await markOnboardingDone();
    goToLogin();
  };

  const isLast = slide === TOTAL - 1;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: C.bg, opacity: screenO }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Skip button — hidden on first and last slide */}
        <View style={{ height: 44, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20 }}>
          {slide > 0 && !isLast && (
            <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText style={{ fontSize: 14, color: C.navyLight, fontWeight: '600' }}>Pular</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={{ flex: 1 }}
        >
          <Slide1 />
          <Slide2 active={ready && slide === 1} />
          <Slide3 active={ready && slide === 2} />
          <Slide4 />
        </ScrollView>

        {/* Bottom bar */}
        <View style={{
          paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 8 : 16,
          paddingTop: 16, gap: 16,
        }}>

          {/* Dots */}
          <View style={{ alignItems: 'center' }}>
            <Dots total={TOTAL} active={slide} />
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: C.navy,
              borderRadius: 16,
              height: 54,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              ...C.shadow,
            }}
          >
            <AppText style={{ fontSize: 16, fontWeight: '800', color: C.green }}>
              {isLast ? 'Começar' : 'Próximo'}
            </AppText>
            <ArrowRight size={18} color={C.green} weight="bold" />
          </TouchableOpacity>

          {/* Sign-in link — only on last slide */}
          {isLast && (
            <TouchableOpacity onPress={skip} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <AppText style={{ fontSize: 14, color: C.navyLight, fontWeight: '600' }}>
                Já tenho uma conta
              </AppText>
            </TouchableOpacity>
          )}

        </View>

      </SafeAreaView>
    </Animated.View>
  );
}
