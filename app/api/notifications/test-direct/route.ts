import { NextRequest, NextResponse } from 'next/server';
import { ReengagementNotificationService } from '@/lib/reengagement-notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 [TEST-DIRECT] Direct reengagement test started');
    
    const body = await request.json();
    const { user_id, name = 'Felipe' } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
    
    console.log(`🔥 Sending direct practice reminder to: ${user_id}`);
    
    // Test direct call to reengagement service
    const success = await ReengagementNotificationService.sendPracticeReminder(user_id, name);
    
    return NextResponse.json({ 
      success, 
      message: success ? 'Direct notification sent successfully!' : 'Failed to send notification',
      user_id,
      name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [TEST-DIRECT] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}