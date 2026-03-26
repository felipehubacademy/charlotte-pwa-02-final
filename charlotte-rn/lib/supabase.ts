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
//
// iOS 26 Keychain contention fix: all operations are funnelled through a
// single promise queue so writes and reads never run concurrently.
// Without this, a token-refresh setItem that fires while login's setItem is
// still writing chunks causes partial writes → null session on next cold boot.
const CHUNK_SIZE = 1800;

// Global operation queue — serialises every Keychain access.
let _keychainQueue: Promise<unknown> = Promise.resolve();
function _enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = (_keychainQueue = _keychainQueue.then(fn, fn)) as Promise<T>;
  return result;
}

// SecureStore options: AFTER_FIRST_UNLOCK so tokens survive a device reboot
// and are readable as soon as the user unlocks the phone once (vs WHEN_UNLOCKED
// which requires the screen to be on — problematic for background refreshes).
const STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    _enqueue(async () => {
      try {
        const countStr = await SecureStore.getItemAsync(`${key}.__chunks`, STORE_OPTS);
        if (countStr) {
          const count = parseInt(countStr, 10);
          const parts: string[] = [];
          // Sequential reads — same Keychain queue constraint as writes
          for (let i = 0; i < count; i++) {
            const chunk = await SecureStore.getItemAsync(`${key}.__chunk${i}`, STORE_OPTS);
            if (chunk === null) return null; // partial write: treat as missing
            parts.push(chunk);
          }
          return parts.join('');
        }
        return await SecureStore.getItemAsync(key, STORE_OPTS);
      } catch {
        return null;
      }
    }),

  setItem: (key: string, value: string): Promise<void> =>
    _enqueue(async () => {
      if (value.length > CHUNK_SIZE) {
        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          chunks.push(value.slice(i, i + CHUNK_SIZE));
        }
        // 1. Delete any old chunks beyond new count (handle shrinking session)
        const oldCountStr = await SecureStore.getItemAsync(`${key}.__chunks`, STORE_OPTS).catch(() => null);
        if (oldCountStr) {
          const oldCount = parseInt(oldCountStr, 10);
          for (let i = chunks.length; i < oldCount; i++) {
            await SecureStore.deleteItemAsync(`${key}.__chunk${i}`, STORE_OPTS).catch(() => {});
          }
        }
        // 2. Write new chunks
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.deleteItemAsync(`${key}.__chunk${i}`, STORE_OPTS).catch(() => {});
          await SecureStore.setItemAsync(`${key}.__chunk${i}`, chunks[i], STORE_OPTS);
        }
        // 3. Write count last — if app is killed mid-write, a missing count means
        //    getItem falls back to the plain key (null) rather than partial chunks
        await SecureStore.deleteItemAsync(`${key}.__chunks`, STORE_OPTS).catch(() => {});
        await SecureStore.setItemAsync(`${key}.__chunks`, String(chunks.length), STORE_OPTS);
      } else {
        await SecureStore.deleteItemAsync(key, STORE_OPTS).catch(() => {});
        await SecureStore.setItemAsync(key, value, STORE_OPTS);
      }
    }),

  removeItem: (key: string): Promise<void> =>
    _enqueue(async () => {
      try {
        const countStr = await SecureStore.getItemAsync(`${key}.__chunks`, STORE_OPTS);
        if (countStr) {
          const count = parseInt(countStr, 10);
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}.__chunk${i}`, STORE_OPTS).catch(() => {});
          }
          await SecureStore.deleteItemAsync(`${key}.__chunks`, STORE_OPTS).catch(() => {});
        }
        await SecureStore.deleteItemAsync(key, STORE_OPTS).catch(() => {});
      } catch {}
    }),
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
