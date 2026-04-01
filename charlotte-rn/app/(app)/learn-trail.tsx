import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft, BookOpen, Microphone, CheckCircle,
  Lock, Play, CaretRight,
} from 'phosphor-react-native';
import { useAuth } from '@/hooks/useAuth';
import { AppText } from '@/components/ui/Text';
import { CURRICULUM, TrailLevel, topicHasContent, totalTopics } from '@/data/curriculum';
import { useLearnProgress } from '@/hooks/useLearnProgress';

// ── Palette ────────────────────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  ghost:     'rgba(22,21,58,0.06)',
  ghostMid:  'rgba(22,21,58,0.12)',
  border:    'rgba(22,21,58,0.10)',
  gold:      '#D97706',
  goldBg:    '#FFFBEB',
  goldBorder:'rgba(217,119,6,0.25)',
  green:     '#3D8800',
  greenBg:   '#F0FFD9',
  greenBorder:'rgba(61,136,0,0.25)',
  violet:    '#7C3AED',
  violetBg:  '#F5F3FF',
  lockGray:  '#C4C3D4',
};

const shadow = Platform.select({
  ios:     { shadowColor: 'rgba(22,21,58,0.10)', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 2 },
});

const LEVEL_LABELS: Record<TrailLevel, string> = {
  Novice:   'Novice — A1/A2',
  Inter:    'Intermediate — B1/B2',
  Advanced: 'Advanced — C1/C2',
};

const LEVEL_COLOR: Record<TrailLevel, string> = {
  Novice:   '#D97706',
  Inter:    '#7C3AED',
  Advanced: '#0F766E',
};

export default function LearnTrailScreen() {
  const { profile } = useAuth();
  const level = (profile?.user_level ?? 'Inter') as TrailLevel;
  const userId = profile?.id;

  const { progress, loading, isTopicComplete, isCurrent, isLocked } = useLearnProgress(userId, level);

  const modules   = CURRICULUM[level];
  const accent    = LEVEL_COLOR[level];
  const completed = progress?.completed.length ?? 0;
  const total     = totalTopics(level);
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleStart = (moduleIdx: number, topicIdx: number) => {
    router.push({
      pathname: '/(app)/learn-session',
      params: { level, moduleIndex: String(moduleIdx), topicIndex: String(topicIdx) },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, height: 52,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={C.navy} weight="bold" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1 }}>
            Charlotte
          </AppText>
          <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: -0.3 }}>
            Trilha de Aprendizado
          </AppText>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Trail banner ── */}
        <View style={{
          backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 24,
          borderWidth: 1, borderColor: C.border, ...shadow,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: accent + '18',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={22} color={accent} weight="fill" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 13, fontWeight: '800', color: C.navy }}>
                {LEVEL_LABELS[level]}
              </AppText>
              <AppText style={{ fontSize: 12, color: C.navyLight, fontWeight: '500' }}>
                {modules.length} módulos · {total} tópicos
              </AppText>
            </View>
            <AppText style={{ fontSize: 18, fontWeight: '900', color: accent }}>{pct}%</AppText>
          </View>

          {/* Progress bar */}
          <View style={{ height: 6, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${pct}%` as any, backgroundColor: accent, borderRadius: 3 }} />
          </View>
          <AppText style={{ fontSize: 11, color: C.navyLight, fontWeight: '600', marginTop: 6 }}>
            {completed} de {total} tópicos concluídos
          </AppText>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <ActivityIndicator color={accent} />
            <AppText style={{ color: C.navyLight, marginTop: 12, fontSize: 13 }}>Carregando seu progresso…</AppText>
          </View>
        ) : (
          modules.map((mod, mIdx) => (
            <View key={mIdx} style={{ marginBottom: 24 }}>

              {/* Module header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: accent, alignItems: 'center', justifyContent: 'center',
                }}>
                  <AppText style={{ fontSize: 12, fontWeight: '900', color: '#FFF' }}>
                    {mIdx + 1}
                  </AppText>
                </View>
                <AppText style={{ fontSize: 14, fontWeight: '800', color: C.navy, flex: 1 }}>
                  {mod.title}
                </AppText>
              </View>

              {/* Topics */}
              <View style={{ gap: 8 }}>
                {mod.topics.map((topic, tIdx) => {
                  const complete = isTopicComplete(mIdx, tIdx);
                  const current  = isCurrent(mIdx, tIdx);
                  const locked   = isLocked(mIdx, tIdx);
                  const hasContent = topicHasContent(level, mIdx, tIdx);

                  // If locked and no content, show coming soon
                  const comingSoon = locked && !hasContent;
                  const canTap = (current || complete) && hasContent;

                  return (
                    <TouchableOpacity
                      key={tIdx}
                      onPress={() => canTap && handleStart(mIdx, tIdx)}
                      activeOpacity={canTap ? 0.75 : 1}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        backgroundColor: current ? accent + '0E' : C.card,
                        borderRadius: 14, padding: 14,
                        borderWidth: current ? 1.5 : 1,
                        borderColor: current ? accent + '50' : C.border,
                        opacity: locked ? 0.55 : 1,
                        ...shadow,
                      }}
                    >
                      {/* Status icon */}
                      <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: complete ? C.greenBg : current ? accent + '18' : C.ghost,
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {complete ? (
                          <CheckCircle size={20} color={C.green} weight="fill" />
                        ) : locked ? (
                          <Lock size={18} color={C.lockGray} weight="fill" />
                        ) : (
                          <Play size={18} color={accent} weight="fill" />
                        )}
                      </View>

                      {/* Title */}
                      <View style={{ flex: 1 }}>
                        <AppText style={{
                          fontSize: 13, fontWeight: current ? '700' : '600',
                          color: complete ? C.navyMid : current ? C.navy : locked ? C.navyLight : C.navy,
                          lineHeight: 18,
                        }}>
                          {topic.title}
                        </AppText>

                        {/* Tags */}
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          {topic.grammar.length > 0 && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center', gap: 3,
                              backgroundColor: C.goldBg, borderRadius: 6,
                              paddingHorizontal: 7, paddingVertical: 3,
                            }}>
                              <BookOpen size={11} color={C.gold} weight="fill" />
                              <AppText style={{ fontSize: 10, fontWeight: '700', color: C.gold }}>
                                {topic.grammar.length} gramática
                              </AppText>
                            </View>
                          )}
                          {topic.pronunciation.length > 0 && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center', gap: 3,
                              backgroundColor: C.violetBg, borderRadius: 6,
                              paddingHorizontal: 7, paddingVertical: 3,
                            }}>
                              <Microphone size={11} color={C.violet} weight="fill" />
                              <AppText style={{ fontSize: 10, fontWeight: '700', color: C.violet }}>
                                {topic.pronunciation.length} pron
                              </AppText>
                            </View>
                          )}
                          {comingSoon && (
                            <View style={{
                              backgroundColor: C.ghost, borderRadius: 6,
                              paddingHorizontal: 7, paddingVertical: 3,
                            }}>
                              <AppText style={{ fontSize: 10, fontWeight: '700', color: C.navyLight }}>
                                Em breve
                              </AppText>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* CTA arrow */}
                      {current && hasContent && (
                        <View style={{
                          backgroundColor: accent, borderRadius: 10,
                          paddingHorizontal: 12, paddingVertical: 8,
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                          <AppText style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>Iniciar</AppText>
                          <CaretRight size={12} color="#FFF" weight="bold" />
                        </View>
                      )}
                      {complete && (
                        <AppText style={{ fontSize: 11, fontWeight: '700', color: C.green }}>Feito</AppText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
