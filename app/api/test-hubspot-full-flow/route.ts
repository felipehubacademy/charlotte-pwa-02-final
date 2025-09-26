import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando fluxo completo: Contato + Deal + Associação...');
    
    // Inicializar HubSpot se configurado
    if (process.env.HUBSPOT_API_KEY) {
      HubSpotService.initialize(process.env.HUBSPOT_API_KEY, process.env.HUBSPOT_DEFAULT_OWNER_ID);
      console.log('✅ HubSpot inicializado');
    }

    // Criar novo contato e deal
    const contactData = {
      nome: 'Felipe Xavier Full Flow',
      email: 'felipe.fullflow@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel_ingles: 'Advanced',
      lead_id: 'full-flow-test-123'
    };

    console.log('📧 Criando contato...');
    const contact = await HubSpotService.createContact(contactData);
    
    if (!contact) {
      return NextResponse.json({
        success: false,
        message: 'Falha ao criar contato'
      }, { status: 500 });
    }

    console.log('✅ Contato criado:', contact.id);

    // Criar deal
    console.log('💼 Criando deal...');
    const deal = await HubSpotService.createDeal(contactData);
    
    if (!deal) {
      return NextResponse.json({
        success: false,
        message: 'Falha ao criar deal',
        contact: { id: contact.id }
      }, { status: 500 });
    }

    console.log('✅ Deal criado:', deal.id);

    // Tentar associar
    console.log('🔗 Associando deal ao contato...');
    const associationSuccess = await HubSpotService.associateDealToContact(deal.id, contact.id);

    return NextResponse.json({
      success: true,
      message: 'Fluxo completo testado',
      results: {
        contact: {
          id: contact.id,
          email: contactData.email
        },
        deal: {
          id: deal.id,
          name: contactData.nome
        },
        association: {
          success: associationSuccess,
          message: associationSuccess ? 'Associação criada com sucesso!' : 'Falha na associação'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de fluxo completo:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
