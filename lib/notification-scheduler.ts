// Sistema de Agendamento de Notificações - Charlotte
// Triggers automáticos para notificações de reengajamento

import { ReengagementNotificationService } from './reengagement-notification-service';

export class NotificationScheduler {
  
  /**
   * 🔥 Verificar e enviar lembretes de streak em risco
   * Executar diariamente às 21h
   */
  static async checkStreakReminders(): Promise<void> {
    try {
      console.log('🔥 [SCHEDULER] Checking streak reminders...');
      
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      // Buscar usuários com streak > 0 que não praticaram hoje
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usersAtRisk, error } = await supabase
        .from('user_progress')
        .select('user_id, streak_days')
        .gt('streak_days', 0)
        .not('user_id', 'in', 
          `(SELECT DISTINCT user_id FROM user_practices WHERE created_at::date = '${today}')`
        );

      if (error) {
        console.error('❌ Error fetching users at risk:', error);
        return;
      }

      if (!usersAtRisk || usersAtRisk.length === 0) {
        console.log('✅ No users at streak risk today');
        return;
      }

      console.log(`🔥 Found ${usersAtRisk.length} users with streak at risk`);

      // Enviar lembretes
      const results = await Promise.allSettled(
        usersAtRisk.map(user => 
          ReengagementNotificationService.sendStreakReminder(user.user_id, user.streak_days)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Sent ${successful}/${usersAtRisk.length} streak reminders`);

    } catch (error) {
      console.error('❌ Error in streak reminder scheduler:', error);
    }
  }

  /**
   * 💪 Enviar desafios semanais
   * Executar segundas-feiras às 9h
   */
  static async sendWeeklyChallenges(): Promise<void> {
    try {
      console.log('💪 [SCHEDULER] Sending weekly challenges...');
      
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      // Buscar usuários ativos na última semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: activeUsers, error } = await supabase
        .from('user_practices')
        .select('user_id')
        .gte('created_at', oneWeekAgo.toISOString());

      if (error) {
        console.error('❌ Error fetching active users:', error);
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        console.log('✅ No active users for weekly challenge');
        return;
      }

      const challengeTitle = this.getWeeklyChallenge();
      console.log(`💪 Sending challenge "${challengeTitle}" to ${activeUsers.length} users`);

      // Enviar desafios
      const results = await Promise.allSettled(
        activeUsers.map((user: any) => 
          ReengagementNotificationService.sendWeeklyChallenge(user.user_id, challengeTitle)
        )
      );

      const successful = results.filter((r: any) => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Sent ${successful}/${activeUsers.length} weekly challenges`);

    } catch (error) {
      console.error('❌ Error in weekly challenge scheduler:', error);
    }
  }

  /**
   * ⏰ Enviar lembretes de prática personalizados
   * Executar de acordo com horário preferido do usuário
   */
  static async sendPracticeReminders(): Promise<void> {
    try {
      console.log('⏰ [SCHEDULER] Checking practice reminders...');
      
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:00:00`;
      
      // Buscar usuários que devem receber lembrete neste horário
      // e que não praticaram nas últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: usersToRemind, error } = await supabase
        .from('users')
        .select('entra_id, preferred_reminder_time')
        .eq('preferred_reminder_time', currentTime)
        .not('entra_id', 'in',
          `(SELECT DISTINCT user_id FROM user_practices WHERE created_at >= '${yesterday.toISOString()}')`
        );

      if (error) {
        console.error('❌ Error fetching users for reminders:', error);
        return;
      }

      if (!usersToRemind || usersToRemind.length === 0) {
        console.log(`✅ No users need practice reminders at ${currentTime}`);
        return;
      }

      console.log(`⏰ Sending practice reminders to ${usersToRemind.length} users`);

      // Enviar lembretes
      const results = await Promise.allSettled(
        usersToRemind.map(user => 
          ReengagementNotificationService.sendPracticeReminder(user.entra_id, user.preferred_reminder_time)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Sent ${successful}/${usersToRemind.length} practice reminders`);

    } catch (error) {
      console.error('❌ Error in practice reminder scheduler:', error);
    }
  }

  /**
   * 🎯 Verificar metas e enviar lembretes
   * Executar diariamente às 19h
   */
  static async checkGoalReminders(): Promise<void> {
    try {
      console.log('🎯 [SCHEDULER] Checking goal reminders...');
      
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      // Buscar usuários com atividade na semana (simplificado)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyProgress, error } = await supabase
        .from('user_practices')
        .select('user_id, xp_awarded')
        .gte('created_at', startOfWeek.toISOString());

      if (error) {
        console.error('❌ Error fetching goal progress:', error);
        return;
      }

      if (!weeklyProgress || weeklyProgress.length === 0) {
        console.log('✅ No users with weekly activity');
        return;
      }

      // Agregar XP por usuário manualmente
      const userXPMap = new Map();
      weeklyProgress.forEach((practice: any) => {
        const userId = practice.user_id;
        const xp = practice.xp_awarded || 0;
        userXPMap.set(userId, (userXPMap.get(userId) || 0) + xp);
      });

      // Filtrar usuários próximos da meta (80-99% de 100 XP)
      const usersNearGoal = Array.from(userXPMap.entries())
        .filter(([_, totalXP]: [string, number]) => totalXP >= 80 && totalXP < 100)
        .map(([userId, totalXP]: [string, number]) => ({ user_id: userId, weekly_xp: totalXP }));

      if (usersNearGoal.length === 0) {
        console.log('✅ No users near weekly goal completion');
        return;
      }

      console.log(`🎯 Found ${usersNearGoal.length} users near goal completion`);

      // Enviar lembretes de meta
      const results = await Promise.allSettled(
        usersNearGoal.map((user: any) => {
          const progress = Math.round((user.weekly_xp / 100) * 100);
          return ReengagementNotificationService.sendGoalReminder(
            user.user_id, 
            'weekly XP', 
            progress
          );
        })
      );

      const successful = results.filter((r: any) => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Sent ${successful}/${usersNearGoal.length} goal reminders`);

    } catch (error) {
      console.error('❌ Error in goal reminder scheduler:', error);
    }
  }

  /**
   * 💪 Obter desafio semanal baseado na data
   */
  private static getWeeklyChallenge(): string {
    const challenges = [
      'Pronunciation Master',
      'Grammar Guru',
      'Conversation Champion', 
      'Vocabulary Builder',
      'Fluency Challenger',
      'Speaking Streak',
      'Writing Wizard',
      'Listening Legend'
    ];

    // Usar semana do ano para rotacionar desafios
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const weekOfYear = Math.floor(diff / (oneDay * 7));
    
    return challenges[weekOfYear % challenges.length];
  }

  /**
   * 🕐 Executar todos os schedulers apropriados para o horário atual
   */
  static async runScheduledTasks(): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log(`🕐 [SCHEDULER] Running tasks for ${hour}:00, day ${dayOfWeek}`);

    // Segunda-feira às 9h - Desafios semanais
    if (dayOfWeek === 1 && hour === 9) {
      await this.sendWeeklyChallenges();
    }

    // Diariamente às 19h - Verificar metas
    if (hour === 19) {
      await this.checkGoalReminders();
    }

    // Diariamente às 21h - Verificar streaks em risco
    if (hour === 21) {
      await this.checkStreakReminders();
    }

    // A cada hora - Verificar lembretes de prática
    await this.sendPracticeReminders();

    console.log('✅ [SCHEDULER] Scheduled tasks completed');
  }
}

// Exportar para uso em cron jobs ou API routes
export default NotificationScheduler; 