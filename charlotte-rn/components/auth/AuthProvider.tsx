import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAccess: boolean;           // lms_role válido OU subscription ativa/trial
  mustChangePassword: boolean;  // aluno institucional no primeiro acesso
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register push notifications after login
  // Temporarily disabled: crashing on iOS 26 in production builds
  // TODO: re-enable after confirming expo-notifications iOS 26 compatibility
  // usePushNotifications(session?.user?.id);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, user_level, is_active, lms_role, subscription_status, trial_ends_at, must_change_password')
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
        setIsLoading(false); // never leave the app stuck on loading
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
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
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // Acesso liberado se:
  //   (a) usuário institucional: lms_role preenchido + is_active
  //   (b) assinante app: subscription_status active ou trial (+ trial não expirado)
  const hasAccess = (() => {
    if (!profile || !profile.is_active) return false;
    if (profile.lms_role) return true;  // institucional — bypass paywall
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
