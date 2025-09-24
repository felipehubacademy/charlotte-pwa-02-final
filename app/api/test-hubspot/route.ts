import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    // Inicializar HubSpot
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HUBSPOT_API_KEY não configurado' },
        { status: 400 }
      );
    }

    HubSpotService.initialize(apiKey, process.env.HUBSPOT_DEFAULT_OWNER_ID);

    // Testar criação de contato
    const contactData = {
      nome: 'Teste HubSpot API',
      email: 'teste.api@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel_ingles: 'Advanced',
      lead_id: 'test-123'
    };

    const result = await HubSpotService.createContact(contactData);

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Contato criado no HubSpot com sucesso!',
        contactId: result.id,
        contactData
      });
    } else {
      return NextResponse.json(
        { error: 'Falha ao criar contato no HubSpot' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro no teste HubSpot:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
