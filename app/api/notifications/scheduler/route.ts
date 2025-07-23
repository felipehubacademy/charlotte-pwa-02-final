import { NextRequest, NextResponse } from 'next/server';
import NotificationScheduler from '@/lib/notification-scheduler';

/**
 * 🕐 API para executar o sistema de agendamento de notificações
 * Pode ser chamada por cron jobs externos ou para testes manuais
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📋 [SCHEDULER API] Starting scheduled notification tasks...');
    
    // Verificar se é uma requisição autorizada (produção deve usar auth)
    const authHeader = request.headers.get('authorization');
    
    // TODO: Em produção, implementar verificação de token/chave API
    // if (!authHeader || authHeader !== `Bearer ${process.env.SCHEDULER_API_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json().catch(() => ({}));
    const { taskType } = body;

    // Executar task específica ou todas
    switch (taskType) {
      case 'streak_reminders':
        await NotificationScheduler.checkStreakReminders();
        break;
      
      case 'weekly_challenges':
        await NotificationScheduler.sendWeeklyChallenges();
        break;
      
      case 'practice_reminders':
        await NotificationScheduler.sendPracticeReminders();
        break;
      
      case 'goal_reminders':
        await NotificationScheduler.checkGoalReminders();
        break;
      
      case 'all':
      default:
        await NotificationScheduler.runScheduledTasks();
        break;
    }

    return NextResponse.json({
      success: true,
      message: `✅ Scheduler task "${taskType || 'all'}" completed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [SCHEDULER API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📊 GET - Status do scheduler e próximas execuções
 */
export async function GET() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const nextTasks = [];
    
    // Calcular próximas execuções
    if (dayOfWeek === 1 && hour < 9) {
      nextTasks.push('Weekly challenges today at 9:00');
    } else if (dayOfWeek !== 1) {
      const daysUntilMonday = (8 - dayOfWeek) % 7;
      nextTasks.push(`Weekly challenges in ${daysUntilMonday} days`);
    }
    
    if (hour < 19) {
      nextTasks.push(`Goal reminders today at 19:00`);
    } else {
      nextTasks.push(`Goal reminders tomorrow at 19:00`);
    }
    
    if (hour < 21) {
      nextTasks.push(`Streak reminders today at 21:00`);
    } else {
      nextTasks.push(`Streak reminders tomorrow at 21:00`);
    }
    
    nextTasks.push(`Practice reminders every hour`);

    return NextResponse.json({
      success: true,
      status: 'active',
      currentTime: now.toISOString(),
      nextTasks,
      availableEndpoints: {
        'POST /api/notifications/scheduler': 'Execute scheduled tasks',
        'POST /api/notifications/scheduler with taskType': 'Execute specific task',
        'GET /api/notifications/scheduler': 'Get scheduler status'
      }
    });

  } catch (error) {
    console.error('❌ [SCHEDULER API] Status error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 