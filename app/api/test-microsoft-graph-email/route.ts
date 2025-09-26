import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function POST(request: NextRequest) {
  try {
    const { to, nome, nivel } = await request.json();

    if (!to || !nome || !nivel) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: to, nome, nivel' },
        { status: 400 }
      );
    }

    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
    const fromEmail = process.env.MICROSOFT_GRAPH_FROM_EMAIL;

    if (!clientId || !clientSecret || !tenantId || !fromEmail) {
      return NextResponse.json(
        { error: 'Microsoft Graph não configurado' },
        { status: 500 }
      );
    }

    console.log('🔧 Testando Microsoft Graph diretamente...');
    console.log('📧 From:', fromEmail);
    console.log('📧 To:', to);

    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    const client = Client.initWithMiddleware({ authProvider });

    // Template de email simples
    const subject = `🎉 Teste Microsoft Graph - ${nome}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Teste Microsoft Graph</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #a3ff3c;">Teste Microsoft Graph</h1>
        <p>Olá <strong>${nome}</strong>!</p>
        <p>Este é um teste de envio de email via Microsoft Graph.</p>
        <p><strong>Nível:</strong> ${nivel}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Enviado via Microsoft Graph API - Charlotte PWA
        </p>
      </body>
      </html>
    `;

    const textContent = `
Teste Microsoft Graph

Olá ${nome}!

Este é um teste de envio de email via Microsoft Graph.

Nível: ${nivel}
Data: ${new Date().toLocaleString('pt-BR')}

Enviado via Microsoft Graph API - Charlotte PWA
    `;

    // Tentar enviar email
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    console.log('📤 Enviando email via Microsoft Graph...');
    const response = await client.api(`/users/${fromEmail}/sendMail`).post(message);
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📊 Resposta:', response);

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso via Microsoft Graph!',
      details: {
        from: fromEmail,
        to: to,
        subject: subject,
        response: response
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao enviar email via Microsoft Graph:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao enviar email via Microsoft Graph',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

