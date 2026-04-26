import React, { useEffect, useRef } from 'react';
import {
  View, Modal, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/Text';
import type { TourStep, SpotlightRect } from '@/lib/tourContext';

const OVERLAY   = 'rgba(0,0,0,0.60)';
const NAVY      = '#16153A';
const NAVY_MID  = '#4B4A72';
const NAVY_LIGHT = '#9896B8';
const GREEN     = '#A3FF3C';
const GREEN_DARK = '#3D8800';
const CARD      = '#FFFFFF';

const { width: SW, height: SH } = Dimensions.get('screen');

interface Props {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  spotlightRect: SpotlightRect;
  onNext: () => void;
  onSkip: () => void;
}

export function TourOverlay({
  step, stepIndex, totalSteps, spotlightRect, onNext, onSkip,
}: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fade in when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 220, useNativeDriver: true,
    }).start();
  }, [stepIndex, fadeAnim]);

  // Pulse border around spotlight
  useEffect(() => {
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.000, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stepIndex, pulseAnim]);

  const { x, y, width, height } = spotlightRect;

  // Tooltip: prefer below, but move above if it would overflow screen bottom
  const TOOLTIP_H    = 180; // estimated tooltip height
  const belowY       = y + height + 16;
  const tooltipAbove = belowY + TOOLTIP_H > SH - 20;
  const rawTop       = tooltipAbove ? y - TOOLTIP_H - 12 : belowY;
  const tooltipTop   = Math.max(60, Math.min(rawTop, SH - TOOLTIP_H - 20));
  const isLast       = stepIndex === totalSteps - 1;

  // Arrow horizontal center clamped so it stays within tooltip bounds
  const arrowCenter = Math.max(24, Math.min(SW - 64, x + width / 2 - 20));

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* Dark surround — 4 views create the "hole" */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, y), backgroundColor: OVERLAY }} />
        <View style={{ position: 'absolute', top: y + height, left: 0, right: 0, bottom: 0, backgroundColor: OVERLAY }} />
        <View style={{ position: 'absolute', top: y, left: 0, width: Math.max(0, x), height, backgroundColor: OVERLAY }} />
        <View style={{ position: 'absolute', top: y, left: x + width, right: 0, height, backgroundColor: OVERLAY }} />

        {/* Spotlight border with pulse */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: y, left: x, width, height,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: GREEN,
            transform: [{ scale: pulseAnim }],
          }}
        />

        {/* Tooltip */}
        <View style={{
          position: 'absolute',
          top: tooltipTop,
          left: 16, right: 16,
          backgroundColor: CARD,
          borderRadius: 20,
          padding: 20,
          shadowColor: NAVY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        }}>

          {/* Arrow triangle */}
          {tooltipAbove ? (
            <View style={{
              position: 'absolute',
              bottom: -8,
              left: arrowCenter,
              width: 0, height: 0,
              borderTopWidth: 8,   borderTopColor: CARD,
              borderLeftWidth: 8,  borderLeftColor: 'transparent',
              borderRightWidth: 8, borderRightColor: 'transparent',
            }} />
          ) : (
            <View style={{
              position: 'absolute',
              top: -8,
              left: arrowCenter,
              width: 0, height: 0,
              borderBottomWidth: 8,   borderBottomColor: CARD,
              borderLeftWidth: 8,     borderLeftColor: 'transparent',
              borderRightWidth: 8,    borderRightColor: 'transparent',
            }} />
          )}

          {/* Step counter */}
          <AppText style={{
            fontSize: 11, color: GREEN_DARK, fontWeight: '800',
            letterSpacing: 0.8, marginBottom: 6,
          }}>
            {stepIndex + 1} / {totalSteps}
          </AppText>

          <AppText style={{
            fontSize: 16, color: NAVY, fontWeight: '800',
            lineHeight: 22, marginBottom: 6,
          }}>
            {step.title}
          </AppText>

          <AppText style={{
            fontSize: 14, color: NAVY_MID,
            lineHeight: 20, marginBottom: 18,
          }}>
            {step.description}
          </AppText>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={onSkip}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppText style={{ fontSize: 13, color: NAVY_LIGHT, fontWeight: '600' }}>
                Pular tour
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              style={{
                backgroundColor: NAVY,
                borderRadius: 12,
                paddingHorizontal: 22,
                paddingVertical: 10,
              }}
            >
              <AppText style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '800' }}>
                {isLast ? 'Entendi' : 'Proximo'}
              </AppText>
            </TouchableOpacity>
          </View>

        </View>
      </Animated.View>
    </Modal>
  );
}
