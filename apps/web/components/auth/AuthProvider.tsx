'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import { msalInstance, loginRequest, initializeMsal } from '@/lib/auth';
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
  loginWithMicrosoft: () => Promise<void>;
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
// Helpers — Supabase email/password users (profiles table)
// ----------------------------------------------------------------

async function fetchOrCreateProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): Promise<User | null> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile && !error) {
      return buildUserFromProfile(authUser, profile);
    }

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
      return buildUserFromProfile(authUser, newProfile);
    }

    return buildUserFromProfile(authUser, created || newProfile);
  } catch (err) {
    console.error('❌ fetchOrCreateProfile error:', err);
    return null;
  }
}

function buildUserFromProfile(
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
// Helpers — MSAL / Entra users (public.users table)
// ----------------------------------------------------------------

async function syncMsalUser(account: AccountInfo): Promise<User | null> {
  try {
    // Look up by entra_id first
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('entra_id', account.localAccountId)
      .single();

    if (!error && data) return data as User;

    // Fallback: look up by email
    const { data: byEmail } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', account.username)
      .single();

    return (byEmail as User) ?? null;
  } catch (err) {
    console.error('❌ syncMsalUser error:', err);
    return null;
  }
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [msalAccount, setMsalAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // ── 1. Check Supabase session ──────────────────────────────
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchOrCreateProfile(
            session.user as Parameters<typeof fetchOrCreateProfile>[0]
          );
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
            return; // Supabase session takes precedence
          }
        }

        // ── 2. Check MSAL session (institutional users) ────────────
        await initializeMsal();
        await msalInstance.handleRedirectPromise();

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0 && mounted) {
          const account = accounts[0];
          setMsalAccount(account);
          const userData = await syncMsalUser(account);
          if (mounted) {
            if (userData) {
              setUser(userData);
            } else {
              toast.error('Usuário não encontrado. Fale com a Hub Academy.');
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Supabase auth state listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          // Only clear user if not logged in via MSAL
          if (!msalAccount) setUser(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const profile = await fetchOrCreateProfile(
              session.user as Parameters<typeof fetchOrCreateProfile>[0]
            );
            if (mounted) setUser(profile);
          } catch (err) {
            console.error('❌ onAuthStateChange profile error:', err);
          } finally {
            if (mounted) setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- loginWithMicrosoft (institutional users) ----
  const loginWithMicrosoft = async () => {
    try {
      await initializeMsal();
      // loginRedirect navigates away — result handled in initializeAuth on return
      await msalInstance.loginRedirect(loginRequest);
    } catch (error: any) {
      if (error.message?.includes('interaction_in_progress')) return;
      console.error('❌ Microsoft login error:', error);
      toast.error('Falha no login com Microsoft. Tente novamente.');
    }
  };

  // ---- login (trial users — email/password via Supabase) ----
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

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Usuário não encontrado' };

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ---- logout ----
  const logout = async () => {
    try {
      setIsLoading(true);
      setUser(null);

      if (msalAccount) {
        // Institutional user — sign out from MSAL
        setMsalAccount(null);
        await msalInstance.logoutRedirect();
      } else {
        // Trial user — sign out from Supabase
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
          console.error('❌ Logout error:', error);
          toast.error('Falha no logout. Tente novamente.');
        }
      }
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
      const table = msalAccount ? 'users' : 'profiles';
      await supabaseClient
        .from(table)
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
        loginWithMicrosoft,
        logout,
        updateLastActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
