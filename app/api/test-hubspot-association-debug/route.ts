import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Debug detalhado da associação Deal-Contato...');
    
    const apiKey = process.env.HUBSPOT_API_KEY;
    const contactId = '158525703183';
    const dealId = '44564765252';

    if (!apiKey) {
      return NextResponse.json({
        error: 'API key não encontrada'
      }, { status: 500 });
    }

    console.log('📋 Testando associação:', { contactId, dealId });

    // Testar diferentes abordagens de associação
    const approaches = [
      {
        name: 'API v3 - PUT simples',
        url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}`,
        method: 'PUT',
        body: { associationType: 'deal_to_contact' }
      },
      {
        name: 'API v4 - PUT com array',
        url: `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`,
        method: 'PUT',
        body: [{ associationType: 'deal_to_contact' }]
      },
      {
        name: 'API v3 - POST batch',
        url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}`,
        method: 'POST',
        body: { associationType: 'deal_to_contact' }
      }
    ];

    const results = [];

    for (const approach of approaches) {
      try {
        console.log(`🧪 Testando: ${approach.name}`);
        
        const response = await fetch(approach.url, {
          method: approach.method,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(approach.body)
        });

        const responseText = await response.text();
        
        results.push({
          approach: approach.name,
          status: response.status,
          success: response.ok,
          response: responseText.substring(0, 500) // Limitar tamanho
        });

        console.log(`📊 ${approach.name}: ${response.status} - ${response.ok ? 'SUCESSO' : 'FALHA'}`);

      } catch (error: any) {
        results.push({
          approach: approach.name,
          error: error.message
        });
        console.log(`❌ ${approach.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug de associação concluído',
      results
    });

  } catch (error) {
    console.error('❌ Erro no debug de associação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
