import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';
import { leaderboardService, LeaderboardData, LeaderboardEntry } from '@/lib/leaderboard-service';
import { supabaseService } from '@/lib/supabase-service';

interface LevelLeaderboardProps {
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userId?: string;
  className?: string;
  refreshTrigger?: number; // ✅ NOVO: Trigger para recarregar
}

const LevelLeaderboard: React.FC<LevelLeaderboardProps> = ({
  userLevel,
  userId,
  className = '',
  refreshTrigger = 0
}) => {
  // ✅ NOVO: Tradução baseada no nível do usuário
  const isPortuguese = userLevel === 'Novice';
  const translations = {
    activeLearners: isPortuguese ? 'estudantes ativos' : 'active learners',
    yourPosition: isPortuguese ? 'Sua posição:' : 'Your position:',
    top: isPortuguese ? 'Top' : 'Top',
    updated: isPortuguese ? 'Atualizado' : 'Updated'
  };
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [userLevel, userId, refreshTrigger]); // ✅ NOVO: Incluir refreshTrigger

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [leaderboard, position] = await Promise.all([
        leaderboardService.getLeaderboard(userLevel, 50),
        userId ? leaderboardService.getUserPosition(userId, userLevel) : Promise.resolve(null)
      ]);

      setLeaderboardData(leaderboard);
      setUserPosition(position);
    } catch (err) {
      console.error('❌ Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="text-yellow-400" size={20} />;
      case 2:
        return <Medal className="text-gray-300" size={20} />;
      case 3:
        return <Award className="text-amber-600" size={20} />;
      default:
        return null;
    }
  };

  const getPodiumGradient = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-500 to-amber-700';
      default:
        return 'from-white/10 to-white/5';
    }
  };

  const UserAvatar: React.FC<{ entry: LeaderboardEntry; size?: 'sm' | 'md' | 'lg' }> = ({ 
    entry, 
    size = 'md' 
  }) => {
    const [avatarData, setAvatarData] = useState<{
      avatarUrl: string | null;
      fallbackInitial: string;
      fallbackColor: string;
    } | null>(null);
    const [imageError, setImageError] = useState(false);

    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg'
    };

    // Buscar avatar do Entra ID
    useEffect(() => {
      const loadAvatar = async () => {
        try {
          const avatar = await supabaseService.getUserAvatar(entry.userId);
          setAvatarData(avatar);
        } catch (error) {
          console.error('Error loading avatar:', error);
          // Fallback para dados atuais
          setAvatarData({
            avatarUrl: null,
            fallbackInitial: entry.displayName.charAt(0).toUpperCase(),
            fallbackColor: entry.avatarColor
          });
        }
      };

      loadAvatar();
    }, [entry.userId, entry.displayName, entry.avatarColor]);

    if (!avatarData) {
      // Loading state
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-white/10 animate-pulse`} />
      );
    }

    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center`}>
        {avatarData.avatarUrl && !imageError ? (
          // Avatar do Entra ID
          <img
            src={avatarData.avatarUrl}
            alt={entry.displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback com inicial do nome real
          <div 
            className="w-full h-full flex items-center justify-center font-bold text-black"
            style={{ backgroundColor: avatarData.fallbackColor }}
          >
            {avatarData.fallbackInitial}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="text-center py-8">
          <Users className="mx-auto text-white/30 mb-2" size={32} />
          <p className="text-white/50 text-sm">
            {error || 'Unable to load leaderboard'}
          </p>
        </div>
      </div>
    );
  }

  const topThree = leaderboardData.entries.slice(0, 3);
  const restOfEntries = leaderboardData.entries.slice(3);

  return (
    <div className={`bg-white/5 rounded-xl p-6 border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">
            {userLevel} Leaderboard
          </h3>
          <p className="text-white/60 text-sm">
            {leaderboardData.totalUsers} {translations.activeLearners}
          </p>
        </div>
        <TrendingUp className="text-primary" size={20} />
      </div>

      {/* Pódium - Top 3 */}
      {topThree.length > 0 && (
        <div className="mb-6">
          <div className="flex items-end justify-center space-x-4 mb-4">
            {/* 2nd Place */}
            {topThree[1] && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <UserAvatar entry={topThree[1]} size="md" />
                <div className={`mt-2 px-3 py-2 rounded-lg bg-gradient-to-b ${getPodiumGradient(2)} h-16 flex flex-col justify-center items-center min-w-[80px]`}>
                  <div className="flex items-center space-x-1 mb-1">
                    {getPodiumIcon(2)}
                    <span className="text-white font-bold text-sm">#2</span>
                  </div>
                  <span className="text-white/90 text-xs font-medium">
                    {topThree[1].totalXP.toLocaleString()}
                  </span>
                </div>
                <p className="text-white/80 text-xs mt-1 text-center max-w-[80px] truncate">
                  {topThree[1].displayName}
                </p>
              </motion.div>
            )}

            {/* 1st Place */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center"
            >
              <UserAvatar entry={topThree[0]} size="lg" />
              <div className={`mt-2 px-4 py-3 rounded-lg bg-gradient-to-b ${getPodiumGradient(1)} h-20 flex flex-col justify-center items-center min-w-[90px]`}>
                <div className="flex items-center space-x-1 mb-1">
                  {getPodiumIcon(1)}
                  <span className="text-white font-bold">#1</span>
                </div>
                <span className="text-white/90 text-sm font-medium">
                  {topThree[0].totalXP.toLocaleString()}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-1 text-center max-w-[90px] truncate font-medium">
                {topThree[0].displayName}
              </p>
            </motion.div>

            {/* 3rd Place */}
            {topThree[2] && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <UserAvatar entry={topThree[2]} size="md" />
                <div className={`mt-2 px-3 py-2 rounded-lg bg-gradient-to-b ${getPodiumGradient(3)} h-14 flex flex-col justify-center items-center min-w-[80px]`}>
                  <div className="flex items-center space-x-1 mb-1">
                    {getPodiumIcon(3)}
                    <span className="text-white font-bold text-sm">#3</span>
                  </div>
                  <span className="text-white/90 text-xs font-medium">
                    {topThree[2].totalXP.toLocaleString()}
                  </span>
                </div>
                <p className="text-white/80 text-xs mt-1 text-center max-w-[80px] truncate">
                  {topThree[2].displayName}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Rest of the leaderboard */}
      {restOfEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white/80 text-sm font-medium mb-3">
            {translations.top} {Math.min(50, leaderboardData.entries.length)}
          </h4>
          
          <div className="max-h-64 overflow-y-auto scrollbar-custom space-y-1">
            {restOfEntries.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (index + 3) * 0.05 }}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-colors
                  ${entry.userId === userId 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                {/* Position */}
                <div className="w-8 text-center">
                  <span className="text-white/60 text-sm font-medium">
                    #{entry.position}
                  </span>
                </div>

                {/* Avatar */}
                <UserAvatar entry={entry} size="sm" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium truncate ${
                      entry.userId === userId ? 'text-primary' : 'text-white/90'
                    }`}>
                      {entry.displayName}
                    </p>
                    {/* Removido L1, L2 labels para deixar mais limpo */}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/70 text-xs">
                      {entry.totalXP.toLocaleString()} XP
                    </span>
                    {entry.currentStreak > 0 && (
                      <span className="text-orange-400 text-xs">
                        🔥 {entry.currentStreak}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* User position (if not in top 50) */}
      {userPosition && userPosition.position > 50 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/60 text-xs mb-2">{translations.yourPosition}</p>
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/20 border border-primary/30">
            <div className="w-8 text-center">
              <span className="text-primary text-sm font-medium">
                #{userPosition.position}
              </span>
            </div>
            <UserAvatar entry={userPosition} size="sm" />
            <div className="flex-1">
              <p className="text-primary text-sm font-medium">
                {userPosition.displayName}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-white/70 text-xs">
                  {userPosition.totalXP.toLocaleString()} XP
                </span>
                {/* Removido L1, L2 labels para deixar mais limpo */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-white/40 text-xs text-center">
          {translations.updated} {leaderboardData.lastUpdated.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {/* ✅ ESTILOS CUSTOMIZADOS PARA SCROLLBAR */}
      <style jsx>{`
        /* Scrollbar customizada sutil */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(163, 255, 60, 0.3) transparent;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(163, 255, 60, 0.3);
          border-radius: 2px;
          transition: background 0.2s ease;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 255, 60, 0.5);
        }

        /* Efeito hover na área de scroll */
        .scrollbar-custom:hover {
          scrollbar-color: rgba(163, 255, 60, 0.5) transparent;
        }
      `}</style>
    </div>
  );
};

export default LevelLeaderboard; 