import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { HubSpotService } from '@/lib/hubspot-service';

// Inicializar HubSpot se configurado
if (process.env.HUBSPOT_API_KEY) {
  HubSpotService.initialize(
    process.env.HUBSPOT_API_KEY,
    process.env.HUBSPOT_DEFAULT_OWNER_ID
  );
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
  const supabase = getSupabaseAdmin();

  try {
    const body: LeadData = await request.json();
    const { nome, email, telefone, nivel, senha, confirmarSenha } = body;

    // ----------------------------------------------------------
    // 1. Validar inputs
    // ----------------------------------------------------------
    if (!nome || !email || !telefone || !nivel || !senha || !confirmarSenha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(telefone)) {
      return NextResponse.json(
        { error: 'Formato de telefone inválido. Use: (XX) XXXXX-XXXX' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 2. Verificar se email já existe em leads
    // ----------------------------------------------------------
    interface ExistingLead {
      id: string;
      status: string;
      user_id: string | null;
    }

    const { data: existingLeadRaw } = await supabase
      .from('leads')
      .select('id, status, user_id')
      .eq('email', email)
      .maybeSingle();

    const existingLead = existingLeadRaw as ExistingLead | null;

    if (existingLead?.user_id) {
      // Já tem conta criada — redirecionar para instalação
      return NextResponse.json(
        {
          success: true,
          message: 'Lead já cadastrado',
          redirect: '/install',
        },
        { status: 200 }
      );
    }

    // ----------------------------------------------------------
    // 3. Criar lead no Supabase (tabela leads)
    // ----------------------------------------------------------
    let leadId: string;

    if (existingLead) {
      // Atualizar lead existente sem user_id
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          nome,
          telefone,
          nivel_ingles: nivel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead:', updateError);
        return NextResponse.json(
          { error: 'Erro ao processar cadastro' },
          { status: 500 }
        );
      }

      leadId = existingLead.id;
    } else {
      const { data: newLeadRaw, error: leadError } = await supabase
        .from('leads')
        .insert({
          nome,
          email,
          telefone,
          nivel_ingles: nivel,
          status: 'pending',
        })
        .select('id')
        .single();

      const newLead = newLeadRaw as { id: string } | null;

      if (leadError || !newLead) {
        console.error('❌ Erro ao criar lead:', leadError);
        return NextResponse.json(
          { error: 'Erro ao processar cadastro' },
          { status: 500 }
        );
      }

      leadId = newLead.id;
    }

    // ----------------------------------------------------------
    // 4. Criar usuário via supabaseAdmin.createUser()
    // ----------------------------------------------------------
    const newUser = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      app_metadata: { user_level: nivel },
      user_metadata: {
        nome,
        telefone,
        nivel_ingles: nivel,
        is_trial: true,
        lead_id: leadId,
      },
    });

    if (newUser.error || !newUser.data.user) {
      console.error('❌ Erro ao criar usuário Supabase Auth:', newUser.error);
      return NextResponse.json(
        { error: 'Erro ao criar conta de acesso' },
        { status: 500 }
      );
    }

    const userId = newUser.data.user.id;

    // ----------------------------------------------------------
    // 5. Definir user_level e trial_expires_at no profile
    // ----------------------------------------------------------
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          name: nome,
          user_level: nivel,
          is_active: true,
          trial_expires_at: trialExpiresAt.toISOString(),
          entra_id: userId, // backward compat
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn('⚠️ Erro ao criar profile:', profileError.message);
      // Não bloquear o fluxo — profile pode ser criado no login
    }

    // Atualizar lead com user_id e data de expiração
    await supabase
      .from('leads')
      .update({
        user_id: userId,
        data_expiracao: trialExpiresAt.toISOString(),
        status: 'converted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    // ----------------------------------------------------------
    // 6. Criar registro em trial_access
    // ----------------------------------------------------------
    const { error: trialError } = await supabase.rpc('create_trial_access', {
      p_user_id: userId,
      p_lead_id: leadId,
      p_nivel_ingles: nivel,
    });

    if (trialError) {
      console.warn('⚠️ Erro ao criar trial_access via RPC:', trialError.message);
      // Tentar inserir diretamente como fallback
      await supabase.from('trial_access').insert({
        user_id: userId,
        lead_id: leadId,
        data_fim: trialExpiresAt.toISOString(),
        nivel_ingles: nivel,
        status: 'active',
      });
    }

    // ----------------------------------------------------------
    // 7. Disparar HubSpot (manter existente)
    // ----------------------------------------------------------
    let hubspotContactId: string | null = null;
    let hubspotDealId: string | null = null;

    try {
      const hubspotResult = await HubSpotService.createContactAndDeal({
        nome,
        email,
        telefone,
        nivel_ingles: nivel,
        lead_id: leadId,
      });

      if (hubspotResult.contact) {
        hubspotContactId = hubspotResult.contact.id;
        hubspotDealId = hubspotResult.deal?.id || null;

        await supabase
          .from('leads')
          .update({
            hubspot_contact_id: hubspotContactId,
            hubspot_deal_id: hubspotDealId,
          })
          .eq('id', leadId);
      }
    } catch (hubspotErr) {
      console.warn('⚠️ HubSpot error (non-blocking):', hubspotErr);
    }

    // ----------------------------------------------------------
    // 8. Retornar { success, userId, leadId }
    // ----------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: 'Conta criada com sucesso',
        userId,
        leadId,
        hubspotContactId,
        hubspotDealId,
        redirect: '/install',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro na API de leads:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
