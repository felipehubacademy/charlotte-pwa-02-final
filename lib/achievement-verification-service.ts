/**
 * 🏆 ACHIEVEMENT VERIFICATION SERVICE
 * Conecta a lógica de detecção de achievements com o banco de dados
 * Verifica automaticamente achievements quando práticas são completadas
 */

import { supabaseService } from './supabase-service';

interface UserStats {
  total_practices: number;
  perfect_practices: number;
  streak_days: number;
  current_level: number;
  vocabulary_count: number;
  daily_practices_today: number;
  weekly_practices: number;
  active_days: number;
  levels_practiced: number;
}

interface AchievementToAward {
  code: string;
  name: string;
  description: string;
  badge_icon: string;
  badge_color: string;
  category: string;
  xp_reward: number;
  rarity: string;
}

export class AchievementVerificationService {
  
  /**
   * Verificar e conceder achievements após uma prática
   */
  static async verifyAndAwardAchievements(userId: string, practiceData: {
    practice_type: string;
    accuracy_score?: number;
    grammar_score?: number;
    pronunciation_score?: number;
    xp_awarded: number;
    duration?: number;
  }): Promise<AchievementToAward[]> {
    
    if (!supabaseService.isAvailable()) {
      console.warn('⚠️ Supabase not available for achievement verification');
      return [];
    }

    try {
      console.log('🏆 Starting achievement verification for user:', userId);

      // 1. Buscar achievements disponíveis no banco
      const availableAchievements = await supabaseService.getAchievements(true);

      // 2. Buscar achievements já conquistados pelo usuário
      const earnedCodes = await supabaseService.getUserAchievementCodes(userId);
      const earnedCodesSet = new Set(earnedCodes);

      // 3. Calcular estatísticas do usuário
      const userStats = await this.calculateUserStats(userId, practiceData);
      
      // 4. Verificar quais achievements devem ser concedidos
      const achievementsToAward: AchievementToAward[] = [];

      for (const achievement of availableAchievements) {
        // Pular se já foi conquistado
        if (earnedCodesSet.has(achievement.code)) {
          continue;
        }

        // Verificar se o usuário atende aos critérios
        if (this.meetsRequirement(achievement, userStats, practiceData)) {
          achievementsToAward.push({
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            badge_icon: achievement.badge_icon,
            badge_color: achievement.badge_color,
            category: achievement.category,
            xp_reward: achievement.xp_reward,
            rarity: achievement.rarity
          });
        }
      }

      // 5. Salvar achievements conquistados no banco
      if (achievementsToAward.length > 0) {
        await this.saveNewAchievements(userId, achievementsToAward);
        console.log('✅ Awarded achievements:', achievementsToAward.map(a => a.name));
      }

      return achievementsToAward;

    } catch (error) {
      console.error('❌ Error in achievement verification:', error);
      return [];
    }
  }

