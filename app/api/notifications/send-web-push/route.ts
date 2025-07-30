import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configurar VAPID keys para iOS Web Push
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com',
  'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA',
  'cTlw_6Ex7Ldo3Ra5YJDiLzOnZ0HE29NmpIZhMb1uNdU'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, payload } = body;

    if (!subscription?.endpoint || !payload?.title || !payload?.body) {
      return NextResponse.json(
        { error: 'Missing required fields (subscription, payload)' },
        { status: 400 }
      );
    }

    console.log('🌐 [WEB PUSH] Sending to iOS:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title: payload.title,
      platform: 'ios'
    });

    // Preparar payload para iOS
    const pushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: payload.url || '/chat',
        ...payload.data
      },
      actions: [
        {
          action: 'open',
          title: 'Open Charlotte'
        }
      ],
      requireInteraction: true,
      tag: 'charlotte-notification',
      renotify: true
    };

    // Enviar via Web Push
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      JSON.stringify(pushPayload)
    );

    console.log('✅ [WEB PUSH] iOS notification sent successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Web Push notification sent',
      statusCode: result.statusCode
    });

  } catch (error: any) {
    console.error('❌ [WEB PUSH] Error sending iOS notification:', error);
    
    // Log específico para erros de subscription
    if (error.statusCode === 410) {
      console.log('📭 [WEB PUSH] Subscription expired or invalid');
    } else if (error.statusCode === 429) {
      console.log('⏰ [WEB PUSH] Rate limited by Apple Push Service');
    }

    return NextResponse.json(
      { 
        error: 'Failed to send Web Push notification',
        details: error.message,
        statusCode: error.statusCode
      },
      { status: 500 }
    );
  }
} 