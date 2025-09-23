import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se usuário tem trial ativo
    const { data: trialData, error: trialError } = await supabase
      .from('trial_access')
      .select(`
        id,
        data_inicio,
        data_fim,
        status,
        nivel_ingles,
        lead_id,
        leads!inner(
          nome,
          email,
          telefone
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (trialError || !trialData) {
      return NextResponse.json(
        { 
          hasTrial: false,
          message: 'Usuário não possui trial ativo'
        },
        { status: 200 }
      );
    }

    // Calcular dias restantes
    const now = new Date();
    const endDate = new Date(trialData.data_fim);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      hasTrial: true,
      trial: {
        id: trialData.id,
        dataInicio: trialData.data_inicio,
        dataFim: trialData.data_fim,
        status: trialData.status,
        nivelIngles: trialData.nivel_ingles,
        diasRestantes: Math.max(0, daysRemaining),
        lead: trialData.leads[0]
      }
    });

  } catch (error) {
    console.error('Erro na API de status do trial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'User ID e action são obrigatórios' },
        { status: 400 }
      );
    }

    if (action === 'check_expired') {
      // Verificar e expirar trials automaticamente
      const { data: expiredCount, error: expireError } = await supabase.rpc('expire_trials');

      if (expireError) {
        console.error('Erro ao expirar trials:', expireError);
        return NextResponse.json(
          { error: 'Erro ao verificar trials expirados' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        expiredTrials: expiredCount
      });
    }

    return NextResponse.json(
      { error: 'Action não reconhecida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro na API de trial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
