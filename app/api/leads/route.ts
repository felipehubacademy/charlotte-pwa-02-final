import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { HubSpotService } from '@/lib/hubspot-service';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Inicializar HubSpot se configurado
if (process.env.HUBSPOT_API_KEY) {
  HubSpotService.initialize(process.env.HUBSPOT_API_KEY, process.env.HUBSPOT_DEFAULT_OWNER_ID);
}

interface LeadData {
  nome: string;
  email: string;
  telefone: string;
  nivel: 'Novice' | 'Inter' | 'Advanced';
  senha: string;
  confirmarSenha: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json();
    const { nome, email, telefone, nivel, senha, confirmarSenha } = body;

    // Validação básica
    if (!nome || !email || !telefone || !nivel || !senha || !confirmarSenha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar senhas
    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (senha !== confirmarSenha) {
      return NextResponse.json(
        { error: 'Senhas não coincidem' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar telefone brasileiro
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(telefone)) {
      return NextResponse.json(
        { error: 'Formato de telefone inválido' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, status, user_id')
      .eq('email', email)
      .single();

    if (existingLead) {
      // Se já existe e tem user_id, redirecionar para instalação
      if (existingLead.user_id) {
        return NextResponse.json(
          { 
            success: true, 
            message: 'Lead já cadastrado',
            redirect: '/install'
          },
          { status: 200 }
        );
      }
      
      // Se existe mas não tem user_id, atualizar dados
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          nome,
          telefone,
          nivel_ingles: nivel,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Erro ao atualizar lead:', updateError);
        return NextResponse.json(
          { error: 'Erro ao processar cadastro' },
          { status: 500 }
        );
      }

      // Criar conta temporária
      const { data: userData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: senha, // Senha fornecida pelo usuário
        email_confirm: true,
        user_metadata: {
          nome,
          telefone,
          nivel_ingles: nivel,
          is_trial: true,
          lead_id: existingLead.id
        }
      });

      if (authError || !userData.user) {
        console.error('Erro ao criar usuário:', authError);
        return NextResponse.json(
          { error: 'Erro ao criar conta temporária' },
          { status: 500 }
        );
      }

      // Criar trial access
      const { error: trialError } = await supabase.rpc('create_trial_access', {
        p_user_id: userData.user.id,
        p_lead_id: existingLead.id,
        p_nivel_ingles: nivel
      });

      if (trialError) {
        console.error('Erro ao criar trial access:', trialError);
        // Tentar limpar usuário criado
        await supabase.auth.admin.deleteUser(userData.user.id);
        return NextResponse.json(
          { error: 'Erro ao configurar acesso temporário' },
          { status: 500 }
        );
      }

      // Enviar para HubSpot (se configurado)
      const hubspotContact = await HubSpotService.createContact({
        nome,
        email,
        telefone,
        nivel_ingles: nivel,
        lead_id: existingLead.id
      });

      if (hubspotContact) {
        // Atualizar lead com HubSpot ID
        await supabase
          .from('leads')
          .update({ hubspot_contact_id: hubspotContact.id })
          .eq('id', existingLead.id);
      }

      return NextResponse.json(
        { 
          success: true, 
          message: 'Lead atualizado e conta criada',
          redirect: '/install'
        },
        { status: 200 }
      );
    }

    // Criar lead no banco
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
      console.error('Erro ao criar lead:', leadError);
      return NextResponse.json(
        { error: 'Erro ao processar cadastro' },
        { status: 500 }
      );
    }

    // Criar usuário no Azure AD (definitivo)
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
        return NextResponse.json(
          { error: 'Erro ao criar conta no sistema corporativo' },
          { status: 500 }
        );
      }
      
      console.log('✅ Usuário criado no Azure AD:', azureUser.id);
      
      const azureUserId = azureUser.id;
      console.log('✅ Usuário criado no Azure AD:', azureUserId);
      
      // Atualizar lead com Azure ID
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          azure_user_id: azureUserId,
          data_expiracao: expirationDate.toISOString(),
          status: 'converted'
        })
        .eq('id', newLead.id);

      if (updateError) {
        console.error('Erro ao atualizar lead:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar lead' },
          { status: 500 }
        );
      }

      // Enviar para HubSpot (se configurado) - Criar contato e deal
      const hubspotResult = await HubSpotService.createContactAndDeal({
        nome,
        email,
        telefone,
        nivel_ingles: nivel,
        lead_id: newLead.id
      });

      if (hubspotResult.contact) {
        // Atualizar lead com HubSpot ID
        await supabase
          .from('leads')
          .update({ 
            hubspot_contact_id: hubspotResult.contact.id,
            hubspot_deal_id: hubspotResult.deal?.id || null
          })
          .eq('id', newLead.id);
        
        console.log('✅ Lead atualizado com HubSpot IDs:', {
          contact: hubspotResult.contact.id,
          deal: hubspotResult.deal?.id || 'N/A'
        });
      }

      // Agendar email de boas-vindas
      await scheduleWelcomeEmail(newLead.id, azureUserId);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Lead criado e conta temporária ativada',
          data: {
            leadId: newLead.id,
            azureUserId: azureUserId,
            hubspotContactId: hubspotResult.contact?.id,
            hubspotDealId: hubspotResult.deal?.id
          },
          redirect: '/install'
        },
        { status: 200 }
      );
      
    } catch (azureError) {
      console.error('❌ Erro específico do Azure AD:', azureError);
      console.error('❌ Stack trace:', azureError instanceof Error ? azureError.stack : 'N/A');
      return NextResponse.json(
        { 
          error: 'Erro ao criar conta no sistema corporativo',
          details: azureError instanceof Error ? azureError.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro na API de leads:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


// Função para agendar email de boas-vindas
async function scheduleWelcomeEmail(leadId: string, azureUserId: string) {
  try {
    await supabase
      .from('email_notifications')
      .insert({
        lead_id: leadId,
        azure_user_id: azureUserId,
        tipo: 'welcome',
        status: 'pending',
        data_agendamento: new Date().toISOString()
      });
  } catch (error) {
    console.error('Erro ao agendar email de boas-vindas:', error);
  }
}
