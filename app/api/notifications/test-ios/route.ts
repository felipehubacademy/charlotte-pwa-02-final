import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, test_type = 'basic' } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID required' },
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

    // Buscar subscriptions do usuário (Web Push e FCM)
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found' },
        { status: 404 }
      );
    }

    const results = [];
    const iosSubscriptions = subscriptions.filter(sub => sub.platform === 'ios');
    const fcmSubscriptions = subscriptions.filter(sub => sub.subscription_type === 'fcm');

    // Teste para Web Push (iOS)
    for (const subscription of iosSubscriptions) {
      try {
        const webPushResult = await sendIOSWebPushTest(subscription, test_type);
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

    // Log do teste
    await supabase
      .from('notification_logs')
      .insert({
        user_id,
        type: 'test_ios',
        platform: 'ios',
        success: results.some(r => r.success),
        metadata: {
          test_type,
          results,
          timestamp: new Date().toISOString()
        }
      });

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendIOSWebPushTest(subscription: any, testType: string) {
  const webpush = require('web-push');
  
  // Configurar VAPID keys - EMAIL CORRETO
  webpush.setVapidDetails(
    'mailto:felipe.xavier1987@gmail.com',  // ← CORRIGIDO: email real
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
        title: '🎉 Conquista Desbloqueada!',
        body: 'Você completou sua primeira lição no iOS!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/chat?achievement=first-ios-notification',
        data: {
          type: 'achievement',
          platform: 'ios',
          test: true
        }
      });
      break;
      
    case 'reminder':
      payload = JSON.stringify({
        title: '⏰ Hora de Praticar!',
        body: 'Que tal uma conversa rápida com Charlotte?',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/chat',
        data: {
          type: 'reminder',
          platform: 'ios',
          test: true
        }
      });
      break;
      
    default:
      payload = JSON.stringify({
        title: '🧪 Teste iOS',
        body: 'Push notifications funcionando no iPhone!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        url: '/chat',
        data: {
          type: 'test',
          platform: 'ios',
          test: true
        }
      });
  }

  try {
    await webpush.sendNotification(pushSubscription, payload);
    return {
      success: true,
      message: 'iOS Web Push notification sent successfully'
    };
  } catch (error) {
    console.error('❌ iOS Web Push error:', error);
    return {
      success: false,
      message: `iOS Web Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// GET method para testar endpoint
export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test endpoint',
    usage: 'POST with { user_id: string, test_type?: "basic" | "achievement" | "reminder" }',
    requirements: [
      'iOS 16.4+',
      'PWA installed via "Add to Home Screen"',
      'Active push subscriptions in database'
    ]
  });
}
