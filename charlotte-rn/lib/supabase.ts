import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl: string = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey: string = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY não definidas.');
}

// SecureStore has a 2048-byte limit per value. Supabase JWTs exceed this.
// Solution: split large values into chunks.
const CHUNK_SIZE = 1800;
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}.__chunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.getItemAsync(`${key}.__chunk${i}`)
          )
        );
        if (chunks.some(c => c === null)) return null;
        return chunks.join('');
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length > CHUNK_SIZE) {
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await Promise.all([
        ...chunks.map((chunk, i) =>
          SecureStore.setItemAsync(`${key}.__chunk${i}`, chunk)
        ),
        SecureStore.setItemAsync(`${key}.__chunks`, String(chunks.length)),
      ]);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}.__chunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        await Promise.all([
          ...Array.from({ length: count }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}.__chunk${i}`)
          ),
          SecureStore.deleteItemAsync(`${key}.__chunks`),
        ]);
      }
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Perfil do usuário — espelha as colunas reais da tabela `users`.
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  user_level: 'Novice' | 'Inter' | 'Advanced';
  is_active: boolean;
  lms_role: 'admin' | 'coordinator' | 'teacher' | 'student' | null;
  subscription_status: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;   // ISO timestamp
  must_change_password: boolean;
}
