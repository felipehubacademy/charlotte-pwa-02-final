import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HubSpotService } from '@/lib/hubspot-service';
import TrialAzureIntegration from '@/lib/trial-azure-integration';
import { EmailNotificationService } from '@/lib/email-notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando FLUXO COMPLETO End-to-End...');
    
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
      nome: 'Felipe Xavier Teste Completo',
      email: 'felipe.completo@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel: 'Advanced' as const,
      senha: 'Teste123!',
      confirmarSenha: 'Teste123!'
    };

    console.log('📋 Dados de teste:', testData);

    // PASSO 1: Validar dados (simular validação do frontend)
    console.log('\n🔍 PASSO 1: Validando dados...');
    if (testData.senha !== testData.confirmarSenha) {
      throw new Error('Senhas não coincidem');
    }
    console.log('✅ Dados validados');

    // PASSO 2: Verificar se email já existe
    console.log('\n🔍 PASSO 2: Verificando email existente...');
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, email')
      .eq('email', testData.email)
      .single();

    if (existingLead) {
      console.log('⚠️ Email já existe, atualizando lead existente');
    } else {
      console.log('✅ Email disponível');
    }

    // PASSO 3: Criar trial completo usando Azure AD
    console.log('\n🔍 PASSO 3: Criando trial completo...');
    const trialResult = await TrialAzureIntegration.createCompleteTrial({
      nome: testData.nome,
      email: testData.email,
      telefone: testData.telefone,
      nivel: testData.nivel,
      senha: testData.senha
    });

    if (!trialResult.success) {
      throw new Error(`Falha ao criar trial: ${trialResult.error}`);
    }
    console.log('✅ Trial criado:', {
      leadId: trialResult.leadId,
      supabaseUserId: trialResult.supabaseUserId,
      azureUserId: trialResult.azureUserId
    });

    // PASSO 4: Criar contato e deal no HubSpot
    console.log('\n🔍 PASSO 4: Criando contato e deal no HubSpot...');
    const hubspotResult = await HubSpotService.createContactAndDeal({
      nome: testData.nome,
      email: testData.email,
      telefone: testData.telefone,
      nivel_ingles: testData.nivel,
      lead_id: trialResult.leadId!
    });

    if (!hubspotResult.contact) {
      throw new Error('Falha ao criar contato no HubSpot');
    }
    console.log('✅ HubSpot criado:', {
      contactId: hubspotResult.contact.id,
      dealId: hubspotResult.deal?.id || 'N/A'
    });

    // PASSO 5: Atualizar lead com IDs do HubSpot
    console.log('\n🔍 PASSO 5: Atualizando lead com IDs do HubSpot...');
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        hubspot_contact_id: hubspotResult.contact.id,
        hubspot_deal_id: hubspotResult.deal?.id || null
      })
      .eq('id', trialResult.leadId);

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

    // PASSO 7: Verificar dados no banco
    console.log('\n🔍 PASSO 7: Verificando dados no banco...');
    const { data: finalLead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', trialResult.leadId)
      .single();

    if (leadError) {
      console.warn('⚠️ Erro ao buscar lead final:', leadError);
    } else {
      console.log('✅ Lead final:', {
        id: finalLead.id,
        nome: finalLead.nome,
        email: finalLead.email,
        status: finalLead.status,
        hubspot_contact_id: finalLead.hubspot_contact_id,
        hubspot_deal_id: finalLead.hubspot_deal_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Fluxo completo executado com sucesso!',
      data: {
        trial: {
          leadId: trialResult.leadId,
          supabaseUserId: trialResult.supabaseUserId,
          azureUserId: trialResult.azureUserId
        },
        hubspot: {
          contactId: hubspotResult.contact?.id,
          dealId: hubspotResult.deal?.id
        },
        email: {
          sent: emailSent,
          template: welcomeTemplate.subject
        },
        lead: finalLead ? {
          id: finalLead.id,
          status: finalLead.status,
          hubspot_contact_id: finalLead.hubspot_contact_id,
          hubspot_deal_id: finalLead.hubspot_deal_id
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro no fluxo completo:', error);
    return NextResponse.json(
      { 
        error: 'Erro no fluxo completo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
