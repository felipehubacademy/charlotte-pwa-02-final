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

    // Buscar subscriptions iOS
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

    // Teste para Web Push (iOS) com TIMEOUT FIX
    for (const subscription of subscriptions) {
      try {
        const webPushResult = await sendIOSWebPushWithTimeout(subscription, test_type);
        results.push({
          type: 'web_push',
          platform: 'ios',
          success: webPushResult.success,
          message: webPushResult.message
        });
      } catch (error) {
        results.push({
          type: 'web_push',
          platform: 'ios',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'iOS notification test completed',
      results,
      summary: {
        total_attempts: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('❌ iOS test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendIOSWebPushWithTimeout(subscription: any, testType: string) {
  const webpush = require('web-push');
  
  // Configurar VAPID keys
  webpush.setVapidDetails(
    'mailto:felipe.xavier1987@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys
  };

  let payload;
  
  switch (testType) {
    case 'achievement':
      payload = JSON.stringify({
        title: '🎉 Conquista iOS!',
        body: 'Push notification finalmente funcionando!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/chat'
      });
      break;
    default:
      payload = JSON.stringify({
        title: '🚀 Teste iOS Funciona!',
        body: 'Timeout fix aplicado com sucesso!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/chat'
      });
  }

  try {
    console.log('📤 Sending to iOS with timeout protection...');
    
    // TIMEOUT FIX: Promise race com timeout de 8 segundos
    const pushPromise = webpush.sendNotification(pushSubscription, payload);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Push timeout after 8 seconds')), 8000);
    });

    await Promise.race([pushPromise, timeoutPromise]);
    
    console.log('✅ iOS push sent successfully!');
    return {
      success: true,
      message: 'iOS Web Push notification sent successfully'
    };
    
  } catch (error) {
    console.error('❌ iOS Web Push error:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        message: 'iOS Web Push timeout - Apple Push Service not responding'
      };
    }
    
    return {
      success: false,
      message: `iOS Web Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test endpoint with timeout fix',
    status: 'operational',
    timeout: '8 seconds max',
    timestamp: new Date().toISOString()
  });
}
