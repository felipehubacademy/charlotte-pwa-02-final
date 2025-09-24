// lib/simple-email-service.ts
// Serviço de email simplificado usando Resend

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class SimpleEmailService {
  // Template de email de boas-vindas
  static getWelcomeTemplate(nome: string, nivel: string): EmailTemplate {
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

  // Enviar email usando Resend
  static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY não configurado, simulando envio');
        console.log('📧 Email simulado:', {
          to,
          subject: template.subject
        });
        return true;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Charlotte <noreply@hubacademy.com.br>',
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao enviar email via Resend:', error);
        return false;
      }

      const data = await response.json();
      console.log('✅ Email enviado via Resend:', data);
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }
}
