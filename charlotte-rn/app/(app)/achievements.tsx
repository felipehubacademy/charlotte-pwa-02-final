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

// Full catalog — mirrors the DB trigger in 031_fix_award_achievements.sql
const ALL_ACHIEVEMENTS: { code: string; title: string; category: string; rarity: string }[] = [
  { code: 'first_practice', title: 'Olá, Mundo!',           category: 'general',     rarity: 'common'    },
  { code: 'first_text',     title: 'Primeira Conversa',     category: 'text',        rarity: 'common'    },
  { code: 'first_audio',    title: 'Primeira Voz',          category: 'audio',       rarity: 'common'    },
  { code: 'first_grammar',  title: 'Gramático Iniciante',   category: 'grammar',     rarity: 'common'    },
  { code: 'first_learn',    title: 'Na Trilha',             category: 'learn',       rarity: 'common'    },
  { code: 'practices_10',   title: 'Aquecendo',             category: 'general',     rarity: 'common'    },
  { code: 'practices_50',   title: 'No Ritmo',              category: 'general',     rarity: 'rare'      },
  { code: 'practices_100',  title: 'Comprometido',          category: 'general',     rarity: 'epic'      },
  { code: 'practices_500',  title: 'Lenda da Prática',      category: 'general',     rarity: 'legendary' },
  { code: 'streak_3',       title: 'Consistente',           category: 'streak',      rarity: 'common'    },
  { code: 'streak_7',       title: 'Semana Completa',       category: 'streak',      rarity: 'rare'      },
  { code: 'streak_14',      title: 'Duas Semanas',          category: 'streak',      rarity: 'epic'      },
  { code: 'streak_30',      title: 'Mês de Ouro',           category: 'streak',      rarity: 'legendary' },
  { code: 'text_25',        title: 'Comunicativo',          category: 'text',        rarity: 'rare'      },
  { code: 'text_100',       title: 'Fluente no Chat',       category: 'text',        rarity: 'epic'      },
  { code: 'audio_10',       title: 'Falante',               category: 'audio',       rarity: 'rare'      },
  { code: 'audio_50',       title: 'Voz de Ouro',           category: 'audio',       rarity: 'epic'      },
  { code: 'audio_200',      title: 'Locutor Profissional',  category: 'audio',       rarity: 'legendary' },
  { code: 'grammar_20',     title: 'Gramático Avançado',    category: 'grammar',     rarity: 'rare'      },
  { code: 'grammar_50',     title: 'Mestre da Gramática',   category: 'grammar',     rarity: 'epic'      },
  { code: 'learn_25',       title: 'Trilheiro',             category: 'learn',       rarity: 'rare'      },
  { code: 'learn_100',      title: 'Mestre da Trilha',      category: 'learn',       rarity: 'epic'      },
  { code: 'daily_100',      title: 'Super Dia',             category: 'habit',       rarity: 'rare'      },
  { code: 'daily_200',      title: 'Dia Lendário',          category: 'habit',       rarity: 'epic'      },
  { code: 'early_bird',     title: 'Madrugador',            category: 'habit',       rarity: 'rare'      },
  { code: 'night_owl',      title: 'Coruja Noturna',        category: 'habit',       rarity: 'rare'      },
];

interface EarnedAchievement {
  id: string;
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
  const color = rarity === 'locked' ? 'rgba(22,21,58,0.25)' : (RARITY_COLORS[rarity] ?? '#22C55E');
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
        id: a.achievement_type ?? a.id,
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

  // Badges locked = todos do catálogo que o usuário ainda não ganhou
  const earnedCodes = new Set(data.earned.map(a => a.id));
  const lockedBadges = ALL_ACHIEVEMENTS.filter(a => !earnedCodes.has(a.code));

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

        {/* Right spacer to balance layout */}
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
          marginHorizontal: 16, marginBottom: 20,
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
              {isPortuguese ? 'conquistas desbloqueadas' : 'achievements unlocked'}
            </AppText>
          </View>
        </View>

        {/* Section header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <AppText style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>
            {isPortuguese ? 'Suas Conquistas' : 'Your Badges'}
          </AppText>
        </View>

        {data.earned.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
            <Trophy size={48} color={C.navyLight} weight="fill" />
            <AppText style={{ color: C.navy, fontSize: 15, fontWeight: '800', marginTop: 16, marginBottom: 6, textAlign: 'center' }}>
              {isPortuguese ? 'Nenhuma conquista ainda' : 'No achievements yet'}
            </AppText>
            <AppText style={{ color: C.navyLight, fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
              {isPortuguese
                ? 'Continue praticando para desbloquear sua primeira conquista!'
                : 'Keep practicing to unlock your first achievement!'}
            </AppText>
          </View>
        ) : (
          <>
            {/* Earned detail list */}
            <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
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

            {/* Grid: badge circles for visual overview */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <AppText style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>
                {isPortuguese ? 'Galeria' : 'Gallery'}
              </AppText>
            </View>

            <View style={{
              flexDirection: 'row', flexWrap: 'wrap',
              paddingHorizontal: 16, gap: 12, marginBottom: 24,
            }}>
              {data.earned.map((ach, i) => {
                const rc = RARITY_COLORS[ach.rarity] ?? '#22C55E';
                return (
                  <View key={ach.id ?? i} style={{ width: 72, alignItems: 'center' }}>
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: rc + '20',
                      alignItems: 'center', justifyContent: 'center',
                      marginBottom: 6,
                    }}>
                      <AchievementIcon category={ach.category} rarity={ach.rarity} size={24} />
                    </View>
                    <AppText style={{
                      fontSize: 10, fontWeight: '600', color: C.navy,
                      textAlign: 'center',
                    }} numberOfLines={2}>
                      {ach.title}
                    </AppText>
                  </View>
                );
              })}

              {/* Locked badges — catálogo completo com nomes corretos, cor apagada */}
              {lockedBadges.map((ach) => (
                <View key={ach.code} style={{ width: 72, alignItems: 'center' }}>
                  <View style={{
                    width: 52, height: 52, borderRadius: 26,
                    backgroundColor: C.ghost,
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                  }}>
                    <AchievementIcon category={ach.category} rarity="locked" size={24} />
                  </View>
                  <AppText style={{
                    fontSize: 10, fontWeight: '600', color: C.navyLight,
                    textAlign: 'center',
                  }} numberOfLines={2}>
                    {ach.title}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer note */}
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
