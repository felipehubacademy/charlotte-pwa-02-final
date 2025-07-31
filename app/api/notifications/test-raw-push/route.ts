import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configure VAPID
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com',
  'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA',
  'cTlw_6Ex7Ldo3Ra5YJDiLzOnZ0HE29NmpIZhMb1uNdU'
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 [RAW-PUSH] Testing raw web push...');
    
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found', details: error }, { status: 404 });
    }
    
    console.log(`🔥 Found ${subscriptions.length} subscriptions`);
    
    const results = [];
    
    for (const sub of subscriptions) {
      try {
        console.log(`🔥 Sending to ${sub.platform}: ${sub.endpoint.substring(0, 50)}...`);
        
        const payload = JSON.stringify({
          title: '🔥 RAW PUSH TEST',
          body: `Testing ${sub.platform} directly via webpush library!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: {
            url: '/chat',
            test: true,
            timestamp: Date.now()
          }
        });
        
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };
        
        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 24 * 60 * 60,
          urgency: 'normal'
        });
        
        results.push({
          platform: sub.platform,
          success: true,
          message: 'Raw push sent successfully!'
        });
        
        console.log(`✅ Raw push sent to ${sub.platform}`);
        
      } catch (error) {
        console.error(`❌ Failed to send to ${sub.platform}:`, error);
        results.push({
          platform: sub.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: results.some(r => r.success),
      total_subscriptions: subscriptions.length,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [RAW-PUSH] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}