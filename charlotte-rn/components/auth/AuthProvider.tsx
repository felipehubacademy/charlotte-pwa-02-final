import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAccess: boolean;           // is_institutional OR active/trial subscription
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  usePushNotifications(session?.user?.id);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('charlotte_users')
      .select('id, email, name, charlotte_level, placement_test_done, is_institutional, is_active, subscription_status, trial_ends_at, must_change_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthProvider] Erro ao buscar perfil:', error.message);
      return null;
    }
    return data as UserProfile;
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[AuthProvider] getSession error:', error);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          if (!session?.user) {
            setProfile(null);
          } else if (event !== 'USER_UPDATED') {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          }
        } catch (error) {
          console.error('[AuthProvider] onAuthStateChange error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (!session?.user) return;
    const updated = await fetchProfile(session.user.id);
    if (updated) setProfile(updated);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'charlotte://auth/callback',
    });
    if (error) throw error;
  };

  // Access granted if:
  //   (a) institutional user (admin-managed, bypasses paywall)
  //   (b) app subscriber: active or non-expired trial
  const hasAccess = (() => {
    if (!profile || !profile.is_active) return false;
    if (profile.is_institutional) return true;
    if (profile.subscription_status === 'active') return true;
    if (profile.subscription_status === 'trial') {
      if (!profile.trial_ends_at) return true;
      return new Date(profile.trial_ends_at) > new Date();
    }
    return false;
  })();

  const mustChangePassword = profile?.must_change_password === true;

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      isLoading,
      isAuthenticated: !!session,
      hasAccess,
      mustChangePassword,
      signIn,
      signOut,
      resetPassword,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>');
  return ctx;
}
