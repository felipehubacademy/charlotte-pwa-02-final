import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SimpleEmailService } from '@/lib/simple-email-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se existe um lead com este email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, nome, email, azure_user_id, data_expiracao')
      .eq('email', email)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Email não encontrado em nossos registros' },
        { status: 404 }
      );
    }

    // Verificar se o lead tem azure_user_id (conta criada no Azure AD)
    if (!lead.azure_user_id) {
      return NextResponse.json(
        { error: 'Conta não encontrada. Entre em contato com o suporte.' },
        { status: 404 }
      );
    }

    // Verificar se o trial ainda está ativo
    const now = new Date();
    const endDate = new Date(lead.data_expiracao);
    if (endDate <= now) {
      return NextResponse.json(
        { error: 'Seu trial expirou. Entre em contato para continuar.' },
        { status: 400 }
      );
    }

    // Para Azure AD, não podemos resetar senha diretamente
    // Vamos enviar instruções para usar o portal da Microsoft
    const emailTemplate = {
      subject: '🔑 Recuperar Senha - Charlotte Trial',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #a3ff3c 0%, #00d4aa 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #000000;">
              🔑 Recuperar Senha
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #000000; opacity: 0.8;">
              Charlotte Trial - Hub Academy
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 30px; background: #1a1a2e;">
            <p style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff;">
              Olá, <strong>${lead.nome}</strong>!
            </p>

            <p style="margin: 0 0 20px 0; font-size: 16px; color: #b0b0b0; line-height: 1.6;">
              Recebemos uma solicitação para recuperar a senha da sua conta de trial da Charlotte.
            </p>

            <div style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #a3ff3c;">
                📧 Informações da Conta
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #b0b0b0;">
                <strong>Email:</strong> ${email}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #b0b0b0;">
                <strong>Trial válido até:</strong> ${new Date(lead.data_expiracao).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div style="background: #1e3a8a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #ffffff;">
                🔧 Como Recuperar sua Senha
              </h3>
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #b0b0b0;">
                Como sua conta está vinculada ao Microsoft Entra ID, você pode recuperar sua senha através do portal da Microsoft:
              </p>
              
              <div style="margin: 20px 0;">
                <a href="https://account.live.com/password/reset" 
                   style="display: inline-block; background: #0078d4; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">
                  🔑 Recuperar Senha no Microsoft
                </a>
              </div>
              
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #b0b0b0;">
                Ou acesse: <span style="color: #a3ff3c;">https://account.live.com/password/reset</span>
              </p>
            </div>

            <div style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #b0b0b0;">
                <strong>⚠️ Importante:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #b0b0b0;">
                <li>Use o mesmo email: <strong>${email}</strong></li>
                <li>Após recuperar, use a nova senha para entrar no Charlotte</li>
                <li>Se não solicitou, ignore este email</li>
              </ul>
            </div>

            <div style="background: #0f0f1a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #a3ff3c; font-weight: bold;">
                🎯 Após recuperar sua senha:
              </p>
              <p style="margin: 0; font-size: 14px; color: #b0b0b0;">
                Volte ao Charlotte e faça login com sua nova senha
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #0f0f1a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #b0b0b0;">
              Precisa de ajuda? Entre em contato conosco
            </p>
            <p style="margin: 0; font-size: 12px; color: #666666;">
              © 2024 Hub Academy - Charlotte AI
            </p>
          </div>
        </div>
      `,
      text: `
        Recuperar Senha - Charlotte Trial
        
        Olá, ${lead.nome}!
        
        Recebemos uma solicitação para recuperar a senha da sua conta de trial da Charlotte.
        
        Email: ${email}
        Trial válido até: ${new Date(lead.data_expiracao).toLocaleDateString('pt-BR')}
        
        COMO RECUPERAR SUA SENHA:
        
        Como sua conta está vinculada ao Microsoft Entra ID, você pode recuperar sua senha através do portal da Microsoft:
        
        Acesse: https://account.live.com/password/reset
        
        IMPORTANTE:
        - Use o mesmo email: ${email}
        - Após recuperar, use a nova senha para entrar no Charlotte
        - Se não solicitou, ignore este email
        
        Após recuperar sua senha:
        Volte ao Charlotte e faça login com sua nova senha
        
        Precisa de ajuda? Entre em contato conosco.
        
        © 2024 Hub Academy - Charlotte AI
      `
    };

    const emailSent = await SimpleEmailService.sendEmail(email, emailTemplate);

    if (!emailSent) {
      console.error('Erro ao enviar email de recuperação');
      return NextResponse.json(
        { error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Instruções de recuperação enviadas com sucesso'
    });

  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
