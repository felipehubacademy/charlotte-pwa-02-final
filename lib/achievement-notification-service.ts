// 🏆 ACHIEVEMENT NOTIFICATION SERVICE
// Gerencia notificações de achievements entre backend e frontend

import { Achievement } from './types/achievement';

interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  xpBonus: number;
  timestamp: Date;
}

class AchievementNotificationService {
  private static instance: AchievementNotificationService;
  private listeners: ((achievements: AchievementNotification[]) => void)[] = [];
  private recentAchievements: AchievementNotification[] = [];

  static getInstance(): AchievementNotificationService {
    if (!AchievementNotificationService.instance) {
      AchievementNotificationService.instance = new AchievementNotificationService();
    }
    return AchievementNotificationService.instance;
  }

  // Adicionar listener para notificações
  addListener(callback: (achievements: AchievementNotification[]) => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback: (achievements: AchievementNotification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar achievements conquistados
  notifyAchievements(achievements: AchievementToAward[]) {
    const notifications: AchievementNotification[] = achievements.map(achievement => ({
      id: achievement.code,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.badge_icon,
      rarity: achievement.rarity,
      xpBonus: achievement.xp_reward,
      timestamp: new Date()
    }));

    this.recentAchievements = [...this.recentAchievements, ...notifications];

    // Notificar todos os listeners
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error in achievement notification listener:', error);
      }
    });

    console.log('🏆 Achievement notifications sent:', notifications.length);
  }

  // Buscar achievements recentes
  getRecentAchievements(): AchievementNotification[] {
    return this.recentAchievements;
  }

  // Limpar achievements antigos
  clearOldAchievements() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.recentAchievements = this.recentAchievements.filter(
      achievement => achievement.timestamp > oneHourAgo
    );
  }
}

export const achievementNotificationService = AchievementNotificationService.getInstance();

// Interface para achievements do backend
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