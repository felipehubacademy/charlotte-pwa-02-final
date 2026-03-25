'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@/lib/supabase';
import toast from 'react-hot-toast';

// ----------------------------------------------------------------
// Cliente Supabase (anon key) para operações client-side
// ----------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
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

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Busca ou cria o profile do usuário na tabela `profiles`. */
async function fetchOrCreateProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): Promise<User | null> {
  try {
    // Tentar buscar profile existente
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile && !error) {
      return buildUser(authUser, profile);
    }

    // Se não existe, criar um profile básico
    const userLevel =
      (authUser.app_metadata?.user_level as string) ||
      (authUser.user_metadata?.user_level as string) ||
      'Novice';

    const newProfile = {
      id: authUser.id,
      email: authUser.email || '',
      name:
        (authUser.user_metadata?.nome as string) ||
        (authUser.user_metadata?.name as string) ||
        authUser.email?.split('@')[0] ||
        'Usuário',
      user_level: userLevel,
      is_active: true,
      trial_expires_at: null,
      timezone: 'America/Sao_Paulo',
      preferred_reminder_time: '20:00:00',
      reminder_frequency: 'normal',
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error: createError } = await supabaseClient
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .single();

    if (createError) {
      console.warn('⚠️ Erro ao criar profile, usando dados do auth:', createError.message);
      // Fallback: construir user a partir dos metadados de auth
      return buildUser(authUser, newProfile);
    }

    return buildUser(authUser, created || newProfile);
  } catch (err) {
    console.error('❌ fetchOrCreateProfile error:', err);
    return null;
  }
}

/** Constrói um objeto User compatível com a interface existente. */
function buildUser(
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
  profile: Record<string, unknown>
): User {
  const userLevel =
    (profile.user_level as User['user_level']) ||
    (authUser.app_metadata?.user_level as User['user_level']) ||
    'Novice';

  return {
    id: authUser.id,
    // Para backward compat: entra_id = Supabase UUID (sem Azure)
    entra_id: (profile.entra_id as string) || authUser.id,
    email: (profile.email as string) || authUser.email || '',
    name:
      (profile.name as string) ||
      (authUser.user_metadata?.nome as string) ||
      (authUser.user_metadata?.name as string) ||
      authUser.email?.split('@')[0] ||
      'Usuário',
    user_level: userLevel,
    timezone: (profile.timezone as string) || 'America/Sao_Paulo',
    preferred_reminder_time: (profile.preferred_reminder_time as string) || '20:00:00',
    reminder_frequency:
      (profile.reminder_frequency as User['reminder_frequency']) || 'normal',
    last_activity: (profile.last_activity as string) || new Date().toISOString(),
    created_at: (profile.created_at as string) || new Date().toISOString(),
    updated_at: (profile.updated_at as string) || new Date().toISOString(),
  };
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // ---- Inicialização ----
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session?.user && mounted) {
          const profile = await fetchOrCreateProfile(session.user as Parameters<typeof fetchOrCreateProfile>[0]);
          if (mounted) setUser(profile);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listener de mudanças de sessão
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const profile = await fetchOrCreateProfile(session.user as Parameters<typeof fetchOrCreateProfile>[0]);
          if (mounted) setUser(profile);
        } catch (err) {
          console.error('❌ onAuthStateChange profile error:', err);
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---- login ----
  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Usuário não encontrado' };
      }

      // Profile será carregado via onAuthStateChange
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Login unexpected error:', message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ---- logout ----
  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error.message);
        toast.error('Falha no logout. Tente novamente.');
      }
      setUser(null);
    } catch (error) {
      console.error('❌ Logout unexpected error:', error);
      toast.error('Falha no logout. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- updateLastActivity ----
  const updateLastActivity = async () => {
    if (!user) return;
    try {
      await supabaseClient
        .from('profiles')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('❌ Failed to update last activity:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
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
