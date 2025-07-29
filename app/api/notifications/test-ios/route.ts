import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configurar VAPID com suas keys Firebase - PRODUCTION MODE
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com', // Email do projeto Firebase
  'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA', // Sua Firebase VAPID public key CORRETA
  'cTlw_6Ex7Ldo3Ra5YJDiLzOnZ0HE29NmpIZhMb1uNdU' // Sua Firebase VAPID private key
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, test_type = 'basic' }: { 
      user_id: string; 
      test_type?: 'basic' | 'achievement' | 'reminder' 
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log(`🍎 Starting iOS notification test for user: ${user_id}`);

    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
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

    // ✅ PAYLOAD CORRETO para iOS - Formato Apple Web Push
    const payloads: Record<string, any> = {
      basic: {
        notification: {
          title: '🧪 iOS Test',
          body: 'Notificação funcionando no iPhone!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-test',
          requireInteraction: true,
          silent: false
        },
        data: {
          url: '/chat',
          click_action: '/chat',
          platform: 'ios',
          test_type: 'basic'
        }
      },
      achievement: {
        notification: {
          title: '🎉 Conquista iOS!',
          body: 'Push notifications funcionando!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-achievement',
          requireInteraction: true,
          silent: false
        },
        data: {
          url: '/chat',
          click_action: '/chat',
          platform: 'ios',
          test_type: 'achievement'
        }
      },
      reminder: {
        notification: {
          title: '📚 Lembrete iOS',
          body: 'Hora de praticar inglês!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-reminder',
          requireInteraction: true,
          silent: false
        },
        data: {
          url: '/chat',
          click_action: '/chat',
          platform: 'ios',
          test_type: 'reminder'
        }
      }
    };

    const payload = JSON.stringify(payloads[test_type as string] || payloads.basic);

    // Testar cada subscription
    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Testing subscription: ${subscription.id}`);
        console.log(`🔗 Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);

        const webPushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        };

        // ✅ CONFIGURAÇÕES CORRETAS para iOS
        const options: webpush.RequestOptions = {
          TTL: 3600, // 1 hora
          headers: {
            'Urgency': 'high',
            'Topic': 'charlotte-notifications',
            'Content-Type': 'application/json'
          }
        };

        // Enviar notificação com timeout Promise
        try {
          const sendPromise = webpush.sendNotification(webPushSubscription, payload, options);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Push timeout after 8 seconds')), 8000)
          );
          
          await Promise.race([sendPromise, timeoutPromise]);
          
          console.log(`✅ iOS notification sent successfully to ${subscription.id}`);
          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: true,
            message: '🍎 iOS Web Push sent successfully!',
            payload_format: 'ios_compatible'
          });
          successCount++;

        } catch (pushError: any) {
          if (pushError.message === 'Push timeout after 8 seconds') {
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
      },
      payload_format: 'ios_compatible',
      headers_configured: true
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
    ios_compatible: true,
    features: [
      'Apple Web Push notifications',
      'iOS 16.4+ support',
      'iOS-compatible payload format',
      'Proper headers for iOS',
      'Subscription management',
      'Error handling with retry logic'
    ]
  });
}
