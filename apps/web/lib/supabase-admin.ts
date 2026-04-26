// lib/supabase-admin.ts
// Client Supabase com service role key para operações server-side

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Singleton para evitar múltiplas instâncias
let adminClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (!adminClient) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    }
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
};

// ---- Funções de gerenciamento de usuários ----

/**
 * Cria um novo usuário no Supabase Auth (server-side).
 * Retorna o user criado ou null em caso de erro.
 */
export async function createUser(
  email: string,
  password: string,
  userLevel: 'Novice' | 'Inter' | 'Advanced'
) {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { user_level: userLevel },
    user_metadata: { user_level: userLevel },
  });

  if (error) {
    console.error('❌ createUser error:', error);
    return null;
  }

  return data.user;
}

/**
 * Atualiza o user_level de um usuário no Auth e no profile.
 */
export async function updateUserLevel(
  userId: string,
  nivel: 'Novice' | 'Inter' | 'Advanced'
) {
  const admin = getSupabaseAdmin();

  // Atualizar app_metadata no Auth (para JWT claim)
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { user_level: nivel },
    user_metadata: { user_level: nivel },
  });

  if (authError) {
    console.error('❌ updateUserLevel (auth) error:', authError);
    return false;
  }

  // Atualizar tabela profiles se existir
  const { error: profileError } = await admin
    .from('profiles')
    .update({ user_level: nivel, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    // Pode não existir ainda, apenas logar
    console.warn('⚠️ updateUserLevel (profiles) warning:', profileError.message);
  }

  return true;
}

/**
 * Desabilita um usuário (marca is_active = false no profile e bane no Auth).
 */
export async function disableUser(userId: string) {
  const admin = getSupabaseAdmin();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: '87600h', // ~10 anos
  });

  if (authError) {
    console.error('❌ disableUser (auth) error:', authError);
    return false;
  }

  // Marcar is_active = false no profile se existir
  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    console.warn('⚠️ disableUser (profiles) warning:', profileError.message);
  }

  return true;
}

export default getSupabaseAdmin;
