import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, nivel_ingles, lead_id } = await request.json();

    if (!nome || !email || !telefone || !nivel_ingles || !lead_id) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: nome, email, telefone, nivel_ingles, lead_id' },
        { status: 400 }
      );
    }

    console.log('🧪 Testando criação de contato e deal no HubSpot...');
    console.log('📋 Dados:', { nome, email, telefone, nivel_ingles, lead_id });

    // Testar criação de contato e deal
    const result = await HubSpotService.createContactAndDeal({
      nome,
      email,
      telefone,
      nivel_ingles,
      lead_id
    });

    if (result.contact && result.deal) {
      return NextResponse.json({
        success: true,
        message: 'Contato e deal criados com sucesso no HubSpot!',
        data: {
          contact: {
            id: result.contact.id,
            properties: result.contact.properties
          },
          deal: {
            id: result.deal.id,
            properties: result.deal.properties
          }
        }
      });
    } else if (result.contact) {
      return NextResponse.json({
        success: true,
        message: 'Contato criado, mas deal falhou',
        data: {
          contact: {
            id: result.contact.id,
            properties: result.contact.properties
          },
          deal: null
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Falha ao criar contato e deal no HubSpot' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro no teste de HubSpot deal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