  /**
   * Calcular estatísticas do usuário para verificação de achievements
   */
  private static async calculateUserStats(userId: string, currentPractice: any): Promise<UserStats> {
    try {
      // Buscar dados do progresso do usuário
      const userProgress = await supabaseService.getUserStats(userId);

      // Buscar práticas do usuário para cálculos específicos
      const practices = await supabaseService.getUserPracticesForStats(userId);

      // Buscar vocabulário descoberto
      const vocabularyCount = await supabaseService.getUserVocabularyCount(userId);

      // Calcular práticas perfeitas
      const perfectPractices = practices?.filter(p => 
        (p.accuracy_score && p.accuracy_score >= 100) ||
        (p.grammar_score && p.grammar_score >= 100) ||
        (p.pronunciation_score && p.pronunciation_score >= 100)
      ).length || 0;

      // Calcular práticas de hoje
      const today = new Date().toISOString().split('T')[0];
      const dailyPractices = practices?.filter(p => 
        p.created_at.startsWith(today)
      ).length || 0;

      // Calcular práticas da semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyPractices = practices?.filter(p => 
        new Date(p.created_at) >= weekAgo
      ).length || 0;

      // Calcular dias ativos (únicos)
      const uniqueDays = new Set(
        practices?.map(p => p.created_at.split('T')[0]) || []
      ).size;

      // Calcular níveis praticados (tipos únicos)
      const levelsPracticed = new Set(
        practices?.map(p => p.practice_type) || []
      ).size;

      return {
        total_practices: userProgress?.total_practices || 0,
        perfect_practices: perfectPractices,
        streak_days: userProgress?.streak_days || 0,
        current_level: userProgress?.current_level || 1,
        vocabulary_count: vocabularyCount,
        daily_practices_today: dailyPractices,
        weekly_practices: weeklyPractices,
        active_days: uniqueDays,
        levels_practiced: levelsPracticed
      };

    } catch (error) {
      console.error('❌ Error calculating user stats:', error);
      return {
        total_practices: 0,
        perfect_practices: 0,
        streak_days: 0,
        current_level: 1,
        vocabulary_count: 0,
        daily_practices_today: 0,
        weekly_practices: 0,
        active_days: 0,
        levels_practiced: 0
      };
    }
  }

  /**
   * Verificar se o usuário atende aos critérios de um achievement
   */
  private static meetsRequirement(
    achievement: any, 
    userStats: UserStats, 
    currentPractice: any
  ): boolean {
    
    const { requirement_type, requirement_value } = achievement;

    switch (requirement_type) {
      case 'practice_count':
        return userStats.total_practices >= requirement_value;

      case 'perfect_practices':
        // Verificar se a prática atual é perfeita
        const isPerfectNow = (
          (currentPractice.accuracy_score && currentPractice.accuracy_score >= 100) ||
          (currentPractice.grammar_score && currentPractice.grammar_score >= 100) ||
          (currentPractice.pronunciation_score && currentPractice.pronunciation_score >= 100)
        );
        const totalPerfect = userStats.perfect_practices + (isPerfectNow ? 1 : 0);
        return totalPerfect >= requirement_value;

      case 'daily_streak':
        return userStats.streak_days >= requirement_value;

      case 'user_level_numeric':
        return userStats.current_level >= requirement_value;

      case 'vocabulary_count':
        return userStats.vocabulary_count >= requirement_value;

      case 'daily_practices':
        return userStats.daily_practices_today >= requirement_value;

      case 'weekly_practices':
        return userStats.weekly_practices >= requirement_value;

      case 'active_days':
        return userStats.active_days >= requirement_value;

      case 'levels_practiced':
        return userStats.levels_practiced >= requirement_value;

      default:
        console.warn('⚠️ Unknown requirement type:', requirement_type);
        return false;
    }
  }

  /**
   * Salvar novos achievements no banco de dados
   */
  private static async saveNewAchievements(userId: string, achievements: AchievementToAward[]): Promise<void> {
    try {
      const achievementRecords = achievements.map(achievement => ({
        user_id: userId,
        achievement_code: achievement.code,
        achievement_name: achievement.name,
        achievement_description: achievement.description,
        xp_bonus: achievement.xp_reward,
        rarity: achievement.rarity,
        category: achievement.category,
        badge_icon: achievement.badge_icon,
        badge_color: achievement.badge_color,
        earned_at: new Date().toISOString()
      }));

      const success = await supabaseService.saveNewAchievements(userId, achievementRecords);

      if (!success) {
        throw new Error('Failed to save achievements');
      }

      console.log('✅ New achievements saved successfully');

    } catch (error) {
      console.error('❌ Exception saving new achievements:', error);
      throw error;
    }
  }

  /**
   * Buscar achievements recentes do usuário (últimas 24h)
   */
  static async getRecentAchievements(userId: string): Promise<AchievementToAward[]> {
    try {
      const recentAchievements = await supabaseService.getUnreadAchievements(userId);

      return recentAchievements?.map((ua: any) => ({
        code: ua.achievement_code,
        name: ua.achievement_name,
        description: ua.achievement_description,
        badge_icon: ua.badge_icon,
        badge_color: ua.badge_color,
        category: ua.category,
        xp_reward: ua.xp_bonus,
        rarity: ua.rarity
      })) || [];

    } catch (error) {
      console.error('❌ Error in getRecentAchievements:', error);
      return [];
    }
  }
} 