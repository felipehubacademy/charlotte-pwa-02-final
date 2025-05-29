import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Target, Award, Clock } from 'lucide-react';
import { supabaseService } from '@/lib/supabase-service';

interface XPCounterProps {
  sessionXP: number;
  totalXP: number;
  onXPGained?: (amount: number) => void;
  userId?: string;
}

// 📱 Modal de estatísticas - LAYOUT RESPONSIVO MELHORADO
const StatsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  sessionXP: number; 
  totalXP: number;
  userId?: string;
}> = ({ 
  isOpen, onClose, sessionXP, totalXP, userId
}) => {
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
      console.warn('⚠️ No userId provided to StatsModal');
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

  const effectiveTotalXP = realData.realTotalXP;
  const effectiveSessionXP = realData.realSessionXP;

  const currentLevel = Math.floor(effectiveTotalXP / 1000) + 1;
  const xpForNextLevel = (currentLevel * 1000) - effectiveTotalXP;
  const levelProgress = ((effectiveTotalXP % 1000) / 1000) * 100;

  return (
    <AnimatePresence>
      {/* 🌈 OVERLAY COMPLETO COM BLUR */}
      <div 
        className="fixed inset-0 z-50 bg-black/60"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      >
        {/* ✅ CONTAINER RESPONSIVO - HORIZONTAL NO DESKTOP */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-secondary/95 backdrop-blur-md rounded-2xl p-6 w-full border border-white/10 shadow-2xl
                       max-w-md lg:max-w-4xl 
                       max-h-[85vh] overflow-hidden
                       lg:flex lg:gap-6"
          >
            {/* HEADER - Responsivo */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Progress</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            {/* 🖥️ DESKTOP LAYOUT - COLUNA ESQUERDA */}
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

              {/* Level Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm">Level {currentLevel}</span>
                  <span className="text-primary text-sm font-bold">
                    {xpForNextLevel} XP to next level
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary-dark rounded-full h-3 transition-all duration-500 relative"
                    style={{ width: `${levelProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-white/60 text-xs">{Math.round(levelProgress)}% to Level {currentLevel + 1}</span>
                </div>
              </div>

              {/* 📊 STATS GRID - 2x2 EM TODAS AS TELAS */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Session XP */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar size={18} className="text-primary" />
                    <span className="text-white/80 text-sm font-medium">Today</span>
                  </div>
                  <span className="text-white text-2xl font-bold block mb-1">
                    {realData.loading ? '...' : `+${effectiveSessionXP}`}
                  </span>
                  <p className="text-white/60 text-sm">XP earned today</p>
                </div>

                {/* Total XP */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp size={18} className="text-primary" />
                    <span className="text-white/80 text-sm font-medium">Total</span>
                  </div>
                  <span className="text-white text-2xl font-bold block mb-1">
                    {realData.loading ? '...' : effectiveTotalXP.toLocaleString()}
                  </span>
                  <p className="text-white/60 text-sm">XP earned overall</p>
                </div>

                {/* Level */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <Target size={18} className="text-primary" />
                    <span className="text-white/80 text-sm font-medium">Level</span>
                  </div>
                  <span className="text-white text-2xl font-bold block mb-1">{currentLevel}</span>
                  <p className="text-white/60 text-sm">Current level</p>
                </div>

                {/* Streak */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award size={18} className="text-primary" />
                    <span className="text-white/80 text-sm font-medium">Streak</span>
                  </div>
                  <span className="text-white text-2xl font-bold block mb-1">
                    {realData.loading ? '...' : realData.streak}
                  </span>
                  <p className="text-white/60 text-sm">consecutive days</p>
                </div>
              </div>
            </div>

            {/* 🖥️ DESKTOP LAYOUT - COLUNA DIREITA | 📱 MOBILE - SEÇÃO INFERIOR */}
            <div className="lg:flex-1 lg:pl-6 lg:border-l lg:border-white/10">
              {/* Recent Activity - BARRA DE ROLAGEM SUTIL */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 h-full lg:h-auto">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Clock size={16} className="text-primary mr-2" />
                  Recent Activity
                </h3>
                
                {realData.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    <span className="ml-3 text-white/60">Loading your progress...</span>
                  </div>
                ) : null}
                
                {/* ✅ SCROLLABLE AREA COM ESTILO CUSTOMIZADO */}
                <div className="space-y-3 overflow-y-auto scrollbar-custom
                               max-h-32 lg:max-h-80
                               pr-2">
                  {realData.recentActivity.length > 0 ? (
                    realData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex justify-between items-center py-3 px-2 
                                                  bg-white/5 rounded-lg border border-white/5
                                                  hover:bg-white/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <span className="text-white/80 text-sm font-medium block truncate">
                            {activity.type}
                          </span>
                          <p className="text-white/40 text-xs mt-1">
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
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🚀</div>
                      <p className="text-white/50 text-sm">
                        No recent activity
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        Start practicing to see your progress!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>




          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

const XPCounter: React.FC<XPCounterProps> = ({ sessionXP, totalXP, onXPGained, userId }) => {
  const [displaySessionXP, setDisplaySessionXP] = useState(sessionXP);
  const [displayTotalXP, setDisplayTotalXP] = useState(totalXP);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // 🎯 Animar aumento do XP session
  useEffect(() => {
    if (sessionXP > displaySessionXP) {
      setIsAnimating(true);
      const difference = sessionXP - displaySessionXP;
      
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
  }, [sessionXP, displaySessionXP, onXPGained]);

  // 📈 Animar aumento do XP total
  useEffect(() => {
    if (totalXP > displayTotalXP) {
      const difference = totalXP - displayTotalXP;
      const duration = 1500;
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
  }, [totalXP, displayTotalXP]);

  return (
    <>
      <div className="relative flex items-center space-x-2">
        <motion.button
          onClick={() => setShowStatsModal(true)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all duration-300 hover:scale-105 ${
            isAnimating 
              ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/25' 
              : 'bg-white/10 border-white/20 hover:bg-white/15'
          }`}
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
          {/* 🆕 XP Logo Minimalista - Apenas Texto */}
          <div className="flex items-center">
            <motion.div 
              className={`text-sm font-black text-white transition-all ${
                isAnimating ? 'text-primary' : 'text-white/80'
              }`}
              animate={isAnimating ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              XP
            </motion.div>
          </div>

          {/* Session XP */}
          <div className="flex flex-col items-center">
            <motion.span 
              className={`text-sm font-semibold transition-colors ${
                isAnimating ? 'text-primary' : 'text-white/80'
              }`}
              key={displaySessionXP}
              initial={{ scale: 1 }}
              animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              +{displaySessionXP}
            </motion.span>
            <span className="text-[10px] text-white/50 leading-none">today</span>
          </div>

          {/* Divisor */}
          <div className="w-px h-4 bg-white/20"></div>

          {/* Total XP */}
          <div className="flex flex-col items-center">
            <motion.span 
              className="text-sm font-semibold text-white/80"
              animate={isAnimating ? { color: ["#FFFFFF", "#A3FF3C", "#FFFFFF"] } : {}}
              transition={{ duration: 1 }}
            >
              {displayTotalXP.toLocaleString()}
            </motion.span>
            <span className="text-[10px] text-white/50 leading-none">total</span>
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
              <div className="bg-primary text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-primary/50">
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
                  key={i}
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

      {/* Modal com layout responsivo */}
      <StatsModal 
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        sessionXP={sessionXP}
        totalXP={totalXP}
        userId={userId}
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

export default XPCounter;