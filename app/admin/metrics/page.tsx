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
  mrrHealth: {
    newMrr: number;
    churnedMrr: number;
    quickRatio: number;
    newInRange:     { monthly: number; yearly: number; count: number };
    churnedInRange: { monthly: number; yearly: number; count: number };
    mrrTrend: Array<{ week: string; amount: number }>;
  };
  engagement: {
    dau: number; wau: number; mau: number;
    stickinessPct: number | null;
    dauTimeseries: Array<{ date: string; dau: number }>;
  };
  activationFunnel: Array<{ stage: string; label: string; count: number; eligibleDenominator?: number }>;
  streakDistribution: Array<{ bucket: string; count: number }>;
  notifications: {
    tableMissing: boolean;
    activeTokens: number;
    totalUsers: number;
    sent: number;
    failed: number;
    deliveryRatePct: number | null;
    byType: Array<{ type: string; sent: number; uniqueUsers: number }>;
    byCategory: { core: number; prevention: number; revenue: number; winback: number };
    timeseries: Array<{ date: string; count: number }>;
  };
  retentionCohorts: Array<{
    cohort: string;
    size: number;
    survival: {
      w1: number | null; w2: number | null; w3: number | null;
      w4: number | null; w6: number | null; w8: number | null;
    };
  }>;
  timeToFirstValue: {
    sampleSize: number;
    medianHours: number | null;
    p90Hours: number | null;
    distribution: Array<{ bucket: string; count: number }>;
  };
  practiceHeatmap: number[][]; // 7×24
  previousPeriod: {
    range: { from: string; to: string };
    newUsers: number;
    dau: number;
    mau: number;
    notificationsSent: number;
    totalCost: number;
  };
  alerts: Array<{ severity: 'warn' | 'critical'; message: string }>;
  filters: { level: string | null; plan: string | null };
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

// ── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'engagement' | 'retention' | 'push' | 'costs';
const TABS: Array<{ id: TabId; label: string; emoji: string }> = [
  { id: 'overview',   label: 'Overview',     emoji: '📊' },
  { id: 'engagement', label: 'Engajamento',  emoji: '📈' },
  { id: 'retention',  label: 'Retencao',     emoji: '🔄' },
  { id: 'push',       label: 'Push',         emoji: '🔔' },
  { id: 'costs',      label: 'Custos',       emoji: '💸' },
];

