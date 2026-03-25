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
      // Write chunks sequentially — parallel Keychain ops cause lock contention on iOS 26
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.deleteItemAsync(`${key}.__chunk${i}`).catch(() => {});
        await SecureStore.setItemAsync(`${key}.__chunk${i}`, chunks[i]);
      }
      // Write count last so a partial write is never mistaken for a complete session
      await SecureStore.deleteItemAsync(`${key}.__chunks`).catch(() => {});
      await SecureStore.setItemAsync(`${key}.__chunks`, String(chunks.length));
    } else {
      await SecureStore.deleteItemAsync(key).catch(() => {});
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}.__chunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        // Delete sequentially to avoid Keychain lock contention on iOS 26
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}.__chunk${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}.__chunks`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch {}
  },
};

// DIAGNOSTIC BUILD 12: disable SecureStore to isolate Keychain hang on iOS 26.
// If login works with persistSession: false, the issue is in SecureStore/Keychain.
// TODO: re-enable session persistence after root cause is confirmed.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: false,
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
