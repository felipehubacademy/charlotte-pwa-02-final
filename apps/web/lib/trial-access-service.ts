// lib/trial-access-service.ts
// Serviço para controle de acesso temporário

import { createClient } from '@supabase/supabase-js';

// Supabase client (lazy, via getter)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export interface TrialStatus {
  hasTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialData?: {
    id: string;
    dataInicio: string;
    dataFim: string;
    status: string;
    nivelIngles: string;
    lead?: {
      nome: string;
      email: string;
      telefone: string;
    };
  };
}

export class TrialAccessService {
  
  // Verificar status do trial de um usuário
  static async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const { data: trialData, error } = await getSupabase()
        .from('trial_access')
        .select(`
          id,
          data_inicio,
          data_fim,
          status,
          nivel_ingles,
          leads!inner(
            nome,
            email,
            telefone
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !trialData) {
        return {
          hasTrial: false,
          isExpired: false,
          daysRemaining: 0
        };
      }

      // Calcular dias restantes
      const now = new Date();
      const endDate = new Date(trialData.data_fim);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining <= 0;

      return {
        hasTrial: true,
        isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        trialData: {
          id: trialData.id,
          dataInicio: trialData.data_inicio,
          dataFim: trialData.data_fim,
          status: trialData.status,
          nivelIngles: trialData.nivel_ingles,
          lead: trialData.leads[0]
        }
      };

    } catch (error) {
      console.error('Erro ao verificar status do trial:', error);
      return {
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      };
    }
  }

  // Verificar se usuário tem acesso (não expirado)
  static async hasAccess(userId: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      return trialStatus.hasTrial && !trialStatus.isExpired;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  }

  // Expirar trials automaticamente
  static async expireTrials(): Promise<number> {
    try {
      const { data: expiredCount, error } = await getSupabase().rpc('expire_trials');

      if (error) {
        console.error('Erro ao expirar trials:', error);
        return 0;
      }

      console.log(`✅ ${expiredCount} trials expirados automaticamente`);
      return expiredCount || 0;

    } catch (error) {
      console.error('Erro ao expirar trials:', error);
      return 0;
    }
  }

  // Criar trial access para um usuário
  static async createTrialAccess(
    userId: string, 
    leadId: string, 
    nivelIngles: string
  ): Promise<boolean> {
    try {
      const { error } = await getSupabase().rpc('create_trial_access', {
        p_user_id: userId,
        p_lead_id: leadId,
        p_nivel_ingles: nivelIngles
      });

      if (error) {
        console.error('Erro ao criar trial access:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao criar trial access:', error);
      return false;
    }
  }

  // Cancelar trial de um usuário
  static async cancelTrial(userId: string): Promise<boolean> {
    try {
      const { error } = await getSupabase()
        .from('trial_access')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao cancelar trial:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao cancelar trial:', error);
      return false;
    }
  }

  // Converter trial em assinatura paga
  static async convertTrial(userId: string): Promise<boolean> {
    try {
      const { error } = await getSupabase()
        .from('trial_access')
        .update({ 
          status: 'converted',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao converter trial:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao converter trial:', error);
      return false;
    }
  }

  // Obter estatísticas de trials
  static async getTrialStats(): Promise<{
    totalTrials: number;
    activeTrials: number;
    expiredTrials: number;
    convertedTrials: number;
  }> {
    try {
      const { data: stats, error } = await getSupabase()
        .from('trial_access')
        .select('status')
        .not('status', 'is', null);

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
          totalTrials: 0,
          activeTrials: 0,
          expiredTrials: 0,
          convertedTrials: 0
        };
      }

      const totalTrials = stats.length;
      const activeTrials = stats.filter(s => s.status === 'active').length;
      const expiredTrials = stats.filter(s => s.status === 'expired').length;
      const convertedTrials = stats.filter(s => s.status === 'converted').length;

      return {
        totalTrials,
        activeTrials,
        expiredTrials,
        convertedTrials
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalTrials: 0,
        activeTrials: 0,
        expiredTrials: 0,
        convertedTrials: 0
      };
    }
  }

  // Verificar e processar trials que estão próximos do vencimento
  static async processExpiringTrials(): Promise<void> {
    try {
      // Buscar trials que expiram em 1, 2 ou 3 dias
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: expiringTrials, error } = await getSupabase()
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

      if (error) {
        console.error('Erro ao buscar trials próximos do vencimento:', error);
        return;
      }

      // Processar cada trial próximo do vencimento
      for (const trial of expiringTrials || []) {
        const daysRemaining = Math.ceil(
          (new Date(trial.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Agendar email de lembrete se ainda não foi enviado
        if (daysRemaining <= 3) {
          // Verificar se já existe notificação de lembrete
          const { data: existingReminder } = await getSupabase()
            .from('email_notifications')
            .select('id')
            .eq('lead_id', trial.leads[0].id)
            .eq('tipo', 'reminder')
            .eq('status', 'sent')
            .single();

          if (!existingReminder) {
            // Agendar email de lembrete
            const { EmailNotificationService } = await import('./email-notification-service');
            await EmailNotificationService.scheduleReminderEmail(
              trial.leads[0].id,
              trial.user_id,
              daysRemaining - 1
            );
          }
        }
      }

      console.log(`📧 Processados ${expiringTrials?.length || 0} trials próximos do vencimento`);

    } catch (error) {
      console.error('Erro ao processar trials próximos do vencimento:', error);
    }
  }
}
