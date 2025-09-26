import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando login do trial...');
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    console.log('✅ Login bem-sucedido:', {
      userId: authData.user.id,
      email: authData.user.email,
      isTrial: authData.user.user_metadata?.is_trial
    });

    // Buscar dados do lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          isTrial: authData.user.user_metadata?.is_trial,
          leadId: authData.user.user_metadata?.lead_id
        },
        lead: leadData ? {
          id: leadData.id,
          nome: leadData.nome,
          nivel: leadData.nivel_ingles,
          status: leadData.status
        } : null,
        session: authData.session ? {
          accessToken: authData.session.access_token ? 'Presente' : 'Ausente',
          refreshToken: authData.session.refresh_token ? 'Presente' : 'Ausente'
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de login:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
