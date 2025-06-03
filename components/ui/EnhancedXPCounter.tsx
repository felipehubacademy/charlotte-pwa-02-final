import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target, Award, Clock, Trophy, Star } from 'lucide-react';
import { supabaseService } from '@/lib/supabase-service';
import { Achievement } from '@/lib/improved-audio-xp-service';
import LevelLeaderboard from '@/components/leaderboard/LevelLeaderboard';

interface EnhancedXPCounterProps {
  sessionXP: number;
  totalXP: number;
  currentLevel: number;
  achievements: Achievement[];
  onXPGained?: (amount: number) => void;
  onStatsClick?: () => void;
  onAchievementsDismissed?: () => void;
  userId?: string;
  userLevel?: 'Novice' | 'Inter' | 'Advanced';
  isFloating?: boolean;
}

type TabType = 'stats' | 'achievements' | 'leaderboard';

// 📱 Modal de estatísticas melhorado com tabs
const EnhancedStatsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  sessionXP: number; 
  totalXP: number;
  currentLevel: number;
  achievements: Achievement[];
  realAchievements: Achievement[];
  onAchievementsDismissed?: () => void;
  userId?: string;
  userLevel?: 'Novice' | 'Inter' | 'Advanced';
}> = ({ 
  isOpen, onClose, sessionXP, totalXP, currentLevel, achievements, realAchievements, onAchievementsDismissed, userId, userLevel = 'Inter'
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

      const [userStats, todayXP, practiceHistory] = await Promise.all([
        supabaseService.getUserStats(userId),
        supabaseService.getTodaySessionXP(userId),
        supabaseService.getUserPracticeHistory(userId, 8)
      ]);

      console.log('📊 User stats loaded');
      console.log('🗓️ Today XP loaded');
      console.log('📝 Practice history loaded');
      
      const recentActivity = practiceHistory.map((practice: any) => {
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

      setRealData({
        realTotalXP: userStats?.total_xp || 0,
        realSessionXP: todayXP,
        streak: userStats?.streak_days || streakDays,
        recentActivity,
        loading: false,
        error: null
      });

      console.log('✅ Modal data loaded:', {
        realTotalXP: userStats?.total_xp || 0,
        realSessionXP: todayXP,
        streak: userStats?.streak_days || streakDays,
        propsIgnored: { sessionXP, totalXP }
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

  const xpForCurrentLevel = (currentLevel ** 2 * 50);
  const xpForNextLevel = ((currentLevel + 1) ** 2 * 50);
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
                {xpForNextLevel > 0 ? `${xpForNextLevel.toLocaleString()} XP to next level` : 'Max level reached!'}
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
                    <span className="text-white/80 text-xs font-medium">Activity</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.recentActivity.length}</span>
                  <p className="text-white/60 text-xs">recent</p>
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
                    <span className="text-white/80 text-xs font-medium">Activity</span>
                  </div>
                  <span className="text-white text-xl font-bold block mb-1">{realData.recentActivity.length}</span>
                  <p className="text-white/60 text-xs">recent</p>
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
                              achievement.rarity === 'common' ? 'bg-green-500/20 text-green-400' :
                              achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                              achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {achievement.rarity}
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
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-secondary backdrop-blur-md rounded-2xl p-4 sm:p-6 w-full border border-white/10 shadow-2xl
                       max-w-md lg:max-w-4xl 
                       max-h-[80vh] sm:max-h-[85vh] overflow-hidden
                       lg:flex lg:gap-6 relative z-50"
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

// Progress Ring Component
const ProgressRing: React.FC<{ 
  level: number; 
  progress: number; 
  size?: number;
}> = ({ level, progress, size = 40 }) => {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#A3FF3C"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      {/* Level number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{level}</span>
      </div>
    </div>
  );
};

const EnhancedXPCounter: React.FC<EnhancedXPCounterProps> = ({ 
  sessionXP, 
  totalXP, 
  currentLevel,
  achievements,
  onXPGained, 
  onStatsClick,
  onAchievementsDismissed,
  userId,
  userLevel = 'Inter',
  isFloating = false
}) => {
  const [displaySessionXP, setDisplaySessionXP] = useState(sessionXP || 0);
  const [displayTotalXP, setDisplayTotalXP] = useState(totalXP || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [realAchievements, setRealAchievements] = useState<Achievement[]>([]);
  
  // 📱 NEW: Drag functionality for mobile
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  // Detect if mobile device
  const isMobile = typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
     window.innerWidth <= 768);

  // Load real achievements when component mounts
  useEffect(() => {
    if (userId && supabaseService.isAvailable()) {
      loadRealAchievements();
    }
  }, [userId]);

  const loadRealAchievements = async () => {
    if (!userId) return;
    
    try {
      console.log('🏆 Loading real achievements from Supabase...');
      const userAchievements = await supabaseService.getUserAchievements(userId, 50);
      
      console.log('📋 Raw achievements from Supabase:', userAchievements);
      
      if (userAchievements && userAchievements.length > 0) {
        // ✅ CORRIGIDO: Converter dados do Supabase para formato Achievement com mapeamento robusto
        const formattedAchievements = userAchievements.map((ach: any, index: number) => {
          // ✅ NOVO: Gerar título baseado no achievement_type e category se não existir
          const title = ach.achievement_name || 
                       ach.title || 
                       ach.name || 
                       generateAchievementTitle(ach.achievement_type, ach.category, ach.rarity);
          
          // ✅ NOVO: Gerar descrição baseada no achievement_type e category se não existir
          const description = ach.achievement_description || 
                             ach.description || 
                             generateAchievementDescription(ach.achievement_type, ach.category, ach.rarity);
          
          // Determinar ícone com fallbacks
          const icon = ach.badge_icon || 
                      ach.icon || 
                      getAchievementIcon(ach.achievement_type || 'general');
          
          // Determinar XP com fallbacks
          const xpBonus = ach.xp_bonus || 
                         ach.xpBonus || 
                         ach.xp_reward || 
                         0;
          
          console.log(`🔍 Processing achievement ${index + 1}:`, {
            raw: ach,
            mapped: {
              title,
              description,
              icon,
              xpBonus
            }
          });
          
          return {
            id: ach.achievement_id || ach.id || `ach-${index}`,
            title: title,
            description: description,
            type: ach.achievement_type || 'general',
            rarity: ach.rarity || 'common',
            xpBonus: xpBonus,
            icon: icon,
            earnedAt: new Date(ach.earned_at),
            category: ach.category || 'general'
          };
        });
        
        setRealAchievements(formattedAchievements);
        console.log('✅ Real achievements loaded and formatted:', formattedAchievements.length);
        console.log('📊 Formatted achievements:', formattedAchievements);
      } else {
        setRealAchievements([]);
        console.log('📝 No achievements found for user');
      }
    } catch (error) {
      console.error('❌ Error loading real achievements:', error);
      setRealAchievements([]);
    }
  };

  // ✅ NOVO: Função para gerar títulos baseados no tipo e categoria
  const generateAchievementTitle = (type: string, category: string, rarity: string): string => {
    const typeMap: { [key: string]: string } = {
      'perfect-practice': 'Perfect Practice!',
      'perfect-audio': 'Perfect Audio!',
      'perfect-text': 'Perfect Grammar!',
      'eloquent-speaker': 'Eloquent Speaker',
      'detailed-writer': 'Detailed Writer',
      'pronunciation-master': 'Pronunciation Master',
      'grammar-guru': 'Grammar Guru',
      'audio-starter': 'Audio Starter',
      'audio-enthusiast': 'Audio Enthusiast',
      'audio-master': 'Audio Master',
      'audio-legend': 'Audio Legend',
      'text-writer': 'Text Writer',
      'text-warrior': 'Text Warrior',
      'text-champion': 'Text Champion',
      'text-legend': 'Text Legend',
      'streak-milestone': 'Streak Master',
      'early-bird': 'Early Bird',
      'night-owl': 'Night Owl',
      'weekend-warrior': 'Weekend Warrior',
      'general': 'Achievement Unlocked'
    };

    const categoryMap: { [key: string]: string } = {
      'milestone': 'Milestone Achievement',
      'performance': 'Performance Achievement',
      'consistency': 'Consistency Achievement',
      'volume': 'Volume Achievement',
      'quality': 'Quality Achievement',
      'behavioral': 'Behavioral Achievement',
      'special': 'Special Achievement'
    };

    const rarityPrefix: { [key: string]: string } = {
      'legendary': '👑 Legendary',
      'epic': '⭐ Epic',
      'rare': '💎 Rare',
      'uncommon': '🔥 Uncommon',
      'common': '🏆 '
    };

    // Tentar mapear por tipo primeiro
    if (type && typeMap[type]) {
      return `${rarityPrefix[rarity] || '🏆 '}${typeMap[type]}`;
    }

    // Senão, usar categoria
    if (category && categoryMap[category]) {
      return `${rarityPrefix[rarity] || '🏆 '}${categoryMap[category]}`;
    }

    // Fallback final
    return `${rarityPrefix[rarity] || '🏆 '}Achievement Unlocked`;
  };

  // ✅ NOVO: Função para gerar descrições baseadas no tipo e categoria
  const generateAchievementDescription = (type: string, category: string, rarity: string): string => {
    const typeDescriptions: { [key: string]: string } = {
      'perfect-practice': 'Achieved excellent performance in practice',
      'perfect-audio': 'Delivered perfect audio pronunciation',
      'perfect-text': 'Wrote with perfect grammar',
      'eloquent-speaker': 'Spoke with eloquence and clarity',
      'detailed-writer': 'Wrote detailed and comprehensive messages',
      'pronunciation-master': 'Mastered pronunciation skills',
      'grammar-guru': 'Demonstrated excellent grammar knowledge',
      'audio-starter': 'Started your audio practice journey',
      'audio-enthusiast': 'Showed enthusiasm in audio practice',
      'audio-master': 'Mastered audio communication',
      'audio-legend': 'Became a legend in audio practice',
      'text-writer': 'Began your text writing journey',
      'text-warrior': 'Fought through text challenges',
      'text-champion': 'Became a champion in text communication',
      'text-legend': 'Achieved legendary status in writing',
      'streak-milestone': 'Maintained consistent practice streak',
      'early-bird': 'Practiced early in the morning',
      'night-owl': 'Practiced late at night',
      'weekend-warrior': 'Practiced during weekends',
      'general': 'Completed a significant milestone'
    };

    const categoryDescriptions: { [key: string]: string } = {
      'milestone': 'Reached an important milestone in your learning journey',
      'performance': 'Demonstrated exceptional performance',
      'consistency': 'Showed remarkable consistency in practice',
      'volume': 'Completed a significant volume of practice',
      'quality': 'Achieved high quality in your work',
      'behavioral': 'Developed positive learning behaviors',
      'special': 'Earned a special recognition'
    };

    // Tentar mapear por tipo primeiro
    if (type && typeDescriptions[type]) {
      return typeDescriptions[type];
    }

    // Senão, usar categoria
    if (category && categoryDescriptions[category]) {
      return categoryDescriptions[category];
    }

    // Fallback final
    return 'You have unlocked a new achievement!';
  };

  // Helper function to get achievement icon based on type
  const getAchievementIcon = (type: string): string => {
    switch (type) {
      // Audio achievements
      case 'perfect-practice':
      case 'perfect-audio':
        return '🎯';
      case 'long-sentence':
      case 'eloquent-speaker':
        return '🗣️';
      case 'speed-demon':
      case 'speed-talker':
        return '⚡';
      case 'grammar-master':
      case 'pronunciation-master':
        return '🎤';
      
      // Text achievements
      case 'perfect-text':
        return '📝';
      case 'detailed-writer':
        return '✍️';
      case 'word-master':
        return '📚';
      case 'grammar-guru':
        return '📖';
      
      // Live voice achievements
      case 'perfect-conversation':
        return '💬';
      case 'marathon-talker':
        return '🏃‍♂️';
      
      // Volume/Frequency achievements
      case 'audio-starter':
        return '🎙️';
      case 'audio-enthusiast':
        return '🎧';
      case 'audio-master':
        return '🎵';
      case 'audio-legend':
        return '🏆';
      case 'text-writer':
        return '✏️';
      case 'text-warrior':
        return '⚔️';
      case 'text-champion':
        return '🏅';
      case 'text-legend':
        return '📚';
      case 'live-beginner':
        return '💬';
      case 'live-conversationalist':
        return '🗨️';
      case 'live-master':
        return '🎭';
      case 'voice-30min':
        return '⏱️';
      case 'voice-2hours':
        return '🕐';
      case 'voice-5hours':
        return '🕕';
      
      // Quality/Performance achievements
      case 'accuracy-streak-5':
      case 'grammar-streak-5':
        return '🎯';
      case 'perfection-streak-10':
        return '⭐';
      case 'near-perfect-audio':
        return '🎯';
      case 'native-like-pronunciation':
        return '👑';
      case 'grammar-perfectionist':
        return '📖';
      
      // Behavioral achievements
      case 'early-bird':
        return '🌅';
      case 'night-owl':
        return '🦉';
      case 'lunch-learner':
        return '🍽️';
      case 'monday-motivation':
        return '💪';
      case 'friday-finisher':
        return '🎉';
      case 'weekend-warrior':
        return '🏖️';
      
      // Content achievements
      case 'polite-learner':
        return '🙏';
      case 'curious-mind':
        return '❓';
      case 'vocabulary-builder':
        return '📖';
      case 'topic-explorer':
        return '🗺️';
      case 'sentence-architect':
        return '🏗️';
      
      // Challenge achievements
      case 'marathon-session-30':
        return '🏃‍♂️';
      case 'marathon-session-60':
        return '🏃‍♀️';
      case 'essay-writer':
        return '📄';
      
      // Special achievements
      case 'visual-learner':
        return '📸';
      case 'cultural-bridge':
        return '🇧🇷';
      case 'emotion-express':
        return '😊';
      
      // Level-specific achievements (legacy)
      case 'novice-writer':
      case 'novice-speaker':
        return '🌱';
      case 'intermediate-grammar':
      case 'intermediate-speech':
        return '📈';
      case 'advanced-writer':
      case 'advanced-speaker':
        return '👑';
      
      // Streak achievements
      case 'streak-milestone':
        return '🔥';
      
      // Surprise achievements
      case 'lucky-star':
        return '⭐';
      case 'golden-hour':
      case 'golden-moment':
        return '🌟';
      case 'magic-practice':
        return '✨';
      case 'rainbow-bonus':
        return '🌈';
      case 'serendipity':
        return '🍀';
      case 'cosmic-alignment':
        return '🌌';
      
      // Default
      default:
        return '🏆';
    }
  };

  // Calculate level progress
  const xpForCurrentLevel = (currentLevel ** 2 * 50);
  const xpForNextLevel = ((currentLevel + 1) ** 2 * 50);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgressInCurrentLevel = Math.max(0, totalXP - xpForCurrentLevel);
  const levelProgress = xpNeededForNextLevel > 0 ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 : 0;

  // Check for unread achievements - only show for recent achievements (last 24h)
  const hasUnreadAchievements = realAchievements.some(achievement => {
    const achievementDate = new Date(achievement.earnedAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return achievementDate >= yesterday;
  });

  // 🎯 Animar aumento do XP session
  useEffect(() => {
    if ((sessionXP || 0) > displaySessionXP) {
      setIsAnimating(true);
      const difference = (sessionXP || 0) - displaySessionXP;
      
      setFloatingXP(difference);
      
      const duration = 1000;
      const startTime = Date.now();
      const startValue = displaySessionXP;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (difference * easeOut));
        
        setDisplaySessionXP(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setFloatingXP(null);
          onXPGained?.(difference);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [sessionXP]); // Only depend on sessionXP, not displaySessionXP

  // Animate total XP changes
  useEffect(() => {
    if (totalXP !== displayTotalXP && totalXP > 0) {
      const difference = totalXP - displayTotalXP;
      const duration = Math.min(Math.abs(difference) * 10, 2000); // Max 2 seconds
      const startTime = Date.now();
      const startValue = displayTotalXP;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (difference * easeOut));
        
        setDisplayTotalXP(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [totalXP]); // Only depend on totalXP, not displayTotalXP

  const handleStatsClick = () => {
    setShowStatsModal(true);
    onStatsClick?.();
  };

  // 📱 NEW: Drag handlers for mobile
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile || !isFloating) return;
    
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
    setInitialPosition(dragPosition);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !isMobile || !isFloating) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // 🔧 SAFE: Movimento com limites seguros para evitar sumir
    const minX = 10; // Margem mínima da esquerda
    const maxX = window.innerWidth - 100; // Margem da direita
    const minY = 80; // Abaixo do header
    const maxY = window.innerHeight - 200; // Acima do footer
    
    const newX = Math.max(minX, Math.min(maxX, initialPosition.x + deltaX));
    const newY = Math.max(minY, Math.min(maxY, initialPosition.y + deltaY));
    
    setDragPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging && isMobile) {
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleDragMove(e as any);
      };
      
      const handleTouchEnd = () => handleDragEnd();
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e as any);
      const handleMouseUp = () => handleDragEnd();

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isMobile, dragStart, initialPosition]);

  // ✅ NEW: Set initial position for floating counter
  useEffect(() => {
    if (isMobile && isFloating && typeof window !== 'undefined') {
      // 🔧 FIX: Posição inicial mais conservadora e visível
      const initialX = window.innerWidth - 90; // Mais próximo da borda direita
      const initialY = 150; // Mais alto, mas visível
      
      console.log('🎯 XPCounter initial position:', { initialX, initialY, windowWidth: window.innerWidth, windowHeight: window.innerHeight });
      
      setInitialPosition({ x: initialX, y: initialY });
      setDragPosition({ x: initialX, y: initialY });
    }
  }, [isMobile, isFloating]);

  // 🔧 DEBUG: Log quando o componente renderiza
  useEffect(() => {
    console.log('🎯 XPCounter render:', { 
      isMobile, 
      isFloating, 
      dragPosition, 
      sessionXP, 
      totalXP,
      currentLevel 
    });
  }, [isMobile, isFloating, dragPosition, sessionXP, totalXP, currentLevel]);

  return (
    <>
      <div 
        className="relative flex items-center space-x-2"
        style={isMobile && isFloating ? {
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate(${dragPosition.x || window.innerWidth - 90}px, ${dragPosition.y || 150}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          zIndex: showStatsModal ? 40 : 70,
          pointerEvents: 'auto'
        } : {}}
      >
        <motion.button
          onClick={handleStatsClick}
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
          className={`${
            isFloating 
              ? 'flex flex-col items-center space-y-1.5 px-3 py-3.5 rounded-[36px] min-w-[75px] shadow-2xl' 
              : 'flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full'
          } border transition-all duration-300 ${
            isDragging ? 'scale-110' : 'hover:scale-105'
          } ${
            isAnimating 
              ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/25' 
              : isFloating
                ? 'bg-charcoal/90 backdrop-blur-xl border-white/30 hover:bg-charcoal shadow-2xl shadow-black/50'
                : 'bg-charcoal/80 backdrop-blur-md border-white/20 hover:bg-charcoal/90 shadow-2xl'
          } ${isMobile && isFloating ? 'cursor-grab active:cursor-grabbing' : ''}`}
          animate={isAnimating ? {
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 0px rgba(163, 255, 60, 0)",
              "0 0 20px rgba(163, 255, 60, 0.5)",
              "0 0 0px rgba(163, 255, 60, 0)"
            ]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Progress Ring */}
          <div className="relative">
            <ProgressRing 
              level={currentLevel} 
              progress={Math.max(0, Math.min(100, levelProgress))} 
              size={isFloating ? 40 : 32}
            />
            
            {/* Achievement notification badge */}
            {hasUnreadAchievements && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border border-white/20"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-full h-full bg-red-400 rounded-full"
                />
              </motion.div>
            )}
          </div>

          {/* Session XP */}
          <div className="flex flex-col items-center">
            <motion.span 
              className={`${isFloating ? 'text-sm' : 'text-xs'} font-semibold transition-colors ${
                isAnimating ? 'text-primary' : 'text-white/90'
              }`}
              key={displaySessionXP}
              initial={{ scale: 1 }}
              animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              +{displaySessionXP}
            </motion.span>
            <span className={`${isFloating ? 'text-xs' : 'text-[10px]'} text-white/60 leading-none`}>today</span>
          </div>

          {/* Divisor - only show in horizontal layout */}
          {!isFloating && (
            <div className="w-px h-3 sm:h-4 bg-white/20"></div>
          )}

          {/* Total XP */}
          <div className="flex flex-col items-center">
            <motion.span 
              className={`${isFloating ? 'text-sm' : 'text-xs'} font-semibold text-white/90`}
              animate={isAnimating ? { color: ["#FFFFFF", "#A3FF3C", "#FFFFFF"] } : {}}
              transition={{ duration: 1 }}
            >
              {(displayTotalXP || 0).toLocaleString()}
            </motion.span>
            <span className={`${isFloating ? 'text-xs' : 'text-[10px]'} text-white/60 leading-none`}>total</span>
          </div>
        </motion.button>

        {/* Floating XP Animation */}
        <AnimatePresence>
          {floatingXP && (
            <motion.div
              className="absolute left-1/2 top-0 pointer-events-none z-10"
              initial={{ opacity: 1, y: 0, x: "-50%", scale: 0.8 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <div className="bg-primary text-black px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-primary/50">
                +{floatingXP} XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particle Effects */}
        <AnimatePresence>
          {isAnimating && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`particle-${Date.now()}-${i}-${Math.random()}`}
                  className="absolute w-1 h-1 bg-primary rounded-full pointer-events-none"
                  style={{
                    left: `${50 + (Math.random() - 0.5) * 40}%`,
                    top: `${50 + (Math.random() - 0.5) * 40}%`,
                  }}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1,
                    y: -20 + Math.random() * -20,
                    x: (Math.random() - 0.5) * 30
                  }}
                  transition={{ 
                    duration: 1 + Math.random() * 0.5,
                    delay: i * 0.1 
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Modal com tabs */}
      <EnhancedStatsModal 
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        sessionXP={sessionXP}
        totalXP={totalXP}
        currentLevel={currentLevel}
        achievements={achievements}
        realAchievements={realAchievements}
        onAchievementsDismissed={onAchievementsDismissed}
        userId={userId}
        userLevel={userLevel}
      />

      {/* ✅ ESTILOS CUSTOMIZADOS PARA SCROLLBAR */}
      <style jsx global>{`
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
    </>
  );
};

export default EnhancedXPCounter; 