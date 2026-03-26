import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Fire,
  Lightning,
  Trophy,
  TextT,
  Microphone,
  ChatTeardropText,
  CheckCircle,
  Circle,
  Gear,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LEVEL_CONFIG, UserLevel, ChatMode } from '@/lib/levelConfig';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface HomeData {
  streakDays: number;
  totalXP: number;
  todayXP: number;
  rank: number | null;
  totalPractices: number;
  todayMessages: number;
  todayAudios: number;
}

interface Mission {
  id: string;
  label: string;
  description: string;
  xpReward: number;
  completed: boolean;
  progress: number;   // 0-1
  icon: string;
}

interface ModeCard {
  mode: ChatMode;
  title: string;
  description: string;
  route: '/(app)/(tabs)/grammar' | '/(app)/(tabs)/pronunciation' | '/(app)/(tabs)/chat';
  icon: React.ReactNode;
  color: string;
}

const DAILY_XP_GOAL = 100;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}! ☀️`;
  if (hour < 18) return `Good afternoon, ${name}! 👋`;
  return `Good evening, ${name}! 🌙`;
}

function getMotivation(streakDays: number, todayXP: number): string {
  if (todayXP >= DAILY_XP_GOAL) return "You crushed today's goal! 🔥";
  if (streakDays >= 7) return `${streakDays}-day streak — keep it going!`;
  if (streakDays === 0) return 'Start your streak today! 🚀';
  if (todayXP === 0) return "Don't break the streak! Practice now.";
  return `${DAILY_XP_GOAL - todayXP} XP left to hit today's goal!`;
}

