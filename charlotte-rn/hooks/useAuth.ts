import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * Hook conveniente para acessar o contexto de autenticação.
 *
 * Uso:
 *   const { user, loading, signIn, signOut } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
