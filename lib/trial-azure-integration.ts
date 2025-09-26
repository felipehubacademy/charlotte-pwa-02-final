// lib/trial-azure-integration.ts
// Integração de trials com Azure AD

import { createClient } from '@supabase/supabase-js';
import AzureADUserService from './azure-ad-user-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TrialLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nivel_ingles: 'Novice' | 'Inter' | 'Advanced';
  user_id?: string;
  azure_user_id?: string;
  data_expiracao?: string;
}

export class TrialAzureIntegration {
  
  // Criar trial completo: Lead + Azure AD + Supabase Auth
  static async createCompleteTrial(leadData: {
    nome: string;
    email: string;
    telefone: string;
    nivel: 'Novice' | 'Inter' | 'Advanced';
    senha: string;
  }): Promise<{
    success: boolean;
    leadId?: string;
    azureUserId?: string;
    supabaseUserId?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Criando trial completo para:', leadData.email);

      // 1. Criar lead no Supabase
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          nome: leadData.nome,
          email: leadData.email,
          telefone: leadData.telefone,
          nivel_ingles: leadData.nivel,
          status: 'pending'
        })
        .select()
        .single();

      if (leadError || !lead) {
        console.error('❌ Erro ao criar lead:', leadError);
        return { success: false, error: 'Erro ao criar lead' };
      }

      // 2. Criar usuário no Azure AD
      const azureService = new AzureADUserService();
      const azureUser = await azureService.createTrialUser(
        leadData.nome,
        leadData.email,
        leadData.nivel,
        leadData.senha
      );

      if (!azureUser) {
        // Limpar lead se Azure AD falhar
        await supabase.from('leads').delete().eq('id', lead.id);
        return { success: false, error: 'Erro ao criar usuário no Azure AD' };
      }

      // 3. Criar usuário no Supabase Auth (para login)
      const { data: supabaseUser, error: authError } = await supabase.auth.admin.createUser({
        email: leadData.email,
        password: leadData.senha,
        email_confirm: true,
        user_metadata: {
          nome: leadData.nome,
          telefone: leadData.telefone,
          nivel_ingles: leadData.nivel,
          is_trial: true,
          lead_id: lead.id,
          azure_user_id: azureUser.id
        }
      });

      if (authError || !supabaseUser.user) {
        // Limpar Azure AD e lead se Supabase Auth falhar
        await AzureADUserService.disableTrialUser(azureUser.id);
        await supabase.from('leads').delete().eq('id', lead.id);
        return { success: false, error: 'Erro ao criar usuário no Supabase Auth' };
      }

      // 4. Atualizar lead com IDs
      await supabase
        .from('leads')
        .update({
          user_id: supabaseUser.user.id,
          azure_user_id: azureUser.id,
          data_expiracao: expirationDate.toISOString(),
          status: 'converted'
        })
        .eq('id', lead.id);

      // 5. Criar trial access
      await supabase.rpc('create_trial_access', {
        p_user_id: supabaseUser.user.id,
        p_lead_id: lead.id,
        p_nivel_ingles: leadData.nivel
      });

      console.log('✅ Trial completo criado com sucesso');
      return {
        success: true,
        leadId: lead.id,
        azureUserId: azureUser.id,
        supabaseUserId: supabaseUser.user.id
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar trial completo:', error);
      return { success: false, error: error.message };
    }
  }

  // Expirar trial: mover para grupo expirado
  static async expireTrial(leadId: string): Promise<boolean> {
    try {
      console.log('⏰ Expirado trial:', leadId);

      // 1. Buscar dados do lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        console.error('❌ Lead não encontrado:', leadId);
        return false;
      }

      // 2. Mover usuário para grupo expirado no Azure AD
      if (lead.azure_user_id) {
        await AzureADUserService.moveUserToExpiredGroup(lead.azure_user_id);
      }

      // 3. Desabilitar usuário no Azure AD
      if (lead.azure_user_id) {
        await AzureADUserService.disableTrialUser(lead.azure_user_id);
      }

      // 4. Atualizar status no Supabase
      await supabase
        .from('leads')
        .update({ status: 'expired' })
        .eq('id', leadId);

      await supabase
        .from('trial_access')
        .update({ status: 'expired' })
        .eq('lead_id', leadId);

      console.log('✅ Trial expirado com sucesso');
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao expirar trial:', error);
      return false;
    }
  }


  // Verificar status do trial
  static async getTrialStatus(leadId: string): Promise<{
    isActive: boolean;
    isExpired: boolean;
    daysRemaining: number;
    azureUser?: any;
  }> {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*, trial_access(*)')
        .eq('id', leadId)
        .single();

      if (error || !lead) {
        return { isActive: false, isExpired: true, daysRemaining: 0 };
      }

      const now = new Date();
      const endDate = new Date(lead.data_expiracao);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining <= 0;

      // Buscar dados do usuário no Azure AD
      let azureUser = null;
      if (lead.azure_user_id) {
        azureUser = await AzureADUserService.getUserByEmail(lead.email);
      }

      return {
        isActive: !isExpired && lead.status === 'converted',
        isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        azureUser
      };

    } catch (error: any) {
      console.error('❌ Erro ao verificar status do trial:', error);
      return { isActive: false, isExpired: true, daysRemaining: 0 };
    }
  }
}

export default TrialAzureIntegration;
