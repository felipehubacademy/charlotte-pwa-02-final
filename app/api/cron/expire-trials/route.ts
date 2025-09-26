import { NextRequest, NextResponse } from 'next/server';
import TrialAzureIntegration from '@/lib/trial-azure-integration';

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

    // Verificar se é para processar um lead específico
    const body = await request.json().catch(() => ({}));
    const leadId = body.leadId;

    if (leadId) {
      // Processar lead específico
      console.log(`🔄 Processando trial específico: ${leadId}`);
      const success = await TrialAzureIntegration.expireTrial(leadId);
      
      if (success) {
        console.log(`✅ Trial ${leadId} expirado com sucesso`);
        return NextResponse.json({
          success: true,
          message: 'Trial expirado com sucesso',
          leadId
        });
      } else {
        console.error(`❌ Erro ao expirar trial ${leadId}`);
        return NextResponse.json(
          { error: 'Erro ao expirar trial' },
          { status: 500 }
        );
      }
    }

    // Processar todos os trials expirados (comportamento original)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: expiredTrials, error } = await supabase
      .from('leads')
      .select('id, azure_user_id')
      .eq('status', 'converted')
      .lt('data_expiracao', new Date().toISOString());

    if (error) {
      console.error('Erro ao buscar trials expirados:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar trials expirados' },
        { status: 500 }
      );
    }

    let expiredCount = 0;
    for (const trial of expiredTrials || []) {
      const success = await TrialAzureIntegration.expireTrial(trial.id);
      if (success) {
        expiredCount++;
      }
    }
    
    console.log(`✅ Cron job executado: ${expiredCount} trials expirados`);
    
    return NextResponse.json({
      success: true,
      message: `${expiredCount} trials expirados`,
      expiredCount: expiredCount,
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
