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
    const { 
      user_id, 
      title = '🎉 Charlotte Personalizada!',
      body = 'Esta é uma notificação personalizada com emoji e formatação!',
      emoji = '🚀',
      custom_data = {}
    }: { 
      user_id: string; 
      title?: string;
      body?: string;
      emoji?: string;
      custom_data?: any;
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log(`🎨 Starting custom notification test for user: ${user_id}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📄 Body: ${body}`);
    console.log(`😊 Emoji: ${emoji}`);

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

    // ✅ PAYLOAD PERSONALIZADO para iOS - Formato Apple Web Push
    const customPayload = {
      notification: {
        title: `${emoji} ${title}`,
        body: body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'charlotte-custom',
        requireInteraction: true,
        silent: false,
        timestamp: Date.now()
      },
      data: {
        url: '/chat',
        click_action: '/chat',
        platform: 'ios',
        test_type: 'custom',
        custom_emoji: emoji,
        custom_timestamp: Date.now(),
        ...custom_data
      }
    };

    const payload = JSON.stringify(customPayload);

    // Testar cada subscription
    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Testing custom notification for subscription: ${subscription.id}`);
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
            'Topic': 'charlotte-custom-notifications',
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
          
          console.log(`✅ Custom iOS notification sent successfully to ${subscription.id}`);
          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: true,
            message: '🎨 Custom iOS Web Push sent successfully!',
            payload_format: 'ios_compatible',
            custom_title: customPayload.notification.title,
            custom_body: customPayload.notification.body,
            custom_emoji: emoji
          });
          successCount++;
        } catch (pushError) {
          console.error(`❌ Push error for ${subscription.id}:`, pushError);
          results.push({
            subscription_id: subscription.id,
            type: 'apple_web_push',
            success: false,
            message: `Push failed: ${pushError instanceof Error ? pushError.message : 'Unknown error'}`,
            error: pushError instanceof Error ? pushError.message : 'Unknown error'
          });
        }
      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscription_id: subscription.id,
          type: 'apple_web_push',
          success: false,
          message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`📊 Custom notification test completed: ${successCount}/${subscriptions.length} successful`);

    return NextResponse.json({
      success: true,
      message: 'Custom iOS notification test completed',
      results,
      summary: {
        total_attempts: subscriptions.length,
        successful: successCount,
        failed: subscriptions.length - successCount
      },
      payload_format: 'ios_compatible',
      headers_configured: true,
      custom_payload: {
        title: customPayload.notification.title,
        body: customPayload.notification.body,
        emoji: emoji,
        timestamp: customPayload.notification.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Custom notification test error:', error);
    return NextResponse.json({ 
      error: 'Custom notification test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Custom notification test endpoint',
    usage: {
      method: 'POST',
      body: {
        user_id: 'string (required)',
        title: 'string (optional) - default: "🎉 Charlotte Personalizada!"',
        body: 'string (optional) - default: "Esta é uma notificação personalizada com emoji e formatação!"',
        emoji: 'string (optional) - default: "🚀"',
        custom_data: 'object (optional) - additional data to include'
      }
    },
    example: {
      user_id: 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
      title: '🎯 Nova Conquista!',
      body: 'Parabéns! Você completou 10 exercícios hoje!',
      emoji: '🏆',
      custom_data: {
        achievement_id: 'daily_streak',
        points: 100
      }
    }
  });
} 