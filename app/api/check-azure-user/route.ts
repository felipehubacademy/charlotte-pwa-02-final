import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando usuário no Azure AD...');
    
    const { email } = await request.json();
    
    const azureService = new AzureADUserService();
    
    // 1. Buscar usuário por email
    console.log('📋 PASSO 1: Buscando usuário por email...');
    const user = await azureService.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado no Azure AD',
        message: 'O email não existe no Azure AD'
      });
    }
    
    console.log('✅ Usuário encontrado:', user);
    
    // 2. Buscar grupos do usuário
    console.log('📋 PASSO 2: Buscando grupos do usuário...');
    const userGroups = await azureService.getUserGroups(user.id);
    
    console.log('📊 Grupos do usuário:', userGroups);
    
    // 3. Verificar se está no grupo correto
    const isInTrialGroup = userGroups.some(group => 
      group.displayName?.includes('Charlotte-Trial-')
    );
    
    const trialGroup = userGroups.find(group => 
      group.displayName?.includes('Charlotte-Trial-')
    );
    
    return NextResponse.json({
      success: true,
      user,
      groups: userGroups,
      isInTrialGroup,
      trialGroup: trialGroup?.displayName || null,
      message: 'Usuário verificado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao verificar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
