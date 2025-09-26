'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalInstance, loginRequest, initializeMsal } from '@/lib/auth';
import { supabase, User, getSupabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  msalAccount: AccountInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateLastActivity: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [msalAccount, setMsalAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!msalAccount;

  useEffect(() => {
    initializeAuth();
  }, []);

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
      
      // logoutRedirect não retorna response, apenas redireciona
      await msalInstance.logoutRedirect();
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Falha no logout. Tente novamente.');
    } finally {
      setIsLoading(false);
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
      console.error('User sync error:', {
        message: error?.message,
        details: error?.details,
        stack: error?.stack,
        fullError: error
      });
      
      // ✅ NOVO: Não criar fallback para usuários sem acesso
      if (error?.message?.includes('ACCESS_DENIED')) {
        console.log('🚫 Not creating fallback user - access denied');
        return;
      }
      
      // Criar usuário fallback em caso de erro técnico
      const fallbackUser: User = {
        id: `fallback-${account.localAccountId}`,
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
      };
      
      console.log('Using fallback user for:', fallbackUser.entra_id ? 'user-***' : 'unknown');
      setUser(fallbackUser);
      
      toast.error('Falha na sincronização do perfil, usando perfil temporário');
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
      const groupNames = groups.map((group: any) => group.displayName).filter(Boolean);
      console.log('👥 Group names:', groupNames);
      console.log('🔍 Checking for Charlotte groups: Novice, Inter, Advanced, Teacher');
      
      // Log which Charlotte groups the user has
      const charlotteGroups = groupNames.filter((name: string) => 
        ['novice', 'inter', 'advanced', 'teacher', 'trial'].some(group => 
          name.toLowerCase().includes(group)
        )
      );
      console.log('🎯 Charlotte-related groups:', charlotteGroups);
      
      // ✅ NOVO: Verificar se usuário tem acesso ao Charlotte
      const hasCharlotteAccess = charlotteGroups.length > 0;
      
      if (!hasCharlotteAccess) {
        console.log('❌ User has no Charlotte groups - ACCESS DENIED');
        throw new Error('ACCESS_DENIED: User is not in any Charlotte groups');
      }
      
      // ✅ NOVO: Verificar se é trial user
      const isTrialUser = groupNames.some((name: string) => 
        name.toLowerCase().includes('trial')
      );
      console.log('🎯 Is trial user:', isTrialUser);
      
      // Determinar nível baseado nos grupos
      if (groupNames.some((name: string) => name.toLowerCase().includes('trial-novice'))) {
        console.log('🎯 User level: Trial Novice');
        return 'Novice';
      } else if (groupNames.some((name: string) => name.toLowerCase().includes('trial-inter'))) {
        console.log('🎯 User level: Trial Inter');
        return 'Inter';
      } else if (groupNames.some((name: string) => name.toLowerCase().includes('trial-advanced'))) {
        console.log('🎯 User level: Trial Advanced');
        return 'Advanced';
      } else if (groupNames.some((name: string) => name.toLowerCase().includes('novice'))) {
        console.log('🎯 User level: Novice');
        return 'Novice';
      } else if (groupNames.some((name: string) => name.toLowerCase().includes('inter'))) {
        console.log('🎯 User level: Inter');
        return 'Inter';
      } else {
        console.log('🎯 User level: Advanced (Teacher or Advanced group)');
        return 'Advanced';
      }
    } catch (error: any) {
      console.error('❌ Error getting user level:', error);
      
      // ✅ NOVO: Se erro é ACCESS_DENIED, propagar
      if (error.message?.includes('ACCESS_DENIED')) {
        throw error;
      }
      
      console.log('🚫 Unknown error in getUserLevel, denying access for security');
      throw new Error('ACCESS_DENIED: Unable to verify user level due to unexpected error');
    }
  };

  const updateLastActivity = async () => {
    if (!user) return;

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;

      const { error } = await supabaseClient
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        msalAccount,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateLastActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}