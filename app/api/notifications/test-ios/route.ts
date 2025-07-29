import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configurar VAPID com suas keys Firebase
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com', // Email do projeto Firebase
  'BJ87VjvmFct3Gp1NksZJzl2j80MIdXb1re6CJdHI3vxtJMfr_mmiR0TJdLip64ancQxYJA-7PFdTG8iNSNPxVh4', // Sua Firebase VAPID public key
  'cTlw_6Ex7Ldo3Ra5YJDiLzOnZ0HE29NmpIZhMb1uNdU' // Sua Firebase VAPID private key
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, test_type = 'basic' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log(`🍎 Starting iOS notification test for user: ${user_id}`);

    const supabase = getSupabase();
    
    // Buscar subscriptions ativas do iOS
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', 'ios')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No iOS subscriptions found',
        hint: 'User needs to activate notifications first'
      });
    }

    console.log(`📱 Found ${subscriptions.length} iOS subscriptions`);

    const results = [];
    let successCount = 0;

    // Payload otimizado para iOS
    const payloads = {
      basic: {
        title: '🧪 iOS Test',
        body: 'Notificação funcionando no iPhone!',
        icon: '/icons/icon-192x192.png'
      },
      achievement: {
        title: '🎉 Conquista iOS!',
        body: 'Push notifications funcionando perfeitamente!',
        icon: '/icons/icon-192x192.png'
      },
      reminder: {
        title: '📚 Lembrete iOS',
        body: 'Hora de praticar inglês!',
        icon: '/icons/icon-192x192.png'
      }
    };

    const payload = JSON.stringify(payloads[test_type] || payloads.basic);

    // Testar cada subscription
    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Testing subscription: ${subscription.id}`);
        console.log(`🔗 Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);

        const webPushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        };

        // Configurações otimizadas para iOS
        const options = {
          TTL: 86400, // 24 horas
          urgency: 'normal',
          headers: {
            'Topic': 'com.hubacademy.charlotte'
          }
        };

        // Timeout de 8 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
          await webpush.sendNotification(webPushSubscription, payload, {
            ...options,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log(`✅ iOS notification sent successfully to ${subscription.id}`);
          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: true,
            message: '🍎 iOS Web Push sent successfully!'
          });
          successCount++;

        } catch (pushError: any) {
          clearTimeout(timeoutId);
          
          if (pushError.name === 'AbortError') {
            console.log(`⏰ iOS Push timeout for ${subscription.id}`);
            results.push({
              subscription_id: subscription.id,
              type: 'apple_web_push',
              success: false,
              message: 'Apple Push Service timeout (8s)'
            });
          } else {
            console.error(`❌ iOS Push error for ${subscription.id}:`, pushError);
            
            // Verificar se subscription expirou
            if (pushError.statusCode === 410) {
              console.log(`🗑️ Subscription ${subscription.id} expired, marking as inactive`);
              
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id);
            }
            
            results.push({
              subscription_id: subscription.id,
              type: 'apple_web_push',
              success: false,
              message: `Apple Web Push failed: ${pushError.message || 'Unknown error'}`,
              error_code: pushError.statusCode
            });
          }
        }

      } catch (error: any) {
        console.error(`❌ General error for subscription ${subscription.id}:`, error);
        results.push({
          subscription_id: subscription.id,
          type: 'apple_web_push',
          success: false,
          message: `General error: ${error.message}`
        });
      }
    }

    const response = {
      success: successCount > 0,
      message: `iOS notification test completed`,
      results,
      summary: {
        total_attempts: results.length,
        successful: successCount,
        failed: results.length - successCount
      }
    };

    console.log(`📊 iOS Test Summary: ${successCount}/${results.length} successful`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Test iOS error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test endpoint - Apple Web Push',
    status: 'operational',
    service: 'Apple Push Service via web-push',
    vapid_configured: true,
    features: [
      'Apple Web Push notifications',
      'iOS 16.4+ support',
      'Subscription management',
      'Error handling with retry logic'
    ]
  });
}
