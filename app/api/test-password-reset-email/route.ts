import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/email-notification-service';

export async function POST(request: NextRequest) {
  try {
    const { to, nome, resetLink } = await request.json();

    if (!to || !nome || !resetLink) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: to, nome, resetLink' },
        { status: 400 }
      );
    }

    // Testar envio de email de recuperação de senha
    const template = EmailNotificationService.getPasswordResetTemplate(nome, resetLink);
    const success = await EmailNotificationService.sendEmail(to, template);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email de recuperação enviado com sucesso!',
        template: {
          subject: template.subject,
          to: to
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Falha ao enviar email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro no teste de email de recuperação de senha:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

