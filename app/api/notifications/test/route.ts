import { NextRequest, NextResponse } from 'next/server';
import { simplePushServer } from '@/lib/simple-push-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type = 'test' } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    console.log('🧪 [TEST API] Sending test notification to user:', user_id);

    let result;
    
    if (type === 'test') {
      // Send test notification using simplified server
      await simplePushServer.sendTestNotification(user_id);
      result = 'Test notification sent (simplified)';
    } else {
      result = 'Only test type supported in simplified mode';
    }

    console.log('✅ [TEST API] Test notification process completed');

    return NextResponse.json({
      success: true,
      message: result,
      user_id,
      type,
      note: 'Using simplified push server for testing'
    });

  } catch (error: any) {
    console.error('❌ [TEST API] Test notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 