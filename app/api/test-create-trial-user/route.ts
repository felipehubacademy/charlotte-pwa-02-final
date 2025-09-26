import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testando createTrialUser com logs detalhados...');
    
    const { email, displayName, nivel, password } = await request.json();
    
    const azureService = new AzureADUserService();
    
    console.log('📋 Dados recebidos:', { email, displayName, nivel, password: '***' });
    
    // Testar cada passo individualmente
    console.log('📋 PASSO 1: Criando usuário no Azure AD...');
    
    try {
      const userResult = await azureService.createTrialUser(
        displayName || 'Teste Detalhado',
        email || 'teste.detalhado@hubacademybr.com',
        nivel || 'Novice',
        password || 'Teste123!'
      );
      
      console.log('📊 Resultado createTrialUser:', userResult);
      
      if (userResult) {
        return NextResponse.json({
          success: true,
          message: 'createTrialUser funcionou',
          user: userResult
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'createTrialUser retornou null',
          message: 'Verifique os logs do servidor para mais detalhes'
        });
      }
      
    } catch (createError) {
      console.error('❌ Erro específico no createTrialUser:', createError);
      return NextResponse.json({
        success: false,
        error: 'Erro específico no createTrialUser',
        details: createError instanceof Error ? createError.message : 'Erro desconhecido',
        stack: createError instanceof Error ? createError.stack : undefined
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro geral',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
