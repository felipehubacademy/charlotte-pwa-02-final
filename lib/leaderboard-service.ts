// lib/leaderboard-service.ts - Serviço de leaderboard otimizado

import { supabaseService } from './supabase-service';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalXP: number;
  levelNumber: number;
  currentStreak: number;
  position: number;
  avatarColor: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastUpdated: Date;
}

class LeaderboardService {
  private cache = new Map<string, { data: LeaderboardData; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // 🎯 CONECTADO COM SUPABASE - Dados reais (PRODUÇÃO)
  async getLeaderboard(userLevel: string, limit: number = 50): Promise<LeaderboardData> {
    const cacheKey = `${userLevel}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📊 Using cached leaderboard data');
      return cached.data;
    }

    try {
      console.log('🔄 Loading REAL leaderboard data from Supabase...');
      
      if (!supabaseService.isAvailable()) {
        console.error('❌ Supabase not available - CRITICAL for production!');
        throw new Error('Supabase connection required for production leaderboard');
      }

      // Buscar usuários reais do Supabase
      const leaderboardResult = await supabaseService.getLeaderboard(userLevel, limit);
      
      if (!leaderboardResult || !leaderboardResult.entries) {
        console.error('❌ No leaderboard data returned - check if migration was executed');
        throw new Error('Leaderboard table missing - run migration in Supabase Dashboard');
      }

      // Se não há usuários ainda, retornar estrutura vazia mas válida
      if (leaderboardResult.entries.length === 0) {
        console.log('📝 No users found yet - returning empty leaderboard');
        return {
          entries: [],
          totalUsers: 0,
          lastUpdated: new Date()
        };
      }

      const entries: LeaderboardEntry[] = leaderboardResult.entries.map((user: any, index: number) => ({
        userId: user.user_id || user.entra_id,
        displayName: this.formatDisplayName(user.display_name || user.email || 'Anonymous'),
        totalXP: user.total_xp || 0,
        levelNumber: Math.floor(Math.sqrt((user.total_xp || 0) / 50)) + 1,
        currentStreak: user.streak_days || 0,
        position: user.position || (index + 1),
        avatarColor: this.generateAvatarColor(user.display_name || user.email || 'Anonymous')
      }));

      const leaderboardData: LeaderboardData = {
        entries,
        totalUsers: leaderboardResult.totalUsers,
        lastUpdated: leaderboardResult.lastUpdated
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: leaderboardData,
        timestamp: Date.now()
      });

      console.log('✅ REAL leaderboard data loaded successfully:', {
        userLevel,
        totalUsers: entries.length,
        topUser: entries[0]?.displayName || 'No users yet'
      });

      return leaderboardData;

    } catch (error) {
      console.error('❌ CRITICAL: Failed to load real leaderboard data:', error);
      
      // Para produção, não usar fallback - mostrar erro
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      
      // Apenas em desenvolvimento, usar fallback
      console.log('🔄 Development mode: Using fallback data');
      return this.getFallbackLeaderboard(userLevel, limit);
    }
  }

  // 🎯 CONECTADO COM SUPABASE - Posição real do usuário (PRODUÇÃO)
  async getUserPosition(userId: string, userLevel: string): Promise<LeaderboardEntry | null> {
    try {
      if (!supabaseService.isAvailable()) {
        console.error('❌ Supabase not available - CRITICAL for production user position!');
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Supabase connection required for production user position');
        }
        return null;
      }

      console.log('🔄 Getting REAL user position from Supabase...');
      
      const userPosition = await supabaseService.getUserPosition(userId, userLevel);
      
      if (!userPosition) {
        console.log('📝 User position not found - user may not be in leaderboard yet');
        return null;
      }

      const entry: LeaderboardEntry = {
        userId: userPosition.user_id || userPosition.entra_id,
        displayName: this.formatDisplayName(userPosition.display_name || userPosition.email || 'You'),
        totalXP: userPosition.total_xp || 0,
        levelNumber: Math.floor(Math.sqrt((userPosition.total_xp || 0) / 50)) + 1,
        currentStreak: userPosition.streak_days || 0,
        position: userPosition.position || 0,
        avatarColor: this.generateAvatarColor(userPosition.display_name || userPosition.email || 'You')
      };

      console.log('✅ REAL user position loaded successfully:', {
        userId,
        position: entry.position,
        totalXP: entry.totalXP
      });

      return entry;

    } catch (error) {
      console.error('❌ CRITICAL: Failed to get real user position:', error);
      
      // Para produção, não retornar null silenciosamente
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      
      return null;
    }
  }

  // 🔄 Fallback para quando Supabase não está disponível
  private getFallbackLeaderboard(userLevel: string, limit: number): LeaderboardData {
    console.log('📊 Using fallback leaderboard data');
    
    const mockUsers = [
      { name: 'Alex Johnson', xp: 2450, streak: 15 },
      { name: 'Maria Silva', xp: 2380, streak: 12 },
      { name: 'John Smith', xp: 2290, streak: 8 },
      { name: 'Ana Costa', xp: 2150, streak: 20 },
      { name: 'Mike Brown', xp: 2050, streak: 5 },
      { name: 'Sofia Garcia', xp: 1980, streak: 18 },
      { name: 'David Wilson', xp: 1920, streak: 7 },
      { name: 'Emma Davis', xp: 1850, streak: 14 },
      { name: 'Carlos Rodriguez', xp: 1780, streak: 9 },
      { name: 'Lisa Anderson', xp: 1720, streak: 11 }
    ];

    const entries: LeaderboardEntry[] = mockUsers.slice(0, limit).map((user, index) => ({
      userId: `mock-${index}`,
      displayName: this.formatDisplayName(user.name),
      totalXP: user.xp,
      levelNumber: Math.floor(Math.sqrt(user.xp / 50)) + 1,
      currentStreak: user.streak,
      position: index + 1,
      avatarColor: this.generateAvatarColor(user.name)
    }));

    return {
      entries,
      totalUsers: mockUsers.length,
      lastUpdated: new Date()
    };
  }

  // 🎨 Gerar cor determinística baseada no nome
  private generateAvatarColor(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // 🔒 Formatar nome para privacidade (Primeiro nome + inicial do sobrenome)
  private formatDisplayName(fullName: string): string {
    if (!fullName || fullName.trim() === '') return 'Anonymous';
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    
    return `${firstName} ${lastInitial}.`;
  }

  // 🗑️ Limpar cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Leaderboard cache cleared');
  }
}

export const leaderboardService = new LeaderboardService(); 