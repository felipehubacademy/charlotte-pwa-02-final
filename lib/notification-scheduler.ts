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
   * 🎯 Enviar lembretes de prática respeitando preferências do usuário
   * Executar via cron job diário
   */
  static async sendPracticeReminders(): Promise<void> {
    try {
      console.log('🎯 [SCHEDULER] Sending practice reminders with user preferences...');
      
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const today = currentTime.toISOString().split('T')[0];
      
      // ✅ CONVERTER UTC PARA BRASIL (UTC-3)
      const brazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000));
      const brazilHour = brazilTime.getHours();
      const brazilTimeString = `${brazilHour.toString().padStart(2, '0')}:00:00`;
      
      console.log(`🕐 Current UTC time: ${currentHour}:${currentMinute}`);
      console.log(`🇧🇷 Current Brazil time: ${brazilHour}:00`);
      console.log(`🔍 Checking for users with Brazil time: ${brazilTimeString}`);

      // ✅ DEBUG: Primeiro buscar TODOS os usuários para ver o que temos
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select(`
          id,
          entra_id,
          name,
          preferred_reminder_time,
          reminder_frequency
        `)
        .limit(10);

      if (allUsersError) {
        console.error('❌ Error fetching all users:', allUsersError);
      } else {
        console.log('🔍 DEBUG: All users sample:', allUsers?.slice(0, 3));
        console.log('🔍 DEBUG: Users with 13:00 time:', allUsers?.filter(u => u.preferred_reminder_time === '13:00:00'));
      }

      // ✅ DEBUG: Buscar notification_preferences separadamente
      const { data: allPrefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .limit(10);

      if (prefsError) {
        console.error('❌ Error fetching preferences:', prefsError);
      } else {
        console.log('🔍 DEBUG: All preferences sample:', allPrefs?.slice(0, 3));
        console.log('🔍 DEBUG: Users with practice_reminders=true:', allPrefs?.filter(p => p.practice_reminders));
      }

      const { data: eligibleUsers, error } = await supabase
        .from('users')
        .select(`
          id,
          entra_id,
          name,
          preferred_reminder_time,
          reminder_frequency,
          notification_preferences (
            practice_reminders
          )
        `)
        .eq('notification_preferences.practice_reminders', true) // Apenas quem quer receber
        .neq('reminder_frequency', 'disabled') // Não enviar para quem desabilitou
        .eq('preferred_reminder_time', brazilTimeString); // Horário Brasil da hora atual

      if (error) {
        console.error('❌ Error fetching eligible users:', error);
        return;
      }

      console.log(`🔍 DEBUG: Eligible users found:`, eligibleUsers);

      if (!eligibleUsers || eligibleUsers.length === 0) {
        console.log('✅ No users eligible for reminders at this time');
        return;
      }

      console.log(`👥 Found ${eligibleUsers.length} potential users for reminders`);

      // Filtrar por frequência e verificar se já praticaram hoje
      const filteredUsers = [];

      for (const user of eligibleUsers) {
        const { reminder_frequency } = user;

        // Aplicar filtros de frequência
        let shouldSend = false;

        switch (reminder_frequency) {
          case 'normal':
            shouldSend = true; // Enviar todos os dias
            break;
          case 'frequent':
            shouldSend = true; // Enviar todos os dias (será 2x)
            break;
          default:
            shouldSend = false;
        }

        if (!shouldSend) {
          console.log(`⏭️ Skipping user ${user.entra_id} - frequency filter`);
          continue;
        }

        // Verificar se já praticou hoje
        const { data: todayPractice, error: practiceError } = await supabase
          .from('user_practices')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00Z`)
          .lte('created_at', `${today}T23:59:59Z`)
          .limit(1);

        if (practiceError) {
          console.error(`❌ Error checking practice for user ${user.entra_id}:`, practiceError);
          continue;
        }

        if (todayPractice && todayPractice.length > 0) {
          console.log(`✅ User ${user.entra_id} already practiced today - skipping`);
          continue;
        }

        // Verificar se já recebeu notificação na última hora para evitar spam
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        const { data: recentNotification, error: notificationError } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('notification_type', 'practice_reminder')
          .gte('created_at', oneHourAgo.toISOString())
          .limit(1);

        if (notificationError) {
          console.error(`❌ Error checking recent notifications for user ${user.entra_id}:`, notificationError);
          continue;
        }

        if (recentNotification && recentNotification.length > 0) {
          console.log(`⏭️ User ${user.entra_id} already received reminder in last hour - skipping`);
          continue;
        }

        filteredUsers.push(user);
      }

      if (filteredUsers.length === 0) {
        console.log('✅ No users need reminders after filtering');
        return;
      }

      console.log(`📤 Sending reminders to ${filteredUsers.length} users`);

      // Enviar notificações
      const results = await Promise.allSettled(
        filteredUsers.map(async (user) => {
          try {
            await ReengagementNotificationService.sendPracticeReminder(
              user.entra_id,
              user.name?.split(' ')[0] || 'Estudante'
            );
            console.log(`✅ Reminder sent to ${user.entra_id}`);
            return true;
          } catch (error) {
            console.error(`❌ Failed to send reminder to ${user.entra_id}:`, error);
            return false;
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Sent ${successful}/${filteredUsers.length} practice reminders`);

      // Para usuários com frequência "frequent", agendar segundo lembrete
      await this.scheduleSecondReminder(filteredUsers.filter(u => u.reminder_frequency === 'frequent'));

    } catch (error) {
      console.error('❌ Error in practice reminder scheduler:', error);
    }
  }

  /**
   * 🔄 Agendar segundo lembrete para usuários "frequent"
   */
  static async scheduleSecondReminder(frequentUsers: any[]): Promise<void> {
    if (frequentUsers.length === 0) return;

    console.log(`🔄 Scheduling second reminders for ${frequentUsers.length} frequent users`);

    // Implementar lógica para segundo lembrete (ex: 6 horas depois)
    // Por enquanto, apenas log
    frequentUsers.forEach(user => {
      console.log(`⏰ Second reminder scheduled for ${user.entra_id} at evening`);
    });
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