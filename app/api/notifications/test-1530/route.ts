import { NextRequest, NextResponse } from 'next/server';
import { ReengagementNotificationService } from '@/lib/reengagement-notification-service';

/**
 * 🧪 Endpoint para testar notificações às 15:30
 * Busca usuários configurados para 15:30 e envia notificação manual
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST 15:30] Testing notifications for 15:30 users...');
    
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    
    if (!supabase) {
      console.log('❌ Supabase not available');
      return NextResponse.json({ error: 'Supabase not available' }, { status: 500 });
    }

    // Buscar usuários configurados para 15:30
    const { data: users1530, error } = await supabase
      .from('users')
      .select(`
        id,
        entra_id,
        name,
        preferred_reminder_time,
        reminder_frequency,
        notification_preferences (
          practice_reminders
        )
      `)
      .eq('preferred_reminder_time', '15:30:00')
      .eq('notification_preferences.practice_reminders', true);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`👥 Found ${users1530?.length || 0} users configured for 15:30`);
    console.log('Users:', users1530?.map(u => ({ 
      id: u.entra_id, 
      name: u.name, 
      frequency: u.reminder_frequency,
      practice_reminders: u.notification_preferences?.[0]?.practice_reminders 
    })));

    if (!users1530 || users1530.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users configured for 15:30',
        users: []
      });
    }

    // Enviar notificação para cada usuário
    const results = await Promise.allSettled(
      users1530.map(async (user) => {
        try {
          console.log(`📤 Sending test notification to ${user.entra_id} (${user.name})`);
          
          const success = await ReengagementNotificationService.sendPracticeReminder(
            user.entra_id,
            user.name?.split(' ')[0] || 'Estudante'
          );
          
          console.log(`${success ? '✅' : '❌'} Test notification for ${user.entra_id}: ${success ? 'sent' : 'failed'}`);
          
          return { 
            userId: user.entra_id, 
            name: user.name,
            success 
          };
        } catch (error) {
          console.error(`❌ Failed to send test notification to ${user.entra_id}:`, error);
          return { 
            userId: user.entra_id, 
            name: user.name,
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    const notifications = results.map(r => 
      r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
    );

    const successful = notifications.filter(n => n.success).length;

    return NextResponse.json({
      success: true,
      message: `✅ Test completed: ${successful}/${users1530.length} notifications sent`,
      users: users1530.map(u => ({
        id: u.entra_id,
        name: u.name,
        reminder_time: u.preferred_reminder_time,
        frequency: u.reminder_frequency,
        practice_reminders: u.notification_preferences?.[0]?.practice_reminders
      })),
      results: notifications,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [TEST 15:30] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📊 GET - Ver quantos usuários estão configurados para 15:30
 */
export async function GET() {
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not available' }, { status: 500 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        entra_id,
        name,
        preferred_reminder_time,
        reminder_frequency,
        notification_preferences (
          practice_reminders
        )
      `)
      .eq('preferred_reminder_time', '15:30:00');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users?.map(u => ({
        id: u.entra_id,
        name: u.name,
        reminder_time: u.preferred_reminder_time,
        frequency: u.reminder_frequency,
        practice_reminders: u.notification_preferences?.[0]?.practice_reminders
      })) || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [TEST 15:30] GET Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 