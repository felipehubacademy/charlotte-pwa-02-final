import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Buscar todas as subscriptions iOS ativas
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('platform', 'ios')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No iOS subscriptions found',
        count: 0
      });
    }

    // Agrupar por usuário
    const usersMap = new Map();
    
    subscriptions.forEach(sub => {
      if (!usersMap.has(sub.user_id)) {
        usersMap.set(sub.user_id, {
          user_id: sub.user_id,
          subscriptions: [],
          total_subscriptions: 0,
          latest_created: sub.created_at
        });
      }
      
      const user = usersMap.get(sub.user_id);
      user.subscriptions.push({
        id: sub.id,
        endpoint: sub.endpoint?.substring(0, 50) + '...',
        platform: sub.platform,
        subscription_type: sub.subscription_type,
        created_at: sub.created_at,
        is_active: sub.is_active
      });
      user.total_subscriptions = user.subscriptions.length;
      
      if (new Date(sub.created_at) > new Date(user.latest_created)) {
        user.latest_created = sub.created_at;
      }
    });

    const users = Array.from(usersMap.values());

    console.log(`📱 Found ${users.length} users with iOS subscriptions`);

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users with iOS subscriptions`,
      total_users: users.length,
      total_subscriptions: subscriptions.length,
      users: users
    });

  } catch (error: any) {
    console.error('❌ List iOS users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Buscar subscriptions específicas do usuário
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', 'ios')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No iOS subscriptions found for this user',
        user_id: user_id,
        count: 0
      });
    }

    console.log(`📱 Found ${subscriptions.length} iOS subscriptions for user ${user_id}`);

    return NextResponse.json({
      success: true,
      message: `Found ${subscriptions.length} iOS subscriptions for user`,
      user_id: user_id,
      count: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint?.substring(0, 50) + '...',
        platform: sub.platform,
        subscription_type: sub.subscription_type,
        created_at: sub.created_at,
        is_active: sub.is_active
      }))
    });

  } catch (error: any) {
    console.error('❌ Get user iOS subscriptions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
} 