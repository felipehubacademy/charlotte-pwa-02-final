import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface User {
  id: string;
  entra_id: string;
  email: string;
  name: string;
  user_level: 'Novice' | 'Inter' | 'Advanced';
  timezone: string;
  preferred_reminder_time: string;
  reminder_frequency: 'disabled' | 'light' | 'normal' | 'frequent';
  last_activity: string;
  created_at: string;
  updated_at: string;
}

// Only create Supabase client if we have valid credentials
let supabaseClient: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl.startsWith('http') && supabaseAnonKey !== 'your_supabase_anon_key') {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return supabaseClient;
};

// For backwards compatibility
export const supabase = getSupabase();