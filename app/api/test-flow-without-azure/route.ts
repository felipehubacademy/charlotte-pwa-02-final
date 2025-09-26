import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HubSpotService } from '@/lib/hubspot-service';
import { EmailNotificationService } from '@/lib/email-notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando FLUXO SEM Azure AD...');
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Inicializar HubSpot se configurado
    if (process.env.HUBSPOT_API_KEY) {
      HubSpotService.initialize(process.env.HUBSPOT_API_KEY, process.env.HUBSPOT_DEFAULT_OWNER_ID);
      console.log('✅ HubSpot inicializado');
    }

    // Dados de teste
    const testData = {
      nome: 'Felipe Xavier Teste Sem Azure',
      email: 'felipe.semazure@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel: 'Advanced' as const,
      senha: 'Teste123!',
      confirmarSenha: 'Teste123!'
    };

    console.log('📋 Dados de teste:', testData);

    // PASSO 1: Criar lead no banco
    console.log('\n🔍 PASSO 1: Criando lead no banco...');
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: testData.nome,
        email: testData.email,
        telefone: testData.telefone,
        nivel_ingles: testData.nivel,
        status: 'pending'
      })
      .select()
      .single();

    if (leadError || !newLead) {
      throw new Error(`Erro ao criar lead: ${leadError?.message}`);
    }
    console.log('✅ Lead criado:', newLead.id);

    // PASSO 2: Criar usuário no Supabase Auth
    console.log('\n🔍 PASSO 2: Criando usuário no Supabase Auth...');
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email: testData.email,
      password: testData.senha,
      email_confirm: true,
      user_metadata: {
        nome: testData.nome,
        telefone: testData.telefone,
        nivel_ingles: testData.nivel,
        is_trial: true,
        lead_id: newLead.id
      }
    });

    if (authError || !userData.user) {
      throw new Error(`Erro ao criar usuário: ${authError?.message}`);
    }
    console.log('✅ Usuário criado:', userData.user.id);

    // PASSO 3: Criar trial access
    console.log('\n🔍 PASSO 3: Criando trial access...');
    const { error: trialError } = await supabase.rpc('create_trial_access', {
      p_user_id: userData.user.id,
      p_lead_id: newLead.id,
      p_nivel_ingles: testData.nivel
    });

    if (trialError) {
      console.warn('⚠️ Erro ao criar trial access:', trialError);
    } else {
      console.log('✅ Trial access criado');
    }

    // PASSO 4: Criar contato e deal no HubSpot
    console.log('\n🔍 PASSO 4: Criando contato e deal no HubSpot...');
    const hubspotResult = await HubSpotService.createContactAndDeal({
      nome: testData.nome,
      email: testData.email,
      telefone: testData.telefone,
      nivel_ingles: testData.nivel,
      lead_id: newLead.id
    });

    if (!hubspotResult.contact) {
      console.warn('⚠️ Falha ao criar contato no HubSpot');
    } else {
      console.log('✅ HubSpot criado:', {
        contactId: hubspotResult.contact.id,
        dealId: hubspotResult.deal?.id || 'N/A'
      });
    }

    // PASSO 5: Atualizar lead com IDs do HubSpot
    console.log('\n🔍 PASSO 5: Atualizando lead com IDs do HubSpot...');
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        hubspot_contact_id: hubspotResult.contact?.id || null,
        hubspot_deal_id: hubspotResult.deal?.id || null
      })
      .eq('id', newLead.id);

    if (updateError) {
      console.warn('⚠️ Erro ao atualizar lead:', updateError);
    } else {
      console.log('✅ Lead atualizado com IDs do HubSpot');
    }

    // PASSO 6: Enviar email de boas-vindas
    console.log('\n🔍 PASSO 6: Enviando email de boas-vindas...');
    const welcomeTemplate = EmailNotificationService.getWelcomeTemplate(testData.nome, testData.nivel);
    const emailSent = await EmailNotificationService.sendEmail(testData.email, welcomeTemplate);
    
    if (emailSent) {
      console.log('✅ Email de boas-vindas enviado');
    } else {
      console.warn('⚠️ Falha ao enviar email de boas-vindas');
    }

    return NextResponse.json({
      success: true,
      message: 'Fluxo sem Azure AD executado com sucesso!',
      data: {
        lead: {
          id: newLead.id,
          nome: newLead.nome,
          email: newLead.email,
          status: newLead.status
        },
        user: {
          id: userData.user.id,
          email: userData.user.email
        },
        hubspot: {
          contactId: hubspotResult.contact?.id,
          dealId: hubspotResult.deal?.id
        },
        email: {
          sent: emailSent,
          template: welcomeTemplate.subject
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no fluxo sem Azure AD:', error);
    return NextResponse.json(
      { 
        error: 'Erro no fluxo sem Azure AD',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
