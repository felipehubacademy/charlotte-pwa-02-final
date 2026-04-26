/**
 * migrate-users-to-auth.ts
 *
 * Cria contas no Supabase Auth (auth.users) para todos os usuários
 * que existem em public.users mas ainda não têm conta de autenticação.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=sua_chave npx ts-node scripts/migrate-users-to-auth.ts
 *
 * A service role key está no Supabase Dashboard:
 *   Project Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://fnvjibzreepubageztoi.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const TEMP_PASSWORD     = 'Charlotte@2025';

if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY não definida.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Busca todos os usuários ativos do public.users
  const { data: publicUsers, error: fetchErr } = await supabase
    .from('users')
    .select('id, email, name, is_active')
    .eq('is_active', true);

  if (fetchErr) { console.error('Erro ao buscar usuários:', fetchErr); process.exit(1); }
  if (!publicUsers?.length) { console.log('Nenhum usuário encontrado.'); return; }

  console.log(`\n📋  ${publicUsers.length} usuários encontrados em public.users\n`);

  let created = 0;
  let skipped = 0;
  let errors  = 0;

  for (const user of publicUsers) {
    // 2. Verifica se já existe no auth.users
    const { data: existing } = await supabase.auth.admin.getUserById(user.id);

    if (existing?.user) {
      console.log(`⏭   ${user.email} — já existe no auth (pulando)`);
      skipped++;
      continue;
    }

    // 3. Cria conta no auth.users com o mesmo UUID
    const { error: createErr } = await supabase.auth.admin.createUser({
      user_metadata: { name: user.name },
      email:         user.email,
      password:      TEMP_PASSWORD,
      email_confirm: true,          // pula confirmação de email
      id:            user.id,       // mantém o mesmo UUID do public.users
    });

    if (createErr) {
      console.error(`❌  ${user.email} — erro: ${createErr.message}`);
      errors++;
      continue;
    }

    // 4. Marca must_change_password no public.users
    await supabase
      .from('users')
      .update({ must_change_password: true })
      .eq('id', user.id);

    console.log(`✅  ${user.email} — criado com senha temporária`);
    created++;

    // Pequeno delay para não sobrecarregar a API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Criados:  ${created}
⏭   Pulados:  ${skipped}
❌  Erros:    ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Senha temporária: ${TEMP_PASSWORD}
Todos vão ser redirecionados para criar senha no primeiro acesso.
  `);
}

main().catch(console.error);
