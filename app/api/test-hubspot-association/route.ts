import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testando associação Deal-Contato no HubSpot...');
    
    // Inicializar HubSpot se configurado
    if (process.env.HUBSPOT_API_KEY) {
      HubSpotService.initialize(process.env.HUBSPOT_API_KEY, process.env.HUBSPOT_DEFAULT_OWNER_ID);
      console.log('✅ HubSpot inicializado');
    }

    // Usar IDs dos testes anteriores
    const contactId = '158525703183'; // Felipe Xavier Debug
    const dealId = '44564765252'; // Deal criado

    console.log('📋 Testando associação:', { contactId, dealId });

    // Testar associação
    const success = await HubSpotService.associateDealToContact(dealId, contactId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Associação criada com sucesso!',
        data: { contactId, dealId }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Falha na associação',
        data: { contactId, dealId }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro no teste de associação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
