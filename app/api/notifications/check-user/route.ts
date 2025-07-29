import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log(`🔍 Checking user: ${user_id}`);

    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verificar se usuário existe na tabela users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('entra_id', user_id)
      .single();

    if (userError) {
      console.error('❌ Error checking user:', userError);
      return NextResponse.json({ 
        success: false,
        message: 'User not found in users table',
        user_id: user_id,
        error: userError.message
      });
    }

    // Verificar subscriptions do usuário
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('❌ Error checking subscriptions:', subError);
    }

    console.log(`✅ User found: ${user_id}`);
    console.log(`📱 Subscriptions found: ${subscriptions?.length || 0}`);

    return NextResponse.json({
      success: true,
      message: 'User found in database',
      user: {
        entra_id: user.entra_id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      subscriptions: {
        total: subscriptions?.length || 0,
        ios: subscriptions?.filter(s => s.platform === 'ios' && s.is_active).length || 0,
        android: subscriptions?.filter(s => s.platform === 'android' && s.is_active).length || 0,
        desktop: subscriptions?.filter(s => s.platform === 'desktop' && s.is_active).length || 0,
        fcm: subscriptions?.filter(s => s.subscription_type === 'fcm' && s.is_active).length || 0,
        web_push: subscriptions?.filter(s => s.subscription_type === 'web_push' && s.is_active).length || 0
      },
      subscription_details: subscriptions?.map(sub => ({
        id: sub.id,
        platform: sub.platform,
        subscription_type: sub.subscription_type,
        is_active: sub.is_active,
        created_at: sub.created_at,
        endpoint_preview: sub.endpoint?.substring(0, 50) + '...'
      })) || []
    });

  } catch (error: any) {
    console.error('❌ Check user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'User verification endpoint',
    status: 'operational',
    usage: 'POST with {"user_id": "user-uuid"} to check user existence and subscriptions'
  });
} 