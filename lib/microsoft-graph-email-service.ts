// lib/microsoft-graph-email-service.ts
// Serviço de envio de emails usando Microsoft Graph

import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

class MicrosoftGraphEmailService {
  private client: Client;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.MICROSOFT_GRAPH_FROM_EMAIL || 'noreply@hubacademy.com.br';
    
    const authProvider: AuthenticationProvider = {
      getAccessToken: async () => {
        return await this.getAccessToken();
      }
    };

    this.client = Client.initWithMiddleware({ authProvider });
  }

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Microsoft Graph credentials not configured');
    }

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
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<boolean> {
    try {
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

      await this.client.api(`/users/${this.fromEmail}/sendMail`).post(message);
      
      console.log(`✅ Email enviado para ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  // Template de email de boas-vindas
  getWelcomeTemplate(nome: string, nivel: string): { subject: string; html: string; text: string } {
    const subject = `🎉 Bem-vindo(a) ao Charlotte, ${nome}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Charlotte</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/logos/hub-white.png" alt="Hub Academy" style="height: 60px; margin-bottom: 20px;">
          <h1 style="color: #a3ff3c; font-size: 28px; margin: 0;">Bem-vindo ao Charlotte!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Olá, ${nome}! 👋</h2>
          <p>Seu teste grátis de 7 dias no Charlotte foi ativado com sucesso!</p>
          <p><strong>Nível configurado:</strong> ${nivel}</p>
          <p><strong>Período:</strong> 7 dias grátis</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #a3ff3c;">🚀 O que você pode fazer agora:</h3>
          <ul style="padding-left: 20px;">
            <li>Pratique inglês com conversas inteligentes</li>
            <li>Receba feedback em tempo real</li>
            <li>Use recursos de voz e câmera</li>
            <li>Ganhe conquistas e acompanhe seu progresso</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install" 
             style="background: #a3ff3c; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📱 Instalar App Agora
          </a>
        </div>

        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
          <p><strong>Importante:</strong> Seu teste grátis expira em 7 dias. Após esse período, entre em contato conosco para continuar usando o Charlotte.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
          <p>Este é um email automático. Não responda a esta mensagem.</p>
          <p>Hub Academy - Charlotte IA</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Bem-vindo ao Charlotte!

Olá, ${nome}!

Seu teste grátis de 7 dias no Charlotte foi ativado com sucesso!

Nível configurado: ${nivel}
Período: 7 dias grátis

O que você pode fazer agora:
- Pratique inglês com conversas inteligentes
- Receba feedback em tempo real
- Use recursos de voz e câmera
- Ganhe conquistas e acompanhe seu progresso

Instalar App: ${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install

Importante: Seu teste grátis expira em 7 dias. Após esse período, entre em contato conosco para continuar usando o Charlotte.

Hub Academy - Charlotte IA
    `;

    return { subject, html, text };
  }

  // Template de lembrete
  getReminderTemplate(nome: string, diasRestantes: number): { subject: string; html: string; text: string } {
    const subject = `⏰ Lembrete: ${diasRestantes} dias restantes no Charlotte`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete Charlotte</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/logos/hub-white.png" alt="Hub Academy" style="height: 60px; margin-bottom: 20px;">
          <h1 style="color: #a3ff3c; font-size: 24px; margin: 0;">Lembrete do Charlotte</h1>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h2 style="color: #856404; margin-top: 0;">Olá, ${nome}! ⏰</h2>
          <p><strong>Você tem ${diasRestantes} dias restantes</strong> no seu teste grátis do Charlotte.</p>
          <p>Aproveite ao máximo essa oportunidade para praticar inglês!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/chat" 
             style="background: #a3ff3c; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🚀 Continuar Praticando
          </a>
        </div>

        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
          <p><strong>Dica:</strong> Pratique pelo menos 10 minutos por dia para ver resultados significativos!</p>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
          <p>Hub Academy - Charlotte IA</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Lembrete do Charlotte

Olá, ${nome}!

Você tem ${diasRestantes} dias restantes no seu teste grátis do Charlotte.

Aproveite ao máximo essa oportunidade para praticar inglês!

Continuar Praticando: ${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/chat

Dica: Pratique pelo menos 10 minutos por dia para ver resultados significativos!

Hub Academy - Charlotte IA
    `;

    return { subject, html, text };
  }

  // Template de expiração
  getExpirationTemplate(nome: string): { subject: string; html: string; text: string } {
    const subject = `⏰ Seu teste grátis do Charlotte expirou`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste Expirado - Charlotte</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/logos/hub-white.png" alt="Hub Academy" style="height: 60px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; font-size: 24px; margin: 0;">Teste Expirado</h1>
        </div>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
          <h2 style="color: #721c24; margin-top: 0;">Olá, ${nome}! 😔</h2>
          <p><strong>Seu teste grátis de 7 dias no Charlotte expirou.</strong></p>
          <p>Esperamos que tenha gostado da experiência!</p>
        </div>

        <div style="background: #d1ecf1; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #0c5460; margin-top: 0;">💡 Quer continuar usando o Charlotte?</h3>
          <p>Entre em contato conosco para conhecer nossos planos e continuar sua jornada de aprendizado!</p>
          <p><strong>Email:</strong> contato@hubacademy.com.br</p>
          <p><strong>WhatsApp:</strong> (11) 99999-9999</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:contato@hubacademy.com.br" 
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📧 Entrar em Contato
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
          <p>Hub Academy - Charlotte IA</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Teste Expirado - Charlotte

Olá, ${nome}!

Seu teste grátis de 7 dias no Charlotte expirou.

Esperamos que tenha gostado da experiência!

Quer continuar usando o Charlotte?

Entre em contato conosco para conhecer nossos planos e continuar sua jornada de aprendizado!

Email: contato@hubacademy.com.br
WhatsApp: (11) 99999-9999

Hub Academy - Charlotte IA
    `;

    return { subject, html, text };
  }
}

export default new MicrosoftGraphEmailService();
