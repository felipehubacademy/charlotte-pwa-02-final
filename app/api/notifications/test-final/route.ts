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
    const body = await request.json();
    const { user_id, message = "🎯 TESTE FINAL COMPLETO!" } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
    // Get user info
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('name, entra_id')
      .eq('entra_id', user_id)
      .limit(1);
      
    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Get subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }
    
    console.log(`🎯 [FINAL-TEST] Testing ${subscriptions.length} devices for ${user.name}`);
    
    const results = [];
    
    for (const sub of subscriptions) {
      try {
        console.log(`🎯 Testing ${sub.platform}: ${sub.endpoint.substring(0, 50)}...`);
        
        // Create detailed payload with Service Worker instructions
        const payload = JSON.stringify({
          title: `🎯 ${message}`,
          body: `${user.name} - Teste ${sub.platform} às ${new Date().toLocaleTimeString('pt-BR')}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: true,
          data: {
            url: '/chat',
            platform: sub.platform,
            user: user.name,
            timestamp: Date.now(),
            test_type: 'final_complete',
            // Force Service Worker to show custom notification
            forceCustom: true,
            customTitle: `🎯 ${message}`,
            customBody: `${user.name} - Teste ${sub.platform} às ${new Date().toLocaleTimeString('pt-BR')}`
          },
          actions: [
            {
              action: 'open',
              title: 'Abrir Charlotte'
            }
          ]
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
          urgency: 'high',
          headers: {
            'Urgency': 'high'
          }
        });
        
        results.push({
          platform: sub.platform,
          success: true,
          message: `Final test sent to ${sub.platform}!`,
          payload_preview: {
            title: `🎯 ${message}`,
            body: `${user.name} - Teste ${sub.platform}`,
            platform: sub.platform
          }
        });
        
        console.log(`✅ Final test sent to ${sub.platform}`);
        
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
      user: user.name,
      total_subscriptions: subscriptions.length,
      results,
      timestamp: new Date().toISOString(),
      message: `Final test completed for ${user.name}`
    });
    
  } catch (error) {
    console.error('❌ [FINAL-TEST] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}