import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import {
  ChartBar, Trophy, Medal, Lightning, Star, Fire, Microphone,
  PencilLine, GraduationCap, Sun, Moon, CalendarCheck,
  HourglassMedium, Warning, X, RocketLaunch, Target,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types/achievement';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';

// ── Light theme ───────────────────────────────────────────────
const C = {
  overlay:    'rgba(22,21,58,0.45)',
  sheet:      '#FFFFFF',
  bg:         '#F4F3FA',
  navy:       '#16153A',
  navyMid:    '#4B4A72',
  navyLight:  '#9896B8',
  border:     'rgba(22,21,58,0.07)',
  green:      '#A3FF3C',
  greenDark:  '#3D8800',
  greenBg:    '#F0FFD9',
  handle:     'rgba(22,21,58,0.15)',
};

const cardStyle = {
  backgroundColor: C.bg,
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: C.border,
  marginBottom: 10,
};

const shadow = Platform.select({
  ios: { shadowColor: 'rgba(22,21,58,0.06)', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 2 },
});

type TabType = 'stats' | 'achievements' | 'leaderboard';

const TAB_ICONS: Record<TabType, (color: string) => React.ReactNode> = {
  stats:        (c) => <ChartBar size={15} color={c} weight="duotone" />,
  achievements: (c) => <Trophy  size={15} color={c} weight="duotone" />,
  leaderboard:  (c) => <Medal   size={15} color={c} weight="duotone" />,
};

const RARITY_COLORS: Record<string, string> = {
  common:    '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#EAB308',
};

// Map achievement category to a Phosphor icon
function AchievementIcon({ category, rarity, size = 22 }: { category: string; rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity] ?? '#22C55E';
  switch (category) {
    case 'xp':
    case 'xp_milestone': return <Lightning    size={size} color={color} weight="duotone" />;
    case 'streak':       return <Fire         size={size} color={color} weight="duotone" />;
    case 'audio':        return <Microphone   size={size} color={color} weight="duotone" />;
    case 'grammar':
    case 'text':         return <PencilLine   size={size} color={color} weight="duotone" />;
    case 'learn':        return <GraduationCap size={size} color={color} weight="duotone" />;
    case 'habit':        return <Sun          size={size} color={color} weight="duotone" />;
    case 'consistency':  return <CalendarCheck size={size} color={color} weight="duotone" />;
    default:             return <Star         size={size} color={color} weight="duotone" />;
  }
}

interface EnhancedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionXP: number;
  totalXP: number;
  userId?: string;
  userLevel?: 'Novice' | 'Inter' | 'Advanced';
  userName?: string;
}

interface RecentActivity { type: string; xp: number; timestamp: Date; isMission: boolean; isAchievement: boolean; }
interface RealData {
  streak: number; totalPractices: number; todayXP: number; freshTotalXP: number;
  recentActivity: RecentActivity[]; achievements: Achievement[];
  loading: boolean; error: string | null;
}

