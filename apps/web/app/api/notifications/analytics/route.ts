import { NextRequest, NextResponse } from 'next/server';
import { NotificationLogger } from '@/lib/notification-logger';

/**
 * 📊 API para obter métricas de notificações
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [ANALYTICS API] Getting notification metrics...');
    
    // Validação opcional de autenticação (remover em produção se não necessário)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias atrás
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const userId = searchParams.get('userId');

    let result;

    if (userId) {
      // Histórico de um usuário específico
      const limit = parseInt(searchParams.get('limit') || '50');
      result = {
        type: 'user_history',
        userId,
        history: await NotificationLogger.getUserNotificationHistory(userId, limit)
      };
    } else {
      // Métricas gerais
      result = {
        type: 'general_metrics',
        period: { startDate, endDate },
        metrics: await NotificationLogger.getNotificationMetrics(startDate, endDate)
      };
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ANALYTICS API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🧹 POST - Limpeza de logs antigos
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 [ANALYTICS API] Cleaning up old logs...');
    
    // Validação de autorização para operações de limpeza
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotificationLogger.cleanupOldLogs();

    return NextResponse.json({
      success: true,
      message: '✅ Old logs cleaned up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ANALYTICS API] Cleanup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 