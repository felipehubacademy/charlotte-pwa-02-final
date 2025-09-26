import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando membros do grupo Azure AD...');
    
    const userId = '79979401-4726-4efb-89a6-465e9dde2127';
    const groupName = 'Charlotte-Trial-Advanced';
    
    // Configurar cliente
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;
    
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });
    
    // Buscar o grupo
    const groupResponse = await client.api('/groups').filter(`displayName eq '${groupName}'`).get();
    const groupId = groupResponse.value[0].id;
    
    // Verificar membros do grupo
    const membersResponse = await client.api(`/groups/${groupId}/members`).get();
    const members = membersResponse.value || [];
    
    // Verificar se o usuário está no grupo
    const userInGroup = members.find((member: any) => member.id === userId);
    
    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      data: {
        group: {
          id: groupId,
          name: groupName,
          totalMembers: members.length
        },
        user: {
          id: userId,
          isInGroup: !!userInGroup,
          memberDetails: userInGroup || null
        },
        allMembers: members.map((m: any) => ({
          id: m.id,
          displayName: m.displayName,
          userPrincipalName: m.userPrincipalName
        }))
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro na verificação de membros:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro na verificação de membros',
        details: error.message
      },
      { status: 500 }
    );
  }
}
