import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Verificar se há FCM token ativo para o usuário
    const { data: fcmTokens, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .eq('subscription_type', 'fcm');

    if (error) {
      console.error('❌ Error checking FCM tokens:', error);
      return NextResponse.json(
        { error: 'Failed to check FCM tokens' },
        { status: 500 }
      );
    }

    const hasFCMToken = fcmTokens && fcmTokens.length > 0;

    console.log(`🔍 FCM token check for user ${user_id}: ${hasFCMToken ? 'Found' : 'Not found'}`);

    return NextResponse.json({
      success: true,
      hasFCMToken,
      tokenCount: fcmTokens?.length || 0
    });

  } catch (error) {
    console.error('❌ FCM token check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 