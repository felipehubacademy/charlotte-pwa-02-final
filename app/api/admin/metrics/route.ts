/**
 * app/api/admin/metrics/route.ts
 * Admin metrics dashboard — Camada 1 (receita/retencao) + Camada 2 (custo OpenAI).
 * Protegido pelo ADMIN_SECRET (mesmo de /admin).
 *
 * Query params:
 *   ?days=7|30|90     — atalho (default 30)
 *   ?from=YYYY-MM-DD  — range custom (sobrescreve days)
 *   ?to=YYYY-MM-DD    — range custom
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

// Preco da assinatura (em USD para padronizar com custo OpenAI)
// 39.90 BRL/mes * 0.19 (cambio aprox) = ~7.58 USD/mes
const MONTHLY_PRICE_USD = 7.58;
const YEARLY_PRICE_USD  = 72.00;  // 379 BRL/ano

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret') ?? '';
  return ADMIN_SECRET && auth === ADMIN_SECRET;
}

function parseRange(req: NextRequest): { from: Date; to: Date; days: number } {
  const now = new Date();
  const to = req.nextUrl.searchParams.get('to');
  const from = req.nextUrl.searchParams.get('from');
  const daysParam = req.nextUrl.searchParams.get('days');

  if (from && to) {
    const f = new Date(from);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    const days = Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000));
    return { from: f, to: t, days };
  }

  const days = daysParam ? Math.max(1, parseInt(daysParam, 10)) : 30;
  const f = new Date(now);
  f.setDate(f.getDate() - days);
  return { from: f, to: now, days };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/metrics
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, to, days } = parseRange(req);
  const supabase = getSupabaseAdmin();

  // Types locais (Supabase retorna `unknown` sem tipagem global)
  type UserRow = {
    id: string;
    email?: string;
    name?: string | null;
    created_at: string;
    charlotte_level: string | null;
    is_institutional: boolean;
    subscription_status: string;
    subscription_product: string | null;
    subscription_expires_at: string | null;
    trial_ends_at: string | null;
  };
  type PracticeRow = { user_id: string; created_at: string; xp_earned: number | null };
  type UsageRow = {
    user_id: string | null;
    endpoint: string;
    model: string;
    cost_usd: number | string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    audio_seconds: number | null;
    audio_input_min: number | null;
    audio_output_min: number | null;
    created_at: string;
  };

  // Fetch bases in parallel
  const [usersRes, practicesRes, usageRes] = await Promise.all([
    supabase.from('charlotte_users').select('id, email, name, created_at, charlotte_level, is_institutional, subscription_status, subscription_product, subscription_expires_at, trial_ends_at'),
    supabase.from('charlotte_practices').select('user_id, created_at, xp_earned').gte('created_at', from.toISOString()),
    // openai_usage pode nao existir ainda — catch silencioso
    supabase.from('openai_usage').select('user_id, endpoint, model, prompt_tokens, completion_tokens, total_tokens, audio_seconds, audio_input_min, audio_output_min, cost_usd, created_at').gte('created_at', from.toISOString()).lte('created_at', to.toISOString()),
  ]);

  if (usersRes.error)     return NextResponse.json({ error: usersRes.error.message },     { status: 500 });
  if (practicesRes.error) return NextResponse.json({ error: practicesRes.error.message }, { status: 500 });

  const users     = (usersRes.data     ?? []) as unknown as UserRow[];
  const practices = (practicesRes.data ?? []) as unknown as PracticeRow[];
  const usage     = (usageRes.data     ?? []) as unknown as UsageRow[];

  // usageErr pode ser "relation does not exist" se o user ainda nao rodou a migration
  const usageTableMissing = Boolean(usageRes.error);

  // ─────────────────────────────────────────────────────────────────────────
  // CAMADA 1 — RECEITA & RETENCAO
  // ─────────────────────────────────────────────────────────────────────────

  const nonInstitutional = users.filter(u => !u.is_institutional);

  // ── Receita ──────────────────────────────────────────────────────────────
  const activeSubs = nonInstitutional.filter(u => u.subscription_status === 'active');
  const monthlySubs = activeSubs.filter(u => u.subscription_product === 'monthly').length;
  const yearlySubs  = activeSubs.filter(u => u.subscription_product === 'yearly').length;
  // MRR considera yearly como /12
  const mrr = (monthlySubs * MONTHLY_PRICE_USD) + (yearlySubs * YEARLY_PRICE_USD / 12);
  const arr = mrr * 12;

  // ── Trial ────────────────────────────────────────────────────────────────
  const onTrial = nonInstitutional.filter(u => u.subscription_status === 'trial').length;

  // Trial -> paid: quem ja esteve em trial (hoje active/cancelled/expired)
  // Aproximacao: users com subscription_status != 'trial' e != 'none' que tiveram trial_ends_at
  const hadTrial = nonInstitutional.filter(u => u.trial_ends_at !== null).length;
  const convertedFromTrial = nonInstitutional.filter(u =>
    u.trial_ends_at !== null &&
    (u.subscription_status === 'active' || u.subscription_status === 'cancelled' || u.subscription_status === 'expired')
  ).length;
  const trialConversionPct = hadTrial === 0 ? null : Math.round((convertedFromTrial / hadTrial) * 100);

  // ── Churn ────────────────────────────────────────────────────────────────
  // Proxy: cancelled + expired entre non-institutional
  const churned = nonInstitutional.filter(u =>
    u.subscription_status === 'cancelled' || u.subscription_status === 'expired'
  ).length;
  const churnDenominator = churned + activeSubs.length;
  const churnPct = churnDenominator === 0 ? null : Math.round((churned / churnDenominator) * 100);

  // ── Renovacoes proximas (7 dias) ────────────────────────────────────────
  const in7d = new Date(); in7d.setDate(in7d.getDate() + 7);
  const renewals7d = activeSubs.filter(u => {
    if (!u.subscription_expires_at) return false;
    const exp = new Date(u.subscription_expires_at);
    return exp > new Date() && exp <= in7d;
  }).length;

  // ── Retention D1/D7/D30 ──────────────────────────────────────────────────
  // Proxy simples: entre users criados nos ultimos 60d, quantos praticaram apos X dias
  const d60 = new Date(); d60.setDate(d60.getDate() - 60);
  const cohortUsers = users.filter(u => new Date(u.created_at) >= d60);

  // Mapa user -> [timestamps de practices]
  const practicesByUser = new Map<string, Date[]>();
  for (const p of practices) {
    const uid = String(p.user_id);
    if (!practicesByUser.has(uid)) practicesByUser.set(uid, []);
    practicesByUser.get(uid)!.push(new Date(p.created_at));
  }

  const retentionAt = (targetDay: number) => {
    // entre cohort users com mais de X dias de idade, quantos praticaram apos dia X
    const eligibles = cohortUsers.filter(u => {
      const age = (Date.now() - new Date(u.created_at).getTime()) / 86400000;
      return age >= targetDay;
    });
    if (eligibles.length === 0) return null;
    const retained = eligibles.filter(u => {
      const acts = practicesByUser.get(String(u.id)) ?? [];
      const ageCreated = new Date(u.created_at).getTime();
      return acts.some(t => (t.getTime() - ageCreated) >= targetDay * 86400000);
    }).length;
    return Math.round((retained / eligibles.length) * 100);
  };

  const retention = {
    d1:  retentionAt(1),
    d7:  retentionAt(7),
    d30: retentionAt(30),
  };

  // ── Inativos com sub ativa (14 dias sem pratica) ────────────────────────
  const d14 = new Date(); d14.setDate(d14.getDate() - 14);
  const inactivePayingIds = activeSubs.filter(u => {
    const acts = practicesByUser.get(String(u.id)) ?? [];
    const lastAct = acts.length ? Math.max(...acts.map(t => t.getTime())) : 0;
    return lastAct < d14.getTime();
  }).map(u => u.id);
  const inactivePaying = inactivePayingIds.length;

  // ── Novos usuarios no periodo ────────────────────────────────────────────
  const newUsers = users.filter(u => new Date(u.created_at) >= from && new Date(u.created_at) <= to).length;

  // ─────────────────────────────────────────────────────────────────────────
  // CAMADA 2 — CUSTO OPENAI (no periodo)
  // ─────────────────────────────────────────────────────────────────────────

  const usageRows = usage;

  const totalCost = usageRows.reduce((s, r) => s + Number(r.cost_usd || 0), 0);
  const callCount = usageRows.length;

  // Por endpoint
  const costByEndpoint: Record<string, { cost: number; calls: number; tokens: number }> = {};
  for (const r of usageRows) {
    if (!costByEndpoint[r.endpoint]) costByEndpoint[r.endpoint] = { cost: 0, calls: 0, tokens: 0 };
    costByEndpoint[r.endpoint].cost  += Number(r.cost_usd || 0);
    costByEndpoint[r.endpoint].calls += 1;
    costByEndpoint[r.endpoint].tokens += (r.total_tokens || 0);
  }
  const byEndpoint = Object.entries(costByEndpoint)
    .map(([endpoint, v]) => ({ endpoint, ...v, cost: round2(v.cost) }))
    .sort((a, b) => b.cost - a.cost);

  // Por model
  const costByModel: Record<string, { cost: number; calls: number; tokens: number }> = {};
  for (const r of usageRows) {
    if (!costByModel[r.model]) costByModel[r.model] = { cost: 0, calls: 0, tokens: 0 };
    costByModel[r.model].cost  += Number(r.cost_usd || 0);
    costByModel[r.model].calls += 1;
    costByModel[r.model].tokens += (r.total_tokens || 0);
  }
  const byModel = Object.entries(costByModel)
    .map(([model, v]) => ({ model, ...v, cost: round2(v.cost) }))
    .sort((a, b) => b.cost - a.cost);

  // Top 10 users por custo
  const costByUser: Record<string, number> = {};
  for (const r of usageRows) {
    const uid = r.user_id ?? 'anonymous';
    costByUser[uid] = (costByUser[uid] ?? 0) + Number(r.cost_usd || 0);
  }
  const userMap = new Map(users.map(u => [String(u.id), u]));
  const topUsers = Object.entries(costByUser)
    .map(([userId, cost]) => {
      const u = userMap.get(userId);
      return {
        userId,
        email: u?.email ?? null,
        name:  u?.name  ?? null,
        cost:  round2(cost),
      };
    })
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // Custo medio por assinante ativo (aproximacao — no periodo inteiro)
  const costPerActiveSub = activeSubs.length === 0 ? 0 : totalCost / activeSubs.length;

  // Custo por dia (serie temporal — ultimos 30 buckets do range)
  const costPerDay: Record<string, number> = {};
  for (const r of usageRows) {
    const day = (r.created_at as string).slice(0, 10);
    costPerDay[day] = (costPerDay[day] ?? 0) + Number(r.cost_usd || 0);
  }
  const timeseries = Object.entries(costPerDay)
    .map(([date, cost]) => ({ date, cost: round2(cost) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ─────────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString(), days },
    revenue: {
      mrr: round2(mrr),
      arr: round2(arr),
      activeSubs: activeSubs.length,
      monthlySubs,
      yearlySubs,
      onTrial,
      trialConversionPct,
      churnPct,
      renewals7d,
      inactivePaying,
      newUsers,
      totalUsers: (users ?? []).length,
      totalNonInstitutional: nonInstitutional.length,
    },
    retention,
    openai: {
      tableMissing: usageTableMissing,
      totalCost: round2(totalCost),
      callCount,
      costPerActiveSub: round4(costPerActiveSub),
      byEndpoint,
      byModel,
      topUsers,
      timeseries,
    },
  });
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }
