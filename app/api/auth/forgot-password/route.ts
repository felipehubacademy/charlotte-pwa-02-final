import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SimpleEmailService } from '@/lib/simple-email-service';

// Força route handler dinâmico (não analisa em build time)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

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
    interface LeadRecord {
      id: string;
      nome: string;
      email: string;
      user_id: string | null;
      data_expiracao: string;
    }

    const { data: leadRaw, error: leadError } = await supabase
      .from('leads')
      .select('id, nome, email, user_id, data_expiracao')
      .eq('email', email)
      .single();

    const lead = leadRaw as LeadRecord | null;

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Email não encontrado em nossos registros' },
        { status: 404 }
      );
    }

    // Verificar se o lead tem user_id (conta criada)
    if (!lead.user_id) {
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

    // Gerar link de recuperação usando Supabase Auth
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://charlotte-pwa-02-final.vercel.app'}/auth/confirm`
      }
    });

    if (resetError || !resetData) {
      console.error('Erro ao gerar link de recuperação:', resetError);
      return NextResponse.json(
        { error: 'Erro ao gerar link de recuperação' },
        { status: 500 }
      );
    }

    // Enviar email de recuperação
    const emailTemplate = {
      subject: 'Recuperar Senha - Charlotte Trial',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #a3ff3c 0%, #00d4aa 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">
              🔐 Recuperar Senha
            </h1>
            <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px;">
              Charlotte - Hub Academy
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #a3ff3c; margin: 0 0 20px 0; font-size: 24px;">
              Olá, ${lead.nome}!
            </h2>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
              Recebemos uma solicitação para redefinir a senha da sua conta de trial da Charlotte.
            </p>

            <div style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a3ff3c;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #a3ff3c;">
                📧 Email: ${email}
              </p>
              <p style="margin: 0; font-size: 14px; color: #b0b0b0;">
                Trial válido até: ${new Date(lead.data_expiracao).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
              Clique no botão abaixo para redefinir sua senha:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetData.properties.action_link}" 
                 style="display: inline-block; background: #a3ff3c; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">
                🔑 Redefinir Senha
              </a>
            </div>

            <div style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #b0b0b0;">
                <strong>⚠️ Importante:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #b0b0b0;">
                <li>Este link expira em 1 hora</li>
                <li>Use apenas uma vez</li>
                <li>Se não solicitou, ignore este email</li>
              </ul>
            </div>

            <p style="margin: 20px 0 0 0; font-size: 14px; color: #b0b0b0;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #a3ff3c; word-break: break-all;">
              ${resetData.properties.action_link}
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #0f0f1a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
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
        
        Recebemos uma solicitação para redefinir a senha da sua conta de trial da Charlotte.
        
        Email: ${email}
        Trial válido até: ${new Date(lead.data_expiracao).toLocaleDateString('pt-BR')}
        
        Para redefinir sua senha, acesse:
        ${resetData.properties.action_link}
        
        IMPORTANTE:
        - Este link expira em 1 hora
        - Use apenas uma vez
        - Se não solicitou, ignore este email
        
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
      message: 'Email de recuperação enviado com sucesso'
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
