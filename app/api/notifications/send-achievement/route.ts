import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminService } from '@/lib/firebase-admin-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🏆 [ACHIEVEMENT NOTIFICATION API] Processing achievement notification...');

    const { userId, notification } = await request.json();

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'Missing userId or notification data' },
        { status: 400 }
      );
    }

    console.log('🔔 Sending achievement notification to user:', userId);
    console.log('🏆 Notification payload:', notification);

    // Enviar notificação via FCM
    const adminService = getFirebaseAdminService();
    const success = await adminService.sendToUser(userId, {
      title: notification.title,
      body: notification.body,
      data: {
        ...notification.data,
        click_action: 'achievement_earned',
        url: '/chat' // Redirecionar para o chat ao clicar
      }
    });

    if (success) {
      console.log('✅ Achievement notification sent successfully');
      return NextResponse.json({ 
        success: true,
        message: 'Achievement notification sent'
      });
    } else {
      console.error('❌ Failed to send achievement notification');
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [ACHIEVEMENT NOTIFICATION API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 