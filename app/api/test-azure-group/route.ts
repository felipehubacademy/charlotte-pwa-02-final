import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando adição de usuário ao grupo...');
    
    const { email, displayName, nivel, password } = await request.json();
    
    const azureService = new AzureADUserService();
    
    // 1. Criar usuário
    console.log('📋 PASSO 1: Criando usuário...');
    const userResult = await azureService.createTrialUser(
      displayName || 'Teste Grupo',
      email || 'teste.grupo@hubacademybr.com',
      nivel || 'Novice',
      password || 'Teste123!'
    );
    
    if (!userResult) {
      return NextResponse.json({
        success: false,
        error: 'Falha ao criar usuário',
        message: 'Usuário não foi criado no Azure AD'
      });
    }
    
    console.log('✅ Usuário criado:', userResult.id);
    
    // 2. Verificar se o usuário existe
    console.log('📋 PASSO 2: Verificando se o usuário existe...');
    const userByEmail = await azureService.getUserByEmail(email);
    
    console.log('📊 Usuário encontrado por email:', userByEmail);
    
    // 3. Verificar usuários no grupo
    console.log('📋 PASSO 3: Verificando usuários no grupo Charlotte-Trial-Novice...');
    const usersInGroup = await azureService.getUsersInGroup('Charlotte-Trial-Novice');
    
    console.log('📊 Usuários no grupo:', usersInGroup.length);
    
    const isInGroup = usersInGroup.some(user => user.id === userResult.id);
    
    return NextResponse.json({
      success: true,
      user: userResult,
      userByEmail,
      usersInGroupCount: usersInGroup.length,
      isInGroup,
      message: 'Teste de grupo concluído'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de grupo:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no teste de grupo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
