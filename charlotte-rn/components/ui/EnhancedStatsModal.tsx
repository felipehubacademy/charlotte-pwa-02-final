import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { ChartBar, Trophy, Medal, Lightning, Star, Fire, ChatDots, RocketLaunch } from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types/achievement';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';

type TabType = 'stats' | 'achievements' | 'leaderboard';

const TAB_ICON_COMPONENTS: Record<TabType, (color: string) => React.ReactNode> = {
  stats: (color) => <ChartBar size={15} color={color} weight="duotone" />,
  achievements: (color) => <Trophy size={15} color={color} weight="duotone" />,
  leaderboard: (color) => <Medal size={15} color={color} weight="duotone" />,
};

interface EnhancedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionXP: number;
  totalXP: number;
  userId?: string;
  userLevel?: 'Novice' | 'Inter' | 'Advanced';
}

interface RecentActivity {
  type: string;
  xp: number;
  timestamp: Date;
}

interface RealData {
  streak: number;
  recentActivity: RecentActivity[];
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
}

function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function calculateStreak(practices: any[]): number {
  if (!practices?.length) return 0;
  const byDay = new Map<string, boolean>();
  practices.forEach(p => {
    byDay.set(new Date(p.created_at).toDateString(), true);
  });
  let streak = 0;
  const cur = new Date();
  const today = cur.toDateString();
  while (true) {
    const s = cur.toDateString();
    if (byDay.has(s)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (s === today) {
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const card = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
  marginBottom: 10,
};

const RARITY_COLORS: Record<string, string> = {
  common: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#EAB308',
};

export default function EnhancedStatsModal({
  isOpen,
  onClose,
  sessionXP,
  totalXP,
  userId,
  userLevel = 'Inter',
}: EnhancedStatsModalProps) {
  const isPortuguese = userLevel === 'Novice';
  const [activeTab, setActiveTab] = React.useState<TabType>('stats');
  const [realData, setRealData] = React.useState<RealData>({
    streak: 0,
    recentActivity: [],
    achievements: [],
    loading: true,
    error: null,
  });

  const tabAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    if (!userId) return;
    setRealData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const today = new Date().toISOString().split('T')[0];

      const [historyRes, achievementsRes] = await Promise.all([
        supabase
          .from('user_practices')
          .select('practice_type, xp_awarded, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })
          .limit(50),
      ]);

      const practices = historyRes.data ?? [];
      const dbAchievements = achievementsRes.data ?? [];

      const todayPractices = practices.filter(p => p.created_at.startsWith(today));

      const typeLabels: Record<string, string> = {
        text_message: 'Text Practice',
        audio_message: 'Audio Practice',
        live_voice: 'Live Conversation',
        image_recognition: 'Object Recognition',
        camera_object: 'Object Recognition',
      };

      const recentActivity: RecentActivity[] = todayPractices.map(p => ({
        type: typeLabels[p.practice_type] ?? 'Practice',
        xp: p.xp_awarded ?? 0,
        timestamp: new Date(p.created_at),
      }));

      const achievements: Achievement[] = dbAchievements.map((a: any) => ({
        id: a.id,
        type: 'achievement',
        title: a.achievement_name,
        description: a.achievement_description,
        xpBonus: a.xp_bonus ?? 0,
        rarity: a.rarity ?? 'common',
        icon: a.badge_icon ?? '🏆',
        earnedAt: new Date(a.earned_at),
      }));

      setRealData({
        streak: calculateStreak(practices),
        recentActivity,
        achievements,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setRealData(prev => ({ ...prev, loading: false, error: 'Error loading data' }));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    Animated.timing(tabAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start(() => {
      Animated.timing(tabAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Level math
  const level = calculateLevel(totalXP);
  const xpForCurrent = Math.pow(level - 1, 2) * 50;
  const xpForNext = Math.pow(level, 2) * 50;
  const progress = xpForNext > xpForCurrent
    ? Math.min(100, ((totalXP - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
    : 100;
  const xpRemaining = Math.max(0, xpForNext - totalXP);

  const TABS: { id: TabType; label: string }[] = [
    { id: 'stats', label: isPortuguese ? 'Stats' : 'Stats' },
    { id: 'achievements', label: isPortuguese ? 'Conquistas' : 'Badges' },
    { id: 'leaderboard', label: isPortuguese ? 'Ranking' : 'Rank' },
  ];

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Level Progress */}
      <View style={card}>
        <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {isPortuguese ? 'Nível Atual' : 'Current Level'}
        </AppText>
        <AppText style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 10 }}>
          {isPortuguese ? 'Nível' : 'Level'} {level}
        </AppText>
        <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 6 }}>
          <View style={{ width: `${progress}%`, height: 6, backgroundColor: '#A3FF3C', borderRadius: 3 }} />
        </View>
        <AppText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          {xpRemaining > 0
            ? `${xpRemaining.toLocaleString()} XP ${isPortuguese ? 'para próximo nível' : 'to next level'}`
            : isPortuguese ? 'Nível máximo!' : 'Max level!'}
        </AppText>
      </View>

      {/* Stats Grid — row 1 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={[card, { flex: 1 }]}>
          <Lightning size={22} color="#A3FF3C" weight="duotone" />
          <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8, marginBottom: 2 }}>
            {isPortuguese ? 'Hoje' : 'Today'}
          </AppText>
          <AppText style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>+{sessionXP}</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>XP</AppText>
        </View>
        <View style={[card, { flex: 1 }]}>
          <Star size={22} color="#F59E0B" weight="duotone" />
          <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8, marginBottom: 2 }}>Total</AppText>
          <AppText style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{totalXP.toLocaleString()}</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>XP</AppText>
        </View>
      </View>

      {/* Stats Grid — row 2 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={[card, { flex: 1 }]}>
          <Fire size={22} color="#F97316" weight="duotone" />
          <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8, marginBottom: 2 }}>
            {isPortuguese ? 'Sequência' : 'Streak'}
          </AppText>
          <AppText style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{realData.streak}</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            {isPortuguese ? 'dias' : 'days'}
          </AppText>
        </View>
        <View style={[card, { flex: 1 }]}>
          <ChatDots size={22} color="#60A5FA" weight="duotone" />
          <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8, marginBottom: 2 }}>
            {isPortuguese ? 'Hoje' : 'Today'}
          </AppText>
          <AppText style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{realData.recentActivity.length}</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            {isPortuguese ? 'práticas' : 'practices'}
          </AppText>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[card, { marginBottom: 8 }]}>
        <AppText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
          {isPortuguese ? 'Atividade Recente' : 'Recent Activity'}
        </AppText>
        {realData.recentActivity.length > 0 ? (
          realData.recentActivity.slice(0, 5).map((a, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
            >
              <View style={{ flex: 1 }}>
                <AppText style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{a.type}</AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>
                  {a.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AppText>
              </View>
              <View style={{ backgroundColor: 'rgba(163,255,60,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 10 }}>
                <AppText style={{ color: '#A3FF3C', fontSize: 13, fontWeight: '700' }}>+{a.xp}</AppText>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <RocketLaunch size={36} color="rgba(255,255,255,0.2)" weight="duotone" />
            <AppText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 10 }}>
              {isPortuguese ? 'Nenhuma atividade ainda' : 'No activity yet'}
            </AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {realData.achievements.length > 0 ? (
        realData.achievements.map((ach, i) => (
          <View
            key={ach.id ?? i}
            style={[card, {
              marginBottom: 8,
              borderLeftWidth: 3,
              borderLeftColor: RARITY_COLORS[ach.rarity] ?? '#22C55E',
            }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AppText style={{ fontSize: 26, marginRight: 12 }}>{ach.icon}</AppText>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }}>
                    {ach.title}
                  </AppText>
                  <AppText style={{ color: '#A3FF3C', fontSize: 12, fontWeight: '700' }}>+{ach.xpBonus} XP</AppText>
                </View>
                <AppText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>{ach.description}</AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {ach.earnedAt.toLocaleDateString()}
                </AppText>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Trophy size={52} color="rgba(255,255,255,0.15)" weight="duotone" />
          <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>
            {isPortuguese ? 'Nenhuma conquista ainda' : 'No achievements yet'}
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
            {isPortuguese ? 'Continue praticando!' : 'Keep practicing to unlock your first!'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );

  const renderContent = () => {
    if (realData.loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <AppText style={{ fontSize: 32 }}>⏳</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Loading...</AppText>
        </View>
      );
    }
    if (realData.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AppText style={{ fontSize: 28 }}>⚠️</AppText>
          <AppText style={{ color: '#f87171', fontSize: 14 }}>{realData.error}</AppText>
        </View>
      );
    }
    switch (activeTab) {
      case 'stats': return renderStats();
      case 'achievements': return renderAchievements();
      case 'leaderboard':
        return (
          <LevelLeaderboard
            userLevel={userLevel}
            userId={userId}
          />
        );
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent statusBarTranslucent>
      {/* Overlay */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} onTouchEnd={onClose}>
        <View
          style={{
            flex: 1,
            marginTop: 60,
            backgroundColor: '#16153A',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: 'rgba(255,255,255,0.09)',
            overflow: 'hidden',
          }}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
            <AppText style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
              {isPortuguese ? 'Seu Progresso' : 'Your Progress'}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 18 }}>✕</AppText>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const iconColor = isActive ? '#000' : 'rgba(255,255,255,0.5)';
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 9,
                    borderRadius: 10,
                    gap: 5,
                    backgroundColor: isActive ? '#A3FF3C' : 'transparent',
                  }}
                >
                  {TAB_ICON_COMPONENTS[tab.id](iconColor)}
                  <AppText style={{ fontSize: 12, fontWeight: '600', color: iconColor }}>
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
