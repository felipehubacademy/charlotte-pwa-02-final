// supabase/functions/expire-trials/index.ts
// Edge Function para expirar trials automaticamente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('CRON_SECRET_TOKEN');
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando processo de expiração de trials...');

    // 1. Expirar trials automaticamente
    const { data: expiredCount, error: expireError } = await supabase.rpc('expire_trials');

    if (expireError) {
      console.error('❌ Erro ao expirar trials:', expireError);
      return new Response(
        JSON.stringify({ error: 'Erro ao expirar trials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ ${expiredCount} trials expirados`);

    // 2. Processar trials próximos do vencimento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: expiringTrials, error: expiringError } = await supabase
      .from('trial_access')
      .select(`
        id,
        user_id,
        data_fim,
        leads!inner(
          id,
          nome,
          email
        )
      `)
      .eq('status', 'active')
      .gte('data_fim', tomorrow.toISOString())
      .lte('data_fim', threeDaysFromNow.toISOString());

    if (expiringError) {
      console.error('❌ Erro ao buscar trials próximos do vencimento:', expiringError);
    } else {
      console.log(`📧 ${expiringTrials?.length || 0} trials próximos do vencimento encontrados`);
    }

    // 3. Processar fila de emails
    try {
      const emailResponse = await fetch(`${Deno.env.get('SITE_URL')}/api/email/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${expectedToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (emailResponse.ok) {
        console.log('📧 Fila de emails processada com sucesso');
      } else {
        console.error('❌ Erro ao processar fila de emails');
      }
    } catch (emailError) {
      console.error('❌ Erro ao chamar API de emails:', emailError);
    }

    // 4. Obter estatísticas
    const { data: stats, error: statsError } = await supabase
      .from('trial_access')
      .select('status')
      .not('status', 'is', null);

    let statsSummary = {
      totalTrials: 0,
      activeTrials: 0,
      expiredTrials: 0,
      convertedTrials: 0
    };

    if (!statsError && stats) {
      statsSummary = {
        totalTrials: stats.length,
        activeTrials: stats.filter(s => s.status === 'active').length,
        expiredTrials: stats.filter(s => s.status === 'expired').length,
        convertedTrials: stats.filter(s => s.status === 'converted').length
      };
    }

    console.log('📊 Estatísticas:', statsSummary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processo de expiração concluído',
        expiredTrials: expiredCount,
        expiringTrials: expiringTrials?.length || 0,
        stats: statsSummary,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no processo de expiração:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
