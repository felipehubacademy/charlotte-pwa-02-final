import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminService } from '@/lib/firebase-admin-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [FCM TEST API] Testing Firebase Cloud Messaging...');

    const body = await request.json();
    const { user_id, type = 'test' } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    console.log('🧪 [FCM TEST API] Sending FCM test notification to user:', user_id);

    // Get Firebase Admin service
    const fcmService = getFirebaseAdminService();

    // Send test notification
    const success = await fcmService.testNotification(user_id);

    if (success) {
      console.log('✅ [FCM TEST API] FCM test notification sent successfully');
      return NextResponse.json({
        success: true,
        message: 'FCM test notification sent successfully',
        user_id,
        type,
        service: 'firebase_cloud_messaging'
      });
    } else {
      console.log('❌ [FCM TEST API] Failed to send FCM notification');
      return NextResponse.json({
        success: false,
        message: 'Failed to send FCM notification - no active tokens found',
        user_id,
        type
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ [FCM TEST API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send FCM test notification',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 