import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { password, confirmPassword, access_token, refresh_token } = await request.json();

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Senha e confirmação são obrigatórias' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Senhas não coincidem' },
        { status: 400 }
      );
    }

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Token de recuperação inválido' },
        { status: 400 }
      );
    }

    // Configurar sessão com os tokens fornecidos
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError || !sessionData.session) {
      console.error('Erro ao configurar sessão:', sessionError);
      return NextResponse.json(
        { error: 'Token de recuperação inválido ou expirado' },
        { status: 400 }
      );
    }

    // Verificar se é um usuário de trial
    const isTrial = sessionData.user.user_metadata?.is_trial === true;
    if (!isTrial) {
      return NextResponse.json(
        { error: 'Esta funcionalidade é apenas para usuários de trial' },
        { status: 403 }
      );
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar senha. Tente novamente.' },
        { status: 500 }
      );
    }

    // Fazer logout para forçar novo login
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
