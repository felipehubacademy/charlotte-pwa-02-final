import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug do fluxo de leads SEM Supabase Auth...');
    
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

    // 2. PULAR Supabase Auth e ir direto para Azure AD
    console.log('📋 PASSO 2: Criando usuário no Azure AD (SEM Supabase Auth)...');
    const azureService = new AzureADUserService();
    
    try {
      const azureUser = await azureService.createTrialUser(nome, email, nivel, senha);
      
      if (!azureUser) {
        console.error('❌ Azure AD retornou null');
        return NextResponse.json(
          { error: 'Erro ao criar conta no sistema corporativo' },
          { status: 500 }
        );
      }
      
      console.log('✅ Usuário criado no Azure AD:', azureUser.id);
      
      return NextResponse.json({
        success: true,
        message: 'Fluxo SEM Supabase Auth funcionou',
        data: {
          leadId: newLead.id,
          azureUserId: azureUser.id
        }
      });
      
    } catch (azureError) {
      console.error('❌ Erro específico do Azure AD:', azureError);
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
