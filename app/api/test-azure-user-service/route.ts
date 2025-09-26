import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando Azure AD User Service...');
    
    // Verificar se as variáveis de ambiente estão configuradas
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    console.log('📋 Configuração:', {
      clientId: clientId ? 'Configurado' : 'Não configurado',
      clientSecret: clientSecret ? 'Configurado' : 'Não configurado',
      tenantId: tenantId ? 'Configurado' : 'Não configurado'
    });

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        details: { clientId: !!clientId, clientSecret: !!clientSecret, tenantId: !!tenantId }
      }, { status: 500 });
    }

    // Testar criação de usuário
    const testData = {
      nome: 'Felipe Xavier Teste Azure',
      email: 'felipe.azure.test@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel: 'Advanced' as const,
      senha: 'Teste123!'
    };

    console.log('📋 Dados de teste:', testData);

    try {
      const azureService = new AzureADUserService();
      
      // Testar criação de usuário
      const userResult = await azureService.createTrialUser(
        testData.nome,
        testData.email,
        testData.nivel,
        testData.senha
      );

      if (userResult) {
        console.log('✅ Usuário criado no Azure AD:', userResult.id);
        
        // Testar adição ao grupo
        const groupResult = await azureService.addUserToTrialGroup(userResult.id, testData.nivel);
        
        return NextResponse.json({
          success: true,
          message: 'Usuário criado com sucesso no Azure AD!',
          data: {
            user: userResult,
            groupAdded: groupResult
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Falha ao criar usuário no Azure AD'
        }, { status: 500 });
      }

    } catch (azureError: any) {
      console.error('❌ Erro no Azure AD:', azureError);
      return NextResponse.json({
        success: false,
        error: 'Erro no Azure AD',
        details: azureError.message,
        stack: azureError.stack
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro no teste Azure User Service:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
