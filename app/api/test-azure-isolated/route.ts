import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Teste isolado do Azure AD...');
    
    const { email, displayName, nivel, password } = await request.json();
    
    console.log('📋 Dados recebidos:', { email, displayName, nivel, password: '***' });
    
    // Testar apenas a criação de usuário
    console.log('📋 Criando instância do AzureADUserService...');
    const azureService = new AzureADUserService();
    console.log('✅ Instância criada');
    
    console.log('📋 Chamando createTrialUser...');
    const result = await azureService.createTrialUser(
      displayName || 'Teste Isolado',
      email || 'teste.isolado@hubacademybr.com',
      nivel || 'Novice',
      password || 'Teste123!'
    );
    
    console.log('📊 Resultado:', result);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Teste isolado funcionou',
        user: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Teste isolado falhou - retornou null',
        message: 'Verifique os logs do servidor'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste isolado:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no teste isolado',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
