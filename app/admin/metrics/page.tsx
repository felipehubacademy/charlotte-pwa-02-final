'use client';

/**
 * app/admin/metrics/page.tsx
 * Charlotte Metrics Dashboard — receita, retencao, custo OpenAI em producao.
 * Protegido pelo mesmo ADMIN_SECRET (sessionStorage compartilhado com /admin).
 */

import { useEffect, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricsResponse {
  range: { from: string; to: string; days: number };
  revenue: {
    mrr: number; arr: number;
    activeSubs: number; monthlySubs: number; yearlySubs: number;
    onTrial: number;
    trialConversionPct: number | null;
    churnPct: number | null;
    renewals7d: number;
    inactivePaying: number;
    newUsers: number;
    totalUsers: number;
    totalNonInstitutional: number;
  };
  retention: { d1: number | null; d7: number | null; d30: number | null };
  openai: {
    tableMissing: boolean;
    totalCost: number;
    callCount: number;
    costPerActiveSub: number;
    byEndpoint: Array<{ endpoint: string; cost: number; calls: number; tokens: number }>;
    byModel:    Array<{ model: string;    cost: number; calls: number; tokens: number }>;
    topUsers:   Array<{ userId: string; email: string | null; name: string | null; cost: number }>;
    timeseries: Array<{ date: string; cost: number }>;
  };
}

// ── Palette (mesmo do /admin) ────────────────────────────────────────────────
const C = {
  bg:         '#F4F3FA',
  card:       '#FFFFFF',
  navy:       '#16153A',
  navyMid:    '#4B4A72',
  navyLight:  '#9896B8',
  navyGhost:  'rgba(22,21,58,0.05)',
  border:     'rgba(22,21,58,0.08)',
  green:      '#A3FF3C',
  greenDark:  '#3D8800',
  blue:       '#3B82F6',
  orange:     '#EA580C',
  red:        '#EF4444',
  shadow:     '0 1px 3px rgba(22,21,58,0.08), 0 1px 2px rgba(22,21,58,0.04)',
  shadowLg:   '0 20px 60px rgba(22,21,58,0.14)',
};

// ── Range presets ────────────────────────────────────────────────────────────
type RangePreset = '7d' | '30d' | '90d' | 'custom';

export default function MetricsPage() {
  const [secret, setSecret]       = useState('');
  const [authed, setAuthed]       = useState(false);
  const [data, setData]           = useState<MetricsResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [preset, setPreset]       = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');

  useEffect(() => {
    const s = sessionStorage.getItem('admin_secret');
    if (s) { setSecret(s); setAuthed(true); }
  }, []);

  const fetchMetrics = useCallback(async (s: string, p: RangePreset, f: string, t: string) => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (p === 'custom' && f && t) {
        qs.set('from', f);
        qs.set('to', t);
      } else {
        qs.set('days', p.replace('d', ''));
      }
      const res = await fetch(`/api/admin/metrics?${qs}`, { headers: { 'x-admin-secret': s } });
      if (res.status === 401) { setError('Senha incorreta.'); setAuthed(false); return; }
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setData(json);
    } catch {
      setError('Erro ao carregar metricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed || !secret) return;
    if (preset === 'custom' && (!customFrom || !customTo)) return;
    fetchMetrics(secret, preset, customFrom, customTo);
  }, [authed, secret, preset, customFrom, customTo, fetchMetrics]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    setAuthed(true);
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: C.card, padding: 40, borderRadius: 20, maxWidth: 400, width: '100%', boxShadow: C.shadowLg }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.navy, marginBottom: 8 }}>Charlotte Metrics</h1>
          <p style={{ color: C.navyMid, marginBottom: 24, fontSize: 14 }}>Insira a senha de admin para continuar.</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            autoFocus
            style={{
              width: '100%', padding: '12px 16px',
              border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            style={{
              width: '100%', padding: '12px 16px',
              background: C.navy, color: '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.navy, letterSpacing: '-0.5px' }}>Charlotte Metrics</h1>
            <p style={{ color: C.navyMid, margin: '4px 0 0', fontSize: 14 }}>
              Receita, retencao e custo OpenAI em producao.
              {data && <span style={{ color: C.navyLight, marginLeft: 8 }}>
                — {new Date(data.range.from).toLocaleDateString('pt-BR')} a {new Date(data.range.to).toLocaleDateString('pt-BR')} ({data.range.days}d)
              </span>}
            </p>
          </div>
          <a href="/admin" style={{ fontSize: 13, color: C.navyMid, textDecoration: 'none' }}>&larr; voltar para /admin</a>
        </div>

        {/* ── Range picker ───────────────────────────────────────────── */}
        <div style={{ background: C.card, padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['7d', '30d', '90d'] as RangePreset[]).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              style={{
                padding: '8px 18px',
                background: preset === p ? C.navy : 'transparent',
                color: preset === p ? '#fff' : C.navyMid,
                border: `1px solid ${preset === p ? C.navy : C.border}`,
                borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
          <span style={{ color: C.navyLight, fontSize: 13 }}>ou:</span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => { setCustomFrom(e.target.value); setPreset('custom'); }}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}
          />
          <span style={{ color: C.navyLight }}>-</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => { setCustomTo(e.target.value); setPreset('custom'); }}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}
          />
          {loading && <span style={{ color: C.navyLight, fontSize: 13, marginLeft: 'auto' }}>carregando...</span>}
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: C.red, padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ════════════════════════════════════════════════════════ */}
            {/* CAMADA 1 — RECEITA & RETENCAO                          */}
            {/* ════════════════════════════════════════════════════════ */}
            <SectionTitle>Receita</SectionTitle>
            <Grid cols={4}>
              <KpiCard label="MRR" value={`$${data.revenue.mrr}`} sub={`${data.revenue.activeSubs} assinantes ativos`} accent={C.green} />
              <KpiCard label="ARR projetada" value={`$${data.revenue.arr}`} sub="MRR × 12" accent={C.greenDark} />
              <KpiCard label="Assinantes mensais" value={data.revenue.monthlySubs} sub="R$ 39,90/mes" accent={C.navy} />
              <KpiCard label="Assinantes anuais" value={data.revenue.yearlySubs} sub="R$ 379/ano" accent={C.navy} />
            </Grid>

            <SectionTitle>Conversao & Churn</SectionTitle>
            <Grid cols={4}>
              <KpiCard label="Em trial agora" value={data.revenue.onTrial} sub="pre-conversao" accent={C.orange} />
              <KpiCard label="Trial → Pago" value={data.revenue.trialConversionPct != null ? `${data.revenue.trialConversionPct}%` : '—'} sub="historico total" accent={C.blue} />
              <KpiCard label="Churn" value={data.revenue.churnPct != null ? `${data.revenue.churnPct}%` : '—'} sub="cancelados + expirados" accent={C.red} />
              <KpiCard label="Renovacoes em 7d" value={data.revenue.renewals7d} sub="proximas cobrancas" accent={C.orange} />
            </Grid>

            <SectionTitle>Retencao (cohort ultimos 60d)</SectionTitle>
            <Grid cols={4}>
              <KpiCard label="D1" value={data.retention.d1 != null ? `${data.retention.d1}%` : '—'} sub="voltaram em 1 dia" accent={C.blue} />
              <KpiCard label="D7" value={data.retention.d7 != null ? `${data.retention.d7}%` : '—'} sub="voltaram em 7 dias" accent={C.blue} />
              <KpiCard label="D30" value={data.retention.d30 != null ? `${data.retention.d30}%` : '—'} sub="voltaram em 30 dias" accent={C.blue} />
              <KpiCard label="Inativos pagando" value={data.revenue.inactivePaying} sub="active sem pratica 14d" accent={C.red} />
            </Grid>

            <SectionTitle>Base de usuarios</SectionTitle>
            <Grid cols={3}>
              <KpiCard label={`Novos no periodo`} value={data.revenue.newUsers} sub={`${data.range.days} dias`} accent={C.navy} />
              <KpiCard label="Nao-institucionais" value={data.revenue.totalNonInstitutional} sub="base B2C" accent={C.navy} />
              <KpiCard label="Total de usuarios" value={data.revenue.totalUsers} sub="B2C + B2B" accent={C.navy} />
            </Grid>

            {/* ════════════════════════════════════════════════════════ */}
            {/* CAMADA 2 — CUSTO OPENAI                                */}
            {/* ════════════════════════════════════════════════════════ */}
            <SectionTitle>Custo OpenAI (no periodo)</SectionTitle>

            {data.openai.tableMissing ? (
              <div style={{ background: '#FFF7ED', border: `1px solid #FED7AA`, color: C.orange, padding: 16, borderRadius: 12, fontSize: 14, lineHeight: 1.5 }}>
                <strong>Tabela <code>charlotte.openai_usage</code> ainda nao existe.</strong>
                <br />
                Rode a migration <code>supabase/migrations/20260422_openai_usage.sql</code> no Supabase SQL Editor e depois instrumente os endpoints (<code>app/api/*/route.ts</code>) com <code>logOpenAIUsage()</code> de <code>lib/openai-usage.ts</code>.
              </div>
            ) : (
              <>
                <Grid cols={3}>
                  <KpiCard label="Custo total" value={`$${data.openai.totalCost}`} sub={`${data.openai.callCount} chamadas`} accent={C.red} />
                  <KpiCard label="Custo / assinante" value={`$${data.openai.costPerActiveSub}`} sub="medio no periodo" accent={C.orange} />
                  <KpiCard label="Margem liquida" value={`$${round2(data.revenue.mrr - data.openai.totalCost)}`} sub="MRR - custo periodo" accent={(data.revenue.mrr - data.openai.totalCost) >= 0 ? C.greenDark : C.red} />
                </Grid>

                {/* Tabelas detalhe */}
                <Grid cols={2}>
                  <TableCard title="Por endpoint" rows={data.openai.byEndpoint.map(r => [r.endpoint, `${r.calls}`, `$${r.cost}`])} cols={['Endpoint', 'Calls', 'Custo']} />
                  <TableCard title="Por modelo" rows={data.openai.byModel.map(r => [r.model, `${r.calls}`, `$${r.cost}`])} cols={['Modelo', 'Calls', 'Custo']} />
                </Grid>

                <TableCard title="Top 10 usuarios por custo" rows={data.openai.topUsers.map(r => [r.email || r.name || r.userId.slice(0, 8), `$${r.cost}`])} cols={['Usuario', 'Custo']} />

                {data.openai.timeseries.length > 0 && (
                  <div style={{ background: C.card, padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 16 }}>Custo por dia</div>
                    <MiniBarChart data={data.openai.timeseries} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 800, color: C.navyMid, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '32px 0 12px' }}>
      {children}
    </h2>
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 16,
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: C.shadow,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent ?? C.navy, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.navyLight, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function TableCard({ title, cols, rows }: { title: string; cols: string[]; rows: Array<string[]> }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ padding: 20, color: C.navyLight, fontSize: 13 }}>Sem dados no periodo.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.navyGhost }}>
              {cols.map(c => (
                <th key={c} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: C.navyMid, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                {r.map((cell, j) => (
                  <td key={j} style={{ padding: '10px 20px', color: j === 0 ? C.navy : C.navyMid, fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ date: string; cost: number }> }) {
  const max = Math.max(...data.map(d => d.cost), 0.01);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto', paddingBottom: 24 }}>
      {data.map(d => (
        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24, position: 'relative' }}>
          <div
            title={`${d.date}: $${d.cost}`}
            style={{
              width: 20,
              height: `${(d.cost / max) * 100}%`,
              minHeight: 2,
              background: C.navy,
              borderRadius: '4px 4px 0 0',
            }}
          />
          <div style={{ position: 'absolute', bottom: -20, fontSize: 9, color: C.navyLight, transform: 'rotate(-30deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
            {d.date.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
