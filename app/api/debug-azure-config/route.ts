import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debugando configuração Azure AD...');
    
    // Verificar variáveis de ambiente
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    console.log('📋 Variáveis de ambiente:', {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'Não configurado',
      clientSecret: clientSecret ? 'Configurado' : 'Não configurado',
      tenantId: tenantId ? tenantId : 'Não configurado'
    });

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        details: { clientId: !!clientId, clientSecret: !!clientSecret, tenantId: !!tenantId }
      }, { status: 500 });
    }

    // Testar autenticação
    console.log('🔐 Testando autenticação...');
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });

    // Testar obtenção de token
    console.log('🎫 Testando obtenção de token...');
    const token = await authProvider.getAccessToken();
    console.log('✅ Token obtido:', token ? `${token.substring(0, 20)}...` : 'Falha');

    // Testar acesso à API
    console.log('🔍 Testando acesso à API...');
    try {
      const me = await client.api('/me').get();
      console.log('✅ Acesso à API funcionando:', me);
    } catch (meError: any) {
      console.log('⚠️ Erro ao acessar /me:', meError.message);
    }

    // Testar listagem de usuários
    console.log('👥 Testando listagem de usuários...');
    try {
      const users = await client.api('/users').top(1).get();
      console.log('✅ Listagem de usuários funcionando:', users);
    } catch (usersError: any) {
      console.log('❌ Erro ao listar usuários:', {
        message: usersError.message,
        statusCode: usersError.statusCode,
        code: usersError.code
      });
    }

    // Testar listagem de grupos
    console.log('👥 Testando listagem de grupos...');
    try {
      const groups = await client.api('/groups').top(5).get();
      console.log('✅ Listagem de grupos funcionando:', groups);
    } catch (groupsError: any) {
      console.log('❌ Erro ao listar grupos:', {
        message: groupsError.message,
        statusCode: groupsError.statusCode,
        code: groupsError.code
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Debug concluído',
      details: {
        environment: 'Configurado',
        authentication: 'Funcionando',
        token: token ? 'Obtido' : 'Falha'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no debug Azure AD:', error);
    return NextResponse.json(
      { 
        error: 'Erro no debug Azure AD',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
