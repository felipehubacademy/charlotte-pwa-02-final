import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando estrutura da tabela leads...');
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tentar buscar leads simples
    console.log('🔍 Tentando buscar leads...');
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar leads',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Leads encontrados:', leads?.length || 0);

    // Verificar estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'leads');

    if (tableError) {
      console.warn('⚠️ Erro ao verificar estrutura da tabela:', tableError);
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      data: {
        leadsCount: leads?.length || 0,
        leads: leads?.map(lead => ({
          id: lead.id,
          nome: lead.nome,
          email: lead.email,
          hubspot_contact_id: lead.hubspot_contact_id,
          hubspot_deal_id: lead.hubspot_deal_id,
          status: lead.status,
          created_at: lead.created_at
        })) || [],
        tableStructure: tableInfo || 'Não disponível'
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
