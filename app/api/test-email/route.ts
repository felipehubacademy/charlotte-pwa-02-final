import { NextRequest, NextResponse } from 'next/server';
import { SimpleEmailService } from '@/lib/simple-email-service';

export async function POST(request: NextRequest) {
  try {
    const { to, nome, nivel } = await request.json();

    if (!to || !nome || !nivel) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: to, nome, nivel' },
        { status: 400 }
      );
    }

    // Testar envio de email de boas-vindas
    const template = SimpleEmailService.getWelcomeTemplate(nome, nivel);
    const success = await SimpleEmailService.sendEmail(to, template);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email de teste enviado com sucesso!',
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
    console.error('Erro no teste de email:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
