import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import admin from 'firebase-admin';
import webpush from 'web-push';

// Inicializar Firebase Admin se ainda não foi inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.log('Firebase Admin initialization skipped:', error);
  }
}

// Configurar web-push para Apple
webpush.setVapidDetails(
  'mailto:felipe.xavier1987@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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
      .eq('is_active', true);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No iOS subscriptions found' }, { status: 404 });
    }

    console.log('📱 Found iOS subscriptions:', subscriptions.length);

    const results = [];

    // Processar cada subscription
    for (const subscription of subscriptions) {
      try {
        let result;
        
        // Determinar o tipo baseado no endpoint ou fcm_token
        if (subscription.fcm_token) {
          // Usar Firebase se tiver FCM token
          console.log('🔥 Using Firebase for subscription:', subscription.id);
          result = await sendFirebasePush(subscription, test_type);
        } else if (subscription.endpoint?.includes('push.apple.com')) {
          // Usar Apple Web Push para endpoints Apple
          console.log('🍎 Using Apple Web Push for subscription:', subscription.id);
          result = await sendAppleWebPush(subscription, test_type);
        } else {
          // Tentar extrair FCM token do endpoint
          const extractedToken = extractFCMTokenFromEndpoint(subscription.endpoint);
          if (extractedToken) {
            console.log('🔍 Extracted FCM token, using Firebase');
            subscription.fcm_token = extractedToken;
            result = await sendFirebasePush(subscription, test_type);
          } else {
            console.log('⚠️ Unknown endpoint type, trying web-push');
            result = await sendAppleWebPush(subscription, test_type);
          }
        }
        
        results.push({
          subscription_id: subscription.id,
          type: result.method,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        results.push({
          subscription_id: subscription.id,
          type: 'unknown',
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

// Enviar via Apple Web Push (web-push library)
async function sendAppleWebPush(subscription: any, testType: string) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys
  };

  // Payload para Apple
  let payload;
  switch (testType) {
    case 'achievement':
      payload = JSON.stringify({
        title: '🎉 Achievement Unlocked!',
        body: 'You reached a new milestone!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: '/achievements' }
      });
      break;
    default:
      payload = JSON.stringify({
        title: '🍎 Apple Push Works!',
        body: 'Notification via Apple Web Push',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: '/chat' }
      });
  }

  const options = {
    TTL: 60,
    headers: {
      'Urgency': 'normal'
    }
  };

  try {
    console.log('📤 Sending via Apple Web Push...');
    
    // Timeout de 8 segundos
    const pushPromise = webpush.sendNotification(pushSubscription, payload, options);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Push timeout after 8 seconds')), 8000);
    });

    await Promise.race([pushPromise, timeoutPromise]);
    
    console.log('✅ Apple Web Push sent successfully!');
    return {
      success: true,
      message: '🍎 Apple Web Push delivered!',
      method: 'apple_web_push'
    };
    
  } catch (error) {
    console.error('❌ Apple Web Push error:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Apple Push Service timeout',
        method: 'apple_web_push'
      };
    }
    
    return {
      success: false,
      message: `Apple Web Push failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      method: 'apple_web_push'
    };
  }
}

// Enviar via Firebase Admin
async function sendFirebasePush(subscription: any, testType: string) {
  const fcmToken = subscription.fcm_token;
  
  if (!fcmToken) {
    return {
      success: false,
      message: 'No FCM token available',
      method: 'firebase'
    };
  }

  let title: string;
  let body: string;
  
  switch (testType) {
    case 'achievement':
      title = '🎉 Achievement Unlocked!';
      body = 'You reached a new milestone!';
      break;
    default:
      title = '🔥 Firebase Push Works!';
      body = 'Notification via Firebase Admin';
  }

  const message = {
    token: fcmToken,
    notification: { title, body },
    webpush: {
      fcmOptions: {
        link: 'https://charlotte-ai.com',
      },
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      },
    },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    console.log('📤 Sending via Firebase Admin...');
    const response = await admin.messaging().send(message);
    
    console.log('✅ Firebase push sent successfully!');
    return {
      success: true,
      message: `🔥 Firebase Push delivered! ID: ${response}`,
      method: 'firebase'
    };
    
  } catch (error) {
    console.error('❌ Firebase Push error:', error);
    return {
      success: false,
      message: `Firebase Push failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      method: 'firebase'
    };
  }
}

// Helper para extrair FCM token
function extractFCMTokenFromEndpoint(endpoint: string): string | null {
  if (!endpoint) return null;
  
  // Padrões conhecidos de FCM
  const patterns = [
    /\/send\/([^\/\?]+)/,
    /\/registrations\/([^\/\?]+)/,
    /\/wpush\/v2\/([^\/\?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = endpoint.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export async function GET() {
  return NextResponse.json({
    message: 'iOS notification test - Dual support (Apple + Firebase)',
    status: 'operational',
    services: ['Apple Web Push', 'Firebase Cloud Messaging'],
    features: [
      'Auto-detection of push service type',
      'Apple Web Push for push.apple.com endpoints',
      'Firebase for FCM tokens',
      'Fallback support'
    ],
    timestamp: new Date().toISOString()
  });
}
