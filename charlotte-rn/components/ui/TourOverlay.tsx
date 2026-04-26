import React, { useEffect, useRef } from 'react';
import {
  View, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/ui/Text';
import type { TourStep, SpotlightRect } from '@/lib/tourContext';

const OVERLAY    = 'rgba(0,0,0,0.60)';
const NAVY       = '#16153A';
const NAVY_MID   = '#4B4A72';
const NAVY_LIGHT = '#9896B8';
const GREEN      = '#A3FF3C';
const GREEN_DARK = '#3D8800';
const CARD       = '#FFFFFF';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  spotlightRect: SpotlightRect;
  lang: 'pt' | 'en';
  onNext: () => void;
  onSkip: () => void;
}

export function TourOverlay({
  step, stepIndex, totalSteps, spotlightRect, lang, onNext, onSkip,
}: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 220, useNativeDriver: true,
    }).start();
  }, [stepIndex, fadeAnim]);


  const { x, y, width: w, height: h } = spotlightRect;
  const r = Math.min(step.spotlightRadius ?? 14, w / 2, h / 2);

  // SVG path: full screen rect + rounded spotlight hole (evenodd creates the cutout)
  const holePath = [
    `M ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    'Z',
  ].join(' ');
  const overlayPath = `M 0 0 L ${SW} 0 L ${SW} ${SH} L 0 ${SH} Z ${holePath}`;

  const TOOLTIP_H  = 190;
  const belowY     = y + h + 14;
  const tooltipAbove = belowY + TOOLTIP_H > SH - 20;
  const rawTop     = tooltipAbove ? y - TOOLTIP_H - 10 : belowY;
  const tooltipTop = Math.max(60, Math.min(rawTop, SH - TOOLTIP_H - 20));

  const isLast    = stepIndex === totalSteps - 1;
  const skipLabel = lang === 'pt' ? 'Pular tour' : 'Skip tour';
  const nextLabel = lang === 'pt' ? 'Próximo' : 'Next';
  const doneLabel = lang === 'pt' ? 'Entendi' : 'Got it';

  const arrowCenter = Math.max(24, Math.min(SW - 64, x + w / 2 - 20));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        opacity: fadeAnim,
        zIndex: 9999,
        elevation: 9999,
      }}
    >

        {/* SVG overlay with perfectly rounded hole */}
        <Svg
          width={SW}
          height={SH}
          style={{ position: 'absolute', top: 0, left: 0 }}
          pointerEvents="none"
        >
          <Path d={overlayPath} fill={OVERLAY} fillRule="evenodd" />
        </Svg>

        {/* Spotlight border */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: y, left: x, width: w, height: h,
            borderRadius: r,
            borderWidth: 2,
            borderColor: GREEN,
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
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 12,
        }}>
          {tooltipAbove ? (
            <View style={{
              position: 'absolute', bottom: -8, left: arrowCenter,
              width: 0, height: 0,
              borderTopWidth: 8,   borderTopColor: CARD,
              borderLeftWidth: 8,  borderLeftColor: 'transparent',
              borderRightWidth: 8, borderRightColor: 'transparent',
            }} />
          ) : (
            <View style={{
              position: 'absolute', top: -8, left: arrowCenter,
              width: 0, height: 0,
              borderBottomWidth: 8,   borderBottomColor: CARD,
              borderLeftWidth: 8,     borderLeftColor: 'transparent',
              borderRightWidth: 8,    borderRightColor: 'transparent',
            }} />
          )}

          <AppText style={{ fontSize: 11, color: GREEN_DARK, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 }}>
            {stepIndex + 1} / {totalSteps}
          </AppText>
          <AppText style={{ fontSize: 16, color: NAVY, fontWeight: '800', lineHeight: 22, marginBottom: 6 }}>
            {step.title}
          </AppText>
          <AppText style={{ fontSize: 14, color: NAVY_MID, lineHeight: 20, marginBottom: 18 }}>
            {step.description}
          </AppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText style={{ fontSize: 13, color: NAVY_LIGHT, fontWeight: '600' }}>
                {skipLabel}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              style={{ backgroundColor: NAVY, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 }}
            >
              <AppText style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '800' }}>
                {isLast ? doneLabel : nextLabel}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

    </Animated.View>
  );
}
