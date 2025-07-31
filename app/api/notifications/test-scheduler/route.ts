import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler } from '@/lib/notification-scheduler';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-SCHEDULER] Manual scheduler test started');
    
    // Execute the scheduler manually
    await NotificationScheduler.sendPracticeReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduler test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [TEST-SCHEDULER] Error:', error);
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