import React, { useEffect, useState } from 'react';
import {
  View, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ChartBar, Trophy, Medal, Lightning, Star, Fire, Microphone,
  PencilLine, GraduationCap, Sun, CalendarCheck,
  Warning, ArrowLeft, RocketLaunch, Target, ShareNetwork, BookOpenText,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types/achievement';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';
import { shareStreak, shareXP } from '@/lib/shareUtils';
import { checkLevelPromotion, NEXT_LEVEL, PROMOTION_XP_THRESHOLD, TOTAL_TOPICS_PER_LEVEL, PromotionStatus } from '@/lib/levelPromotion';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  ghost:     'rgba(22,21,58,0.06)',
  border:    'rgba(22,21,58,0.08)',
  green:     '#3D8800',
  greenBg:   'rgba(61,136,0,0.10)',
  greenLight:'#F0FFD9',
  orange:    '#EA580C',
  orangeBg:  'rgba(234,88,12,0.10)',
  gold:      '#D97706',
  goldBg:    'rgba(217,119,6,0.10)',
};

const LEVEL_COLOR: Record<string, string> = {
  Novice:   '#D97706',
  Inter:    '#7C3AED',
  Advanced: '#0F766E',
};

const RARITY_COLORS: Record<string, string> = {
  common:    '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#EAB308',
};

// No shadows — white cards on gray bg, separation is enough
const card = {
  backgroundColor: C.card,
  borderRadius: 20,
  padding: 16,
  marginBottom: 10,
};

type TabType = 'stats' | 'achievements' | 'leaderboard';
type Level   = 'Novice' | 'Inter' | 'Advanced';

interface RecentActivity { type: string; xp: number; timestamp: Date; isMission: boolean; isAchievement: boolean; }
interface RealData {
  streak: number; totalPractices: number; todayXP: number; freshTotalXP: number;
  recentActivity: RecentActivity[]; achievements: Achievement[];
  loading: boolean; error: string | null;
}

