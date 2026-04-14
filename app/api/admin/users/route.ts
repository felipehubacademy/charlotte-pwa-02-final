/**
 * app/api/admin/users/route.ts
 * Admin API — list, create, update and delete charlotte users.
 * Protected by ADMIN_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import { inviteTemplate } from '@/lib/email-templates';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret') ?? '';
  return ADMIN_SECRET && auth === ADMIN_SECRET;
}

// ── GET /api/admin/users — list all users + stats + engagement ────────────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Fetch users + engagement data in parallel
  const [
    { data: users, error },
    { data: practices },
    { data: learnProgress },
  ] = await Promise.all([
    supabase.from('charlotte_users').select('*').order('created_at', { ascending: false }),
    supabase.from('charlotte_practices').select('user_id, xp_earned, practice_type, created_at'),
    supabase.from('learn_progress').select('user_id, completed, module_index, topic_index, level'),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Aggregate practices per user ──────────────────────────────────────────
  const now   = new Date();
  const d1    = new Date(now); d1.setDate(d1.getDate() - 1);
  const d7    = new Date(now); d7.setDate(d7.getDate() - 7);

  type EngMap = Record<string, {
    totalXP: number; lastActive: string | null;
    lessonCount: number; messageCount: number; sessionDays: Set<string>;
  }>;
  const engMap: EngMap = {};

  for (const p of (practices ?? [])) {
    const uid = String(p.user_id).toLowerCase();
    if (!engMap[uid]) {
      engMap[uid] = { totalXP: 0, lastActive: null, lessonCount: 0, messageCount: 0, sessionDays: new Set() };
    }
    const e = engMap[uid];
    e.totalXP += (p.xp_earned ?? 0);
    if (!e.lastActive || p.created_at > e.lastActive) e.lastActive = p.created_at;
    e.sessionDays.add((p.created_at as string).slice(0, 10));
    if (p.practice_type === 'learn_exercise') e.lessonCount++;
    if (['text_message', 'audio_message', 'grammar_message'].includes(p.practice_type)) e.messageCount++;
  }

  // ── Aggregate learn_progress per user (Novice trail) ─────────────────────
  type ProgMap = Record<string, { topicsCompleted: number; moduleIndex: number; topicIndex: number }>;
  const progMap: ProgMap = {};
  for (const lp of (learnProgress ?? [])) {
    if ((lp.level ?? 'Novice') !== 'Novice') continue; // track Novice trail as main metric
    const uid = String(lp.user_id).toLowerCase();
    const completed = (lp.completed as Array<{ m: number; t: number }>) ?? [];
    progMap[uid] = {
      topicsCompleted: completed.length,
      moduleIndex:     lp.module_index ?? 0,
      topicIndex:      lp.topic_index  ?? 0,
    };
  }

  // ── Attach engagement to each user ───────────────────────────────────────
  const usersWithEng = (users ?? []).map(u => {
    const uid = String(u.id).toLowerCase();
    const e   = engMap[uid];
    const p   = progMap[uid];
    return {
      ...u,
      engagement: e ? {
        totalXP:      e.totalXP,
        lastActive:   e.lastActive,
        sessionDays:  e.sessionDays.size,
        lessonCount:  e.lessonCount,
        messageCount: e.messageCount,
      } : null,
      trailProgress: p ?? null,
    };
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total         = usersWithEng.length;
  const institutional = usersWithEng.filter(u => u.is_institutional).length;
  const subscribers   = usersWithEng.filter(u => u.subscription_status === 'active').length;
  const onTrial       = usersWithEng.filter(u => u.subscription_status === 'trial').length;
  const trialExpired  = usersWithEng.filter(u => {
    if (u.subscription_status !== 'trial') return false;
    return !u.trial_ends_at || new Date(u.trial_ends_at) < now;
  }).length;

  const d30   = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60   = new Date(now); d60.setDate(d60.getDate() - 60);
  const last30 = usersWithEng.filter(u => new Date(u.created_at) >= d30).length;
  const prev30 = usersWithEng.filter(u => new Date(u.created_at) >= d60 && new Date(u.created_at) < d30).length;
  const growthPct = prev30 === 0 ? null : Math.round(((last30 - prev30) / prev30) * 100);

  // Engagement stats
  const activeToday = usersWithEng.filter(u =>
    u.engagement?.lastActive && new Date(u.engagement.lastActive) >= d1
  ).length;
  const activeWeek = usersWithEng.filter(u =>
    u.engagement?.lastActive && new Date(u.engagement.lastActive) >= d7
  ).length;

  return NextResponse.json({
    users: usersWithEng,
    stats: { total, institutional, subscribers, onTrial, trialExpired, last30, growthPct, activeToday, activeWeek },
  });
}

// ── POST /api/admin/users — create a new user ─────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    email, password, name,
    charlotte_level       = null,
    is_institutional      = true,
    is_active             = true,
    subscription_status   = 'none',
    must_change_password  = true,
    placement_test_done   = false,
  } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email e password são obrigatórios' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || null, is_institutional },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const userId = authData.user.id;

  const { error: profileError } = await supabase
    .from('charlotte_users')
    .update({
      name:                 name || null,
      is_institutional,
      must_change_password,
      placement_test_done,
      is_active,
      charlotte_level:      charlotte_level || null,
      subscription_status,
    })
    .eq('id', userId);

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Envia email de convite (fire-and-forget — nao bloqueia resposta)
  if (email && name) {
    const { subject, html } = inviteTemplate({ name, email, tempPassword: password });
    sendEmail({ to: email, subject, html }).catch(() => {});
  }

  return NextResponse.json({ success: true, userId });
}

// ── PATCH /api/admin/users — update a user ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;

  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Allowed editable fields
  const allowed = [
    'name', 'charlotte_level', 'is_institutional',
    'is_active', 'subscription_status', 'trial_ends_at',
    'must_change_password', 'placement_test_done',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
  }

  const { error } = await supabase
    .from('charlotte_users')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update email via auth admin if provided
  if (fields.email) {
    const { error: emailError } = await supabase.auth.admin.updateUserById(id, { email: fields.email });
    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/users — delete a user ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Deleting auth user cascades to charlotte.users via ON DELETE CASCADE
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
