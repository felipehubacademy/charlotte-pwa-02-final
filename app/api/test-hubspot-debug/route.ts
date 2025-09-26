import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Debug HubSpot - Verificando configuração...');
    
    // Inicializar HubSpot se configurado
    if (process.env.HUBSPOT_API_KEY) {
      HubSpotService.initialize(process.env.HUBSPOT_API_KEY, process.env.HUBSPOT_DEFAULT_OWNER_ID);
      console.log('✅ HubSpot inicializado com API key');
    } else {
      console.log('❌ HUBSPOT_API_KEY não encontrado');
    }
    
    // Verificar se HubSpot está configurado
    const isConfigured = HubSpotService.isConfigured();
    console.log('📋 HubSpot configurado:', isConfigured);
    
    if (!isConfigured) {
      return NextResponse.json({
        error: 'HubSpot não está configurado',
        details: 'Verifique se HUBSPOT_API_KEY está definido'
      }, { status: 500 });
    }

    // Testar criação de contato primeiro
    console.log('📧 Testando criação de contato...');
    const contactResult = await HubSpotService.createContact({
      nome: 'Felipe Xavier Debug',
      email: 'felipe.debug@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel_ingles: 'Advanced',
      lead_id: 'debug-123'
    });

    if (!contactResult) {
      return NextResponse.json({
        error: 'Falha ao criar contato',
        details: 'Contato não foi criado'
      }, { status: 500 });
    }

    console.log('✅ Contato criado:', contactResult.id);

    // Agora testar criação de deal
    console.log('💼 Testando criação de deal...');
    const dealResult = await HubSpotService.createDeal({
      nome: 'Felipe Xavier Debug',
      email: 'felipe.debug@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel_ingles: 'Advanced',
      lead_id: 'debug-123'
    });

    return NextResponse.json({
      success: true,
      message: 'Debug concluído',
      results: {
        contact: {
          id: contactResult.id,
          properties: contactResult.properties
        },
        deal: dealResult ? {
          id: dealResult.id,
          properties: dealResult.properties
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug HubSpot:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
