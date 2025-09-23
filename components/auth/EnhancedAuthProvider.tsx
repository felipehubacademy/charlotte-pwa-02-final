// components/auth/EnhancedAuthProvider.tsx
// AuthProvider com suporte a trial access

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalInstance, loginRequest, initializeMsal } from '@/lib/auth';
import { supabase, User, getSupabase } from '@/lib/supabase';
import { TrialAccessService, TrialStatus } from '@/lib/trial-access-service';
import toast from 'react-hot-toast';

interface EnhancedAuthContextType {
  user: User | null;
  msalAccount: AccountInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  trialStatus: TrialStatus;
  hasTrialAccess: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateLastActivity: () => Promise<void>;
  refreshTrialStatus: () => Promise<void>;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [msalAccount, setMsalAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    hasTrial: false,
    isExpired: false,
    daysRemaining: 0
  });

  const isAuthenticated = !!user && !!msalAccount;
  const hasTrialAccess = trialStatus.hasTrial && !trialStatus.isExpired;

  useEffect(() => {
    initializeAuth();
  }, []);

  // Verificar trial status quando user muda
  useEffect(() => {
    if (user?.id) {
      refreshTrialStatus();
    } else {
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
    }
  }, [user?.id]);

  const initializeAuth = async () => {
    try {
      await initializeMsal();
      
      // Processa redirect (se houver) sem duplicar lógica
      await msalInstance.handleRedirectPromise();
      
      // Verifica se tem usuário logado
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        setMsalAccount(account);
        
        try {
          await syncUserWithSupabase(account);
        } catch (syncError: any) {
          console.error('❌ User sync failed:', syncError);
          
          // Se erro for de acesso negado, fazer logout
          if (syncError.message?.includes('ACCESS_DENIED')) {
            console.log('🚫 Access denied, logging out...');
            await logout();
            toast.error('Acesso negado. Fale com a Hub Academy.');
            return;
          }
          
          // Para outros erros, usar fallback
          toast.error('Falha na sincronização do perfil, usando perfil temporário');
        }
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      toast.error('Falha na inicialização da autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se já tem interação em progresso
      const inProgress = msalInstance.getActiveAccount() !== null;
      if (inProgress) {
        console.log('🔄 Login already in progress, skipping...');
        return;
      }
      
      // loginRedirect não retorna response, apenas redireciona
      await msalInstance.loginRedirect(loginRequest);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Se for erro de interação em progresso, ignorar
      if (error.message?.includes('interaction_in_progress')) {
        console.log('🔄 Interaction already in progress, ignoring error');
        return;
      }
      
      toast.error('Falha no login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      setUser(null);
      setMsalAccount(null);
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
      
      // logoutRedirect não retorna response, apenas redireciona
      await msalInstance.logoutRedirect();
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Falha no logout. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrialStatus = async () => {
    if (!user?.id) {
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
      return;
    }

    try {
      const status = await TrialAccessService.getTrialStatus(user.id);
      setTrialStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status do trial:', error);
      setTrialStatus({
        hasTrial: false,
        isExpired: false,
        daysRemaining: 0
      });
    }
  };

  const syncUserWithSupabase = async (account: AccountInfo) => {
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        console.log('Supabase not configured, skipping user sync');
        // Create a mock user for development
        setUser({
          id: 'mock-id',
          entra_id: account.localAccountId,
          email: account.username,
          name: account.name || account.username,
          user_level: 'Novice',
          timezone: 'America/Sao_Paulo',
          preferred_reminder_time: '20:00:00',
          reminder_frequency: 'normal',
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      console.log('Starting user sync for user:', account.localAccountId ? 'user-***' : 'unknown');

      // ✅ NOVO: Verificar acesso antes de sincronizar
      let userLevel: 'Novice' | 'Inter' | 'Advanced';
      try {
        userLevel = await getUserLevel(account);
        console.log('User level determined:', userLevel);
      } catch (error: any) {
        console.error('❌ Error getting user level:', error);
        
        if (error.message?.includes('ACCESS_DENIED')) {
          console.log('🚫 Access denied - user not in Charlotte groups');
          throw new Error('ACCESS_DENIED: User is not in any Charlotte groups');
        }
        
        // Para erros de token/autenticação, tentar login novamente
        if (error.name === 'InteractionRequiredAuthError' || 
            error.errorCode === 'interaction_required') {
          console.log('🔄 Token expired, redirecting to login...');
          setUser(null);
          setMsalAccount(null);
          return;
        }
        
        // Para outros erros, usar fallback
        console.log('⚠️ Using fallback level due to error');
        userLevel = 'Novice';
      }
      
      const userData = {
        entra_id: account.localAccountId,
        email: account.username,
        name: account.name || account.username,
        user_level: userLevel,
        last_activity: new Date().toISOString(),
      };

      console.log('Attempting upsert for user:', userData.entra_id ? 'user-***' : 'unknown');

      const { data, error } = await supabaseClient
        .from('users')
        .upsert(userData, { 
          onConflict: 'entra_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from upsert');
      }

      console.log('User sync successful for user:', data.entra_id ? 'user-***' : 'unknown');
      setUser(data);
      
    } catch (error: any) {
      console.error('❌ User sync failed:', error);
      throw error;
    }
  };

  const getUserLevel = async (account: AccountInfo): Promise<'Novice' | 'Inter' | 'Advanced'> => {
    try {
      console.log('🔍 Getting user level from Entra ID groups...');
      
      let tokenResponse;
      try {
        tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ['GroupMember.Read.All'],
          account: account,
        });
        console.log('✅ Token acquired successfully via silent flow');
      } catch (silentError: any) {
        console.log('⚠️ Silent token acquisition failed, checking error type...');
        
        // Se o token expirou, limpar session e forçar novo login
        if (silentError.name === 'InteractionRequiredAuthError' || 
            silentError.errorCode === 'interaction_required') {
          console.log('🔄 Token expired, clearing session and forcing re-authentication...');
          
          // Limpar usuário atual para forçar novo login
          setUser(null);
          setMsalAccount(null);
          
          // Fazer logout e redirect para nova autenticação
          await msalInstance.logoutRedirect();
          return 'Advanced'; // Nunca vai chegar aqui por causa do redirect
        }
        
        // Para outros erros, bloquear acesso por segurança
        console.log('🚫 Unknown error getting user level, denying access for security');
        throw new Error('ACCESS_DENIED: Unable to verify user level due to technical error');
      }

      const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Graph API error:', response.status, response.statusText);
        console.log('🎯 Defaulting to Advanced level');
        return 'Advanced';
      }

      const groupsData = await response.json();
      console.log('📊 Groups found:', groupsData.value?.length || 0);
      
      const groups = groupsData.value || [];
      
      // Verificar grupos específicos do Charlotte
      const charlotteGroups = groups.filter((group: any) => 
        group.displayName?.includes('Charlotte') || 
        group.displayName?.includes('charlotte')
      );
      
      console.log('🎯 Charlotte groups found:', charlotteGroups.length);
      
      if (charlotteGroups.length === 0) {
        console.log('🚫 No Charlotte groups found, denying access');
        throw new Error('ACCESS_DENIED: User is not in any Charlotte groups');
      }
      
      // Determinar nível baseado nos grupos
      const hasNovice = charlotteGroups.some((group: any) => 
        group.displayName?.toLowerCase().includes('novice') ||
        group.displayName?.toLowerCase().includes('iniciante')
      );
      
      const hasInter = charlotteGroups.some((group: any) => 
        group.displayName?.toLowerCase().includes('inter') ||
        group.displayName?.toLowerCase().includes('intermediario')
      );
      
      const hasAdvanced = charlotteGroups.some((group: any) => 
        group.displayName?.toLowerCase().includes('advanced') ||
        group.displayName?.toLowerCase().includes('avancado')
      );
      
      console.log('🎯 Group analysis:', { hasNovice, hasInter, hasAdvanced });
      
      // Prioridade: Advanced > Inter > Novice
      if (hasAdvanced) {
        console.log('✅ User level: Advanced');
        return 'Advanced';
      } else if (hasInter) {
        console.log('✅ User level: Inter');
        return 'Inter';
      } else if (hasNovice) {
        console.log('✅ User level: Novice');
        return 'Novice';
      } else {
        console.log('🎯 Defaulting to Novice level');
        return 'Novice';
      }
      
    } catch (error: any) {
      console.error('❌ Error in getUserLevel:', error);
      throw error;
    }
  };

  const updateLastActivity = async () => {
    if (!user?.id) return;
    
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;

      await supabaseClient
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  return (
    <EnhancedAuthContext.Provider
      value={{
        user,
        msalAccount,
        isLoading,
        isAuthenticated,
        trialStatus,
        hasTrialAccess,
        login,
        logout,
        updateLastActivity,
        refreshTrialStatus,
      }}
    >
      {children}
    </EnhancedAuthContext.Provider>
  );
}
