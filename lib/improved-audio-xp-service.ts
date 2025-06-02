// lib/improved-audio-xp-service.ts - Sistema XP baseado em pesquisa psicológica

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  xpBonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  earnedAt: Date;
}

export interface AudioAssessmentResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  feedback: string[];
}

export interface ImprovedXPResult {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  achievements: Achievement[];
  surpriseBonus?: {
    amount: number;
    message: string;
  };
  levelUp?: {
    oldLevel: number;
    newLevel: number;
  };
  feedback: string;
  shouldRetry: boolean;
  retryReason: string;
}

/**
 * 🎯 XP Ranges baseados em pesquisa psicológica
 * Reduzidos de 30-150 para 3-25 para evitar inflação
 */
const XP_RANGES = {
  'Novice': { min: 8, max: 25 },
  'Inter': { min: 5, max: 20 },
  'Advanced': { min: 3, max: 15 }
} as const;

/**
 * 🎲 Variable Ratio Reinforcement - 15% chance de bônus surpresa
 */
function calculateSurpriseBonus(baseXP: number): { amount: number; message: string } | undefined {
  if (Math.random() < 0.15) { // 15% chance
    const bonusPercentage = 0.05 + Math.random() * 0.45; // 5-50% extra
    const bonusAmount = Math.round(baseXP * bonusPercentage);
    
    const messages = [
      "🌟 Lucky streak! Bonus XP!",
      "✨ Perfect timing! Extra points!",
      "🎯 Outstanding effort! Bonus!",
      "🚀 Exceptional practice! More XP!",
      "💫 Great momentum! Keep going!"
    ];
    
    return {
      amount: bonusAmount,
      message: messages[Math.floor(Math.random() * messages.length)]
    };
  }
  return undefined;
}

/**
 * 🏆 Sistema de Achievements instantâneos
 */
function detectAchievements(
  assessmentResult: AudioAssessmentResult,
  duration: number,
  userLevel: string,
  streakDays: number
): Achievement[] {
  const achievements: Achievement[] = [];
  const { text, accuracyScore, pronunciationScore } = assessmentResult;

  // Perfect Practice (accuracy > 95%)
  if (accuracyScore > 95) {
    achievements.push({
      id: `perfect-practice-${Date.now()}`,
      type: 'perfect-practice',
      title: 'Perfect Practice!',
      description: 'Achieved 95%+ accuracy',
      xpBonus: 10,
      rarity: 'rare',
      icon: '🎯',
      earnedAt: new Date()
    });
  }

  // Long Sentence (text > 100 chars)
  if (text.length > 100) {
    achievements.push({
      id: `long-sentence-${Date.now()}`,
      type: 'long-sentence',
      title: 'Eloquent Speaker',
      description: 'Spoke a long, detailed sentence',
      xpBonus: 5,
      rarity: 'common',
      icon: '📝',
      earnedAt: new Date()
    });
  }

  // Speed Demon (duration > 30s)
  if (duration > 30) {
    achievements.push({
      id: `speed-demon-${Date.now()}`,
      type: 'speed-demon',
      title: 'Marathon Speaker',
      description: 'Spoke for over 30 seconds',
      xpBonus: 8,
      rarity: 'common',
      icon: '⚡',
      earnedAt: new Date()
    });
  }

  // Grammar Master (pronunciation > 90%)
  if (pronunciationScore > 90) {
    achievements.push({
      id: `grammar-master-${Date.now()}`,
      type: 'grammar-master',
      title: 'Grammar Master',
      description: 'Excellent pronunciation score',
      xpBonus: 12,
      rarity: 'rare',
      icon: '📚',
      earnedAt: new Date()
    });
  }

  // Streak Milestone (every 5 days)
  if (streakDays > 0 && streakDays % 5 === 0) {
    achievements.push({
      id: `streak-milestone-${streakDays}`,
      type: 'streak-milestone',
      title: `${streakDays}-Day Streak!`,
      description: `Practiced for ${streakDays} consecutive days`,
      xpBonus: streakDays,
      rarity: streakDays >= 20 ? 'epic' : 'rare',
      icon: '🔥',
      earnedAt: new Date()
    });
  }

  // Surprise Achievements (1% chance)
  if (Math.random() < 0.01) {
    const surpriseAchievements = [
      {
        id: `lucky-star-${Date.now()}`,
        type: 'lucky-star',
        title: 'Lucky Star!',
        description: 'Fortune smiles upon you',
        xpBonus: 20,
        rarity: 'legendary' as const,
        icon: '⭐'
      },
      {
        id: `golden-hour-${Date.now()}`,
        type: 'golden-hour',
        title: 'Golden Hour',
        description: 'Perfect timing bonus',
        xpBonus: 15,
        rarity: 'epic' as const,
        icon: '🌅'
      }
    ];

    const randomAchievement = surpriseAchievements[Math.floor(Math.random() * surpriseAchievements.length)];
    achievements.push({
      ...randomAchievement,
      earnedAt: new Date()
    });
  }

  return achievements;
}

/**
 * 🧮 Cálculo de nível baseado em fórmula exponencial suave
 */
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

/**
 * 🔄 Verificar se o áudio precisa ser repetido
 */
