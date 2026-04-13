import React, { useEffect, useState } from 'react';
import {
  View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft, Trophy, Lightning, Fire, Star,
  Microphone, PencilLine, GraduationCap, Sun, CalendarCheck,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { ALL_ACHIEVEMENTS } from '@/lib/achievementsCatalog';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  ghost:     'rgba(22,21,58,0.06)',
  border:    'rgba(22,21,58,0.08)',
  green:     '#3D8800',
  greenLight:'#F0FFD9',
};

const RARITY_COLORS: Record<string, string> = {
  common:    '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#EAB308',
};

type Level = 'Novice' | 'Inter' | 'Advanced';

interface EarnedAchievement {
  id: string;
  code: string;
  title: string;
  description: string;
  xpBonus: number;
  rarity: string;
  category: string;
  earnedAt: Date;
}

interface AchievementsData {
  earned: EarnedAchievement[];
  loading: boolean;
  error: string | null;
}

function AchievementIcon({ category, rarity, size = 22 }: { category: string; rarity: string; size?: number }) {
  const color = rarity === 'locked' ? 'rgba(22,21,58,0.22)' : (RARITY_COLORS[rarity] ?? '#22C55E');
  switch (category) {
    case 'xp':
    case 'xp_milestone': return <Lightning     size={size} color={color} weight="fill" />;
    case 'streak':       return <Fire          size={size} color={color} weight="fill" />;
    case 'audio':        return <Microphone    size={size} color={color} weight="fill" />;
    case 'grammar':
    case 'text':         return <PencilLine    size={size} color={color} weight="fill" />;
    case 'learn':        return <GraduationCap size={size} color={color} weight="fill" />;
    case 'habit':        return <Sun           size={size} color={color} weight="fill" />;
    case 'consistency':  return <CalendarCheck size={size} color={color} weight="fill" />;
    default:             return <Star          size={size} color={color} weight="fill" />;
  }
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function AchievementsScreen() {
  const params = useLocalSearchParams<{
    userId:    string;
    userLevel: string;
    userName:  string;
  }>();

  const userId    = params.userId    ?? '';
  const userLevel = (params.userLevel ?? 'Inter') as Level;
  const isPortuguese = userLevel === 'Novice';

  const [data, setData] = useState<AchievementsData>({
    earned: [], loading: true, error: null,
  });

  useEffect(() => { if (userId) loadData(); }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data: rows, error } = await supabase
        .from('user_achievements')
        .select('id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,category,earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      const earned: EarnedAchievement[] = (rows ?? []).map((a: any) => ({
        id: a.id,
        code: a.achievement_type ?? '',
        title: a.achievement_name ?? 'Achievement',
        description: a.achievement_description ?? '',
        xpBonus: a.xp_bonus ?? 0,
        rarity: a.rarity ?? 'common',
        category: a.category ?? 'general',
        earnedAt: new Date(a.earned_at),
      }));

      setData({ earned, loading: false, error: null });
    } catch {
      setData(prev => ({ ...prev, loading: false, error: 'Error loading achievements' }));
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (data.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  const earnedCodes = new Set(data.earned.map(a => a.code));
  const earnedMap: Record<string, EarnedAchievement> = {};
  data.earned.forEach(a => { earnedMap[a.code] = a; });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, height: 52,
        backgroundColor: C.card,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={C.navy} weight="regular" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1 }}>
            CHARLOTTE
          </AppText>
          <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: -0.3 }}>
            {isPortuguese ? 'Conquistas' : 'Achievements'}
          </AppText>
        </View>

        <View style={{ width: 22 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Summary bar */}
        <View style={{
          marginHorizontal: 16, marginBottom: 24,
          backgroundColor: C.card, borderRadius: 20, padding: 16,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: '#EAB30820', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={22} color="#EAB308" weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 22, fontWeight: '800', color: C.navy }}>
              {data.earned.length}
            </AppText>
            <AppText style={{ fontSize: 12, fontWeight: '600', color: C.navyLight }}>
              {isPortuguese
                ? `de ${ALL_ACHIEVEMENTS.length} conquistas desbloqueadas`
                : `of ${ALL_ACHIEVEMENTS.length} achievements unlocked`}
            </AppText>
          </View>
        </View>

        {/* Earned detail cards — only when there are earned ones */}
        {data.earned.length > 0 && (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <AppText style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>
                {isPortuguese ? 'Suas Conquistas' : 'Your Badges'}
              </AppText>
            </View>

            <View style={{ marginHorizontal: 16, marginBottom: 28 }}>
              {data.earned.map((ach, i) => {
                const rc = RARITY_COLORS[ach.rarity] ?? '#22C55E';
                return (
                  <View
                    key={ach.id ?? i}
                    style={{
                      backgroundColor: C.card, borderRadius: 16, padding: 14,
                      flexDirection: 'row', alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: rc + '20',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 12, flexShrink: 0,
                    }}>
                      <AchievementIcon category={ach.category} rarity={ach.rarity} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <AppText style={{ color: C.navy, fontWeight: '800', fontSize: 13, flex: 1, marginRight: 8 }}>
                          {ach.title}
                        </AppText>
                        {ach.xpBonus > 0 && (
                          <View style={{ backgroundColor: C.greenLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                            <AppText style={{ color: C.green, fontSize: 11, fontWeight: '800' }}>
                              +{ach.xpBonus} XP
                            </AppText>
                          </View>
                        )}
                      </View>
                      {ach.description.length > 0 && (
                        <AppText style={{ color: C.navyMid, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>
                          {ach.description}
                        </AppText>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '500' }}>
                          {ach.earnedAt.toLocaleDateString()}
                        </AppText>
                        <View style={{
                          paddingHorizontal: 6, paddingVertical: 2,
                          borderRadius: 6, backgroundColor: rc + '18',
                        }}>
                          <AppText style={{
                            fontSize: 10, fontWeight: '700', color: rc,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>
                            {ach.rarity}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Full catalog grid — always visible, earned colored, locked greyed */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <AppText style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>
            {isPortuguese ? 'Todas as Conquistas' : 'All Achievements'}
          </AppText>
        </View>

        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          paddingHorizontal: 16, gap: 16, marginBottom: 24,
        }}>
          {ALL_ACHIEVEMENTS.map(catalog => {
            const isEarned = earnedCodes.has(catalog.code);
            const rc = RARITY_COLORS[catalog.rarity] ?? '#22C55E';
            return (
              <View key={catalog.code} style={{ width: 72, alignItems: 'center' }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: isEarned ? rc + '20' : C.ghost,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <AchievementIcon
                    category={catalog.category}
                    rarity={isEarned ? catalog.rarity : 'locked'}
                    size={24}
                  />
                </View>
                <AppText style={{
                  fontSize: 10, fontWeight: '600',
                  color: isEarned ? C.navy : C.navyLight,
                  textAlign: 'center',
                }} numberOfLines={2}>
                  {catalog.title}
                </AppText>
                {isEarned && (
                  <View style={{
                    marginTop: 3, width: 8, height: 8, borderRadius: 4,
                    backgroundColor: rc,
                  }} />
                )}
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
          <AppText style={{ fontSize: 12, fontWeight: '500', color: C.navyLight, textAlign: 'center' }}>
            {isPortuguese
              ? 'Continue praticando para desbloquear mais conquistas!'
              : 'Keep practicing to unlock more achievements!'}
          </AppText>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
