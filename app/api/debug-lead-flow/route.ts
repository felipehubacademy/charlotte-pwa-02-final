import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureADUserService } from '@/lib/azure-ad-user-service';
import { HubSpotService } from '@/lib/hubspot-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug do fluxo de leads...');
    
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
    const azureUser = await azureService.createTrialUser(nome, email, nivel, senha);
    
    if (!azureUser) {
      console.error('❌ Erro ao criar usuário no Azure AD');
      // Limpar lead
      await supabase.from('leads').delete().eq('id', newLead.id);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar usuário no Azure AD',
        leadId: newLead.id
      });
    }
    
    console.log('✅ Usuário Azure criado:', azureUser.id);
    
    // 3. Criar usuário no Supabase Auth
    console.log('📋 PASSO 3: Criando usuário no Supabase Auth...');
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        is_trial: true,
        lead_id: newLead.id,
        azure_user_id: azureUser.id
      }
    });
    
    if (authError || !userData.user) {
      console.error('❌ Erro ao criar usuário no Supabase Auth:', authError);
      // Limpar Azure AD e lead
      await azureService.disableTrialUser(azureUser.id);
      await supabase.from('leads').delete().eq('id', newLead.id);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar usuário no Supabase Auth',
        details: authError?.message,
        leadId: newLead.id,
        azureUserId: azureUser.id
      });
    }
    
    console.log('✅ Usuário Supabase Auth criado:', userData.user.id);
    
    // 4. Atualizar lead com IDs
    console.log('📋 PASSO 4: Atualizando lead com IDs...');
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        user_id: userData.user.id,
        azure_user_id: azureUser.id,
        data_expiracao: expirationDate.toISOString(),
        status: 'converted'
      })
      .eq('id', newLead.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar lead:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar lead',
        details: updateError.message,
        leadId: newLead.id,
        azureUserId: azureUser.id,
        userId: userData.user.id
      });
    }
    
    console.log('✅ Lead atualizado com IDs');
    
    // 5. Criar HubSpot contact e deal
    console.log('📋 PASSO 5: Criando HubSpot contact e deal...');
    const hubspotResult = await HubSpotService.createContactAndDeal({
      nome,
      email,
      telefone,
      nivel_ingles: nivel,
      lead_id: newLead.id
    });
    
    if (hubspotResult.contact) {
      console.log('✅ HubSpot contact criado:', hubspotResult.contact.id);
      
      // Atualizar lead com HubSpot IDs
      await supabase
        .from('leads')
        .update({ 
          hubspot_contact_id: hubspotResult.contact.id,
          hubspot_deal_id: hubspotResult.deal?.id || null
        })
        .eq('id', newLead.id);
      
      console.log('✅ Lead atualizado com HubSpot IDs');
    } else {
      console.log('⚠️ HubSpot contact não criado');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fluxo de lead debugado com sucesso',
      data: {
        leadId: newLead.id,
        userId: userData.user.id,
        azureUserId: azureUser.id,
        hubspotContactId: hubspotResult.contact?.id,
        hubspotDealId: hubspotResult.deal?.id
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no debug do fluxo:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro no debug do fluxo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
