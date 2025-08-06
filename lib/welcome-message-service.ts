/**
 * 🎯 WELCOME MESSAGE SERVICE
 * Orquestra mensagens de welcome dinâmicas baseadas em contexto
 */

interface WelcomeContext {
  userName: string;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  totalXP: number;
  streakDays: number;
  lastTopic?: string;
  lastPracticeTime?: Date | null;
  todayPractices: number;
  isFirstTime: boolean;
}

interface WelcomeMessage {
  content: string;
  type: 'greeting' | 'motivational' | 'action' | 'contextual';
  priority: number;
}

export class WelcomeMessageService {
  
  /**
   * Gerar mensagem de welcome baseada no contexto
   */
  static generateWelcomeMessage(context: WelcomeContext): string {
    
    // 1. PRIMEIRA VEZ - Sempre a mesma
    if (context.isFirstTime) {
      return this.getFirstTimeMessage(context);
    }
    
    // 2. RETORNO - Sistema de decisão inteligente
    return this.getReturnMessage(context);
  }
  
  /**
   * Mensagem para primeira vez
   */
  private static getFirstTimeMessage(context: WelcomeContext): string {
    const { userName, userLevel } = context;
    
    if (userLevel === 'Novice') {
      return `Hi ${userName}! I'm Charlotte, your English assistant. You can write in Portuguese or English!`;
    }
    
    return `Hi ${userName}! I'm Charlotte, ready to help you practice English. How can I assist you today?`;
  }
  
  /**
   * Sistema de decisão para mensagens de retorno
   */
  private static getReturnMessage(context: WelcomeContext): string {
    const { userName, totalXP, streakDays, lastTopic, todayPractices, lastPracticeTime } = context;
    
    // 🎯 ALGORITMO DE DECISÃO:
    const decisions = [
      // 1. STREAK ALTO - Prioridade máxima
      {
        condition: streakDays >= 7,
        message: `🔥 Amazing ${userName}! You're on a ${streakDays}-day streak! Let's keep this fire burning!`,
        priority: 10
      },
      
      // 2. PRIMEIRA PRÁTICA DO DIA
      {
        condition: todayPractices === 0,
        message: `Good morning ${userName}! Ready to start your English practice today?`,
        priority: 9
      },
      
      // 3. PROGRESSO SIGNIFICATIVO
      {
        condition: totalXP >= 100,
        message: `🎉 Wow ${userName}! You've earned ${totalXP} XP! Your English is getting stronger!`,
        priority: 8
      },
      
      // 4. CONTINUAR TÓPICO ANTERIOR
      {
        condition: lastTopic && lastTopic.length > 0,
        message: `Welcome back! We were discussing "${lastTopic}". Want to continue or try something new?`,
        priority: 7
      },
      
      // 5. MENSAGENS MOTIVACIONAIS (aleatórias)
      {
        condition: true,
        message: this.getRandomMotivationalMessage(userName),
        priority: 5
      }
    ];
    
    // 🎯 SELECIONAR MELHOR MENSAGEM
    const validDecisions = decisions.filter(d => d.condition);
    const bestDecision = validDecisions.reduce((best, current) => 
      current.priority > best.priority ? current : best
    );
    
    return bestDecision.message;
  }
  
  /**
   * Mensagens motivacionais aleatórias
   */
  private static getRandomMotivationalMessage(userName: string): string {
    const messages = [
      `Welcome back ${userName}! Ready for more English practice?`,
      `Great to see you again! What shall we work on today?`,
      `Your English journey continues! What's on your mind?`,
      `Time for some English magic! Choose your practice: 💬 Write | 🎤 Speak | 📚 Learn`,
      `Ready to level up your English? Let's practice!`,
      `Your English is getting better every day! What shall we work on?`,
      `Welcome back! Pick your challenge: 💬 Chat | 🎯 Grammar | 🗣️ Pronunciation`,
      `Let's make today's English practice amazing! What would you like to focus on?`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Analisar contexto do usuário
   */
  static async analyzeContext(userId: string, userData: any): Promise<WelcomeContext> {
    // Buscar dados do usuário
    const userStats = await this.getUserStats(userId);
    const lastTopic = await this.getLastTopic(userId);
    const todayPractices = await this.getTodayPractices(userId);
    const lastPracticeTime = await this.getLastPracticeTime(userId);
    
    return {
      userName: userData.name?.split(' ')[0] || 'there',
      userLevel: userData.user_level || 'Inter',
      totalXP: userStats?.total_xp || 0,
      streakDays: userStats?.streak_days || 0,
      lastTopic,
      lastPracticeTime,
      todayPractices,
      isFirstTime: !lastPracticeTime || lastPracticeTime === null // Se nunca praticou, é primeira vez
    };
  }
  
  // Métodos auxiliares para buscar dados
  private static async getUserStats(userId: string) {
    try {
      const { supabaseService } = await import('./supabase-service');
      return await supabaseService.getUserStats(userId);
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return null;
    }
  }
  
  private static async getLastTopic(userId: string) {
    try {
      const { supabaseService } = await import('./supabase-service');
      const practices = await supabaseService.getUserPracticeHistory(userId, 5);
      
      // Extrair tópico da última prática com contexto
      const lastPractice = practices?.[0];
      if (lastPractice?.transcription) {
        // Simplificar: usar primeiras palavras como tópico
        const words = lastPractice.transcription.split(' ').slice(0, 3).join(' ');
        return words.length > 0 ? words : null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting last topic:', error);
      return null;
    }
  }
  
  private static async getTodayPractices(userId: string) {
    try {
      const { supabaseService } = await import('./supabase-service');
      const practices = await supabaseService.getUserPracticeHistory(userId, 50);
      
      const today = new Date().toISOString().split('T')[0];
      return practices?.filter(p => 
        p.created_at?.startsWith(today)
      ).length || 0;
    } catch (error) {
      console.error('❌ Error getting today practices:', error);
      return 0;
    }
  }
  
  private static async getLastPracticeTime(userId: string): Promise<Date | null> {
    try {
      const { supabaseService } = await import('./supabase-service');
      const practices = await supabaseService.getUserPracticeHistory(userId, 1);
      
      const lastPractice = practices?.[0];
      return lastPractice?.created_at ? new Date(lastPractice.created_at) : null;
    } catch (error) {
      console.error('❌ Error getting last practice time:', error);
      return null;
    }
  }
} 