function buildMissions(data: HomeData, level: UserLevel): Mission[] {
  const config = LEVEL_CONFIG[level];
  const missions: Mission[] = [];

  // Mission 1 — always available: send messages
  const msgTarget = 5;
  missions.push({
    id: 'messages',
    label: `Send ${msgTarget} messages`,
    description: 'Any conversation mode counts',
    xpReward: 20,
    completed: data.todayMessages >= msgTarget,
    progress: Math.min(data.todayMessages / msgTarget, 1),
    icon: '💬',
  });

  // Mission 2 — pronunciation only if unlocked
  if (config.tabs.includes('pronunciation')) {
    missions.push({
      id: 'audio',
      label: 'Record your voice',
      description: 'Hold the mic and say something',
      xpReward: 15,
      completed: data.todayAudios >= 1,
      progress: data.todayAudios >= 1 ? 1 : 0,
      icon: '🎤',
    });
  }

  // Mission 3 — earn XP
  const xpTarget = 30;
  missions.push({
    id: 'xp',
    label: `Earn ${xpTarget} XP`,
    description: 'Keep the conversation going',
    xpReward: 10,
    completed: data.todayXP >= xpTarget,
    progress: Math.min(data.todayXP / xpTarget, 1),
    icon: '⚡',
  });

  return missions;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useAuth();
  const userId  = profile?.id ?? '';
  const level   = (profile?.user_level ?? 'Novice') as UserLevel;
  const name    = profile?.name ?? profile?.email?.split('@')[0] ?? 'Student';
  const config  = LEVEL_CONFIG[level];

  const [data, setData]           = useState<HomeData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [progressRes, practicesRes, leaderboardRes] = await Promise.all([
      supabase
        .from('user_progress')
        .select('streak_days, total_xp, total_practices')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_practices')
        .select('practice_type, xp_awarded')
        .eq('user_id', userId)
        .gte('created_at', todayISO),
      supabase
        .from('user_leaderboard_cache')
        .select('rank')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const progress   = progressRes.data;
    const practices  = practicesRes.data ?? [];
    const leaderboard = leaderboardRes.data;

    const todayXP      = practices.reduce((s, p) => s + (p.xp_awarded ?? 0), 0);
    const todayMessages = practices.filter(p =>
      p.practice_type === 'text_message' || p.practice_type === 'audio_message'
    ).length;
    const todayAudios = practices.filter(p => p.practice_type === 'audio_message').length;

    setData({
      streakDays:     progress?.streak_days    ?? 0,
      totalXP:        progress?.total_xp       ?? 0,
      todayXP,
      rank:           leaderboard?.rank        ?? null,
      totalPractices: progress?.total_practices ?? 0,
      todayMessages,
      todayAudios,
    });
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const missions = data ? buildMissions(data, level) : [];
  const completedMissions = missions.filter(m => m.completed).length;

  const modeCards: ModeCard[] = [
    {
      mode: 'grammar',
      title: 'Grammar',
      description: level === 'Novice'
        ? 'Write a sentence — I\'ll correct it'
        : 'Polish your writing with AI feedback',
      route: '/(app)/(tabs)/grammar',
      icon: <TextT size={28} color="#A3FF3C" weight="bold" />,
      color: 'rgba(163,255,60,0.1)',
    },
    {
      mode: 'pronunciation',
      title: 'Pronunciation',
      description: 'Speak and get instant feedback',
      route: '/(app)/(tabs)/pronunciation',
      icon: <Microphone size={28} color="#60A5FA" weight="bold" />,
      color: 'rgba(96,165,250,0.1)',
    },
    {
      mode: 'chat',
      title: 'Free Chat',
      description: 'Have a real conversation with Charlotte',
      route: '/(app)/(tabs)/chat',
      icon: <ChatTeardropText size={28} color="#F472B6" weight="bold" />,
      color: 'rgba(244,114,182,0.1)',
    },
  ].filter(c => config.tabs.includes(c.mode));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#A3FF3C" />
        </View>
      </SafeAreaView>
    );
  }

  const xpProgress = Math.min((data?.todayXP ?? 0) / DAILY_XP_GOAL, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A3FF3C"
          />
        }
      >
        {/* ── Header ───────────────────────────────────────── */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>
              {getGreeting(name)}
            </AppText>
            <AppText style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {getMotivation(data?.streakDays ?? 0, data?.todayXP ?? 0)}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/configuracoes')}
            style={{ padding: 6, marginTop: 2 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Gear size={22} color="rgba(255,255,255,0.5)" weight="regular" />
          </TouchableOpacity>
        </View>

        {/* ── Stats row ────────────────────────────────────── */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 16,
          gap: 10,
        }}>
          <StatPill
            icon={<Fire size={18} color="#FF6B35" weight="fill" />}
            value={String(data?.streakDays ?? 0)}
            label="day streak"
            highlight={data?.streakDays ? '#FF6B35' : undefined}
          />
          <StatPill
            icon={<Lightning size={18} color="#A3FF3C" weight="fill" />}
            value={`Lv.${Math.floor((data?.totalXP ?? 0) / 100) + 1}`}
            label={`${data?.totalXP ?? 0} XP total`}
            highlight="#A3FF3C"
          />
          {data?.rank ? (
            <StatPill
              icon={<Trophy size={18} color="#FBBF24" weight="fill" />}
              value={`#${data.rank}`}
              label="ranking"
              highlight="#FBBF24"
            />
          ) : null}
        </View>

        {/* ── Daily XP bar ─────────────────────────────────── */}
        <View style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 14,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <AppText style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
              Today's XP
            </AppText>
            <AppText style={{ fontSize: 13, fontWeight: '700', color: '#A3FF3C' }}>
              {data?.todayXP ?? 0} / {DAILY_XP_GOAL}
            </AppText>
          </View>
          {/* Progress bar */}
          <View style={{
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${xpProgress * 100}%`,
              backgroundColor: xpProgress >= 1 ? '#A3FF3C' : '#6EE7B7',
              borderRadius: 4,
            }} />
          </View>
        </View>

        {/* ── Daily Missions ───────────────────────────────── */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <AppText style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
              Daily Missions
            </AppText>
            <AppText style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              {completedMissions}/{missions.length} done
            </AppText>
          </View>

          {missions.map(mission => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </View>

        {/* ── Practice Now ─────────────────────────────────── */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <AppText style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>
            Practice Now
          </AppText>

          {modeCards.map(card => (
            <TouchableOpacity
              key={card.mode}
              onPress={() => router.navigate(card.route)}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: card.color,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                {card.icon}
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  {card.title}
                </AppText>
                <AppText style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {card.description}
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatPill({
  icon, value, label, highlight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: string;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    }}>
      {icon}
      <AppText style={{
        fontSize: 16,
        fontWeight: '800',
        color: highlight ?? '#FFFFFF',
      }}>
        {value}
      </AppText>
      <AppText style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const progressPercent = Math.round(mission.progress * 100);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      opacity: mission.completed ? 0.7 : 1,
    }}>
      {/* Check icon */}
      <View style={{ marginRight: 12 }}>
        {mission.completed
          ? <CheckCircle size={24} color="#A3FF3C" weight="fill" />
          : <Circle size={24} color="rgba(255,255,255,0.2)" weight="regular" />
        }
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText style={{ fontSize: 14 }}>{mission.icon}</AppText>
          <AppText style={{
            fontSize: 14,
            fontWeight: '600',
            color: mission.completed ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
            textDecorationLine: mission.completed ? 'line-through' : 'none',
          }}>
            {mission.label}
          </AppText>
        </View>
        <AppText style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          {mission.description}
        </AppText>

        {/* Mini progress bar (only when in progress) */}
        {!mission.completed && mission.progress > 0 && (
          <View style={{
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            marginTop: 6,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#A3FF3C',
              borderRadius: 2,
            }} />
          </View>
        )}
      </View>

      {/* XP badge */}
      <View style={{
        backgroundColor: mission.completed
          ? 'rgba(163,255,60,0.15)'
          : 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 10,
      }}>
        <AppText style={{
          fontSize: 12,
          fontWeight: '700',
          color: mission.completed ? '#A3FF3C' : 'rgba(255,255,255,0.4)',
        }}>
          +{mission.xpReward}
        </AppText>
      </View>
    </View>
  );
}
