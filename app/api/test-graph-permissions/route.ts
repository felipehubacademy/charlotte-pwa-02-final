import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
    const fromEmail = process.env.MICROSOFT_GRAPH_FROM_EMAIL;

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais do Microsoft Graph não configuradas'
      });
    }

    // Testar obtenção de token
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: 'Erro ao obter token de acesso',
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        }
      });
    }

    const tokenData = await response.json();
    
    // Testar permissões básicas
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Token obtido com sucesso',
      config: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasTenantId: !!tenantId,
        hasFromEmail: !!fromEmail,
        fromEmail: fromEmail
      },
      token: {
        hasToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      },
      graphTest: {
        status: graphResponse.status,
        statusText: graphResponse.statusText,
        hasAccess: graphResponse.ok
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}
