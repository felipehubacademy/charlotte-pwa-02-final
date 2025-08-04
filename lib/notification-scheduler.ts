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
      
      // ✅ CONVERTER UTC PARA BRASIL (UTC-3) - BUSCAR HORÁRIOS CONFIGURADOS
      const brazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000));
      const brazilHour = brazilTime.getHours();
      const brazilMinute = brazilTime.getMinutes();
      
      // ✅ BUSCAR USUÁRIOS COM HORÁRIOS PRÓXIMOS (janela de 60 minutos para compensar atraso GRANDE do Vercel)
      const timeWindow = 60; // minutos - Vercel pode atrasar até 20+ minutos!
      const currentTimeMinutes = brazilHour * 60 + brazilMinute;
      
      console.log(`🕐 Current UTC time: ${currentHour}:${currentMinute}`);
      console.log(`🇧🇷 Current Brazil time: ${brazilHour}:${brazilMinute}`);
      console.log(`🔍 Checking for users with Brazil time in window: ${currentTimeMinutes - timeWindow} - ${currentTimeMinutes + timeWindow} minutes`);

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
        
      }

      // ✅ DEBUG: Buscar notification_preferences separadamente
      const { data: allPrefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .limit(10);

      if (prefsError) {
        console.error('❌ Error fetching preferences:', prefsError);
      } else {
        
      }

      // ✅ LÓGICA PRODUÇÃO: Buscar apenas nos horários de 8h e 20h (com janela de tolerância)
      const times = [];
      
      // Determinar qual janela de horário estamos
      const isMorningWindow = brazilHour >= 7 && brazilHour <= 9;   // 7h-9h = janela manhã
      const isEveningWindow = brazilHour >= 19 && brazilHour <= 21; // 19h-21h = janela noite
      
      if (isMorningWindow) {
        // Buscar usuários que escolheram 8h
        times.push('08:00:00');
      } else if (isEveningWindow) {
        // Buscar usuários que escolheram 20h
        times.push('20:00:00');
      } else {
        // Fora das janelas de produção, não enviar nada
        console.log(`⏰ Outside production windows. Brazil time: ${brazilHour}:${brazilMinute}`);
        return;
      }
      
      console.log(`🔍 Looking for users with times: ${times.join(', ')}`);

      const { data: eligibleUsers, error } = await supabase
        .from('users')
        .select(`
          id,
          entra_id,
          name,
          preferred_reminder_time,
          reminder_frequency
        `)
        .neq('reminder_frequency', 'disabled') // Não enviar para quem desabilitou
        .in('preferred_reminder_time', times);

      if (error) {
        console.error('❌ Error fetching eligible users:', error);
        return;
      }



      if (!eligibleUsers || eligibleUsers.length === 0) {
        console.log('✅ No users eligible for reminders at this time');
        return;
      }

      console.log(`👥 Found ${eligibleUsers.length} potential users for reminders`);

      // ✅ VERIFICAR PREFERÊNCIAS DE NOTIFICAÇÃO + Filtrar por frequência
      const filteredUsers = [];

      for (const user of eligibleUsers) {
        console.log(`🔍 Processing user ${user.entra_id} (${user.name})`);
        
        // ✅ CRÍTICO: Verificar se o usuário tem practice_reminders ativado
        const { data: userPrefs, error: prefsError } = await supabase
          .from('notification_preferences')
          .select('practice_reminders')
          .eq('user_id', user.id)
          .single();

        if (prefsError || !userPrefs?.practice_reminders) {
          console.log(`⏭️ Skipping user ${user.entra_id} - no practice_reminders preference`);
          continue;
        }

        console.log(`✅ User ${user.entra_id} has practice_reminders enabled`);

        const { reminder_frequency } = user;

        // Aplicar filtros de frequência
        let shouldSend = false;

        // Agora sempre "normal" (1x/dia) - campo frequência removido do modal
        shouldSend = true; // Enviar todos os dias

        if (!shouldSend) {
          console.log(`⏭️ Skipping user ${user.entra_id} - frequency filter (${reminder_frequency})`);
          continue;
        }

        console.log(`✅ User ${user.entra_id} passed all filters - adding to send list`);
        filteredUsers.push(user);
      }

      if (filteredUsers.length === 0) {
        console.log('✅ No users need reminders after filtering');
        return;
      }

      console.log(`📤 Sending reminders to ${filteredUsers.length} users`);

      // ✅ PROTEÇÃO CONTRA DUPLICAÇÃO: Verificar se já enviou hoje
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: todayNotifications, error: todayError } = await supabase
        .from('notification_logs')
        .select('user_id, notification_type')
        .eq('notification_type', 'practice_reminder')
        .gte('created_at', `${todayDate}T00:00:00`)
        .lt('created_at', `${todayDate}T23:59:59`);

      if (todayError) {
        console.error('❌ Error checking today notifications:', todayError);
      }

      // Criar set de usuários que já receberam hoje
      const usersAlreadyNotified = new Set(
        todayNotifications?.map(n => n.user_id) || []
      );

      console.log(`📊 Found ${usersAlreadyNotified.size} users already notified today`);

      // Filtrar usuários que ainda não receberam hoje
      const usersToNotify = filteredUsers.filter(user => 
        !usersAlreadyNotified.has(user.entra_id)
      );

      if (usersToNotify.length === 0) {
        console.log('✅ All eligible users already received notifications today');
        return;
      }

      console.log(`📤 Sending reminders to ${usersToNotify.length} users (filtered from ${filteredUsers.length})`);

      // Enviar notificações
      const results = await Promise.allSettled(
        usersToNotify.map(async (user) => {
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
      console.log(`✅ Sent ${successful}/${usersToNotify.length} practice reminders`);

      // Removido: Segundo lembrete para usuários "frequent" (não existe mais)

    } catch (error) {
      console.error('❌ Error in practice reminder scheduler:', error);
    }
  }

  /**
   * 🔄 Removido: Segundo lembrete para usuários "frequent"
   * Agora apenas 1x por dia (8h OU 20h)
   */

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

    // ✅ PROTEÇÃO CONTRA EXECUÇÕES SIMULTÂNEAS
    const lockKey = `scheduler_lock_${now.toISOString().split('T')[0]}_${hour}`;
    
    try {
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('❌ Supabase not available');
        return;
      }

      // Tentar criar lock (verificar se já existe)
      const { data: existingLock, error: lockError } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('notification_type', 'scheduler_lock')
        .eq('user_id', lockKey)
        .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos
        .single();

      if (existingLock) {
        console.log(`⏭️ Scheduler already running (lock exists: ${lockKey})`);
        return;
      }

      // Criar lock
      await supabase
        .from('notification_logs')
        .insert({
          user_id: lockKey,
          notification_type: 'scheduler_lock',
          message_title: 'Scheduler execution lock',
          message_body: `Scheduler running at ${now.toISOString()}`,
          status: 'sent',
          metadata: { hour, dayOfWeek }
        });

      console.log(`🔒 Scheduler lock created: ${lockKey}`);

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

    } catch (error) {
      console.error('❌ Error in scheduler:', error);
    }
  }
}

// Exportar para uso em cron jobs ou API routes
export default NotificationScheduler; 