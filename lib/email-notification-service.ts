// lib/email-notification-service.ts
// Serviço para envio de notificações por email para leads

import { createClient } from '@supabase/supabase-js';
import { SimpleEmailService } from './simple-email-service';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  
  // Template de email de boas-vindas
  static getWelcomeTemplate(nome: string, nivelIngles: string): EmailTemplate {
    const subject = `Bem-vindo(a) ao Charlotte! Seu teste grátis de 7 dias começou 🎉`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Charlotte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #a3ff3c 0%, #00d4aa 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .welcome-text { font-size: 18px; margin-bottom: 30px; color: #2d3748; }
          .features { margin: 30px 0; }
          .feature { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #f7fafc; border-radius: 8px; }
          .feature-icon { width: 40px; height: 40px; background: #a3ff3c; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
          .feature-text { flex: 1; }
          .feature-title { font-weight: 600; color: #2d3748; margin-bottom: 4px; }
          .feature-desc { color: #718096; font-size: 14px; }
          .cta { text-align: center; margin: 40px 0; }
          .cta-button { display: inline-block; background: #a3ff3c; color: #1a202c; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .trial-info { background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .trial-title { color: #234e52; font-weight: 600; margin-bottom: 10px; }
          .trial-desc { color: #2d3748; font-size: 14px; }
          .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
          .logo { height: 24px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo(a) ao Charlotte!</h1>
            <p>Seu teste grátis de 7 dias começou agora</p>
          </div>
          
          <div class="content">
            <div class="welcome-text">
              Olá <strong>${nome}</strong>!<br><br>
              Que alegria ter você conosco! Seu teste grátis do Charlotte já está ativo e você pode começar a praticar inglês imediatamente.
            </div>

            <div class="trial-info">
              <div class="trial-title">📅 Seu Período de Teste</div>
              <div class="trial-desc">
                • <strong>7 dias grátis</strong> com acesso completo<br>
                • Nível configurado: <strong>${nivelIngles}</strong><br>
                • Sem necessidade de cartão de crédito<br>
                • Cancele a qualquer momento
              </div>
            </div>

            <div class="features">
              <div class="feature">
                <div class="feature-icon">💬</div>
                <div class="feature-text">
                  <div class="feature-title">Conversas Inteligentes</div>
                  <div class="feature-desc">Pratique com nossa IA que se adapta ao seu nível</div>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🎤</div>
                <div class="feature-text">
                  <div class="feature-title">Feedback de Pronúncia</div>
                  <div class="feature-desc">Receba correções instantâneas da sua pronúncia</div>
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🏆</div>
                <div class="feature-text">
                  <div class="feature-title">Sistema de Conquistas</div>
                  <div class="feature-desc">Ganhe XP e desbloqueie conquistas conforme progride</div>
                </div>
              </div>
            </div>

            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install" class="cta-button">
                Começar a Praticar Agora
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 14px; margin: 0;">
                <strong>Dica:</strong> Para ter a melhor experiência, instale o app no seu celular. 
                Assim você terá acesso offline e notificações para não perder nenhum dia de prática!
              </p>
            </div>
          </div>
          
          <div class="footer">
            <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/logos/hub-white.png" alt="Hub Academy" class="logo">
            <p>Charlotte by Hub Academy<br>
            Transformando o aprendizado de inglês com IA</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bem-vindo(a) ao Charlotte! Seu teste grátis de 7 dias começou 🎉

Olá ${nome}!

Que alegria ter você conosco! Seu teste grátis do Charlotte já está ativo e você pode começar a praticar inglês imediatamente.

📅 SEU PERÍODO DE TESTE
• 7 dias grátis com acesso completo
• Nível configurado: ${nivelIngles}
• Sem necessidade de cartão de crédito
• Cancele a qualquer momento

🚀 O QUE VOCÊ PODE FAZER:
• Conversas Inteligentes: Pratique com nossa IA que se adapta ao seu nível
• Feedback de Pronúncia: Receba correções instantâneas da sua pronúncia
• Sistema de Conquistas: Ganhe XP e desbloqueie conquistas conforme progride

Comece agora: ${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install

Dica: Para ter a melhor experiência, instale o app no seu celular. Assim você terá acesso offline e notificações para não perder nenhum dia de prática!

Charlotte by Hub Academy
Transformando o aprendizado de inglês com IA
    `;

    return { subject, html, text };
  }

  // Template de email de lembrete
  static getReminderTemplate(nome: string, diasRestantes: number): EmailTemplate {
    const subject = `Você tem ${diasRestantes} dias restantes no seu teste grátis do Charlotte ⏰`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete - Charlotte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .reminder-text { font-size: 18px; margin-bottom: 30px; color: #2d3748; }
          .days-left { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
          .days-number { font-size: 48px; font-weight: bold; color: #f39c12; margin: 0; }
          .days-text { color: #856404; font-weight: 600; margin: 10px 0 0 0; }
          .cta { text-align: center; margin: 40px 0; }
          .cta-button { display: inline-block; background: #a3ff3c; color: #1a202c; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Não perca seu tempo!</h1>
          </div>
          
          <div class="content">
            <div class="reminder-text">
              Olá <strong>${nome}</strong>!<br><br>
              Você ainda tem tempo para aproveitar ao máximo seu teste grátis do Charlotte!
            </div>

            <div class="days-left">
              <div class="days-number">${diasRestantes}</div>
              <div class="days-text">dias restantes</div>
            </div>

            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install" class="cta-button">
                Continuar Praticando
              </a>
            </div>

            <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
              Aproveite cada minuto para melhorar seu inglês!
            </p>
          </div>
          
          <div class="footer">
            <p>Charlotte by Hub Academy</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Você tem ${diasRestantes} dias restantes no seu teste grátis do Charlotte ⏰

Olá ${nome}!

Você ainda tem tempo para aproveitar ao máximo seu teste grátis do Charlotte!

${diasRestantes} DIAS RESTANTES

Continue praticando: ${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/install

Aproveite cada minuto para melhorar seu inglês!

Charlotte by Hub Academy
    `;

    return { subject, html, text };
  }

  // Template de email de expiração
  static getExpirationTemplate(nome: string): EmailTemplate {
    const subject = `Seu teste grátis do Charlotte expirou - Que tal continuar? 💪`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste Expirado - Charlotte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .expiration-text { font-size: 18px; margin-bottom: 30px; color: #2d3748; }
          .offer { background: #e8f5e8; border: 1px solid #a3ff3c; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
          .offer-title { color: #2d3748; font-weight: 600; margin-bottom: 10px; font-size: 18px; }
          .offer-desc { color: #2d3748; font-size: 14px; }
          .cta { text-align: center; margin: 40px 0; }
          .cta-button { display: inline-block; background: #a3ff3c; color: #1a202c; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .contact { background: #f7fafc; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
          .contact-title { color: #2d3748; font-weight: 600; margin-bottom: 10px; }
          .contact-desc { color: #718096; font-size: 14px; }
          .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Seu teste expirou</h1>
          </div>
          
          <div class="content">
            <div class="expiration-text">
              Olá <strong>${nome}</strong>!<br><br>
              Seu teste grátis de 7 dias do Charlotte chegou ao fim. Esperamos que tenha gostado da experiência!
            </div>

            <div class="offer">
              <div class="offer-title">🎉 Oferta Especial para Você!</div>
              <div class="offer-desc">
                Que tal continuar sua jornada de aprendizado? Temos planos especiais para quem testou nossa plataforma.
              </div>
            </div>

            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/configuracoes" class="cta-button">
                Ver Planos Disponíveis
              </a>
            </div>

            <div class="contact">
              <div class="contact-title">💬 Precisa de Ajuda?</div>
              <div class="contact-desc">
                Entre em contato conosco para dúvidas sobre planos ou suporte técnico.<br>
                Email: contato@hubacademy.com.br
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Charlotte by Hub Academy</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Seu teste grátis do Charlotte expirou - Que tal continuar? 💪

Olá ${nome}!

Seu teste grátis de 7 dias do Charlotte chegou ao fim. Esperamos que tenha gostado da experiência!

🎉 OFERTA ESPECIAL PARA VOCÊ!

Que tal continuar sua jornada de aprendizado? Temos planos especiais para quem testou nossa plataforma.

Ver planos: ${process.env.NEXT_PUBLIC_APP_URL || 'https://charlotte.hubacademy.com.br'}/configuracoes

💬 PRECISA DE AJUDA?
Entre em contato conosco para dúvidas sobre planos ou suporte técnico.
Email: contato@hubacademy.com.br

Charlotte by Hub Academy
    `;

    return { subject, html, text };
  }

  // Template de email de recuperação de senha
  static getPasswordResetTemplate(nome: string, resetLink: string): EmailTemplate {
    const subject = `Recuperação de senha - Charlotte 🔐`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Charlotte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .reset-text { font-size: 18px; margin-bottom: 30px; color: #2d3748; }
          .reset-info { background: #f0f4ff; border: 1px solid #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
          .reset-info-title { color: #2d3748; font-weight: 600; margin-bottom: 10px; }
          .reset-info-desc { color: #2d3748; font-size: 14px; }
          .cta { text-align: center; margin: 40px 0; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .security { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .security-title { color: #856404; font-weight: 600; margin-bottom: 10px; }
          .security-desc { color: #856404; font-size: 14px; }
          .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
          .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          
          <div class="content">
            <div class="reset-text">
              Olá <strong>${nome}</strong>!<br><br>
              Recebemos uma solicitação para redefinir a senha da sua conta no Charlotte.
            </div>

            <div class="reset-info">
              <div class="reset-info-title">🔑 Redefinir Senha</div>
              <div class="reset-info-desc">
                Clique no botão abaixo para criar uma nova senha para sua conta.
              </div>
            </div>

            <div class="cta">
              <a href="${resetLink}" class="cta-button">
                Redefinir Senha
              </a>
            </div>

            <div class="security">
              <div class="security-title">🛡️ Informações de Segurança</div>
              <div class="security-desc">
                • Este link expira em 1 hora<br>
                • Se você não solicitou esta recuperação, ignore este email<br>
                • Nunca compartilhe este link com outras pessoas
              </div>
            </div>

            <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
            </p>
          </div>
          
          <div class="footer">
            <p>Charlotte by Hub Academy</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Recuperação de senha - Charlotte 🔐

Olá ${nome}!

Recebemos uma solicitação para redefinir a senha da sua conta no Charlotte.

🔑 REDEFINIR SENHA

Clique no link abaixo para criar uma nova senha para sua conta:
${resetLink}

🛡️ INFORMAÇÕES DE SEGURANÇA:
• Este link expira em 1 hora
• Se você não solicitou esta recuperação, ignore este email
• Nunca compartilhe este link com outras pessoas

Se você não conseguir clicar no link, copie e cole a URL acima no seu navegador.

Charlotte by Hub Academy
    `;

    return { subject, html, text };
  }

  // Enviar email usando SimpleEmailService
  static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      return await SimpleEmailService.sendEmail(to, template);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  // Processar fila de emails pendentes
  static async processEmailQueue(): Promise<void> {
    try {
      // Buscar emails pendentes
      const { data: pendingEmails, error } = await supabase
        .from('email_notifications')
        .select(`
          id,
          tipo,
          status,
          data_agendamento,
          tentativas,
          lead_id,
          user_id
        `)
        .eq('status', 'pending')
        .lte('data_agendamento', new Date().toISOString());

      if (error) {
        console.error('Erro ao buscar emails pendentes:', error);
        return;
      }

      for (const email of pendingEmails || []) {
        try {
          // Buscar dados do lead
          const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('nome, email, nivel_ingles')
            .eq('id', email.lead_id)
            .single();
          
          if (leadError || !leadData) {
            console.error('Erro ao buscar dados do lead:', leadError);
            continue;
          }

          let template: EmailTemplate;

          switch (email.tipo) {
            case 'welcome':
              template = this.getWelcomeTemplate(
                leadData.nome,
                leadData.nivel_ingles
              );
              break;

            case 'reminder':
              // Para reminder, vamos usar 3 dias como padrão por enquanto
              template = this.getReminderTemplate(
                leadData.nome,
                3
              );
              break;

            case 'expiration':
              template = this.getExpirationTemplate(leadData.nome);
              break;

            default:
              console.log('Tipo de email não reconhecido:', email.tipo);
              continue;
          }

          const success = await this.sendEmail(leadData.email, template);

          // Atualizar status do email
          await supabase
            .from('email_notifications')
            .update({
              status: success ? 'sent' : 'failed',
              data_envio: new Date().toISOString(),
              tentativas: email.tentativas + 1
            })
            .eq('id', email.id);

        } catch (error) {
          console.error('Erro ao processar email:', error);
          
          // Marcar como falha
          await supabase
            .from('email_notifications')
            .update({
              status: 'failed',
              erro: error instanceof Error ? error.message : 'Erro desconhecido',
              tentativas: email.tentativas + 1
            })
            .eq('id', email.id);
        }
      }

    } catch (error) {
      console.error('Erro ao processar fila de emails:', error);
    }
  }

  // Agendar email de lembrete
  static async scheduleReminderEmail(leadId: string, userId: string, daysFromNow: number): Promise<void> {
    try {
      const dataAgendamento = new Date();
      dataAgendamento.setDate(dataAgendamento.getDate() + daysFromNow);

      await supabase
        .from('email_notifications')
        .insert({
          lead_id: leadId,
          user_id: userId,
          tipo: 'reminder',
          status: 'pending',
          data_agendamento: dataAgendamento.toISOString()
        });
    } catch (error) {
      console.error('Erro ao agendar email de lembrete:', error);
    }
  }

  // Agendar email de expiração
  static async scheduleExpirationEmail(leadId: string, userId: string): Promise<void> {
    try {
      const dataAgendamento = new Date();
      dataAgendamento.setDate(dataAgendamento.getDate() + 7); // 7 dias após o cadastro

      await supabase
        .from('email_notifications')
        .insert({
          lead_id: leadId,
          user_id: userId,
          tipo: 'expiration',
          status: 'pending',
          data_agendamento: dataAgendamento.toISOString()
        });
    } catch (error) {
      console.error('Erro ao agendar email de expiração:', error);
    }
  }
}
