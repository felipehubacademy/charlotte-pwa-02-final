import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticação
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken) {
      console.error('CRON_SECRET_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Cron secret token não configurado' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Importar e executar função de expiração
    const { TrialAccessService } = await import('@/lib/trial-access-service');
    
    const result = await TrialAccessService.expireTrials();
    
    console.log(`✅ Cron job executado: ${result.expiredCount} trials expirados`);
    
    return NextResponse.json({
      success: true,
      message: `${result.expiredCount} trials expirados`,
      expiredCount: result.expiredCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no cron job de expiração:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
