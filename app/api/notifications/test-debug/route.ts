import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getFirebaseAdminService } from '@/lib/firebase-admin-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [TEST-DEBUG] Starting comprehensive debug test');
    
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
    
    const results = {
      user_id,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // TEST 1: Database Connection
    console.log('🔍 [DEBUG] Testing Supabase connection...');
    const supabase = getSupabase();
    if (!supabase) {
      results.tests.database = { success: false, error: 'Supabase not available' };
      return NextResponse.json(results);
    }
    results.tests.database = { success: true };
    
    // TEST 2: User Lookup
    console.log('🔍 [DEBUG] Looking up user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, entra_id')
      .eq('entra_id', user_id)
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      results.tests.user_lookup = { success: false, error: userError?.message || 'User not found' };
      return NextResponse.json(results);
    }
    results.tests.user_lookup = { success: true, user: users[0] };
    
    // TEST 3: Push Subscriptions
    console.log('🔍 [DEBUG] Checking push subscriptions...');
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    results.tests.subscriptions = { 
      success: !subError,
      error: subError?.message,
      count: subscriptions?.length || 0,
      subscriptions: subscriptions || []
    };
    
    // TEST 4: Firebase Admin
    console.log('🔍 [DEBUG] Testing Firebase Admin...');
    try {
      const adminService = getFirebaseAdminService();
      results.tests.firebase_admin = { success: true };
    } catch (error) {
      results.tests.firebase_admin = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // TEST 5: FCM Token Search
    console.log('🔍 [DEBUG] Searching FCM tokens...');
    const { data: fcmTokens, error: fcmError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .neq('endpoint', '')
      .not('endpoint', 'is', null);
    
    results.tests.fcm_tokens = {
      success: !fcmError,
      error: fcmError?.message,
      count: fcmTokens?.length || 0,
      tokens: fcmTokens || []
    };
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('❌ [TEST-DEBUG] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}