import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug do contexto do fluxo de leads...');
    
    const { nome, email, telefone, nivel, senha } = await request.json();
    
    console.log('📋 Dados recebidos:', { nome, email, telefone, nivel, senha: '***' });
    
    // Verificar configuração
    console.log('📋 Configuração:');
    console.log('  - Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('  - Supabase Key:', supabaseServiceKey ? 'OK' : 'MISSING');
    console.log('  - Microsoft Client ID:', process.env.MICROSOFT_GRAPH_CLIENT_ID ? 'OK' : 'MISSING');
    console.log('  - Microsoft Client Secret:', process.env.MICROSOFT_GRAPH_CLIENT_SECRET ? 'OK' : 'MISSING');
    console.log('  - Microsoft Tenant ID:', process.env.MICROSOFT_GRAPH_TENANT_ID ? 'OK' : 'MISSING');
    
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

    // 3. Testar Azure AD com logs detalhados
    console.log('📋 PASSO 3: Testando Azure AD com logs detalhados...');
    
    try {
      console.log('📋 3a: Criando instância do AzureADUserService...');
      const azureService = new AzureADUserService();
      console.log('✅ Instância criada');
      
      console.log('📋 3b: Chamando createTrialUser...');
      console.log('  - displayName:', nome);
      console.log('  - email:', email);
      console.log('  - nivel:', nivel);
      console.log('  - password:', '***');
      
      const azureUser = await azureService.createTrialUser(nome, email, nivel, senha);
      
      console.log('📋 3c: Resultado do createTrialUser:', azureUser);
      
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
        message: 'Fluxo com logs detalhados funcionou',
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
          details: azureError instanceof Error ? azureError.message : 'Erro desconhecido',
          stack: azureError instanceof Error ? azureError.stack : undefined
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
