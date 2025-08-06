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
    text?: string; // ✅ NOVO: Para achievements baseados em texto
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
        
        // 🎨 Achievements são mostrados via cards in-app (não push notifications)
        // Push notifications são reservadas para reengajamento, lembretes, etc.
        console.log('🎨 Achievements will be displayed as in-app cards with animations');
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
          (currentPractice.accuracy_score && currentPractice.accuracy_score >= 95) ||
          (currentPractice.grammar_score && currentPractice.grammar_score >= 95) ||
          (currentPractice.pronunciation_score && currentPractice.pronunciation_score >= 95)
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

      case 'morning_practice':
        const currentHour = new Date().getHours();
        return currentHour >= 5 && currentHour <= 7;

      case 'lunch_practice':
        const lunchHour = new Date().getHours();
        return lunchHour >= 12 && lunchHour <= 14;

      case 'night_practice':
        const nightHour = new Date().getHours();
        return (nightHour >= 22 || nightHour <= 2);

      case 'monday_practice':
        return new Date().getDay() === 1; // Segunda-feira

      case 'friday_practice':
        return new Date().getDay() === 5; // Sexta-feira

      case 'weekend_practice':
        const dayOfWeek = new Date().getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado

      case 'message_length':
        return currentPractice.text && currentPractice.text.length >= requirement_value;

      case 'word_count':
        return currentPractice.text && currentPractice.text.split(' ').length >= requirement_value;

      case 'audio_duration':
        return currentPractice.duration && currentPractice.duration >= requirement_value;

      case 'grammar_score':
        return currentPractice.grammar_score && currentPractice.grammar_score >= requirement_value;

      case 'accuracy_score':
        return currentPractice.accuracy_score && currentPractice.accuracy_score >= requirement_value;

      case 'pronunciation_score':
        return currentPractice.pronunciation_score && currentPractice.pronunciation_score >= requirement_value;

      case 'audio_count':
        return userStats.total_practices >= requirement_value; // Simplificado por enquanto

      case 'text_count':
        return userStats.total_practices >= requirement_value; // Simplificado por enquanto

      case 'live_sessions':
        return userStats.total_practices >= requirement_value; // Simplificado por enquanto

      case 'live_duration':
        return currentPractice.duration && currentPractice.duration >= requirement_value;

      case 'polite_expressions':
        return currentPractice.text && (
          currentPractice.text.toLowerCase().includes('thank you') ||
          currentPractice.text.toLowerCase().includes('thanks') ||
          currentPractice.text.toLowerCase().includes('obrigado') ||
          currentPractice.text.toLowerCase().includes('obrigada')
        );

      case 'questions_asked':
        return currentPractice.text && (
          currentPractice.text.includes('?') ||
          currentPractice.text.toLowerCase().includes('what') ||
          currentPractice.text.toLowerCase().includes('how') ||
          currentPractice.text.toLowerCase().includes('why') ||
          currentPractice.text.toLowerCase().includes('when') ||
          currentPractice.text.toLowerCase().includes('where')
        );

      case 'topics_explored':
        return userStats.levels_practiced >= requirement_value; // Simplificado

      case 'cultural_mention':
        return currentPractice.text && (
          currentPractice.text.toLowerCase().includes('brazil') ||
          currentPractice.text.toLowerCase().includes('brasil') ||
          currentPractice.text.toLowerCase().includes('brazilian')
        );

      case 'emotion_expression':
        return currentPractice.text && (
          currentPractice.text.toLowerCase().includes('happy') ||
          currentPractice.text.toLowerCase().includes('sad') ||
          currentPractice.text.toLowerCase().includes('excited') ||
          currentPractice.text.toLowerCase().includes('worried') ||
          currentPractice.text.toLowerCase().includes('love') ||
          currentPractice.text.toLowerCase().includes('hate')
        );

      case 'photo_practices':
        return currentPractice.practice_type === 'camera_object';

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
        achievement_id: null, // Permitir NULL para achievements dinâmicos
        achievement_type: 'dynamic', // Tipo padrão para achievements dinâmicos
        achievement_name: achievement.name || 'Achievement', // ✅ Campo correto na tabela
        achievement_description: achievement.description || 'Achievement earned!', // ✅ Campo correto na tabela
        achievement_code: achievement.code || `dynamic-${Date.now()}`, // ✅ Campo correto na tabela
        category: achievement.category || 'general', // ✅ Campo correto na tabela
        badge_icon: achievement.badge_icon || '🏆', // ✅ Campo correto na tabela
        badge_color: achievement.badge_color || '#4CAF50', // ✅ Campo correto na tabela
        xp_bonus: achievement.xp_reward || 0,
        rarity: achievement.rarity || 'common',
        earned_at: new Date().toISOString()
      }));

      console.log('🔍 Attempting to save achievements:', achievementRecords.length);
      console.log('🔍 Sample achievement data:', achievementRecords[0]);
      console.log('🔍 DEBUG: Using saveNewAchievements method (CORRECTED VERSION)');

      const success = await supabaseService.saveNewAchievements(userId, achievementRecords);

      if (!success) {
        throw new Error('Failed to save achievements to database');
      }

      console.log('✅ New achievements saved successfully');

    } catch (error) {
      console.error('❌ Exception saving new achievements:', error);
      // Não quebrar o fluxo - achievements são um nice-to-have
      console.warn('⚠️ Continuing without saving achievements...');
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

  /**
   * 🎨 Achievements são exibidos como cards in-app animados
   * Esta função foi removida - achievements não precisam de push notifications
   * 
   * Push notifications são reservadas para:
   * - 🔥 Lembretes de streak
   * - 💪 Desafios semanais  
   * - 👥 Convites sociais
   * - ⏰ Lembretes de prática
   * - 🎯 Metas personalizadas
   */
  // REMOVED: sendAchievementNotifications() - achievements are now in-app only

  /**
   * 🌐 Buscar nível do usuário
   */
  private static async getUserLevel(userId: string): Promise<'Novice' | 'Inter' | 'Advanced'> {
    // Simplificar: assumir que a maioria é Inter, Advanced é minoria
    // Futuramente pode ser melhorado com lookup real no banco
    try {
      // Por enquanto, assumir que a maioria dos usuários são Inter
      // Advanced é uma pequena minoria que pode ser configurada via feature flag
      return 'Inter';
    } catch (error) {
      console.warn('⚠️ Could not get user level, defaulting to Inter:', error);
      return 'Inter';
    }
  }

  // REMOVED: getLocalizedMultipleAchievementPayload() - achievements are now in-app only
  // REMOVED: getLocalizedSingleAchievementPayload() - achievements are now in-app only  
  // REMOVED: sendFCMNotification() - achievements are now in-app only
  
  /**
   * 🎨 Achievement display is now handled by in-app components:
   * - components/achievements/AchievementNotification.tsx (animated cards)
   * - Enhanced XP counter with achievement celebration
   * - Confetti and visual feedback during app usage
   * 
   * This provides better UX than push notifications for achievements since:
   * - Users earn achievements while actively using the app
   * - Immediate visual feedback is more rewarding
   * - Animations and celebration enhance the experience
   * - No interruption when user is not using the app
   */
} 