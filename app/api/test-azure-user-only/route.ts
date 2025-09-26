import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testando criação de usuário apenas (sem grupo)...');
    
    const { email, displayName, password } = await request.json();
    
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;
    
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });
    
    // Dados do usuário
    const userData = {
      accountEnabled: true,
      displayName: displayName,
      mailNickname: email.split('@')[0],
      userPrincipalName: email,
      passwordProfile: {
        forceChangePasswordNextSignIn: false,
        password: password || 'Teste123!'
      }
    };
    
    console.log('📋 Dados do usuário:', { ...userData, passwordProfile: { ...userData.passwordProfile, password: '***' } });
    
    // Criar usuário
    console.log('📋 Criando usuário...');
    const createdUser = await client.api('/users').post(userData);
    
    console.log('✅ Usuário criado:', createdUser.id);
    
    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: createdUser.id,
        userPrincipalName: createdUser.userPrincipalName,
        displayName: createdUser.displayName,
        mail: createdUser.mail,
        accountEnabled: createdUser.accountEnabled
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na criação de usuário:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro na criação de usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
