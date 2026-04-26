import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log('🏆 Fetching recent achievements for user:', userId);

    // Buscar achievements não lidos do usuário (últimas 24h)
    const recentAchievements = await supabaseService.getUnreadAchievements(userId);

    if (!recentAchievements) {
      return NextResponse.json({
        success: true,
        achievements: []
      });
    }

    // Mapear para o formato esperado pelo frontend
    const mappedAchievements = recentAchievements.map((achievement: any) => ({
      id: achievement.achievement_code || achievement.id,
      name: achievement.achievement_name || 'Achievement',
      description: achievement.achievement_description || 'Achievement earned!',
      icon: achievement.badge_icon || '🏆',
      rarity: achievement.rarity || 'common',
      xpBonus: achievement.xp_bonus || 0,
      earnedAt: new Date(achievement.earned_at)
    }));

    console.log('🏆 Found recent achievements:', mappedAchievements.length);

    return NextResponse.json({
      success: true,
      achievements: mappedAchievements
    });

  } catch (error) {
    console.error('❌ Error fetching recent achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 