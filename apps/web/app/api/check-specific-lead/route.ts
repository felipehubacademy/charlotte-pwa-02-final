import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando lead específico:', leadId);
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o lead específico
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar lead:', error);
      return NextResponse.json({
        success: false,
        error: 'Lead não encontrado',
        details: error
      }, { status: 500 });
    }

    console.log('📋 Lead encontrado:', lead);

    return NextResponse.json({
      success: true,
      message: 'Lead encontrado',
      data: {
        lead: lead,
        hasHubspotContactId: !!lead.hubspot_contact_id,
        hasHubspotDealId: !!lead.hubspot_deal_id
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na verificação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
