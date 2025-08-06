import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target, Award, Clock, Trophy } from 'lucide-react';
import { supabaseService } from '@/lib/supabase-service';
import { Achievement } from '@/lib/improved-audio-xp-service';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';

type TabType = 'stats' | 'achievements' | 'leaderboard';

interface EnhancedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionXP: number;
  totalXP: number;
  achievements: Achievement[];
  realAchievements: Achievement[];
  onAchievementsDismissed?: () => void;
  userId?: string;
  userLevel?: 'Novice' | 'Inter' | 'Advanced';
}

export const EnhancedStatsModal: React.FC<EnhancedStatsModalProps> = ({ 
  isOpen, onClose, sessionXP, totalXP, achievements, realAchievements, onAchievementsDismissed, userId, userLevel = 'Inter'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [realData, setRealData] = useState({
    realTotalXP: 0,
    realSessionXP: 0,
    streak: 0,
    recentActivity: [] as Array<{
      type: string;
      xp: number;
      timestamp: Date;
    }>,
    loading: true,
    error: null as string | null
  });

  // ✅ BUSCAR DADOS REAIS DO SUPABASE
  useEffect(() => {
    if (isOpen && userId && supabaseService.isAvailable()) {
      loadRealData();
    } else if (isOpen && !userId) {
      console.warn('⚠️ No userId provided to EnhancedStatsModal');
      setRealData(prev => ({ ...prev, loading: false, error: 'No user ID' }));
    }
  }, [isOpen, userId]);

  const loadRealData = async () => {
    if (!userId) return;
    
    setRealData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Loading user data...');
      console.log('📊 Props received in modal:', { sessionXP, totalXP, userId });

      const [userStats, todayXP, practiceHistory] = await Promise.all([
        supabaseService.getUserStats(userId),
        supabaseService.getTodaySessionXP(userId),
        supabaseService.getUserPracticeHistory(userId, 20)
      ]);

      console.log('📊 User stats loaded');
      console.log('🗓️ Today XP loaded');
      console.log('📝 Practice history loaded');
      
      const today = new Date().toISOString().split('T')[0];
      const todayPractices = practiceHistory.filter((practice: any) => 
        practice.created_at.startsWith(today)
      );
      
      console.log('🔍 TODAY PRACTICES DEBUG:', {
        today,
        allPractices: practiceHistory.length,
        todayPractices: todayPractices.length,
        todayPracticesXP: todayPractices.map(p => ({ xp: p.xp_awarded, time: p.created_at })),
        calculatedTodayXP: todayPractices.reduce((sum, p) => sum + (p.xp_awarded || 0), 0)
      });

      const recentActivity = todayPractices.map((practice: any) => {
        let typeName = 'Practice';
        switch (practice.practice_type) {
          case 'text_message':
            typeName = 'Text Practice';
            break;
          case 'audio_message':
            typeName = 'Audio Practice';
            break;
          case 'live_voice':
            typeName = 'Live Conversation';
            break;
          case 'image_recognition':
          case 'camera_object':
            typeName = 'Object Recognition';
            break;
          default:
            typeName = 'Practice';
        }

        return {
          type: typeName,
          xp: practice.xp_awarded || 0,
          timestamp: new Date(practice.created_at)
        };
      });

      const streakDays = calculateStreak(practiceHistory);

      // 🔧 CALCULAR XP DE HOJE CORRETAMENTE
      const calculatedTodayXP = todayPractices.reduce((sum, practice) => sum + (practice.xp_awarded || 0), 0);
      const finalSessionXP = Math.max(sessionXP || 0, todayXP || 0, calculatedTodayXP);

      setRealData({
        realTotalXP: totalXP,
        realSessionXP: finalSessionXP, // 🔧 USAR O VALOR CALCULADO
        streak: userStats?.streak_days || streakDays,
        recentActivity,
        loading: false,
        error: null
      });

      console.log('✅ Modal data loaded (CONSISTENT):', {
        realTotalXP: totalXP,
        realSessionXP: finalSessionXP,
        bankTotalXP: userStats?.total_xp || 0,
        bankSessionXP: todayXP,
        calculatedTodayXP,
        finalUsedValue: finalSessionXP,
        streak: userStats?.streak_days || streakDays,
        todayPracticesCount: todayPractices.length,
        allPracticesCount: practiceHistory.length,
        // 🔍 DEBUG: Verificar se sessionXP está chegando corretamente
        propsSessionXP: sessionXP,
        propsTotalXP: totalXP,
        todayPracticesDetails: todayPractices.map(p => ({
          xp: p.xp_awarded,
          type: p.practice_type,
          time: p.created_at
        }))
      });

    } catch (error) {
      console.error('❌ Error loading modal data:', error);
      setRealData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data'
      }));
    }
  };

  const calculateStreak = (practices: any[]) => {
    if (!practices || practices.length === 0) return 0;

    const practicesByDay = new Map();
    practices.forEach(practice => {
      const day = new Date(practice.created_at).toDateString();
      if (!practicesByDay.has(day)) {
        practicesByDay.set(day, []);
      }
      practicesByDay.get(day).push(practice);
    });

    const today = new Date().toDateString();
    let streak = 0;
    let currentDay = new Date();

    while (true) {
      const dayString = currentDay.toDateString();
      if (practicesByDay.has(dayString)) {
        streak++;
        currentDay.setDate(currentDay.getDate() - 1);
      } else if (dayString === today) {
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  if (!isOpen) return null;

  const effectiveTotalXP = realData.realTotalXP || totalXP;
  const effectiveSessionXP = realData.realSessionXP || sessionXP;

  // Calculate current level from total XP
  const currentLevel = Math.floor(Math.sqrt(totalXP / 50)) + 1;
  
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 50;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 50;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgressInCurrentLevel = Math.max(0, totalXP - xpForCurrentLevel);
  const levelProgress = xpNeededForNextLevel > 0 ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 : 0;

  const tabs = [
    { id: 'stats' as TabType, label: 'Stats', icon: TrendingUp },
    { id: 'achievements' as TabType, label: 'Achievements', icon: Award },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="space-y-4">
            {/* Level Progress */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2 mb-3">
                <Target size={18} className="text-primary" />
                <span className="text-white/80 text-sm font-medium">Current Level</span>
              </div>
              <span className="text-white text-2xl font-bold block mb-1">Level {currentLevel}</span>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, levelProgress))}%` }}
                />
              </div>
              <p className="text-white/60 text-sm">
                {xpNeededForNextLevel > 0 ? `${(xpNeededForNextLevel - xpProgressInCurrentLevel).toLocaleString()} XP to next level` : 'Max level reached!'}
              </p>
            </div>

            {/* 📱 MOBILE: Stats Grid 2x2 + Recent Activity abaixo */}
            <div className="lg:hidden space-y-4">
              {/* Stats Grid 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Today</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">+{effectiveSessionXP}</span>
                  <p className="text-white/60 text-xs">XP earned</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Total</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{effectiveTotalXP.toLocaleString()}</span>
                  <p className="text-white/60 text-xs">XP earned</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Streak</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.streak}</span>
                  <p className="text-white/60 text-xs">days</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Today</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.recentActivity.length}</span>
                  <p className="text-white/60 text-xs">practices</p>
                </div>
              </div>

              {/* Recent Activity abaixo no mobile */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white/80 text-sm font-medium mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {realData.recentActivity.length > 0 ? (
                    <>
                      {/* Mostrar apenas 2 atividades no mobile */}
                      {realData.recentActivity.slice(0, 2).map((activity, index) => (
                        <div key={`mobile-activity-${activity.timestamp.getTime()}-${index}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-white/90 text-sm font-medium">{activity.type}</p>
                            <p className="text-white/50 text-xs">
                              {activity.timestamp.toLocaleDateString([], { 
                                month: 'short', 
                                day: 'numeric' 
                              })} at {activity.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <span className="text-primary text-sm font-bold ml-3 flex-shrink-0 
                                           bg-primary/10 px-2 py-1 rounded-md">
                            +{activity.xp}
                          </span>
                        </div>
                      ))}
                      
                      {/* Mostrar indicador se há mais atividades */}
                      {realData.recentActivity.length > 2 && (
                        <div className="text-center pt-2">
                          <p className="text-white/40 text-xs">
                            +{realData.recentActivity.length - 2} more activities
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-1">🚀</div>
                      <p className="text-white/50 text-sm">No recent activity</p>
                      <p className="text-white/30 text-xs mt-1">Start practicing!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🖥️ DESKTOP: Stats Grid + Recent Activity lado a lado */}
            <div className="hidden lg:flex gap-4">
              {/* Stats Grid 2x2 - Menor */}
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Today</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">+{effectiveSessionXP}</span>
                  <p className="text-white/60 text-xs">XP earned</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Total</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{effectiveTotalXP.toLocaleString()}</span>
                  <p className="text-white/60 text-xs">XP earned</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Streak</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.streak}</span>
                  <p className="text-white/60 text-xs">days</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock size={16} className="text-primary" />
                    <span className="text-white/80 text-xs font-medium">Today</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.recentActivity.length}</span>
                  <p className="text-white/60 text-xs">practices</p>
                </div>
              </div>

              {/* Recent Activity - Ao lado no desktop */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex-1">
                <h3 className="text-white/80 text-sm font-medium mb-3">Recent Activity</h3>
                <div className="max-h-48 overflow-y-auto scrollbar-custom space-y-2">
                  {realData.recentActivity.length > 0 ? (
                    realData.recentActivity.map((activity, index) => (
                      <div key={`desktop-activity-${activity.timestamp.getTime()}-${index}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                        <div className="flex-1">
                          <p className="text-white/90 text-sm font-medium">{activity.type}</p>
                          <p className="text-white/50 text-xs">
                            {activity.timestamp.toLocaleDateString([], { 
                              month: 'short', 
                              day: 'numeric' 
                            })} at {activity.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <span className="text-primary text-sm font-bold ml-3 flex-shrink-0 
                                         bg-primary/10 px-2 py-1 rounded-md">
                          +{activity.xp}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-3xl mb-2">🚀</div>
                      <p className="text-white/50 text-sm">No recent activity</p>
                      <p className="text-white/30 text-xs mt-1">Start practicing!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        const effectiveAchievements = realAchievements.length > 0 ? realAchievements : achievements;
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-bold">Your Achievements</h3>
              {effectiveAchievements.length > 0 && onAchievementsDismissed && (
                <button
                  onClick={onAchievementsDismissed}
                  className="text-primary text-sm hover:text-primary-dark transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-custom space-y-3">
              {effectiveAchievements.length > 0 ? (
                effectiveAchievements.map((achievement, index) => (
                  <div key={achievement.id || `achievement-${index}`} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-bold text-sm">{achievement.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-primary text-xs font-bold">+{achievement.xpBonus} XP</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                              (achievement.rarity || 'common') === 'common' ? 'bg-green-500/20 text-green-400' :
                              (achievement.rarity || 'common') === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                              (achievement.rarity || 'common') === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {achievement.rarity || 'common'}
                            </span>
                          </div>
                        </div>
                        <p className="text-white/70 text-xs">{achievement.description}</p>
                        <p className="text-white/50 text-xs mt-1">
                          Earned {achievement.earnedAt.toLocaleDateString()} at {achievement.earnedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-white/50 text-lg font-medium mb-2">No achievements yet</p>
                  <p className="text-white/30 text-sm">Keep practicing to unlock your first achievement!</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <LevelLeaderboard
            userLevel={userLevel}
            userId={userId}
            className="!bg-transparent !border-0 !p-0"
          />
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="min-h-screen flex items-start justify-center p-4 pt-16 sm:pt-12 md:pt-8 lg:items-center lg:pt-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-secondary backdrop-blur-md rounded-2xl p-4 sm:p-6 w-full border border-white/10 shadow-2xl
                       max-w-md lg:max-w-4xl 
                       max-h-[85vh] sm:max-h-[85vh] lg:max-h-[85vh] overflow-hidden
                       lg:flex lg:gap-6 relative z-[100]"
          >
            {/* Header - Responsivo */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Progress</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            {/* Desktop Layout - Coluna Esquerda */}
            <div className="lg:flex-1 lg:pr-6">
              {/* Header Desktop */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your Progress</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-white/5 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-black'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto scrollbar-custom max-h-[60vh] lg:max-h-[70vh]">
                {renderTabContent()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}; 