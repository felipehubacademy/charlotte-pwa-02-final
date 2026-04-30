/**
 * GET /api/admin/user-cost?userId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Retorna breakdown de custo por endpoint/serviço para um usuário específico.
 * Protegido pelo ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret') ?? '';
  return ADMIN_SECRET && auth === ADMIN_SECRET;
}

const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });

  const to   = searchParams.get('to');
  const from = searchParams.get('from');
  const days = searchParams.get('days') ? Math.max(1, parseInt(searchParams.get('days')!, 10)) : 30;

  const now   = new Date();
  const toDate   = to   ? new Date(to)   : now;
  const fromDate = from ? new Date(from) : new Date(now.getTime() - days * 86400000);
  if (!to) toDate.setHours(23, 59, 59, 999);

  const supabase = getSupabaseAdmin();

  type UsageRow = { endpoint: string; model: string; total_tokens: number | null; cost_usd: number | string | null };
  const { data: rows, error } = await supabase
    .from('openai_usage')
    .select('endpoint, model, total_tokens, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString()) as unknown as Promise<{ data: UsageRow[] | null; error: { message: string } | null }>;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const usageRows: UsageRow[] = rows ?? [];

  // Breakdown por endpoint
  const byEndpoint: Record<string, { cost: number; calls: number; tokens: number }> = {};
  for (const r of usageRows) {
    const key = r.endpoint || 'unknown';
    if (!byEndpoint[key]) byEndpoint[key] = { cost: 0, calls: 0, tokens: 0 };
    byEndpoint[key].cost   += Number(r.cost_usd || 0);
    byEndpoint[key].calls  += 1;
    byEndpoint[key].tokens += (r.total_tokens || 0);
  }
  const breakdown = Object.entries(byEndpoint)
    .map(([endpoint, v]) => ({ endpoint, cost: round6(v.cost), calls: v.calls, tokens: v.tokens }))
    .sort((a, b) => b.cost - a.cost);

  // Breakdown por modelo
  const byModel: Record<string, { cost: number; calls: number }> = {};
  for (const r of usageRows) {
    const key = r.model || 'unknown';
    if (!byModel[key]) byModel[key] = { cost: 0, calls: 0 };
    byModel[key].cost  += Number(r.cost_usd || 0);
    byModel[key].calls += 1;
  }
  const byModelArr = Object.entries(byModel)
    .map(([model, v]) => ({ model, cost: round6(v.cost), calls: v.calls }))
    .sort((a, b) => b.cost - a.cost);

  const totalCost  = round6(usageRows.reduce((s, r) => s + Number(r.cost_usd || 0), 0));
  const totalCalls = usageRows.length;

  return NextResponse.json({ userId, totalCost, totalCalls, breakdown, byModel: byModelArr });
}
