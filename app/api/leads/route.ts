import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { HubSpotService } from '@/lib/hubspot-service';

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
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json();
    const { nome, email, telefone, nivel } = body;

    // Validação básica
    if (!nome || !email || !telefone || !nivel) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
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
        password: uuidv4(), // Senha aleatória
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

    // Criar novo lead
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

    // Criar conta temporária
    const { data: userData2, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: uuidv4(), // Senha aleatória
      email_confirm: true,
      user_metadata: {
        nome,
        telefone,
        nivel_ingles: nivel,
        is_trial: true,
        lead_id: newLead.id
      }
    });

    if (authError || !userData2.user) {
      console.error('Erro ao criar usuário:', authError);
      return NextResponse.json(
        { error: 'Erro ao criar conta temporária' },
        { status: 500 }
      );
    }

    // Criar trial access
    const { error: trialError } = await supabase.rpc('create_trial_access', {
      p_user_id: userData2.user.id,
      p_lead_id: newLead.id,
      p_nivel_ingles: nivel
    });

    if (trialError) {
      console.error('Erro ao criar trial access:', trialError);
      // Tentar limpar usuário criado
      await supabase.auth.admin.deleteUser(userData2.user.id);
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
      lead_id: newLead.id
    });

    if (hubspotContact) {
      // Atualizar lead com HubSpot ID
      await supabase
        .from('leads')
        .update({ hubspot_contact_id: hubspotContact.id })
        .eq('id', newLead.id);
    }

    // Agendar email de boas-vindas
    await scheduleWelcomeEmail(newLead.id, userData2.user.id);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead criado e conta temporária ativada',
        redirect: '/install'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de leads:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


// Função para agendar email de boas-vindas
async function scheduleWelcomeEmail(leadId: string, userId: string) {
  try {
    await supabase
      .from('email_notifications')
      .insert({
        lead_id: leadId,
        user_id: userId,
        tipo: 'welcome',
        status: 'pending',
        data_agendamento: new Date().toISOString()
      });
  } catch (error) {
    console.error('Erro ao agendar email de boas-vindas:', error);
  }
}
