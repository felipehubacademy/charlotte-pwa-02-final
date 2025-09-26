import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testando associação com erro detalhado...');
    
    const apiKey = process.env.HUBSPOT_API_KEY;
    const contactId = '158487049076'; // Felipe Xavier Full Flow
    const dealId = '44543052725'; // Deal criado

    if (!apiKey) {
      return NextResponse.json({
        error: 'API key não encontrada'
      }, { status: 500 });
    }

    console.log('📋 Testando associação:', { contactId, dealId });

    // Testar associação com erro detalhado
    const response = await fetch(`https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3
        }
      ])
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      data: { contactId, dealId }
    });

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
