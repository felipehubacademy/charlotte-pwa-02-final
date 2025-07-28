import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, test_type = 'basic' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Buscar subscription iOS
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', 'ios')
      .eq('subscription_type', 'web_push')
      .eq('is_active', true);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No iOS subscriptions found' }, { status: 404 });
    }

    console.log('📱 Found iOS subscriptions:', subscriptions.length);

    const results = [];

    // Usar fetch direto para Apple Push Service (sem web-push library)
    for (const subscription of subscriptions) {
      try {
        const pushResult = await sendDirectApplePush(subscription, test_type);
        results.push({
          type: 'direct_apple_push',
          platform: 'ios',
          success: pushResult.success,
          message: pushResult.message
        });
      } catch (error) {
        results.push({
          type: 'direct_apple_push',
          platform: 'ios',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'iOS push test completed',
      results,
      summary: {
        total_attempts: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('❌ Working push test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendDirectApplePush(subscription: any, testType: string) {
  try {
    // Construir payload
    let payload;
    switch (testType) {
      case 'achievement':
        payload = {
          title: '🎉 Conquista iOS!',
          body: 'Push notification funcionando no iPhone!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: '/chat'
        };
        break;
      default:
        payload = {
          title: '🚀 Teste iOS Direct',
          body: 'Apple Push Service direto funcionando!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: '/chat'
        };
    }

    console.log('📤 Sending to Apple endpoint:', subscription.endpoint.substring(0, 50) + '...');

    // Usar fetch direto para Apple Push Service
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400'
      },
      body: JSON.stringify(payload)
    });

    console.log('📨 Apple response status:', response.status);

    if (response.ok) {
      return {
        success: true,
        message: 'Direct Apple Push sent successfully'
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Apple Push failed: ${response.status} - ${errorText}`
      };
    }

  } catch (error) {
    console.error('❌ Direct Apple Push error:', error);
    return {
      success: false,
      message: `Direct push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Working iOS push test endpoint',
    status: 'operational',
    method: 'Direct Apple Push Service (no web-push library)',
    timestamp: new Date().toISOString()
  });
}
