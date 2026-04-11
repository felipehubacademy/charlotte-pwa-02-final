import React, { useEffect, useState } from 'react';
import {
  View, TouchableOpacity, ScrollView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ChartBar, Trophy, Medal, Lightning, Star, Fire, Microphone,
  PencilLine, GraduationCap, Sun, CalendarCheck,
  HourglassMedium, Warning, ArrowLeft, RocketLaunch, Target, ShareNetwork,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types/achievement';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';
import { shareStreak, shareXP } from '@/lib/shareUtils';
import { checkLevelPromotion, NEXT_LEVEL, PromotionStatus } from '@/lib/levelPromotion';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  sheet:     '#FFFFFF',
  bg:        '#F4F3FA',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  ghost:     'rgba(22,21,58,0.06)',
  border:    'rgba(22,21,58,0.10)',
  green:     '#3D8800',
  greenBg:   '#F0FFD9',
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

const cardShadow = Platform.select({
  ios:     { shadowColor: 'rgba(22,21,58,0.08)', shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
});

const card = {
  backgroundColor: C.sheet,
  borderRadius: 20,
  padding: 16,
  borderWidth: 1,
  borderColor: C.border,
  marginBottom: 10,
  ...cardShadow,
};

type TabType = 'stats' | 'achievements' | 'leaderboard';
type Level   = 'Novice' | 'Inter' | 'Advanced';

interface RecentActivity { type: string; xp: number; timestamp: Date; isMission: boolean; isAchievement: boolean; }
interface RealData {
  streak: number; totalPractices: number; todayXP: number; freshTotalXP: number;
  recentActivity: RecentActivity[]; achievements: Achievement[];
  loading: boolean; error: string | null;
}

function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
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

// ── Screen ───────────────────────────────────────────────────────────────────
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
      // Fetch promotion status
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
  const level       = calculateLevel(displayTotalXP);
  const xpForCurr   = Math.pow(level - 1, 2) * 50;
  const xpForNext   = Math.pow(level, 2) * 50;
  const progress    = xpForNext > xpForCurr ? Math.min(100, ((displayTotalXP - xpForCurr) / (xpForNext - xpForCurr)) * 100) : 100;
  const xpRemaining = Math.max(0, xpForNext - displayTotalXP);

  const TABS: { id: TabType; label: string }[] = [
    { id: 'stats',        label: isPortuguese ? 'Stats'     : 'Stats' },
    { id: 'achievements', label: isPortuguese ? 'Conquistas': 'Badges' },
    { id: 'leaderboard',  label: isPortuguese ? 'Ranking'   : 'Rank' },
  ];
  const TAB_ICONS: Record<TabType, (active: boolean) => React.ReactNode> = {
    stats:        (a) => <ChartBar size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
    achievements: (a) => <Trophy   size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
    leaderboard:  (a) => <Medal    size={15} color={a ? '#FFF' : C.navyLight} weight="fill" />,
  };

  // ── Stats tab ─────────────────────────────────────────────────────────────
  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

      {/* Level progress */}
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={18} color={accent} weight="fill" />
            </View>
            <View>
              <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1 }}>
                {isPortuguese ? 'Nivel Atual' : 'Current Level'}
              </AppText>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy }}>
                {isPortuguese ? 'Nivel' : 'Level'} {level}
              </AppText>
            </View>
          </View>
          <View style={{ backgroundColor: accent + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: accent + '30' }}>
            <AppText style={{ color: accent, fontSize: 11, fontWeight: '800' }}>{userLevel}</AppText>
          </View>
        </View>
        <View style={{ height: 6, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ width: `${progress}%` as `${number}%`, height: '100%', backgroundColor: accent, borderRadius: 3 }} />
        </View>
        <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '600' }}>
          {xpRemaining > 0
            ? `${xpRemaining.toLocaleString()} XP ${isPortuguese ? 'para o proximo nivel' : 'to next level'}`
            : (isPortuguese ? 'Nivel maximo!' : 'Max level!')}
        </AppText>
      </View>

      {/* Promotion progress card — only if not Advanced */}
      {promotionStatus && NEXT_LEVEL[userLevel] && (
        <View style={[card, { marginBottom: 10 }]}>
          <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {isPortuguese ? 'Para subir de nível' : 'To level up'}
          </AppText>

          {/* Trail completion */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navy }}>
                {isPortuguese ? 'Trilha completa' : 'Trail complete'}
              </AppText>
              <AppText style={{ fontSize: 12, fontWeight: '700', color: promotionStatus.trailComplete ? '#3D8800' : C.navyLight }}>
                {promotionStatus.completedTopics}/{promotionStatus.totalTopics}
              </AppText>
            </View>
            <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                width: `${Math.min(100, (promotionStatus.completedTopics / promotionStatus.totalTopics) * 100)}%` as `${number}%`,
                height: '100%',
                backgroundColor: promotionStatus.trailComplete ? '#3D8800' : accent,
                borderRadius: 3,
              }} />
            </View>
          </View>

          {/* XP from trail */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navy }}>
                {isPortuguese ? 'XP da trilha (mín. 80%)' : 'Trail XP (min. 80%)'}
              </AppText>
              <AppText style={{ fontSize: 12, fontWeight: '700', color: promotionStatus.learnXP >= promotionStatus.learnXPThreshold ? '#3D8800' : C.navyLight }}>
                {promotionStatus.learnXP.toLocaleString()}/{promotionStatus.learnXPThreshold.toLocaleString()}
              </AppText>
            </View>
            <View style={{ height: 5, backgroundColor: C.ghost, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                width: `${Math.min(100, (promotionStatus.learnXP / promotionStatus.learnXPThreshold) * 100)}%` as `${number}%`,
                height: '100%',
                backgroundColor: promotionStatus.learnXP >= promotionStatus.learnXPThreshold ? '#3D8800' : accent,
                borderRadius: 3,
              }} />
            </View>
          </View>

          {promotionStatus.eligible && (
            <View style={{
              marginTop: 14, backgroundColor: '#F0FFD9', borderRadius: 12,
              padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
              borderWidth: 1, borderColor: 'rgba(61,136,0,0.20)',
            }}>
              <Star size={16} color="#3D8800" weight="fill" />
              <AppText style={{ color: '#3D8800', fontSize: 12, fontWeight: '700', flex: 1 }}>
                {isPortuguese
                  ? `Você está pronto para o nível ${NEXT_LEVEL[userLevel]}!`
                  : `You're ready for ${NEXT_LEVEL[userLevel]} level!`}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Stat grid */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard icon={<Lightning size={18} color={accent} weight="fill" />} iconBg={accent + '15'}
          label={isPortuguese ? 'Hoje' : 'Today'} value={`+${realData.todayXP}`} unit="XP" />
        <StatCard icon={<Star size={18} color="#D97706" weight="fill" />} iconBg="#FFFBEB"
          label="Total" value={displayTotalXP.toLocaleString()} unit="XP" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard icon={<Fire size={18} color="#EA580C" weight="fill" />} iconBg="rgba(234,88,12,0.10)"
          label={isPortuguese ? 'Sequencia' : 'Streak'} value={String(realData.streak)} unit={isPortuguese ? 'dias' : 'days'} />
        <StatCard icon={<ChartBar size={18} color="#2563EB" weight="fill" />} iconBg="rgba(37,99,235,0.10)"
          label="Total" value={String(realData.totalPractices)} unit={isPortuguese ? 'praticas' : 'practices'} />
      </View>

      {/* Recent activity */}
      <View style={card}>
        <AppText style={{ fontSize: 9, fontWeight: '700', color: C.navyLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
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
                  {a.isMission     && <Target size={12} color="#D97706" weight="fill" />}
                  {a.isAchievement && <Trophy size={12} color="#A855F7" weight="fill" />}
                  <AppText style={{ color: C.navy, fontSize: 13, fontWeight: '600' }}>{a.type}</AppText>
                </View>
                <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                  {a.timestamp.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  {' · '}
                  {a.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
              <View style={{ backgroundColor: C.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(61,136,0,0.15)' }}>
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

  // ── Achievements tab ──────────────────────────────────────────────────────
  const renderAchievements = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {realData.achievements.length > 0 ? (
        realData.achievements.map((ach: any, i) => (
          <View key={ach.id ?? i} style={[card, { borderLeftWidth: 3, borderLeftColor: RARITY_COLORS[ach.rarity] ?? '#22C55E' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
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

  // ── Content dispatcher ────────────────────────────────────────────────────
  const renderContent = () => {
    if (realData.loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <HourglassMedium size={32} color={C.navyLight} weight="fill" />
          <AppText style={{ color: C.navyLight, fontSize: 13, fontWeight: '500' }}>
            {isPortuguese ? 'Carregando...' : 'Loading...'}
          </AppText>
        </View>
      );
    }
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.sheet }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header — mesmo padrão da Learning Trail */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, height: 52,
        borderBottomWidth: 1, borderBottomColor: C.border,
        backgroundColor: C.sheet,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={C.navy} weight="bold" />
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

      {/* Tabs */}
      <View style={{
        flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 16,
        backgroundColor: C.sheet, borderRadius: 14, padding: 4,
        borderWidth: 1, borderColor: C.border,
        ...cardShadow,
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
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, unit }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; unit: string;
}) {
  return (
    <View style={[{ flex: 1 }, {
      backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14,
      borderWidth: 1, borderColor: 'rgba(22,21,58,0.10)', marginBottom: 0,
      ...cardShadow,
    }]}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        {icon}
      </View>
      <AppText style={{ color: '#9896B8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
        {label}
      </AppText>
      <AppText style={{ color: '#16153A', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
        {value}
      </AppText>
      <AppText style={{ color: '#9896B8', fontSize: 11, fontWeight: '500' }}>{unit}</AppText>
    </View>
  );
}
