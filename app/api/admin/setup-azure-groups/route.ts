import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json(
        { error: 'Microsoft Graph não configurado' },
        { status: 400 }
      );
    }

    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });

    // Grupos que precisam ser criados
    const groupsToCreate = [
      // Grupos para Trials
      {
        displayName: 'Charlotte-Trial-Novice',
        description: 'Usuários trial do Charlotte com nível Novice',
        mailNickname: 'charlotte-trial-novice',
        mailEnabled: false,
        securityEnabled: true,
        groupTypes: []
      },
      {
        displayName: 'Charlotte-Trial-Inter',
        description: 'Usuários trial do Charlotte com nível Intermediário',
        mailNickname: 'charlotte-trial-inter',
        mailEnabled: false,
        securityEnabled: true,
        groupTypes: []
      },
      {
        displayName: 'Charlotte-Trial-Advanced',
        description: 'Usuários trial do Charlotte com nível Advanced',
        mailNickname: 'charlotte-trial-advanced',
        mailEnabled: false,
        securityEnabled: true,
        groupTypes: []
      },
      {
        displayName: 'Charlotte-Trial-Expired',
        description: 'Usuários trial do Charlotte que expiraram',
        mailNickname: 'charlotte-trial-expired',
        mailEnabled: false,
        securityEnabled: true,
        groupTypes: []
      },
    ];

    const results = [];

    for (const group of groupsToCreate) {
      try {
        // Verificar se grupo já existe
        const existingGroups = await client.api('/groups').filter(`displayName eq '${group.displayName}'`).get();
        
        if (existingGroups.value && existingGroups.value.length > 0) {
          results.push({
            group: group.displayName,
            status: 'exists',
            id: existingGroups.value[0].id
          });
          continue;
        }

        // Criar grupo
        const createdGroup = await client.api('/groups').post(group);
        results.push({
          group: group.displayName,
          status: 'created',
          id: createdGroup.id
        });

      } catch (error: any) {
        results.push({
          group: group.displayName,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração de grupos concluída',
      results
    });

  } catch (error: any) {
    console.error('Erro ao configurar grupos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json(
        { error: 'Microsoft Graph não configurado' },
        { status: 400 }
      );
    }

    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });

    // Listar grupos existentes do Charlotte
    const response = await client.api('/groups').filter("startswith(displayName, 'Charlotte')").get();
    const groups = response.value || [];

    return NextResponse.json({
      success: true,
      groups: groups.map((group: any) => ({
        id: group.id,
        displayName: group.displayName,
        description: group.description,
        mailNickname: group.mailNickname,
        securityEnabled: group.securityEnabled,
        mailEnabled: group.mailEnabled
      }))
    });

  } catch (error: any) {
    console.error('Erro ao listar grupos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
