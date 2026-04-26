import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adicionando colunas HubSpot à tabela leads...');
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Adicionar coluna hubspot_contact_id se não existir
    console.log('🔧 Adicionando coluna hubspot_contact_id...');
    const { error: contactIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS hubspot_contact_id VARCHAR(255);
      `
    });

    if (contactIdError) {
      console.warn('⚠️ Erro ao adicionar hubspot_contact_id:', contactIdError);
    } else {
      console.log('✅ Coluna hubspot_contact_id adicionada');
    }

    // Adicionar coluna hubspot_deal_id se não existir
    console.log('🔧 Adicionando coluna hubspot_deal_id...');
    const { error: dealIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS hubspot_deal_id VARCHAR(255);
      `
    });

    if (dealIdError) {
      console.warn('⚠️ Erro ao adicionar hubspot_deal_id:', dealIdError);
    } else {
      console.log('✅ Coluna hubspot_deal_id adicionada');
    }

    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando estrutura da tabela...');
    const { data: leads, error: checkError } = await supabase
      .from('leads')
      .select('id, nome, email, hubspot_contact_id, hubspot_deal_id')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar tabela',
        details: checkError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Colunas HubSpot adicionadas com sucesso',
      data: {
        hubspot_contact_id_added: !contactIdError,
        hubspot_deal_id_added: !dealIdError,
        table_check: leads ? 'OK' : 'Erro'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao adicionar colunas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
