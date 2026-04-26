import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { disableUser } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // ----------------------------------------------------------
    // 1. Validar CRON_SECRET_TOKEN
    // ----------------------------------------------------------
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      console.error('CRON_SECRET_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Cron secret token não configurado' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ----------------------------------------------------------
    // 2. Buscar leads com data_expiracao < now() e status != 'expired'
    // ----------------------------------------------------------
    const { data: expiredLeadsRaw, error: queryError } = await supabase
      .from('leads')
      .select('id, user_id, email, nivel_ingles')
      .lt('data_expiracao', new Date().toISOString())
      .neq('status', 'expired');

    if (queryError) {
      console.error('❌ Erro ao buscar trials expirados:', queryError);
      return NextResponse.json(
        { error: 'Erro ao buscar trials expirados' },
        { status: 500 }
      );
    }

    interface ExpiredLead {
      id: string;
      user_id: string | null;
      email: string;
      nivel_ingles: string;
    }

    const leads = (expiredLeadsRaw || []) as ExpiredLead[];
    console.log(`🔍 Encontrados ${leads.length} trials para expirar`);

    let expiredCount = 0;

    for (const lead of leads) {
      try {
        // --------------------------------------------------------
        // 3. UPDATE leads SET status = 'expired'
        // --------------------------------------------------------
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (leadUpdateError) {
          console.error(`❌ Erro ao expirar lead ${lead.id}:`, leadUpdateError);
          continue;
        }

        // --------------------------------------------------------
        // 4. UPDATE profiles SET is_active = false
        // --------------------------------------------------------
        if (lead.user_id) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.user_id);

          if (profileUpdateError) {
            console.warn(
              `⚠️ Erro ao desativar profile ${lead.user_id}:`,
              profileUpdateError.message
            );
          }

          // Banir usuário no Supabase Auth para bloquear novos logins
          await disableUser(lead.user_id);
        }

        // Atualizar trial_access também
        await supabase
          .from('trial_access')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('lead_id', lead.id)
          .eq('status', 'active');

        expiredCount++;
        console.log(`✅ Trial expirado: lead=${lead.id}, user=${lead.user_id}`);
      } catch (leadErr) {
        console.error(`❌ Erro ao processar lead ${lead.id}:`, leadErr);
      }
    }

    console.log(`✅ Cron job finalizado: ${expiredCount} trials expirados`);

    // ----------------------------------------------------------
    // 5. Retornar { expiredCount }
    // ----------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: `${expiredCount} trials expirados`,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro no cron job de expiração:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
