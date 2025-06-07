import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, achievements } = await request.json();

    if (!userId || !achievements || !Array.isArray(achievements)) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or achievements' },
        { status: 400 }
      );
    }

    console.log('🏆 API: Saving achievements for user:', userId);
    console.log('🏆 API: Achievements count:', achievements.length);
    console.log('🔍 API: Environment check:', {
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      isServerSide: typeof window === 'undefined'
    });

    const result = await supabaseService.saveAchievements(userId, achievements);

    if (result === false) {
      return NextResponse.json(
        { success: false, error: 'Failed to save achievements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ API Error saving achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 