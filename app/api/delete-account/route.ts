// app/api/delete-account/route.ts
// Exclui a conta do usuário permanentemente.
// Apple App Store exige que o app ofereça esta funcionalidade.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Verificar o token do usuário
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = user.id;
    console.log(`🗑️ Deleting account for user: ${userId} (${user.email})`);

    // 2. Limpar dados Charlotte (cascade do auth.users cuida do resto via FK)
    // Mas vamos ser explícitos para tabelas que possam não ter ON DELETE CASCADE
    const tables = [
      'charlotte.practices',
      'charlotte.progress',
      'charlotte.leaderboard_cache',
      'charlotte.users',
      'chat_messages',
      'user_achievements',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error && !error.message.includes('does not exist')) {
        console.warn(`⚠️ Error deleting from ${table}:`, error.message);
      }
    }

    // charlotte.users usa 'id' como PK, não 'user_id'
    await supabase.from('charlotte.users').delete().eq('id', userId).catch(() => {});

    // 3. Deletar o usuário do auth
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error('❌ Failed to delete auth user:', deleteErr.message);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    console.log(`✅ Account deleted successfully: ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Delete account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
