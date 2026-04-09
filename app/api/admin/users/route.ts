/**
 * app/api/admin/users/route.ts
 * Admin API for listing and creating charlotte users.
 * Protected by ADMIN_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret') ?? '';
  return ADMIN_SECRET && auth === ADMIN_SECRET;
}

// ── GET /api/admin/users — list all users + stats ─────────────────────────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Users
  const { data: users, error } = await supabase
    .from('charlotte_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats
  const total         = users?.length ?? 0;
  const institutional = users?.filter(u => u.is_institutional).length ?? 0;
  const subscribers   = users?.filter(u => u.subscription_status === 'active').length ?? 0;
  const onTrial       = users?.filter(u => u.subscription_status === 'trial').length ?? 0;
  const trialExpired  = users?.filter(u => {
    if (u.subscription_status !== 'trial') return false;
    if (!u.trial_ends_at) return true;
    return new Date(u.trial_ends_at) < new Date();
  }).length ?? 0;

  // Growth: users created in last 30 days vs previous 30 days
  const now   = new Date();
  const d30   = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60   = new Date(now); d60.setDate(d60.getDate() - 60);
  const last30 = users?.filter(u => new Date(u.created_at) >= d30).length ?? 0;
  const prev30 = users?.filter(u => new Date(u.created_at) >= d60 && new Date(u.created_at) < d30).length ?? 0;
  const growthPct = prev30 === 0 ? null : Math.round(((last30 - prev30) / prev30) * 100);

  return NextResponse.json({
    users,
    stats: { total, institutional, subscribers, onTrial, trialExpired, last30, growthPct },
  });
}

// ── POST /api/admin/users — create a new user ─────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, password, name } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email e password são obrigatórios' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Create auth user — always institutional, must change password on first login
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || null, is_institutional: true },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const userId = authData.user.id;

  // 2. O trigger on_auth_user_created já criou a linha em charlotte.users.
  //    Apenas atualizamos os campos extras — sem upsert/insert na view.
  const { error: profileError } = await supabase
    .from('charlotte_users')
    .update({
      name:                 name || null,
      is_institutional:     true,
      must_change_password: true,
      placement_test_done:  false,
      is_active:            true,
    })
    .eq('id', userId);

  if (profileError) {
    // Rollback auth user se o update falhar
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId });
}
