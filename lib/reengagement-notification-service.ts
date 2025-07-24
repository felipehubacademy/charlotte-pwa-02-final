// Serviço de Notificações de Reengajamento - Charlotte
// Push notifications para manter usuários engajados (não achievements)

import { getFirebaseAdminService } from './firebase-admin-service';
import { NotificationLogger, NotificationLogType } from './notification-logger';

export interface ReengagementNotification {
  type: 'streak_reminder' | 'weekly_challenge' | 'practice_reminder' | 'social_invite' | 'goal_reminder';
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

export class ReengagementNotificationService {
  
  /**
   * 🔥 Lembrete de streak em risco
   */
  static async sendStreakReminder(userId: string, streakDays: number): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    const isNovice = userLevel === 'Novice';
    
    const notification: ReengagementNotification = {
      type: 'streak_reminder',
      title: isNovice 
        ? `🔥 Seu streak de ${streakDays} dias está em risco!`
        : `🔥 Your ${streakDays}-day streak is at risk!`,
      body: isNovice
        ? `Não quebre a sequência! Pratique apenas 5 minutos para manter seu streak.`
        : `Don't break the chain! Practice for just 5 minutes to keep your streak alive.`,
      url: '/chat',
      data: {
        type: 'streak_reminder',
        streakDays: streakDays.toString(),
        urgency: 'high',
        userLevel
      }
    };

    const success = await this.sendNotification(userId, notification);
    
    // Log the notification attempt
    await NotificationLogger.logNotificationSent({
      user_id: userId,
      notification_type: 'streak_reminder',
      status: success ? 'sent' : 'failed',
      message_title: notification.title,
      message_body: notification.body,
      metadata: {
        streakDays,
        userLevel,
        urgency: 'high'
      }
    });
    
    return success;
  }

  /**
   * 💪 Desafio semanal
   */
  static async sendWeeklyChallenge(userId: string, challengeTitle: string): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    const isNovice = userLevel === 'Novice';
    
    const notification: ReengagementNotification = {
      type: 'weekly_challenge',
      title: isNovice 
        ? `💪 Novo desafio: ${challengeTitle}`
        : `💪 New Challenge: ${challengeTitle}`,
      body: isNovice
        ? `Esta semana, desafie-se a melhorar ainda mais! Vamos lá?`
        : `This week, challenge yourself to improve even more! Are you in?`,
      url: '/chat',
      data: {
        type: 'weekly_challenge',
        challengeTitle,
        userLevel
      }
    };

    const success = await this.sendNotification(userId, notification);
    
    // Log the notification attempt
    await NotificationLogger.logNotificationSent({
      user_id: userId,
      notification_type: 'weekly_challenge',
      status: success ? 'sent' : 'failed',
      message_title: notification.title,
      message_body: notification.body,
      metadata: {
        challengeTitle,
        userLevel
      }
    });
    
