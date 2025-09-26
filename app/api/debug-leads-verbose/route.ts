import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug verbose do fluxo de leads...');
    
    const { nome, email, telefone, nivel, senha } = await request.json();
    
    console.log('📋 Dados recebidos:', { nome, email, telefone, nivel, senha: '***' });
    
    // 1. Criar lead no banco
    console.log('📋 PASSO 1: Criando lead no banco...');
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome,
        email,
        telefone,
        nivel_ingles: nivel,
        status: 'pending'
      })
      .select()
      .single();

    if (leadError || !newLead) {
      console.error('❌ Erro ao criar lead:', leadError);
      return NextResponse.json(
        { error: 'Erro ao processar cadastro' },
        { status: 500 }
      );
    }
    
    console.log('✅ Lead criado:', newLead.id);

    // 2. Criar usuário no Supabase Auth
    console.log('📋 PASSO 2: Criando usuário no Supabase Auth...');
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        telefone,
        nivel_ingles: nivel,
        is_trial: true,
        lead_id: newLead.id
      }
    });

    if (authError || !userData.user) {
      console.error('❌ Erro ao criar usuário:', authError);
      return NextResponse.json(
        { error: 'Erro ao criar conta temporária' },
        { status: 500 }
      );
    }
    
    console.log('✅ Usuário Supabase Auth criado:', userData.user.id);

    // 3. Criar trial access
    console.log('📋 PASSO 3: Criando trial access...');
    const { error: trialError } = await supabase.rpc('create_trial_access', {
      p_user_id: userData.user.id,
      p_lead_id: newLead.id,
      p_nivel_ingles: nivel
    });

    if (trialError) {
      console.error('❌ Erro ao criar trial access:', trialError);
      // Tentar limpar usuário criado
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: 'Erro ao configurar acesso temporário' },
        { status: 500 }
      );
    }
    
    console.log('✅ Trial access criado');

    // 4. Criar usuário no Azure AD (definitivo) - COM LOGS DETALHADOS
    console.log('📋 PASSO 4: Criando usuário no Azure AD...');
    console.log('🔧 Criando usuário no Azure AD...');
    const azureService = new AzureADUserService();
    
    try {
      console.log('📋 Chamando createTrialUser com parâmetros:');
      console.log('  - displayName:', nome);
      console.log('  - email:', email);
      console.log('  - nivel:', nivel);
      console.log('  - password:', '***');
      
      const azureUser = await azureService.createTrialUser(nome, email, nivel, senha);
      
      console.log('📊 Resultado do createTrialUser:', azureUser);
      
      if (!azureUser) {
        console.error('❌ Azure AD retornou null');
        // Limpar usuário criado no Supabase Auth
        await supabase.auth.admin.deleteUser(userData.user.id);
        return NextResponse.json(
          { error: 'Erro ao criar conta no sistema corporativo' },
          { status: 500 }
        );
      }
      
      console.log('✅ Usuário criado no Azure AD:', azureUser.id);
      
      return NextResponse.json({
        success: true,
        message: 'Fluxo verbose funcionou',
        data: {
          leadId: newLead.id,
          userId: userData.user.id,
          azureUserId: azureUser.id
        }
      });
      
    } catch (azureError) {
      console.error('❌ Erro específico do Azure AD:', azureError);
      console.error('❌ Stack trace:', azureError instanceof Error ? azureError.stack : 'N/A');
      // Limpar usuário criado no Supabase Auth
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { 
          error: 'Erro ao criar conta no sistema corporativo',
          details: azureError instanceof Error ? azureError.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro geral no debug',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
