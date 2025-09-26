import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testando adição de usuário ao grupo...');
    
    const { userId, groupName } = await request.json();
    
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;
    
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });
    
    // 1. Buscar grupo por nome
    console.log('📋 PASSO 1: Buscando grupo por nome...');
    const groupsResponse = await client.api('/groups').filter(`displayName eq '${groupName}'`).get();
    const groups = groupsResponse.value || [];
    
    if (groups.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Grupo não encontrado',
        groupName
      });
    }
    
    const group = groups[0];
    console.log('✅ Grupo encontrado:', group.id, group.displayName);
    
    // 2. Adicionar usuário ao grupo
    console.log('📋 PASSO 2: Adicionando usuário ao grupo...');
    await client.api(`/groups/${group.id}/members/$ref`).post({
      '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
    });
    
    console.log('✅ Usuário adicionado ao grupo');
    
    return NextResponse.json({
      success: true,
      message: 'Usuário adicionado ao grupo com sucesso',
      groupId: group.id,
      groupName: group.displayName,
      userId
    });
    
  } catch (error) {
    console.error('❌ Erro na adição ao grupo:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro na adição ao grupo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