function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export default function EnhancedStatsModal({
  isOpen, onClose, sessionXP, totalXP, userId, userLevel = 'Inter', userName,
}: EnhancedStatsModalProps) {
  const isPortuguese = userLevel === 'Novice';
  const [activeTab, setActiveTab] = React.useState<TabType>('stats');
  const [leaderboardKey, setLeaderboardKey] = React.useState(0);
  const [realData, setRealData]   = React.useState<RealData>({
    streak: 0, totalPractices: 0, todayXP: 0, freshTotalXP: 0, recentActivity: [], achievements: [], loading: true, error: null,
  });
  const tabAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen && userId) loadData();
  }, [isOpen, userId]);

  // Refresh leaderboard each time the tab is opened
  React.useEffect(() => {
    if (activeTab === 'leaderboard') setLeaderboardKey(k => k + 1);
  }, [activeTab]);

  const loadData = async () => {
    if (!userId) return;
    setRealData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const [statsRes, historyRes, todayPracticesRes, achievementsRes, todayAchievementsRes] = await Promise.all([
        supabase.from('rn_user_progress').select('streak_days,total_xp').eq('user_id', userId).maybeSingle(),
        // Last 10 RN practices (excluding achievement/mission rewards — shown separately)
        supabase.from('rn_user_practices').select('practice_type,xp_earned,created_at')
          .eq('user_id', userId)
          .not('practice_type', 'like', 'achievement_reward_%')
          .order('created_at', { ascending: false }).limit(10),
        // Today's XP from practices
        supabase.from('rn_user_practices').select('xp_earned')
          .eq('user_id', userId).gte('created_at', todayStart.toISOString()),
        // All achievements for Conquistas tab
        supabase.from('user_achievements').select('*').eq('user_id', userId)
          .order('earned_at', { ascending: false }).limit(50),
        // Today's achievements for Atividade Recente + Hoje XP bonus
        supabase.from('user_achievements').select('achievement_name,xp_bonus,earned_at,category,rarity')
          .eq('user_id', userId)
          .gte('earned_at', todayStart.toISOString())
          .order('earned_at', { ascending: false }),
      ]);

      const typeLabels: Record<string, string> = {
        text_message:     isPortuguese ? 'Conversa por texto' : 'Text Chat',
        audio_message:    isPortuguese ? 'Conversa por voz'   : 'Voice Chat',
        live_voice:       isPortuguese ? 'Conversa ao vivo'   : 'Live Conversation',
        pronunciation:    isPortuguese ? 'Pronúncia'          : 'Pronunciation',
        grammar:          isPortuguese ? 'Gramática'          : 'Grammar',
        learn_exercise:   isPortuguese ? 'Trilha de Aprendizado' : 'Learning Trail',
        image_recognition:'Object Recognition',
        camera_object:    'Object Recognition',
      };
      const getActivityLabel = (type: string) => {
        if (type.startsWith('mission_reward_')) return isPortuguese ? 'Missão Concluída' : 'Mission Complete';
        return typeLabels[type] ?? (isPortuguese ? 'Prática' : 'Practice');
      };

      // Today XP = practices + achievement bonuses earned today
      const todayPracticesXP   = (todayPracticesRes.data ?? []).reduce((s: number, p: any) => s + (p.xp_earned ?? 0), 0);
      const todayAchievementXP = (todayAchievementsRes.data ?? []).reduce((s: number, a: any) => s + (a.xp_bonus ?? 0), 0);
      const todayXPsum         = todayPracticesXP + todayAchievementXP;

      // Build recent activity: practices + today's achievements merged and sorted by time
      const practiceRows: RecentActivity[] = (historyRes.data ?? []).map((p: any) => ({
        type:          getActivityLabel(p.practice_type),
        xp:            p.xp_earned ?? 0,
        timestamp:     new Date(p.created_at),
        isMission:     p.practice_type.startsWith('mission_reward_'),
        isAchievement: false,
      }));
      const achievementRows: RecentActivity[] = (todayAchievementsRes.data ?? []).map((a: any) => ({
        type:          isPortuguese ? 'Conquista Desbloqueada' : 'Achievement Unlocked',
        xp:            a.xp_bonus ?? 0,
        timestamp:     new Date(a.earned_at),
        isMission:     false,
        isAchievement: true,
      }));
      const recentActivity = [...practiceRows, ...achievementRows]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 12);

      setRealData({
        streak:         statsRes.data?.streak_days ?? 0,
        totalPractices: historyRes.data?.length    ?? 0,
        todayXP:        todayXPsum,
        freshTotalXP:   statsRes.data?.total_xp   ?? totalXP,
        recentActivity,
        achievements: (achievementsRes.data ?? []).map((a: any) => ({
          id: a.id, type: a.achievement_type ?? 'general',
          title: a.achievement_name ?? 'Achievement',
          description: a.achievement_description ?? '',
          xpBonus: a.xp_bonus ?? 0,
          rarity: a.rarity ?? 'common',
          icon: a.badge_icon ?? '',
          category: a.category ?? 'general',
          earnedAt: new Date(a.earned_at),
        })),
        loading: false, error: null,
      });
    } catch {
      setRealData(prev => ({ ...prev, loading: false, error: 'Error loading data' }));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    Animated.timing(tabAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start(() =>
      Animated.timing(tabAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    );
  };

  // Use freshTotalXP from DB (loaded in loadData) to avoid stale prop after achievement bonuses
  const displayTotalXP = realData.loading ? totalXP : realData.freshTotalXP;
  const level       = calculateLevel(displayTotalXP);
  const xpForCurr   = Math.pow(level - 1, 2) * 50;
  const xpForNext   = Math.pow(level, 2) * 50;
  const progress    = xpForNext > xpForCurr ? Math.min(100, ((displayTotalXP - xpForCurr) / (xpForNext - xpForCurr)) * 100) : 100;
  const xpRemaining = Math.max(0, xpForNext - displayTotalXP);

  const TABS: { id: TabType; label: string }[] = [
    { id: 'stats',        label: 'Stats' },
    { id: 'achievements', label: isPortuguese ? 'Conquistas' : 'Badges' },
    { id: 'leaderboard',  label: isPortuguese ? 'Ranking' : 'Rank' },
  ];

  // ── Stats tab ─────────────────────────────────────────────

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* Level progress card */}
      <View style={[cardStyle, shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <AppText style={{ color: C.navyLight, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {isPortuguese ? 'Nível Atual' : 'Current Level'}
          </AppText>
          <View style={{ backgroundColor: C.greenBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <AppText style={{ color: C.greenDark, fontSize: 11, fontWeight: '700' }}>{userLevel}</AppText>
          </View>
        </View>
        <AppText style={{ color: C.navy, fontSize: 26, fontWeight: '800', marginBottom: 12 }}>
          {isPortuguese ? 'Nível' : 'Level'} {level}
        </AppText>
        <View style={{ height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: C.green, borderRadius: 4 }} />
        </View>
        <AppText style={{ color: C.navyLight, fontSize: 12 }}>
          {xpRemaining > 0
            ? `${xpRemaining.toLocaleString()} XP ${isPortuguese ? 'para próximo nível' : 'to next level'}`
            : isPortuguese ? 'Nível máximo!' : 'Max level!'}
        </AppText>
      </View>

      {/* Stats grid row 1 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 0 }}>
        <StatCard icon={<Lightning size={22} color={C.greenDark} weight="duotone" />}
          label={isPortuguese ? 'Hoje' : 'Today'} value={`+${realData.todayXP}`} unit="XP" />
        <StatCard icon={<Star size={22} color="#D97706" weight="duotone" />}
          label="Total" value={displayTotalXP.toLocaleString()} unit="XP" />
      </View>

      {/* Stats grid row 2 */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 0 }}>
        <StatCard icon={<Fire size={22} color="#EA580C" weight="duotone" />}
          label={isPortuguese ? 'Sequência' : 'Streak'} value={String(realData.streak)}
          unit={isPortuguese ? 'dias' : 'days'} />
        <StatCard icon={<ChartBar size={22} color="#2563EB" weight="duotone" />}
          label="Total" value={String(realData.totalPractices)}
          unit={isPortuguese ? 'práticas' : 'practices'} />
      </View>

      {/* Recent activity */}
      <View style={[cardStyle, { marginTop: 10 }, shadow]}>
        <AppText style={{ color: C.navyMid, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>
          {isPortuguese ? 'Atividade Recente' : 'Recent Activity'}
        </AppText>
        {realData.recentActivity.length > 0 ? (
          realData.recentActivity.map((a, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 9,
              borderBottomWidth: i < realData.recentActivity.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {a.isMission     && <Target size={13} color="#D97706" weight="fill" />}
                  {a.isAchievement && <Trophy size={13} color="#A855F7" weight="fill" />}
                  <AppText style={{ color: C.navy, fontSize: 13, fontWeight: '600' }}>{a.type}</AppText>
                </View>
                <AppText style={{ color: C.navyLight, fontSize: 11, marginTop: 1 }}>
                  {a.timestamp.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  {' · '}
                  {a.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
              <View style={{ backgroundColor: C.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <AppText style={{ color: C.greenDark, fontSize: 13, fontWeight: '800' }}>+{a.xp}</AppText>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <RocketLaunch size={36} color={C.navyLight} weight="duotone" />
            <AppText style={{ color: C.navyLight, fontSize: 13, marginTop: 10 }}>
              {isPortuguese ? 'Nenhuma atividade ainda' : 'No activity yet'}
            </AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ── Achievements tab ──────────────────────────────────────

  const renderAchievements = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {realData.achievements.length > 0 ? (
        realData.achievements.map((ach: any, i) => (
          <View key={ach.id ?? i} style={[cardStyle, shadow, {
            marginBottom: 8,
            borderLeftWidth: 3,
            borderLeftColor: RARITY_COLORS[ach.rarity] ?? '#22C55E',
          }]}>
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
                  <AppText style={{ color: C.navy, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }}>
                    {ach.title}
                  </AppText>
                  {ach.xpBonus > 0 && (
                    <AppText style={{ color: C.greenDark, fontSize: 12, fontWeight: '800' }}>+{ach.xpBonus} XP</AppText>
                  )}
                </View>
                <AppText style={{ color: C.navyMid, fontSize: 12, marginBottom: 4 }}>{ach.description}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText style={{ color: C.navyLight, fontSize: 11 }}>{ach.earnedAt.toLocaleDateString()}</AppText>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `${RARITY_COLORS[ach.rarity] ?? '#22C55E'}20` }}>
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
          <Trophy size={52} color={C.navyLight} weight="duotone" />
          <AppText style={{ color: C.navyMid, fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6 }}>
            {isPortuguese ? 'Nenhuma conquista ainda' : 'No achievements yet'}
          </AppText>
          <AppText style={{ color: C.navyLight, fontSize: 13, textAlign: 'center' }}>
            {isPortuguese ? 'Continue praticando!' : 'Keep practicing to unlock your first!'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );

  // ── Content dispatcher ────────────────────────────────────

  const renderContent = () => {
    if (realData.loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <HourglassMedium size={36} color={C.navyLight} weight="fill" />
          <AppText style={{ color: C.navyLight, fontSize: 14 }}>Loading...</AppText>
        </View>
      );
    }
    if (realData.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Warning size={32} color="#DC2626" weight="fill" />
          <AppText style={{ color: '#DC2626', fontSize: 14 }}>{realData.error}</AppText>
        </View>
      );
    }
    switch (activeTab) {
      case 'stats':        return renderStats();
      case 'achievements': return renderAchievements();
      case 'leaderboard':  return <LevelLeaderboard userLevel={userLevel} userId={userId} userName={userName} refreshTrigger={leaderboardKey} />;
    }
  };

  // ── Modal ─────────────────────────────────────────────────

  return (
    <Modal visible={isOpen} animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: C.overlay }} onTouchEnd={onClose}>
        <View
          style={{
            flex: 1, marginTop: 60,
            backgroundColor: C.sheet,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: C.border,
            overflow: 'hidden',
          }}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.handle }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
            <AppText style={{ color: C.navy, fontSize: 20, fontWeight: '800' }}>
              {isPortuguese ? 'Seu Progresso' : 'Your Progress'}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
            >
              <X size={14} color={C.navyMid} weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={{
            flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 16,
            backgroundColor: C.bg, borderRadius: 14, padding: 4,
            borderWidth: 1, borderColor: C.border,
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const iconColor = isActive ? C.navy : C.navyLight;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', paddingVertical: 9,
                    borderRadius: 10, gap: 5,
                    backgroundColor: isActive ? C.green : 'transparent',
                  }}
                >
                  {TAB_ICONS[tab.id](iconColor)}
                  <AppText style={{ fontSize: 12, fontWeight: '700', color: iconColor }}>
                    {tab.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content */}
          <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
            {renderContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Stat card ─────────────────────────────────────────────────

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <View style={[cardStyle, { flex: 1 }, Platform.select({
      ios: { shadowColor: 'rgba(22,21,58,0.06)', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    })]}>
      {icon}
      <AppText style={{ color: '#9896B8', fontSize: 11, marginTop: 8, marginBottom: 2 }}>{label}</AppText>
      <AppText style={{ color: '#16153A', fontSize: 22, fontWeight: '800' }}>{value}</AppText>
      <AppText style={{ color: '#9896B8', fontSize: 11 }}>{unit}</AppText>
    </View>
  );
}
