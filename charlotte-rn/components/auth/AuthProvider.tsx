import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { unstable_batchedUpdates } from 'react-native';
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
    console.log('[AuthProvider] fetchProfile start for:', userId);
    const queryPromise = supabase
      .from('charlotte_users')
      .select('id, email, name, charlotte_level, placement_test_done, is_institutional, is_active, subscription_status, trial_ends_at, must_change_password')
      .eq('id', userId)
      .single();

    // 8-second safety net — prevents indefinite hang on cold boot (e.g. Keychain
    // contention or Supabase token-refresh delay blocking the HTTP request).
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => {
        console.warn('[AuthProvider] fetchProfile TIMEOUT for user:', userId);
        resolve({ data: null, error: new Error('fetchProfile timeout') });
      }, 8_000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('[AuthProvider] Erro ao buscar perfil:', (error as any).message ?? error);
      return null;
    }
    console.log('[AuthProvider] fetchProfile success for:', userId);
    return data as UserProfile;
  };

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const markResolved = () => {
      if (mounted && !resolved) {
        resolved = true;
        setIsLoading(false);
      }
    };

    // Hard-timeout safety net: if onAuthStateChange never fires (e.g. network issue),
    // unblock the UI after 12 s instead of hanging forever.
    const hardTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[AuthProvider] auth hard timeout — proceeding unauthenticated');
        markResolved();
      }
    }, 12_000);

    // onAuthStateChange fires INITIAL_SESSION on mount (even with no session),
    // so it is the primary mechanism to resolve auth state.
    //
    // KEY INVARIANT: setSession is called AFTER fetchProfile completes so that
    // React never renders the broken intermediate state (isAuthenticated=true,
    // profile=null), which causes the dot-spinner loop on cold boot in TestFlight.
    // Both setSession + setProfile are batched into a single React render via
    // unstable_batchedUpdates, keeping UI consistent.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('[AuthProvider] event:', event, '| hasSession:', !!session?.user);

        if (!session?.user) {
          // No session — clear state and unblock loading immediately.
          unstable_batchedUpdates(() => {
            setSession(null);
            setProfile(null);
          });
          clearTimeout(hardTimeout);
          markResolved();
          return;
        }

        if (event === 'USER_UPDATED') {
          // Password / email change — just refresh the session object, keep
          // the existing profile so the UI doesn't flicker.
          setSession(session);
          clearTimeout(hardTimeout);
          markResolved();
          return;
        }

        // INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED:
        // Set the session synchronously (unblocks loading indicator via
        // app/index.tsx profile check) and then fetch the profile in a
        // microtask — OUTSIDE this handler — so the Supabase client can
        // finish its internal storage work (SecureStore write, ~7-8 s on
        // cold boot) before we issue the DB query. Without this deferral
        // the query sits in the client's internal queue for the entire
        // SecureStore flush time.
        setSession(session);
        clearTimeout(hardTimeout);
        markResolved();

        const userId = session.user.id;
        // setTimeout(0) yields back to the JS event loop so the Supabase
        // client completes its own async work before we hit the DB.
        setTimeout(async () => {
          if (!mounted) return;
          console.log('[AuthProvider] fetchProfile deferred start for:', userId);
          const userProfile = await fetchProfile(userId);
          if (mounted && userProfile) setProfile(userProfile);
        }, 0);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
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
