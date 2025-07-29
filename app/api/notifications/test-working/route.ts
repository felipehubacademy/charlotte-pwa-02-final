import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import webpush from 'web-push';

// CONFIGURAÇÃO QUE FUNCIONA 100% - MESMA DO test-ios
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com', // Email do projeto Firebase
  'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA', // Sua Firebase VAPID Public Key
  'cTlw_6Ex7Ldo3Ra5YJDiLzOnZ0HE29NmpIZhMb1uNdU' // Sua Firebase VAPID Private Key
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, test_type = 'basic' }: { 
      user_id: string; 
      test_type?: 'basic' | 'achievement' | 'reminder' 
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`🍎 Starting iOS notification test for user: ${user_id}`);

    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    // Buscar subscriptions ativas do iOS
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', 'ios')
      .eq('subscription_type', 'web_push')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'No iOS subscriptions found',
        message: 'User needs to install PWA and enable notifications'
      }, { status: 404 });
    }

    console.log(`📱 Found iOS subscriptions: ${subscriptions.length}`);

    // Payload ultra-simples para Apple (só texto)
    const payloads: Record<string, { title: string; body: string }> = {
      basic: {
        title: '🧪 iOS Test',
        body: 'Notificação funcionando no iPhone!'
      },
      achievement: {
        title: '🎉 Conquista iOS!',
        body: 'Push notifications funcionando!'
      },
      reminder: {
        title: '⏰ Lembrete iOS',
        body: 'Hora de praticar inglês!'
      }
    };

    const payload = JSON.stringify(payloads[test_type as keyof typeof payloads] || payloads.basic);

    // Testar cada subscription
    const results = [];
    
    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Sending to iOS with Apple-compatible payload...`);
        console.log(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`);

        // Configurações mínimas para Apple
        const options: webpush.RequestOptions = {
          TTL: 3600 // 1 hora (reduzido)
        };

        const webPushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        };

        // Timeout Promise para evitar 504
        const sendPromise = webpush.sendNotification(webPushSubscription, payload, options);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Push timeout after 8 seconds')), 8000)
        );

        await Promise.race([sendPromise, timeoutPromise]);

        console.log(`✅ iOS Web Push sent successfully!`);
        
        results.push({
          subscription_id: subscription.id,
          type: 'apple_web_push',
          success: true,
          message: '🍎 iOS Web Push sent successfully!'
        });

      } catch (pushError: any) {
        if (pushError.message === 'Push timeout after 8 seconds') {
          console.log(`⏰ iOS Push timeout for ${subscription.id}`);
          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: false,
            message: 'Apple Push Service timeout',
            error_code: 'timeout'
          });
        } else {
          console.error(`❌ iOS Web Push error:`, pushError);
          
          // Verificar se é subscription expirada (410)
          if (pushError.statusCode === 410) {
            console.log(`🗑️ Subscription expired, marking as inactive: ${subscription.id}`);
            
            // Marcar como inativa no banco
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }

          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: false,
            message: `Apple Web Push failed: ${pushError.message}`,
            error_code: pushError.statusCode || 'unknown'
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      message: 'iOS notification test completed',
      results,
      summary: {
        total_attempts: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });

  } catch (error) {
    console.error('❌ Test working error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Working iOS push test endpoint - Apple Web Push',
    status: 'operational',
    service: 'Apple Push Service via web-push',
    vapid_configured: true,
    features: [
      'iOS 16.4+ compatible',
      'VAPID authentication',
      'Production ready',
      'Timeout protection'
    ],
    timestamp: new Date().toISOString()
  });
}