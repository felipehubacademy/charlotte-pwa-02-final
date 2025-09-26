import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando atualização de lead com HubSpot IDs...');
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o lead mais recente
    const { data: latestLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, nome, email')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !latestLead) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum lead encontrado',
        details: fetchError
      }, { status: 500 });
    }

    console.log('📋 Lead encontrado:', latestLead);

    // Tentar atualizar com IDs de teste
    const testContactId = 'TEST_CONTACT_123';
    const testDealId = 'TEST_DEAL_456';

    console.log('🔧 Tentando atualizar lead...');
    const { data: updateData, error: updateError } = await supabase
      .from('leads')
      .update({ 
        hubspot_contact_id: testContactId,
        hubspot_deal_id: testDealId
      })
      .eq('id', latestLead.id)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar lead:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar lead',
        details: updateError
      }, { status: 500 });
    }

    console.log('✅ Lead atualizado:', updateData);

    // Verificar se a atualização funcionou
    const { data: verifyData, error: verifyError } = await supabase
      .from('leads')
      .select('id, nome, email, hubspot_contact_id, hubspot_deal_id')
      .eq('id', latestLead.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar lead:', verifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de atualização concluído',
      data: {
        originalLead: latestLead,
        updateResult: updateData,
        verification: verifyData,
        hasHubspotContactId: verifyData?.hubspot_contact_id ? true : false,
        hasHubspotDealId: verifyData?.hubspot_deal_id ? true : false
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
