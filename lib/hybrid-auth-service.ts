import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TrialUser {
  id: string;
  email: string;
  user_metadata: {
    nome: string;
    telefone: string;
    nivel_ingles: string;
    is_trial: boolean;
    lead_id: string;
  };
}

export class HybridAuthService {
  // Login para trial users via Supabase Auth
  static async loginTrialUser(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login trial:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Verificar se é realmente um trial user
      const isTrial = data.user.user_metadata?.is_trial === true;
      if (!isTrial) {
        await supabase.auth.signOut();
        return { success: false, error: 'Esta conta não é de trial' };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          user_metadata: data.user.user_metadata as TrialUser['user_metadata']
        },
        session: data.session
      };

    } catch (error) {
      console.error('Erro inesperado no login trial:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Logout para trial users
  static async logoutTrialUser() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout trial:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Erro inesperado no logout trial:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Verificar se usuário está logado via Supabase
  static async getCurrentTrialUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { success: false, user: null };
      }

      const isTrial = user.user_metadata?.is_trial === true;
      if (!isTrial) {
        return { success: false, user: null };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata as TrialUser['user_metadata']
        }
      };

    } catch (error) {
      console.error('Erro ao verificar usuário trial:', error);
      return { success: false, user: null };
    }
  }

  // Verificar se usuário tem trial ativo
  static async hasActiveTrial(userId: string) {
    try {
      const response = await fetch(`/api/trial/status?user_id=${userId}`);
      const data = await response.json();
      
      return data.hasTrial && data.trial?.diasRestantes > 0;
    } catch (error) {
      console.error('Erro ao verificar trial ativo:', error);
      return false;
    }
  }
}
