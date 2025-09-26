import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debugando adição ao grupo Azure AD...');
    
    const userId = '79979401-4726-4efb-89a6-465e9dde2127';
    const groupName = 'Charlotte-Trial-Advanced';
    
    // Configurar cliente
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;
    
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });
    
    // PASSO 1: Buscar o grupo
    console.log('🔍 PASSO 1: Buscando grupo...');
    const groupResponse = await client.api('/groups').filter(`displayName eq '${groupName}'`).get();
    console.log('📋 Resposta da busca do grupo:', groupResponse);
    
    if (!groupResponse.value || groupResponse.value.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Grupo não encontrado',
        groupName: groupName
      });
    }
    
    const groupId = groupResponse.value[0].id;
    console.log('✅ Grupo encontrado:', { id: groupId, name: groupName });
    
    // PASSO 2: Verificar se usuário existe
    console.log('🔍 PASSO 2: Verificando usuário...');
    const userResponse = await client.api(`/users/${userId}`).get();
    console.log('📋 Usuário encontrado:', userResponse);
    
    // PASSO 3: Tentar adicionar ao grupo
    console.log('🔍 PASSO 3: Tentando adicionar ao grupo...');
    const addResponse = await client.api(`/groups/${groupId}/members/$ref`).post({
      '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
    });
    console.log('📋 Resposta da adição:', addResponse);
    
    // PASSO 4: Verificar membros do grupo
    console.log('🔍 PASSO 4: Verificando membros do grupo...');
    const membersResponse = await client.api(`/groups/${groupId}/members`).get();
    console.log('📋 Membros do grupo:', membersResponse);
    
    return NextResponse.json({
      success: true,
      message: 'Debug concluído',
      data: {
        group: {
          id: groupId,
          name: groupName,
          found: true
        },
        user: {
          id: userId,
          found: true
        },
        addition: {
          attempted: true,
          response: addResponse
        },
        members: {
          count: membersResponse.value?.length || 0,
          members: membersResponse.value?.map((m: any) => ({ id: m.id, displayName: m.displayName })) || []
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro no debug de adição ao grupo:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no debug de adição ao grupo',
        details: error.message,
        statusCode: error.statusCode,
        code: error.code
      },
      { status: 500 }
    );
  }
}
