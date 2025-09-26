import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste simples de criação de usuário no Azure AD...');
    
    const { email, displayName, nivel, password } = await request.json();
    
    const azureService = new AzureADUserService();
    
    console.log('📋 Dados recebidos:', { email, displayName, nivel, password: '***' });
    
    // Testar apenas a criação de usuário
    const userResult = await azureService.createTrialUser(
      displayName || 'Teste Simples',
      email || 'teste.simples@hubacademybr.com',
      nivel || 'Novice',
      password || 'Teste123!'
    );
    
    console.log('📊 Resultado:', userResult);
    
    if (userResult) {
      console.log('✅ Usuário criado com sucesso!');
      return NextResponse.json({
        success: true,
        user: userResult,
        message: 'Usuário criado com sucesso'
      });
    } else {
      console.log('❌ Falha na criação do usuário');
      return NextResponse.json({
        success: false,
        error: 'Falha na criação do usuário',
        message: 'Verifique os logs do servidor para mais detalhes'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste simples:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no teste simples',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