function AchievementIcon({ category, rarity, size = 20 }: { category: string; rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity] ?? '#22C55E';
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const params = useLocalSearchParams<{
    sessionXP: string;
    totalXP:   string;
    userId:    string;
    userLevel: string;
    userName:  string;
  }>();

  const sessionXP = Number(params.sessionXP ?? 0);
  const totalXP   = Number(params.totalXP   ?? 0);
  const userId    = params.userId   ?? undefined;
  const userLevel = (params.userLevel ?? 'Inter') as Level;
  const userName  = params.userName  ?? undefined;

  const isPortuguese = userLevel === 'Novice';
  const accent       = LEVEL_COLOR[userLevel] ?? C.navy;

  const [activeTab,      setActiveTab]      = useState<TabType>('stats');
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [promotionStatus, setPromotionStatus] = useState<PromotionStatus | null>(null);
  const [realData, setRealData] = useState<RealData>({
    streak: 0, totalPractices: 0, todayXP: 0, freshTotalXP: 0,
    recentActivity: [], achievements: [], loading: true, error: null,
  });

  useEffect(() => { if (userId) loadData(); }, [userId]);

  useEffect(() => {
    if (activeTab === 'leaderboard') setLeaderboardKey(k => k + 1);
  }, [activeTab]);

  const loadData = async () => {
    if (!userId) return;
    setRealData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const [statsRes, historyRes, todayPracticesRes, achievementsRes, todayAchievementsRes] = await Promise.all([
        supabase.from('charlotte_progress').select('streak_days,total_xp').eq('user_id', userId).maybeSingle(),
        supabase.from('charlotte_practices').select('practice_type,xp_earned,created_at')
          .eq('user_id', userId)
          .not('practice_type', 'like', 'achievement_reward_%')
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('charlotte_practices').select('xp_earned')
          .eq('user_id', userId).gte('created_at', todayStart.toISOString()),
        supabase.from('user_achievements').select('*').eq('user_id', userId)
          .order('earned_at', { ascending: false }).limit(50),
        supabase.from('user_achievements').select('achievement_name,xp_bonus,earned_at,category,rarity')
          .eq('user_id', userId)
          .gte('earned_at', todayStart.toISOString())
          .order('earned_at', { ascending: false }),
      ]);

      const typeLabels: Record<string, string> = {
        text_message:      isPortuguese ? 'Conversa por texto'      : 'Text Chat',
        audio_message:     isPortuguese ? 'Conversa por voz'        : 'Voice Chat',
        live_voice:        isPortuguese ? 'Conversa ao vivo'        : 'Live Conversation',
        pronunciation:     isPortuguese ? 'Pronuncia'               : 'Pronunciation',
        grammar:           isPortuguese ? 'Gramatica'               : 'Grammar',
        learn_exercise:    isPortuguese ? 'Trilha de Aprendizado'   : 'Learning Trail',
        image_recognition: isPortuguese ? 'Pratica'                 : 'Practice',
      };
      const getLabel = (type: string) => {
        if (type.startsWith('mission_reward_')) return isPortuguese ? 'Missao Concluida' : 'Mission Complete';
        return typeLabels[type] ?? (isPortuguese ? 'Pratica' : 'Practice');
      };

      const todayPracticesXP   = (todayPracticesRes.data ?? []).reduce((s: number, p: any) => s + (p.xp_earned ?? 0), 0);
      const todayAchievementXP = (todayAchievementsRes.data ?? []).reduce((s: number, a: any) => s + (a.xp_bonus ?? 0), 0);

      const practiceRows: RecentActivity[] = (historyRes.data ?? []).map((p: any) => ({
        type: getLabel(p.practice_type), xp: p.xp_earned ?? 0,
        timestamp: new Date(p.created_at),
        isMission: p.practice_type.startsWith('mission_reward_'), isAchievement: false,
      }));
      const achievementRows: RecentActivity[] = (todayAchievementsRes.data ?? []).map((a: any) => ({
        type: isPortuguese ? 'Conquista Desbloqueada' : 'Achievement Unlocked',
        xp: a.xp_bonus ?? 0, timestamp: new Date(a.earned_at),
        isMission: false, isAchievement: true,
      }));
      const recentActivity = [...practiceRows, ...achievementRows]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 12);

      setRealData({
        streak: statsRes.data?.streak_days ?? 0,
        totalPractices: historyRes.data?.length ?? 0,
        todayXP: todayPracticesXP + todayAchievementXP,
        freshTotalXP: statsRes.data?.total_xp ?? totalXP,
        recentActivity,
        achievements: (achievementsRes.data ?? []).map((a: any) => ({
          id: a.id, type: a.achievement_type ?? 'general',
          title: a.achievement_name ?? 'Achievement',
          description: a.achievement_description ?? '',
          xpBonus: a.xp_bonus ?? 0, rarity: a.rarity ?? 'common',
          icon: a.badge_icon ?? '', category: a.category ?? 'general',
          earnedAt: new Date(a.earned_at),
        })),
        loading: false, error: null,
      });

      const { data: progressData } = await supabase
        .from('learn_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('level', userLevel)
        .maybeSingle();
      const completedCount = (progressData?.completed ?? []).length;
      const status = await checkLevelPromotion(userId, userLevel, completedCount);
      setPromotionStatus(status);
    } catch {
      setRealData(prev => ({ ...prev, loading: false, error: 'Error loading data' }));
    }
  };

  const displayTotalXP = realData.loading ? totalXP : realData.freshTotalXP;

  const TABS: { id: TabType; label: string }[] = [
    { id: 'stats',        label: 'Stats' },
    { id: 'achievements', label: isPortuguese ? 'Conquistas' : 'Badges' },
    { id: 'leaderboard',  label: isPortuguese ? 'Ranking' : 'Rank' },
  ];
  const TAB_ICONS: Record<TabType, (active: boolean) => React.ReactNode> = {
    stats:        (a) => <ChartBar size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
    achievements: (a) => <Trophy   size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
    leaderboard:  (a) => <Medal    size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
  };

  // ── Stats tab ──────────────────────────────────────────────────────────────
  const promotionXPThreshold = PROMOTION_XP_THRESHOLD[userLevel] ?? 9999;
  const trailTotal           = promotionStatus?.totalTopics ?? TOTAL_TOPICS_PER_LEVEL[userLevel] ?? 0;
  const trailDone            = promotionStatus?.completedTopics ?? 0;
  const trailPct             = trailTotal > 0 ? Math.min(100, (trailDone / trailTotal) * 100) : 0;
  const xpPct                = Math.min(100, (displayTotalXP / promotionXPThreshold) * 100);
  const nextLevelName        = NEXT_LEVEL[userLevel];

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

      {/* ── Counters row ─── */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>

        {/* Today XP */}
        <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Lightning size={14} color={C.green} weight="fill" />
            <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {isPortuguese ? 'Hoje XP' : 'Today XP'}
            </AppText>
          </View>
          <AppText style={{ fontSize: 26, fontWeight: '800', color: C.navy, letterSpacing: -0.5 }}>
            +{realData.todayXP}
          </AppText>
        </View>

        {/* Total XP */}
        <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Lightning size={14} color={C.green} weight="fill" />
            <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Total XP
            </AppText>
          </View>
          <AppText style={{ fontSize: 26, fontWeight: '800', color: C.navy, letterSpacing: -0.5 }}>
            {displayTotalXP.toLocaleString()}
          </AppText>
        </View>

        {/* Streak */}
        <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Fire size={14} color={C.orange} weight="fill" />
            <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {isPortuguese ? 'Sequencia' : 'Streak'}
            </AppText>
          </View>
          <AppText style={{ fontSize: 26, fontWeight: '800', color: C.navy, letterSpacing: -0.5 }}>
            {realData.streak}
            <AppText style={{ fontSize: 13, fontWeight: '600', color: C.navyLight }}>{' '}{isPortuguese ? 'd' : 'd'}</AppText>
          </AppText>
        </View>

      </View>

      {/* ── Progress card — trail + XP ─── */}
      <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 10 }}>

        {/* Header: icon + level badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Star size={18} color={accent} weight="fill" />
          <View style={{ backgroundColor: accent + '18', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
            <AppText style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{userLevel}</AppText>
          </View>
        </View>

        {/* Trail */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BookOpenText size={13} color={C.navyLight} weight="bold" />
              <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navy }}>
                {isPortuguese ? 'Trilha de Aprendizado' : 'Learning Trail'}
              </AppText>
            </View>
            <AppText style={{ fontSize: 12, fontWeight: '700', color: trailDone >= trailTotal && trailTotal > 0 ? C.green : C.navyLight }}>
              {trailDone}/{trailTotal}
            </AppText>
          </View>
          <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{
              width: `${trailPct}%` as `${number}%`, height: '100%',
              backgroundColor: trailDone >= trailTotal && trailTotal > 0 ? C.green : accent,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* XP */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Lightning size={13} color={C.navyLight} weight="fill" />
              <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navy }}>XP</AppText>
            </View>
            <AppText style={{ fontSize: 12, fontWeight: '700', color: displayTotalXP >= promotionXPThreshold ? C.green : C.navyLight }}>
              {displayTotalXP.toLocaleString()}/{promotionXPThreshold.toLocaleString()}
            </AppText>
          </View>
          <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{
              width: `${xpPct}%` as `${number}%`, height: '100%',
              backgroundColor: displayTotalXP >= promotionXPThreshold ? C.green : accent,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* Eligible banner */}
        {promotionStatus?.eligible && nextLevelName && (
          <View style={{
            marginTop: 14, backgroundColor: C.greenLight, borderRadius: 12,
            padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Star size={13} color={C.green} weight="fill" />
            <AppText style={{ color: C.green, fontSize: 12, fontWeight: '700', flex: 1 }}>
              {isPortuguese ? `Pronto para o nivel ${nextLevelName}!` : `Ready for ${nextLevelName} level!`}
            </AppText>
          </View>
        )}
      </View>

      {/* ── Recent activity ─── */}
      <View style={card}>
        <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          {isPortuguese ? 'Atividade Recente' : 'Recent Activity'}
        </AppText>
        {realData.recentActivity.length > 0 ? (
          realData.recentActivity.map((a, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 10,
              borderBottomWidth: i < realData.recentActivity.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {a.isMission     && <Target size={12} color={C.gold}   weight="fill" />}
                  {a.isAchievement && <Trophy size={12} color="#A855F7"  weight="fill" />}
                  <AppText style={{ color: C.navy, fontSize: 13, fontWeight: '600' }}>{a.type}</AppText>
                </View>
                <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                  {a.timestamp.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  {' · '}
                  {a.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
              <View style={{ backgroundColor: C.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <AppText style={{ color: C.green, fontSize: 12, fontWeight: '800' }}>+{a.xp}</AppText>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <RocketLaunch size={32} color={C.navyLight} weight="fill" />
            <AppText style={{ color: C.navyLight, fontSize: 13, fontWeight: '500', marginTop: 10 }}>
              {isPortuguese ? 'Nenhuma atividade ainda' : 'No activity yet'}
            </AppText>
          </View>
        )}
      </View>

    </ScrollView>
  );

  // ── Achievements tab ───────────────────────────────────────────────────────
  const renderAchievements = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {realData.achievements.length > 0 ? (
        realData.achievements.map((ach: any, i) => (
          <View key={ach.id ?? i} style={[card, { borderLeftWidth: 3, borderLeftColor: RARITY_COLORS[ach.rarity] ?? '#22C55E' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: `${RARITY_COLORS[ach.rarity] ?? '#22C55E'}15`,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <AchievementIcon category={ach.category ?? ach.type ?? 'general'} rarity={ach.rarity} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <AppText style={{ color: C.navy, fontWeight: '800', fontSize: 13, flex: 1, marginRight: 8 }}>{ach.title}</AppText>
                  {ach.xpBonus > 0 && (
                    <AppText style={{ color: C.green, fontSize: 12, fontWeight: '800' }}>+{ach.xpBonus} XP</AppText>
                  )}
                </View>
                <AppText style={{ color: C.navyMid, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>{ach.description}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '500' }}>{ach.earnedAt.toLocaleDateString()}</AppText>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `${RARITY_COLORS[ach.rarity] ?? '#22C55E'}18` }}>
                    <AppText style={{ fontSize: 10, fontWeight: '700', color: RARITY_COLORS[ach.rarity] ?? '#22C55E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {ach.rarity}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Trophy size={48} color={C.navyLight} weight="fill" />
          <AppText style={{ color: C.navy, fontSize: 15, fontWeight: '800', marginTop: 16, marginBottom: 6 }}>
            {isPortuguese ? 'Nenhuma conquista ainda' : 'No achievements yet'}
          </AppText>
          <AppText style={{ color: C.navyLight, fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
            {isPortuguese ? 'Continue praticando!' : 'Keep practicing to unlock your first!'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );

  // ── Content dispatcher ─────────────────────────────────────────────────────
  const renderContent = () => {
    if (realData.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Warning size={28} color="#DC2626" weight="fill" />
          <AppText style={{ color: '#DC2626', fontSize: 13 }}>{realData.error}</AppText>
        </View>
      );
    }
    switch (activeTab) {
      case 'stats':        return renderStats();
      case 'achievements': return renderAchievements();
      case 'leaderboard':  return <LevelLeaderboard userLevel={userLevel} userId={userId} userName={userName} refreshTrigger={leaderboardKey} />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (realData.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

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
            Charlotte
          </AppText>
          <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: -0.3 }}>
            {isPortuguese ? 'Seu Progresso' : 'Your Progress'}
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (realData.streak > 0) shareStreak(realData.streak, isPortuguese);
            else shareXP(realData.freshTotalXP || totalXP, isPortuguese);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ShareNetwork size={20} color={C.navyLight} weight="regular" />
        </TouchableOpacity>
      </View>

      {/* Gray area: tabs + content */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 12,
          backgroundColor: C.card, borderRadius: 14, padding: 4,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', paddingVertical: 9,
                  borderRadius: 10, gap: 5,
                  backgroundColor: isActive ? C.navy : 'transparent',
                }}
              >
                {TAB_ICONS[tab.id](isActive)}
                <AppText style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFFFFF' : C.navyLight }}>
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {renderContent()}
        </View>

      </View>
    </SafeAreaView>
  );
}