function shouldRequestRetry(
  assessmentResult: AudioAssessmentResult,
  audioDuration: number
): { shouldRetry: boolean; reason: string } {
  const { text, pronunciationScore, accuracyScore } = assessmentResult;
  
  // Casos que precisam repetir
  if (!text || text.toLowerCase().includes('unknown') || text.trim().length < 3) {
    return { shouldRetry: true, reason: 'not_understood' };
  }
  
  if (audioDuration < 2) {
    return { shouldRetry: true, reason: 'too_short' };
  }
  
  if (pronunciationScore < 15 && accuracyScore < 20) {
    return { shouldRetry: true, reason: 'poor_quality' };
  }
  
  const gibberishPatterns = /[^a-zA-Z0-9\s.,!?'-]/g;
  const gibberishCount = (text.match(gibberishPatterns) || []).length;
  if (gibberishCount > text.length * 0.3) {
    return { shouldRetry: true, reason: 'gibberish' };
  }
  
  return { shouldRetry: false, reason: '' };
}

/**
 * 📝 Gerar feedback motivacional
 */
function generateMotivationalFeedback(
  result: AudioAssessmentResult,
  xpAwarded: number,
  achievements: Achievement[],
  surpriseBonus?: { amount: number; message: string }
): string {
  const { accuracyScore, text } = result;
  
  let feedback = '';
  
  if (accuracyScore >= 90) {
    feedback = '🎯 Excellent pronunciation! Your English is really improving!';
  } else if (accuracyScore >= 75) {
    feedback = '👍 Great job! Your pronunciation is getting better!';
  } else if (accuracyScore >= 60) {
    feedback = '📈 Good effort! Keep practicing to improve your pronunciation!';
  } else {
    feedback = '💪 Nice try! Every practice session makes you better!';
  }
  
  if (text.length > 80) {
    feedback += ' You spoke with great detail!';
  }
  
  if (achievements.length > 0) {
    feedback += ` 🏆 You earned ${achievements.length} achievement${achievements.length > 1 ? 's' : ''}!`;
  }
  
  if (surpriseBonus) {
    feedback += ` ${surpriseBonus.message}`;
  }
  
  return feedback;
}

/**
 * 🎯 FUNÇÃO PRINCIPAL: Calcular XP melhorado
 */
export async function calculateImprovedXP(
  assessmentResult: AudioAssessmentResult,
  audioDuration: number,
  userLevel: 'Novice' | 'Inter' | 'Advanced' = 'Inter',
  userId?: string,
  currentTotalXP: number = 0,
  streakDays: number = 0
): Promise<ImprovedXPResult> {
  
  console.log('🎯 Calculating improved XP:', {
    userLevel,
    duration: audioDuration,
    accuracy: assessmentResult.accuracyScore,
    textLength: assessmentResult.text.length
  });

  // Verificar se precisa repetir
  const retryCheck = shouldRequestRetry(assessmentResult, audioDuration);
  
  if (retryCheck.shouldRetry) {
    return {
      baseXP: 0,
      bonusXP: 0,
      totalXP: 0,
      achievements: [],
      feedback: 'Please try recording again for better audio quality.',
      shouldRetry: true,
      retryReason: retryCheck.reason
    };
  }

  // Calcular XP base baseado no nível
  const range = XP_RANGES[userLevel];
  const { accuracyScore, text } = assessmentResult;
  
  // XP base proporcional à accuracy e duração
  const accuracyFactor = Math.max(0.3, accuracyScore / 100); // Mínimo 30%
  const durationFactor = Math.min(1.5, audioDuration / 20); // Máximo 1.5x para 20s+
  const lengthFactor = Math.min(1.3, text.length / 100); // Máximo 1.3x para 100+ chars
  
  let baseXP = Math.round(
    range.min + 
    (range.max - range.min) * accuracyFactor * durationFactor * lengthFactor
  );

  // Perfect Practice bonus (+10 XP)
  if (accuracyScore > 95) {
    baseXP += 10;
  }

  // Streak multiplier (+10% por dia consecutivo, max 100%)
  const streakMultiplier = 1.0 + Math.min(1.0, streakDays * 0.1);
  baseXP = Math.round(baseXP * streakMultiplier);

  // Detectar achievements
  const achievements = detectAchievements(assessmentResult, audioDuration, userLevel, streakDays);
  
  // Calcular bônus de achievements
  const achievementBonus = achievements.reduce((sum, achievement) => sum + achievement.xpBonus, 0);

  // Variable Ratio Bonus (15% chance)
  const surpriseBonus = calculateSurpriseBonus(baseXP);
  const surpriseBonusXP = surpriseBonus?.amount || 0;

  // Total XP
  const bonusXP = achievementBonus + surpriseBonusXP;
  const totalXP = baseXP + bonusXP;

  // Verificar level up
  const oldLevel = calculateLevel(currentTotalXP);
  const newLevel = calculateLevel(currentTotalXP + totalXP);
  const levelUp = newLevel > oldLevel ? { oldLevel, newLevel } : undefined;

  // Gerar feedback
  const feedback = generateMotivationalFeedback(assessmentResult, totalXP, achievements, surpriseBonus);

  console.log('✅ Improved XP calculated:', {
    baseXP,
    bonusXP,
    totalXP,
    achievements: achievements.length,
    surpriseBonus: surpriseBonusXP,
    levelUp
  });

  return {
    baseXP,
    bonusXP,
    totalXP,
    achievements,
    surpriseBonus,
    levelUp,
    feedback,
    shouldRetry: false,
    retryReason: ''
  };
}

/**
 * 🎮 Serviço principal do sistema XP melhorado
 */
export const improvedAudioXPService = {
  calculateImprovedXP,
  calculateLevel,
  XP_RANGES
}; 