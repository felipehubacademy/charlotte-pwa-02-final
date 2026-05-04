// app/(app)/(tabs)/discover.tsx
// Discover tab — Tip of the Day + future features (phrases, podcasts, etc.)

import React, { useMemo } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightbulbFilament } from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { UserLevel } from '@/lib/levelConfig';
import { TIPS, TIP_STYLE, getTip } from '@/lib/tips';
import { localTodayStr } from '@/lib/dateUtils';

const C = {
  bg:       '#F4F3FA',
  card:     '#FFFFFF',
  navy:     '#16153A',
  navyMid:  '#4B4A72',
  navyLight:'#9896B8',
  border:   'rgba(22,21,58,0.10)',
  shadow:   'rgba(22,21,58,0.08)',
};

const cardShadow = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
}) as object;

export default function DiscoverTab() {
  const { profile } = useAuth();
  const level = (profile?.charlotte_level ?? 'Novice') as UserLevel;
  const isPt  = level === 'Novice';

  const daySeed = useMemo(() =>
    localTodayStr().split('-').reduce((acc, p) => acc * 100 + parseInt(p, 10), 0),
  []);
  const tip      = getTip(level, daySeed);
  const tipStyle = TIP_STYLE[tip.type];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.card }}>
        <View style={{
          paddingHorizontal: 20, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
          <AppText style={{ fontSize: 20, fontWeight: '800', color: C.navy }}>
            {isPt ? 'Descobrir' : 'Discover'}
          </AppText>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <AppText style={{ fontSize: 11, fontWeight: '800', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          {isPt ? 'Dica do dia' : 'Tip of the day'}
        </AppText>

        {/* Tip card */}
        <View style={{
          backgroundColor: C.card, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: C.border, ...cardShadow,
        }}>
          {/* Icon + type badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: tipStyle.bg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <LightbulbFilament size={22} color={tipStyle.color} weight="fill" />
            </View>
            <View style={{
              backgroundColor: tipStyle.bg, borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <AppText style={{ fontSize: 11, fontWeight: '800', color: tipStyle.color, textTransform: 'capitalize' }}>
                {tip.type}
              </AppText>
            </View>
          </View>

          {/* Term */}
          <AppText style={{ fontSize: 22, fontWeight: '900', color: C.navy, marginBottom: 10 }}>
            {tip.term}
          </AppText>

          {/* Meaning */}
          <AppText style={{ fontSize: 14, color: C.navyMid, lineHeight: 21, marginBottom: 16 }}>
            {isPt && tip.meaningPt ? tip.meaningPt : tip.meaning}
          </AppText>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: C.border, marginBottom: 14 }} />

          {/* Example */}
          <AppText style={{ fontSize: 11, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
            {isPt ? 'Exemplo' : 'Example'}
          </AppText>
          <AppText style={{ fontSize: 14, color: C.navy, lineHeight: 21, fontStyle: 'italic' }}>
            "{isPt && tip.examplePt ? tip.examplePt : tip.example}"
          </AppText>
        </View>

        {/* Future sections placeholder */}
        <View style={{ marginTop: 32 }}>
          <AppText style={{ fontSize: 11, fontWeight: '800', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            {isPt ? 'Em breve' : 'Coming soon'}
          </AppText>
          <View style={{
            backgroundColor: C.card, borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: C.border, ...cardShadow,
            alignItems: 'center', gap: 6,
          }}>
            <AppText style={{ fontSize: 15, fontWeight: '700', color: C.navyLight }}>
              {isPt ? 'Frases do dia, podcasts e mais' : 'Daily phrases, podcasts & more'}
            </AppText>
            <AppText style={{ fontSize: 13, color: C.navyLight, textAlign: 'center' }}>
              {isPt ? 'Novidades chegando em breve nesta aba.' : 'New content coming to this tab soon.'}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
