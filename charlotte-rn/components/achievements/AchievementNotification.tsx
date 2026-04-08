import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Lightning, Star, Trophy, Fire, Medal,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { Achievement } from '@/lib/types/achievement';
import { soundEngine, SoundName } from '@/lib/soundEngine';

function achievementSound(rarity: Achievement['rarity']): SoundName {
  switch (rarity) {
    case 'legendary': return 'achievement_legendary';
    case 'epic':      return 'achievement_epic';
    case 'rare':      return 'achievement_rare';
    default:          return 'achievement_common';
  }
}

/** Padrão de vibração escalonado por raridade. */
async function achievementHaptic(rarity: Achievement['rarity']): Promise<void> {
  switch (rarity) {
    case 'legendary':
      // Três pulsos fortes em crescendo: Heavy → Heavy → Heavy (80ms entre eles)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 80));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 80));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'epic':
      // Dois pulsos fortes
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'rare':
      // Um pulso forte único
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    default:
      // Common: pulso de sucesso suave
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

// ── Palette (matches app light theme) ────────────────────────────────────────
const C = {
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  greenBg:   '#F0FFD9',
  sheet:     '#FFFFFF',
  border:    'rgba(22,21,58,0.08)',
};

const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common:    '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#EAB308',
};

const RARITY_BG: Record<Achievement['rarity'], string> = {
  common:    '#F0FFF4',
  rare:      '#EFF6FF',
  epic:      '#FAF5FF',
  legendary: '#FFFBEB',
};

// ── Sparkle particle ─────────────────────────────────────────────────────────
const SPARKLES = [
  { angle: 0,    dist: 80 },
  { angle: 45,   dist: 90 },
  { angle: 90,   dist: 80 },
  { angle: 135,  dist: 90 },
  { angle: 180,  dist: 80 },
  { angle: 225,  dist: 90 },
  { angle: 270,  dist: 80 },
  { angle: 315,  dist: 90 },
];

function SparkleRing({ color, anim }: { color: string; anim: Animated.Value }) {
  return (
    <>
      {SPARKLES.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = Math.cos(rad) * s.dist;
        const y = Math.sin(rad) * s.dist;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, x],
                  }),
                },
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, y],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 1.4, 0],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
            }}
          />
        );
      })}
    </>
  );
}

// ── Rarity icon ───────────────────────────────────────────────────────────────
function RarityIcon({ rarity, size = 44 }: { rarity: Achievement['rarity']; size?: number }) {
  const color = RARITY_COLORS[rarity];
  switch (rarity) {
    case 'legendary': return <Trophy    size={size} color={color} weight="fill" />;
    case 'epic':      return <Fire      size={size} color={color} weight="fill" />;
    case 'rare':      return <Medal     size={size} color={color} weight="fill" />;
    default:          return <Lightning size={size} color={color} weight="fill" />;
  }
}

// ── Main celebration modal ────────────────────────────────────────────────────
interface Props {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
  isPt?: boolean;
}

export default function AchievementNotification({ achievements, onDismiss, isPt = true }: Props) {
  // Show one at a time — pop from front
  const current = achievements[0];

  const scaleAnim   = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const sparkAnim   = React.useRef(new Animated.Value(0)).current;
  const ringAnim    = React.useRef(new Animated.Value(0)).current;
  const glowAnim    = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!current) return;

    // Reset
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    sparkAnim.setValue(0);
    ringAnim.setValue(0);
    glowAnim.setValue(1);

    // 🔊 Som + 📳 vibração sincronizados com a raridade
    soundEngine.play(achievementSound(current.rarity)).catch(() => {});
    achievementHaptic(current.rarity).catch(() => {});

    // Entrance
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim,   { toValue: 1, stiffness: 220, damping: 18, useNativeDriver: true }),
    ]).start(() => {
      // Sparkles burst
      Animated.timing(sparkAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      // Pulsing glow on the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [current?.id]);

  if (!current) return null;

  const rarityColor = RARITY_COLORS[current.rarity];
  const rarityBg    = RARITY_BG[current.rarity];

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.85, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(current.id));
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleDismiss}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(22,21,58,0.75)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: opacityAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              alignItems: 'center',
            }}
          >
            {/* Card */}
            <View
              style={{
                backgroundColor: C.sheet,
                borderRadius: 28,
                paddingHorizontal: 32,
                paddingTop: 40,
                paddingBottom: 36,
                alignItems: 'center',
                width: 300,
                borderWidth: 1,
                borderColor: C.border,
                ...Platform.select({
                  ios:     { shadowColor: rarityColor, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
                  android: { elevation: 12 },
                }),
              }}
            >
              {/* "Achievement Unlocked" label */}
              <View style={{ backgroundColor: rarityBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 24 }}>
                <AppText style={{ color: rarityColor, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {isPt ? 'Conquista Desbloqueada' : 'Achievement Unlocked'}
                </AppText>
              </View>

              {/* Icon with sparkles */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <SparkleRing color={rarityColor} anim={sparkAnim} />
                <Animated.View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 24,
                    backgroundColor: rarityBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: `${rarityColor}40`,
                    transform: [{ scale: glowAnim }],
                  }}
                >
                  <RarityIcon rarity={current.rarity} size={44} />
                </Animated.View>
              </View>

              {/* Title */}
              <AppText style={{ color: C.navy, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
                {current.title}
              </AppText>

              {/* Description */}
              <AppText style={{ color: C.navyMid, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                {current.description}
              </AppText>

              {/* Rarity + XP bonus row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: 20, backgroundColor: rarityBg,
                  borderWidth: 1, borderColor: `${rarityColor}30`,
                }}>
                  <Star size={12} color={rarityColor} weight="fill" />
                  <AppText style={{ color: rarityColor, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {current.rarity}
                  </AppText>
                </View>
                {current.xpBonus > 0 && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 20, backgroundColor: C.greenBg,
                    borderWidth: 1, borderColor: `${C.green}60`,
                  }}>
                    <Lightning size={12} color={C.greenDark} weight="fill" />
                    <AppText style={{ color: C.greenDark, fontSize: 12, fontWeight: '800' }}>
                      +{current.xpBonus} XP
                    </AppText>
                  </View>
                )}
              </View>

              {/* Dismiss button */}
              <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.green,
                  paddingHorizontal: 36,
                  paddingVertical: 14,
                  borderRadius: 16,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <AppText style={{ color: C.navy, fontSize: 15, fontWeight: '800' }}>
                  {isPt ? 'Incrível! 🎉' : 'Awesome! 🎉'}
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
