import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalXP: number;
  levelNumber: number;
  currentStreak: number;
  position: number;
  avatarColor: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastUpdated: Date;
}

interface LevelLeaderboardProps {
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userId?: string;
  refreshTrigger?: number;
}

const AVATAR_COLORS = ['#A3FF3C', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa'];

function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const PODIUM_ICONS = ['🏆', '🥈', '🥉'];

const UserAvatar: React.FC<{
  entry: LeaderboardEntry;
  size?: number;
  isCurrentUser?: boolean;
}> = ({ entry, size = 36, isCurrentUser = false }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: entry.avatarColor,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isCurrentUser ? 2 : 0,
      borderColor: '#A3FF3C',
    }}
  >
    <AppText style={{ color: '#16153A', fontWeight: 'bold', fontSize: size * 0.38 }}>
      {entry.displayName.charAt(0).toUpperCase()}
    </AppText>
  </View>
);

const LevelLeaderboard: React.FC<LevelLeaderboardProps> = ({
  userLevel,
  userId,
  refreshTrigger = 0,
}) => {
  const isPortuguese = userLevel === 'Novice';
  const [data, setData] = React.useState<LeaderboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadLeaderboard();
  }, [userLevel, userId, refreshTrigger]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('user_leaderboard_cache')
        .select('user_id, display_name, total_xp, position')
        .eq('user_level', userLevel)
        .order('position', { ascending: true })
        .limit(50);

      if (err) throw err;

      const entries: LeaderboardEntry[] = (rows ?? []).map((row: any, i: number) => ({
        userId: row.user_id,
        displayName: row.display_name || 'Anonymous',
        totalXP: row.total_xp ?? 0,
        levelNumber: Math.floor(Math.sqrt((row.total_xp ?? 0) / 50)) + 1,
        currentStreak: 0,
        position: row.position ?? i + 1,
        avatarColor: generateAvatarColor(row.display_name || 'x'),
      }));

      setData({ entries, totalUsers: entries.length, lastUpdated: new Date() });
    } catch (e: any) {
      setError(e.message ?? 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
        <ActivityIndicator color="#A3FF3C" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
        <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          {error || 'Unable to load leaderboard'}
        </AppText>
      </View>
    );
  }

  const topThree = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);
  const myPosition = data.entries.find(e => e.userId === userId);
  const myPositionIsOutside = myPosition && myPosition.position > 50;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
        <View>
          <AppText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{userLevel} Leaderboard</AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {data.totalUsers} {isPortuguese ? 'estudantes ativos' : 'active learners'}
          </AppText>
        </View>
        <AppText style={{ fontSize: 20 }}>📈</AppText>
      </View>

      {/* Podium — top 3 */}
      {topThree.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {([1, 0, 2] as const).map((idx) => {
            const entry = topThree[idx];
            if (!entry) return <View key={idx} style={{ width: 88 }} />;
            const isFirst = idx === 0;
            const podiumHeight = isFirst ? 80 : 60;
            const avatarSize = isFirst ? 44 : 36;
            return (
              <View key={entry.userId} style={{ alignItems: 'center', width: 88 }}>
                <UserAvatar
                  entry={entry}
                  size={avatarSize}
                  isCurrentUser={entry.userId === userId}
                />
                <View
                  style={{
                    height: podiumHeight,
                    marginTop: 8,
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <AppText style={{ fontSize: 18 }}>{PODIUM_ICONS[idx]}</AppText>
                  <AppText style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                    #{entry.position}
                  </AppText>
                  <AppText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    {entry.totalXP.toLocaleString()}
                  </AppText>
                </View>
                <AppText
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    textAlign: 'center',
                    color: entry.userId === userId ? '#A3FF3C' : 'rgba(255,255,255,0.8)',
                    fontWeight: entry.userId === userId ? '600' : '400',
                  }}
                  numberOfLines={1}
                >
                  {entry.displayName}
                </AppText>
              </View>
            );
          })}
        </View>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <FlatList
          data={rest}
          keyExtractor={item => item.userId}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginHorizontal: 0,
                borderRadius: 10,
                marginBottom: 4,
                backgroundColor: item.userId === userId
                  ? 'rgba(163,255,60,0.12)'
                  : 'rgba(255,255,255,0.04)',
                borderWidth: item.userId === userId ? 1 : 0,
                borderColor: 'rgba(163,255,60,0.3)',
              }}
            >
              <AppText style={{ width: 28, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' }}>
                #{item.position}
              </AppText>
              <View style={{ marginLeft: 10 }}>
                <UserAvatar
                  entry={item}
                  size={32}
                  isCurrentUser={item.userId === userId}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: item.userId === userId ? '#A3FF3C' : 'rgba(255,255,255,0.9)',
                  }}
                  numberOfLines={1}
                >
                  {item.displayName}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <AppText style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {item.totalXP.toLocaleString()} XP
                  </AppText>
                  {item.currentStreak > 0 && (
                    <AppText style={{ fontSize: 11, color: '#fb923c' }}>
                      🔥 {item.currentStreak}
                    </AppText>
                  )}
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* My position if outside top 50 */}
      {myPositionIsOutside && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>
            {isPortuguese ? 'Sua posição:' : 'Your position:'}
          </AppText>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'rgba(163,255,60,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(163,255,60,0.3)',
          }}>
            <AppText style={{ width: 28, textAlign: 'center', color: '#A3FF3C', fontSize: 13, fontWeight: '500' }}>
              #{myPosition.position}
            </AppText>
            <View style={{ marginLeft: 10 }}>
              <UserAvatar entry={myPosition} size={32} isCurrentUser />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <AppText style={{ color: '#A3FF3C', fontSize: 13, fontWeight: '500' }}>
                {myPosition.displayName}
              </AppText>
              <AppText style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {myPosition.totalXP.toLocaleString()} XP
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Last updated */}
      <AppText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginTop: 12, paddingBottom: 8 }}>
        {isPortuguese ? 'Atualizado' : 'Updated'}{' '}
        {data.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </AppText>
    </View>
  );
};

export default LevelLeaderboard;
