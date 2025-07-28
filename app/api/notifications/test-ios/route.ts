import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import admin from 'firebase-admin';

// Inicializar Firebase Admin se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

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

    // Teste para Firebase Push (iOS)
    for (const subscription of subscriptions) {
      try {
        const firebasePushResult = await sendIOSFirebasePush(subscription, test_type);
        results.push({
          type: 'firebase_push',
          platform: 'ios',
          success: firebasePushResult.success,
          message: firebasePushResult.message
        });
      } catch (error) {
        results.push({
          type: 'firebase_push',
          platform: 'ios',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'iOS notification test completed via Firebase',
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

async function sendIOSFirebasePush(subscription: any, testType: string) {
  // Extrair o token FCM do endpoint ou usar o token armazenado
  // O endpoint do Firebase geralmente contém o token FCM
  const fcmToken = subscription.fcm_token || extractFCMTokenFromEndpoint(subscription.endpoint);
  
  if (!fcmToken) {
    return {
      success: false,
      message: 'No FCM token found for this subscription'
    };
  }

  // Construir mensagem baseada no tipo de teste
  let title: string;
  let body: string;
  
  switch (testType) {
    case 'achievement':
      title = '🎉 Achievement Unlocked!';
      body = 'You\'ve reached a new milestone in Charlotte AI!';
      break;
    case 'reminder':
      title = '⏰ Daily Reminder';
      body = 'Time to check your AI insights!';
      break;
    default:
      title = '🚀 Charlotte AI';
      body = 'Firebase notification working perfectly on iOS!';
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    webpush: {
      fcmOptions: {
        link: 'https://charlotte-ai.com',
      },
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
      },
    },
    // Configuração específica para iOS/Safari
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: 'default',
          badge: 1,
          'mutable-content': 1,
        },
      },
      fcmOptions: {
        link: 'https://charlotte-ai.com',
      },
    },
  };

  try {
    console.log('📤 Sending iOS notification via Firebase Admin...');
    console.log('FCM Token:', fcmToken.substring(0, 20) + '...');
    
    const response = await admin.messaging().send(message);
    
    console.log('✅ iOS Firebase push sent successfully!');
    console.log('Message ID:', response);
    
    return {
      success: true,
      message: `🍎 iOS Firebase Push sent! Message ID: ${response}`
    };
    
  } catch (error) {
    console.error('❌ iOS Firebase Push error:', error);
    
    // Tratamento de erros específicos do Firebase
    let errorMessage = 'iOS Firebase Push failed';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid-registration-token')) {
        errorMessage = 'Invalid or expired FCM token';
      } else if (error.message.includes('not-registered')) {
        errorMessage = 'Device no longer registered';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Firebase authentication error';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}

// Helper function para extrair FCM token do endpoint
function extractFCMTokenFromEndpoint(endpoint: string): string | null {
  // Firebase endpoints geralmente têm o formato:
  // https://fcm.googleapis.com/fcm/send/[FCM_TOKEN]
  const match = endpoint.match(/\/send\/(.+)$/);
  return match ? match[1] : null;
}

export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test endpoint - Firebase Admin version',
    status: 'operational',
    service: 'Firebase Cloud Messaging',
    features: [
      'Native iOS/Safari support via APNS',
      'Firebase Admin SDK authentication',
      'Automatic token management',
      'Rich notification support'
    ],
    timestamp: new Date().toISOString()
  });
}
