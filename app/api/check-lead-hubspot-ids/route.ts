import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando IDs do HubSpot na tabela leads...');
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar leads recentes
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, nome, email, hubspot_contact_id, hubspot_deal_id, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar leads' },
        { status: 500 }
      );
    }

    console.log('📋 Leads encontrados:', leads?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      data: {
        totalLeads: leads?.length || 0,
        leads: leads?.map(lead => ({
          id: lead.id,
          nome: lead.nome,
          email: lead.email,
          hubspot_contact_id: lead.hubspot_contact_id,
          hubspot_deal_id: lead.hubspot_deal_id,
          status: lead.status,
          hasHubspotContactId: !!lead.hubspot_contact_id,
          hasHubspotDealId: !!lead.hubspot_deal_id
        })) || []
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
