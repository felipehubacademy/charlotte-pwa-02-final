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

    // Teste para Web Push (iOS) com PAYLOAD APPLE-COMPATIBLE
    for (const subscription of subscriptions) {
      try {
        const webPushResult = await sendIOSWebPushAppleCompatible(subscription, test_type);
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

async function sendIOSWebPushAppleCompatible(subscription: any, testType: string) {
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

  // PAYLOAD SIMPLIFICADO PARA APPLE - só o essencial
  let payload;
  
  switch (testType) {
    case 'achievement':
      payload = JSON.stringify({
        title: '🎉 iOS Success!',
        body: 'Apple aceita este formato!',
        icon: '/icons/icon-192x192.png'
      });
      break;
    default:
      payload = JSON.stringify({
        title: '🚀 iOS Push Works!',
        body: 'Payload Apple-compatible!',
        icon: '/icons/icon-192x192.png'
      });
  }

  // OPTIONS ESPECÍFICAS PARA iOS
  const options = {
    TTL: 60, // 1 minuto
    headers: {
      'Urgency': 'normal'
    }
  };

  try {
    console.log('📤 Sending to iOS with Apple-compatible payload...');
    console.log('Endpoint:', subscription.endpoint.substring(0, 50) + '...');
    
    // TIMEOUT FIX: Promise race com timeout de 8 segundos
    const pushPromise = webpush.sendNotification(pushSubscription, payload, options);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Push timeout after 8 seconds')), 8000);
    });

    await Promise.race([pushPromise, timeoutPromise]);
    
    console.log('✅ iOS push sent successfully with Apple-compatible format!');
    return {
      success: true,
      message: '🍎 iOS Web Push sent with Apple-compatible payload!'
    };
    
  } catch (error) {
    console.error('❌ iOS Web Push error:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        message: 'iOS Web Push timeout - Apple Push Service not responding'
      };
    }
    
    // Log do erro específico para debug
    const errorDetails = error instanceof Error ? error.message : 'Unknown error';
    console.log('🔍 Apple rejection details:', errorDetails);
    
    return {
      success: false,
      message: `iOS Web Push failed: ${errorDetails}`
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test endpoint with Apple-compatible payload',
    status: 'operational',
    timeout: '8 seconds max',
    payload_format: 'Apple-optimized',
    timestamp: new Date().toISOString()
  });
}