    return success;
  }

  /**
   * ⏰ Lembrete de prática personalizado
   */
  static async sendPracticeReminder(userId: string, userName: string): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    const isNovice = userLevel === 'Novice';
    
    const notification: ReengagementNotification = {
      type: 'practice_reminder',
      title: isNovice 
        ? `⏰ Olá ${userName}! Hora de praticar!`
        : `⏰ Hi ${userName}! Time to practice!`,
      body: isNovice
        ? `Que tal uma sessão rápida de inglês? Charlotte está esperando por você! 🎯`
        : `How about a quick English session? Charlotte is waiting for you! 🎯`,
      url: '/chat',
      data: {
        type: 'practice_reminder',
        userName,
        userLevel
      }
    };

    const success = await this.sendNotification(userId, notification);
    
    // Log the notification attempt
    await NotificationLogger.logNotificationSent({
      user_id: userId,
      notification_type: 'practice_reminder',
      status: success ? 'sent' : 'failed',
      message_title: notification.title,
      message_body: notification.body,
      metadata: {
        userName,
        userLevel
      }
    });
    
    return success;
  }

  /**
   * 👥 Convite social / competição
   */
  static async sendSocialInvite(userId: string, inviterName: string, activityType: string): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    const isNovice = userLevel === 'Novice';
    
    const notification: ReengagementNotification = {
      type: 'social_invite',
      title: isNovice
        ? `👥 ${inviterName} convidou você para competir!`
        : `👥 ${inviterName} invited you to compete!`,
      body: isNovice
        ? `Junte-se ao ${inviterName} no desafio de ${activityType}. Mostre o que você sabe!`
        : `Join ${inviterName} in a ${activityType} challenge. Show them what you've got!`,
      url: '/social',
      data: {
        type: 'social_invite',
        inviter: inviterName,
        activity: activityType,
        userLevel
      }
    };

    return this.sendNotification(userId, notification);
  }

  /**
   * 🎯 Lembrete de meta personalizada
   */
  static async sendGoalReminder(userId: string, goalType: string, progress: number): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    const isNovice = userLevel === 'Novice';
    
    const notification: ReengagementNotification = {
      type: 'goal_reminder',
      title: isNovice
        ? `🎯 Você está ${progress}% mais perto da sua meta de ${goalType}!`
        : `🎯 You're ${progress}% closer to your ${goalType} goal!`,
      body: isNovice
        ? `Apenas mais algumas práticas e você alcançará seu objetivo. Não desista agora!`
        : `Just a few more practices and you'll reach your target. Don't give up now!`,
      url: '/goals',
      data: {
        type: 'goal_reminder',
        goalType,
        progress: progress.toString(),
        userLevel
      }
    };

    return this.sendNotification(userId, notification);
  }

  /**
   * 📱 Enviar notificação via Firebase Admin
   */
  private static async sendNotification(userId: string, notification: ReengagementNotification): Promise<boolean> {
    try {
      console.log(`🔔 [REENGAGEMENT] Sending ${notification.type} to user:`, userId);
      
      const adminService = getFirebaseAdminService();
      const success = await adminService.sendToUser(userId, {
        title: notification.title,
        body: notification.body,
        url: notification.url || '/chat',
        data: {
          ...notification.data,
          click_action: 'reengagement',
          timestamp: Date.now().toString()
        }
      });

      if (success) {
        console.log(`✅ [REENGAGEMENT] ${notification.type} sent successfully`);
      } else {
        console.log(`❌ [REENGAGEMENT] Failed to send ${notification.type}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [REENGAGEMENT] Error sending ${notification.type}:`, error);
      return false;
    }
  }

  /**
   * 🕐 Obter mensagem baseada no horário (localizada por nível)
   */
  private static getTimeBasedMessage(userLevel: string): { title: string; body: string } {
    const hour = new Date().getHours();
    const isNovice = userLevel === 'Novice';
    
    if (hour >= 6 && hour < 12) {
      return {
        title: isNovice ? 'Bom dia! Pronto para praticar?' : 'Good morning! Ready to practice?',
        body: isNovice 
          ? 'Comece o dia com uma prática rápida de inglês. Seu cérebro está mais receptivo agora!'
          : 'Start your day with a quick English practice session. Your brain is most receptive now!'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        title: isNovice ? 'Pausa para praticar?' : 'Afternoon practice break?',
        body: isNovice
          ? 'Faça uma pausa no trabalho e melhore seu inglês. Apenas 5 minutos fazem diferença!'
          : 'Take a break from work and boost your English skills. Just 5 minutes can make a difference!'
      };
    } else if (hour >= 18 && hour < 22) {
      return {
        title: isNovice ? 'Sessão de prática noturna' : 'Evening practice session',
        body: isNovice
          ? 'Relaxe com uma prática de inglês. Perfeita para finalizar seu dia de estudos!'
          : 'Wind down with some English practice. Perfect way to end your learning day!'
      };
    } else {
      return {
        title: isNovice ? 'Hora de praticar inglês' : 'Time to practice English',
        body: isNovice
          ? 'Uma prática rápida vai acelerar seu progresso. Volte para a Charlotte!'
          : 'A quick practice session will boost your progress. Come back to Charlotte!'
      };
    }
  }

  /**
   * 🕐 Obter período do dia atual
   */
  private static getCurrentTimeSlot(): string {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 👤 Buscar nível do usuário do banco de dados
   */
  private static async getUserLevel(userId: string): Promise<string> {
    try {
      const { getSupabase } = await import('./supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('⚠️ Supabase not available, defaulting to Inter');
        return 'Inter';
      }

      const { data, error } = await supabase
        .from('users')
        .select('user_level')
        .eq('entra_id', userId)
        .single();

      if (error || !data) {
        console.log('⚠️ User not found, defaulting to Inter');
        return 'Inter';
      }

      return data.user_level || 'Inter';
    } catch (error) {
      console.error('❌ Error fetching user level:', error);
      return 'Inter';
    }
  }
}

// Exportar tipos para uso em outros arquivos
export type ReengagementType = ReengagementNotification['type']; 