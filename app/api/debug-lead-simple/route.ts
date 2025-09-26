import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug simples do fluxo de leads...');
    
    const { nome, email, telefone, nivel, senha } = await request.json();
    
    console.log('📋 Dados recebidos:', { nome, email, telefone, nivel, senha: '***' });
    
    // 1. Criar lead no Supabase
    console.log('📋 PASSO 1: Criando lead no Supabase...');
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
    
    if (leadError) {
      console.error('❌ Erro ao criar lead:', leadError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar lead no Supabase',
        details: leadError.message
      });
    }
    
    console.log('✅ Lead criado:', newLead.id);
    
    // 2. Criar usuário no Azure AD
    console.log('📋 PASSO 2: Criando usuário no Azure AD...');
    const azureService = new AzureADUserService();
    
    // Testar criação direta do usuário
    console.log('📋 PASSO 2a: Testando criação direta...');
    const azureUser = await azureService.createTrialUser(nome, email, nivel, senha);
    
    if (!azureUser) {
      console.error('❌ Azure AD retornou null - testando com email diferente...');
      
      // Testar com email diferente
      const testEmail = `teste.${Date.now()}@hubacademybr.com`;
      console.log('📋 PASSO 2b: Testando com email:', testEmail);
      const azureUser2 = await azureService.createTrialUser(nome, testEmail, nivel, senha);
      
      if (!azureUser2) {
        console.error('❌ Azure AD falhou mesmo com email diferente');
        return NextResponse.json({
          success: false,
          error: 'Azure AD falhou com ambos os emails',
          leadId: newLead.id,
          originalEmail: email,
          testEmail: testEmail
        });
      }
      
      console.log('✅ Usuário Azure criado com email alternativo:', azureUser2.id);
      
      return NextResponse.json({
        success: true,
        message: 'Fluxo funcionou com email alternativo',
        data: {
          leadId: newLead.id,
          azureUserId: azureUser2.id,
          originalEmail: email,
          usedEmail: testEmail
        }
      });
    }
    
    console.log('✅ Usuário Azure criado:', azureUser.id);
    
    return NextResponse.json({
      success: true,
      message: 'Fluxo simples funcionou',
      data: {
        leadId: newLead.id,
        azureUserId: azureUser.id
      }
    });
    
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