export default function MetricsPage() {
  const [secret, setSecret]       = useState('');
  const [authed, setAuthed]       = useState(false);
  const [data, setData]           = useState<MetricsResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [preset, setPreset]       = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [planFilter,  setPlanFilter]  = useState<string>('');
  const [activeTab, setActiveTab]     = useState<TabId>('overview');

  useEffect(() => {
    const s = sessionStorage.getItem('admin_secret');
    if (s) { setSecret(s); setAuthed(true); }
    // Read initial tab from URL hash (#engagement etc).
    const h = window.location.hash.replace('#', '');
    if (TABS.some(t => t.id === h)) setActiveTab(h as TabId);
  }, []);

  // Sync active tab to URL hash + keyboard arrow navigation.
  useEffect(() => {
    if (!authed) return;
    const curr = window.location.hash.replace('#', '');
    if (curr !== activeTab) window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab, authed]);

  useEffect(() => {
    if (!authed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = TABS.findIndex(t => t.id === activeTab);
      const next = e.key === 'ArrowRight'
        ? TABS[(idx + 1) % TABS.length]
        : TABS[(idx - 1 + TABS.length) % TABS.length];
      setActiveTab(next.id);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, authed]);

  const fetchMetrics = useCallback(async (
    s: string, p: RangePreset, f: string, t: string,
    level: string, plan: string,
  ) => {
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
      if (level) qs.set('level', level);
      if (plan)  qs.set('plan',  plan);
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
    fetchMetrics(secret, preset, customFrom, customTo, levelFilter, planFilter);
  }, [authed, secret, preset, customFrom, customTo, levelFilter, planFilter, fetchMetrics]);

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
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Sticky top zone (header + range + filters + tabs) ───── */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: C.bg,
          paddingTop: 32,
          paddingBottom: 8,
          zIndex: 10,
          boxShadow: '0 12px 16px -16px rgba(22,21,58,0.25)',
        }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.navy, letterSpacing: '-0.5px' }}>Charlotte Metrics</h1>
            <p style={{ color: C.navyMid, margin: '2px 0 0', fontSize: 13 }}>
              {data && <span style={{ color: C.navyLight }}>
                {new Date(data.range.from).toLocaleDateString('pt-BR')} a {new Date(data.range.to).toLocaleDateString('pt-BR')} · {data.range.days}d
              </span>}
            </p>
          </div>
          <a href="/admin" style={{ fontSize: 13, color: C.navyMid, textDecoration: 'none' }}>&larr; voltar para /admin</a>
        </div>

        {/* ── Range picker ───────────────────────────────────────────── */}
        <div style={{ background: C.card, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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

        {/* ── Segmentation filters ──────────────────────────────────── */}
        <div style={{ background: C.card, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: C.navyMid, fontSize: 13, fontWeight: 700 }}>Segmentar por:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">Todos os niveis</option>
            <option value="Novice">Novice</option>
            <option value="Inter">Inter</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {(levelFilter || planFilter) && (
            <button
              onClick={() => { setLevelFilter(''); setPlanFilter(''); }}
              style={{ padding: '6px 12px', background: 'transparent', color: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 18px',
                  background: 'transparent',
                  color: active ? C.navy : C.navyMid,
                  border: 'none',
                  borderBottom: `2px solid ${active ? C.navy : 'transparent'}`,
                  borderRadius: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  fontFamily: 'inherit',
                  marginBottom: -1,
                }}
              >
                <span style={{ marginRight: 6 }}>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', alignSelf: 'center', color: C.navyLight, fontSize: 11, paddingRight: 8 }}>
            Use ← → para navegar
          </div>
        </div>

        </div>
        {/* ── end sticky zone ──────────────────────────────────────── */}

        <div style={{ paddingTop: 20, paddingBottom: 48 }}>

        {/* ── Alerts banner ─────────────────────────────────────────── */}
        {data && data.alerts && data.alerts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {data.alerts.map((a, i) => (
              <div
                key={i}
                style={{
                  background: a.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                  border: `1px solid ${a.severity === 'critical' ? '#FECACA' : '#FDE68A'}`,
                  color: a.severity === 'critical' ? '#991B1B' : '#92400E',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', color: C.red, padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ═══════════════════ TAB: OVERVIEW ═════════════════════ */}
            {activeTab === 'overview' && (<>
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
            </>)}

            {/* ═══════════════════ TAB: RETENTION ════════════════════ */}
            {activeTab === 'retention' && (<>
            <SectionTitle>Retencao (cohort ultimos 60d)</SectionTitle>
            <Grid cols={4}>
              <KpiCard label="D1" value={data.retention.d1 != null ? `${data.retention.d1}%` : '—'} sub="voltaram em 1 dia" accent={C.blue} />
              <KpiCard label="D7" value={data.retention.d7 != null ? `${data.retention.d7}%` : '—'} sub="voltaram em 7 dias" accent={C.blue} />
              <KpiCard label="D30" value={data.retention.d30 != null ? `${data.retention.d30}%` : '—'} sub="voltaram em 30 dias" accent={C.blue} />
              <KpiCard label="Inativos pagando" value={data.revenue.inactivePaying} sub="active sem pratica 14d" accent={C.red} />
            </Grid>

            <SectionTitle>Base de usuarios</SectionTitle>
            <Grid cols={3}>
              <KpiCard
                label={`Novos no periodo`}
                value={data.revenue.newUsers}
                sub={`${data.range.days} dias`}
                accent={C.navy}
                trendDelta={trendDelta(data.revenue.newUsers, data.previousPeriod.newUsers)}
              />
              <KpiCard label="Nao-institucionais" value={data.revenue.totalNonInstitutional} sub="base B2C" accent={C.navy} />
              <KpiCard label="Total de usuarios" value={data.revenue.totalUsers} sub="B2C + B2B" accent={C.navy} />
            </Grid>

            </>)}
            {/* ═══════════════════ back to OVERVIEW ══════════════════ */}
            {activeTab === 'overview' && (<>
            <SectionTitle>Saude do MRR</SectionTitle>
            <Grid cols={4}>
              <KpiCard label="Novo MRR no periodo" value={`$${data.mrrHealth.newMrr}`} sub={`${data.mrrHealth.newInRange.count} assinaturas novas`} accent={C.greenDark} />
              <KpiCard label="Churned MRR" value={`$${data.mrrHealth.churnedMrr}`} sub={`${data.mrrHealth.churnedInRange.count} perdas`} accent={C.red} />
              <KpiCard label="Quick Ratio" value={data.mrrHealth.quickRatio.toFixed(2)} sub={data.mrrHealth.quickRatio >= 4 ? 'saudavel (>=4)' : data.mrrHealth.quickRatio >= 1 ? 'crescendo' : 'encolhendo'} accent={data.mrrHealth.quickRatio >= 4 ? C.greenDark : data.mrrHealth.quickRatio >= 1 ? C.orange : C.red} />
              <KpiCard label="Delta MRR" value={`$${round2(data.mrrHealth.newMrr - data.mrrHealth.churnedMrr)}`} sub="novo - churn" accent={data.mrrHealth.newMrr >= data.mrrHealth.churnedMrr ? C.greenDark : C.red} />
            </Grid>
            {data.mrrHealth.mrrTrend.length > 0 && (
              <ChartCard title="Novo MRR por semana (12 semanas)">
                <MiniBars data={data.mrrHealth.mrrTrend.map(d => ({ label: d.week.slice(5), value: d.amount }))} formatValue={v => `$${v}`} barColor={C.greenDark} />
              </ChartCard>
            )}
            </>)}

            {/* ═══════════════════ TAB: ENGAGEMENT ═══════════════════ */}
            {activeTab === 'engagement' && (<>
            <SectionTitle>Engagement</SectionTitle>
            <Grid cols={4}>
              <KpiCard
                label="DAU"
                value={data.engagement.dau}
                sub="users ativos hoje"
                accent={C.navy}
                trendDelta={trendDelta(data.engagement.dau, data.previousPeriod.dau)}
              />
              <KpiCard label="WAU" value={data.engagement.wau} sub="ativos ultimos 7d" accent={C.navy} />
              <KpiCard
                label="MAU"
                value={data.engagement.mau}
                sub="ativos ultimos 30d"
                accent={C.navy}
                trendDelta={trendDelta(data.engagement.mau, data.previousPeriod.mau)}
              />
              <KpiCard
                label="Stickiness (DAU/MAU)"
                value={data.engagement.stickinessPct != null ? `${data.engagement.stickinessPct}%` : '—'}
                sub={data.engagement.stickinessPct != null && data.engagement.stickinessPct >= 20 ? 'bom (>=20%)' : 'a melhorar'}
                accent={data.engagement.stickinessPct != null && data.engagement.stickinessPct >= 20 ? C.greenDark : C.orange}
              />
            </Grid>
            {data.engagement.dauTimeseries.length > 0 && (
              <ChartCard title="DAU por dia (90 dias)">
                <MiniBars data={data.engagement.dauTimeseries.map(d => ({ label: d.date.slice(5), value: d.dau }))} barColor={C.navy} />
              </ChartCard>
            )}

            <SectionTitle>Funil de ativacao (no periodo)</SectionTitle>
            <FunnelChart stages={data.activationFunnel} />
            </>)}

            {/* ═══════════════════ back to RETENTION ═════════════════ */}
            {activeTab === 'retention' && (<>
            <SectionTitle>Distribuicao de streaks (nao-institucionais)</SectionTitle>
            <ChartCard title="Usuarios por faixa de streak">
              <MiniBars
                data={data.streakDistribution.map(d => ({ label: `${d.bucket} dias`, value: d.count }))}
                barColor={C.blue}
                widthPerBar={80}
              />
            </ChartCard>
            </>)}

            {/* ═══════════════════ TAB: PUSH ═════════════════════════ */}
            {activeTab === 'push' && (<>
            <SectionTitle>Push notifications (no periodo)</SectionTitle>
            {data.notifications.tableMissing ? (
              <div style={{ background: '#FFF7ED', border: `1px solid #FED7AA`, color: C.orange, padding: 16, borderRadius: 12, fontSize: 14, lineHeight: 1.5 }}>
                Tabela <code>notifications.notification_logs</code> nao encontrada.
              </div>
            ) : (
              <>
                <Grid cols={4}>
                  <KpiCard label="Tokens ativos" value={data.notifications.activeTokens} sub={`de ${data.notifications.totalUsers} users`} accent={C.greenDark} />
                  <KpiCard label="Pushes enviados" value={data.notifications.sent} sub="status = sent" accent={C.navy} />
                  <KpiCard label="Falhas" value={data.notifications.failed} sub="status = failed" accent={data.notifications.failed > 0 ? C.red : C.navyLight} />
                  <KpiCard label="Taxa de entrega" value={data.notifications.deliveryRatePct != null ? `${data.notifications.deliveryRatePct}%` : '—'} sub="sent / (sent + failed)" accent={data.notifications.deliveryRatePct != null && data.notifications.deliveryRatePct >= 95 ? C.greenDark : C.orange} />
                </Grid>
                <Grid cols={4}>
                  <KpiCard label="Core" value={data.notifications.byCategory.core} sub="daily/praise/streak/goal/weekly/xp" accent={C.navy} />
                  <KpiCard label="Prevention" value={data.notifications.byCategory.prevention} sub="proativos" accent={C.blue} />
                  <KpiCard label="Revenue" value={data.notifications.byCategory.revenue} sub="trial/sub" accent={C.orange} />
                  <KpiCard label="Winback" value={data.notifications.byCategory.winback} sub="re-engajamento" accent={C.red} />
                </Grid>
                {data.notifications.byType.length > 0 && (
                  <TableCard
                    title="Por tipo"
                    rows={data.notifications.byType.map(r => [r.type, `${r.sent}`, `${r.uniqueUsers}`])}
                    cols={['Tipo', 'Envios', 'Users unicos']}
                  />
                )}
                {data.notifications.timeseries.length > 0 && (
                  <ChartCard title="Pushes por dia">
                    <MiniBars data={data.notifications.timeseries.map(d => ({ label: d.date.slice(5), value: d.count }))} barColor={C.blue} />
                  </ChartCard>
                )}
              </>
            )}

            </>)}

            {/* ═══════════════════ back to RETENTION ═════════════════ */}
            {activeTab === 'retention' && (<>
            <SectionTitle>Retention por cohort semanal (8 ultimas)</SectionTitle>
            <RetentionCohortTable cohorts={data.retentionCohorts} />
            </>)}

            {/* ═══════════════════ back to ENGAGEMENT ════════════════ */}
            {activeTab === 'engagement' && (<>
            <SectionTitle>Time to first value</SectionTitle>
            <Grid cols={3}>
              <KpiCard
                label="Mediana (P50)"
                value={data.timeToFirstValue.medianHours != null ? formatHours(data.timeToFirstValue.medianHours) : '—'}
                sub="do signup a 1a pratica"
                accent={C.blue}
              />
              <KpiCard
                label="P90"
                value={data.timeToFirstValue.p90Hours != null ? formatHours(data.timeToFirstValue.p90Hours) : '—'}
                sub="90% dos users"
                accent={C.blue}
              />
              <KpiCard
                label="Amostra"
                value={data.timeToFirstValue.sampleSize}
                sub="users com 1a pratica"
                accent={C.navy}
              />
            </Grid>
            {data.timeToFirstValue.distribution.length > 0 && (
              <ChartCard title="Distribuicao TTFV">
                <MiniBars
                  data={data.timeToFirstValue.distribution.map(d => ({ label: d.bucket, value: d.count }))}
                  barColor={C.blue}
                  widthPerBar={80}
                />
              </ChartCard>
            )}

            <SectionTitle>Horario de pratica (heatmap, ultimos 90d, BRT)</SectionTitle>
            <PracticeHeatmap matrix={data.practiceHeatmap} />
            </>)}

            {/* ═══════════════════ TAB: COSTS ════════════════════════ */}
            {activeTab === 'costs' && (<>
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
            </>)}
          </>
        )}
        </div>
        {/* ── end content zone ────────────────────────────────────── */}
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

function KpiCard({
  label, value, sub, accent, trendDelta: delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  trendDelta?: { pct: number | null; up: boolean | null };
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: C.shadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
        {delta && delta.pct != null && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: delta.up ? C.greenDark : C.red,
            background: delta.up ? 'rgba(61,136,0,0.08)' : 'rgba(239,68,68,0.08)',
            padding: '2px 8px', borderRadius: 8,
          }}>
            {delta.up ? '↑' : '↓'} {Math.abs(delta.pct)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent ?? C.navy, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.navyLight, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function trendDelta(curr: number, prev: number): { pct: number | null; up: boolean | null } {
  if (prev <= 0) return { pct: null, up: null };
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  return { pct, up: diff >= 0 };
}

function formatHours(h: number): string {
  if (h < 1)  return `${Math.round(h * 60)}min`;
  if (h < 48) return `${Math.round(h)}h`;
  const d = h / 24;
  if (d < 14) return `${d.toFixed(1)}d`;
  return `${Math.round(d)}d`;
}

function RetentionCohortTable({ cohorts }: { cohorts: MetricsResponse['retentionCohorts'] }) {
  const cell = (v: number | null) => v == null ? '—' : `${v}%`;
  const color = (v: number | null) => {
    if (v == null) return C.navyGhost;
    if (v >= 50) return 'rgba(61,136,0,0.18)';
    if (v >= 30) return 'rgba(234,88,12,0.15)';
    if (v >= 15) return 'rgba(234,88,12,0.08)';
    return 'rgba(239,68,68,0.08)';
  };
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.navyGhost }}>
            {['Cohort (semana)', 'Size', 'W1', 'W2', 'W3', 'W4', 'W6', 'W8'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: C.navyMid, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(c => (
            <tr key={c.cohort} style={{ borderTop: `1px solid ${C.border}` }}>
              <td style={{ padding: '10px 16px', color: C.navy, fontWeight: 600 }}>{c.cohort}</td>
              <td style={{ padding: '10px 16px', color: C.navyMid }}>{c.size}</td>
              {(['w1', 'w2', 'w3', 'w4', 'w6', 'w8'] as const).map(k => (
                <td key={k} style={{ padding: '10px 16px', background: color(c.survival[k]), color: C.navy }}>
                  {cell(c.survival[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PracticeHeatmap({ matrix }: { matrix: number[][] }) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  let max = 0;
  for (const row of matrix) for (const v of row) if (v > max) max = v;
  const cell = (v: number) => {
    if (max === 0) return '#F4F3FA';
    const a = v / max;
    // navy alpha escalando
    return `rgba(22, 21, 58, ${0.06 + a * 0.74})`;
  };
  return (
    <div style={{ background: C.card, padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 8px' }}></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} style={{ padding: '4px', color: C.navyLight, fontWeight: 600, width: 22 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d, di) => (
            <tr key={d}>
              <td style={{ padding: '4px 8px', color: C.navyMid, fontWeight: 700, fontSize: 11 }}>{d}</td>
              {matrix[di].map((v, h) => (
                <td
                  key={h}
                  title={`${d} ${h}h: ${v} praticas`}
                  style={{
                    width: 22, height: 22,
                    background: cell(v),
                    color: v > max * 0.5 ? '#fff' : C.navyMid,
                    textAlign: 'center',
                    borderRadius: 3,
                    fontWeight: v > 0 ? 600 : 400,
                  }}
                >
                  {v > 0 ? v : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: C.navyLight, marginTop: 12 }}>
        Pratica por hora × dia da semana (BRT). Max: {max} em uma celula.
      </div>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

// MiniBars — bar chart generico, uso em MRR trend / DAU / streak / push timeline.
function MiniBars({
  data,
  barColor = C.navy,
  widthPerBar = 24,
  formatValue,
}: {
  data: Array<{ label: string; value: number }>;
  barColor?: string;
  widthPerBar?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 0.01);
  const fmt = formatValue ?? ((v: number) => `${v}`);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, overflowX: 'auto', paddingBottom: 28 }}>
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: widthPerBar, position: 'relative' }}>
          <div
            title={`${d.label}: ${fmt(d.value)}`}
            style={{
              width: widthPerBar * 0.7,
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 2 : 0,
              background: barColor,
              borderRadius: '4px 4px 0 0',
            }}
          />
          <div style={{
            position: 'absolute', bottom: -22,
            fontSize: 9, color: C.navyLight,
            transform: 'rotate(-30deg)', transformOrigin: 'center',
            whiteSpace: 'nowrap',
          }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// FunnelChart — barras empilhadas horizontais mostrando queda a cada estagio.
function FunnelChart({ stages }: { stages: Array<{ stage: string; label: string; count: number; eligibleDenominator?: number }> }) {
  const top = stages[0]?.count ?? 0;
  return (
    <div style={{ background: C.card, padding: 20, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, marginBottom: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((s, i) => {
          const denom = s.eligibleDenominator ?? top;
          const pct = denom === 0 ? 0 : (s.count / denom) * 100;
          const prev = i > 0 ? stages[i - 1].count : null;
          const dropPct = prev != null && prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : null;
          return (
            <div key={s.stage} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 160px', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{s.label}</div>
              <div style={{ height: 28, background: C.navyGhost, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${Math.max(pct, 2)}%`,
                  height: '100%',
                  background: i === stages.length - 1 ? C.greenDark : C.blue,
                  transition: 'width 0.3s',
                }} />
                <div style={{
                  position: 'absolute', top: 0, left: 8, height: '100%',
                  display: 'flex', alignItems: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  textShadow: '0 0 4px rgba(0,0,0,0.25)',
                }}>
                  {s.count}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.navyLight, textAlign: 'right' }}>
                {Math.round(pct)}%{dropPct != null ? ` · -${dropPct}% vs anterior` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
