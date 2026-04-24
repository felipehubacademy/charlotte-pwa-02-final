'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, Wifi, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface TokenStats { total: number; withToken: number; withoutToken: number; }
interface PeriodStats { sent: number; failed: number; deliveryRate?: number; }
interface ByType { type: string; sent: number; failed: number; uniqueUsers: number; }
interface Log {
  id: string; user_id: string; notification_type: string; status: string;
  message_title: string | null; message_body: string | null;
  error_message: string | null; created_at: string;
  userName: string | null; userEmail: string | null;
}
interface Data {
  tokenStats: TokenStats; stats24h: PeriodStats; stats7d: PeriodStats;
  byType: ByType[]; logs: Log[]; page: number; total: number; perPage: number;
}

type TaskType = 'daily' | 'praise' | 'streak' | 'goal' | 'weekly' | 'engagement';

// ── Schedule reference ────────────────────────────────────────────────────────
const TASKS: { key: TaskType; label: string; schedule: string; color: string }[] = [
  { key: 'daily',      label: 'Daily Reminder',   schedule: '11h (local)',       color: 'var(--accent)' },
  { key: 'goal',       label: 'Goal Reminder',     schedule: '16h (local)',       color: 'var(--brand)'  },
  { key: 'streak',     label: 'Streak Reminder',   schedule: '18h (local)',       color: 'var(--warn)'   },
  { key: 'praise',     label: 'Charlotte Praise',  schedule: '18h (local)',       color: 'var(--ok)'     },
  { key: 'weekly',     label: 'Weekly Challenge',  schedule: 'seg 9h (local)',    color: 'var(--accent)' },
  { key: 'engagement', label: 'Engagement Push',   schedule: 'dinâmico',          color: 'var(--err)'    },
];

const TYPE_COLORS: Record<string, string> = {
  daily_reminder:   'var(--accent)',
  streak_reminder:  'var(--warn)',
  goal_reminder:    'var(--brand)',
  charlotte_message:'var(--ok)',
  weekly_challenge: 'var(--accent)',
  engagement:       'var(--err)',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
  new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const fmtType = (t: string) => t.replace(/_/g, ' ');

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const cls = status === 'sent' ? 'badge-ok' : status === 'failed' ? 'badge-err' : 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
export default function AdminNotificationsPage() {
  const [data, setData]         = useState<Data | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [typeFilter, setType]   = useState('');
  const [statusFilter, setSt]   = useState('');
  const [trigger, setTrigger]   = useState<{ task: TaskType; loading: boolean; result: string } | null>(null);
  const [updatedAt, setUpdated] = useState<Date | null>(null);

  const secret = typeof window !== 'undefined' ? sessionStorage.getItem('adminSecret') ?? '' : '';

  const fetchData = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (typeFilter)   params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/notifications?${params}`, {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setUpdated(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, typeFilter, statusFilter, secret]);

  useEffect(() => { fetchData(1); setPage(1); }, [typeFilter, statusFilter]);
  useEffect(() => { fetchData(page); }, [page]);

  const handleTrigger = async (task: TaskType) => {
    setTrigger({ task, loading: true, result: '' });
    try {
      const res  = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ task }),
      });
      const json = await res.json();
      setTrigger({ task, loading: false, result: json.ok ? `Concluido em ${json.ms}ms` : `Erro: ${json.error}` });
      setTimeout(() => fetchData(1), 1500);
    } catch (e: any) {
      setTrigger({ task, loading: false, result: `Erro: ${e.message}` });
    }
  };

  const d = data;
  const totalPages = d ? Math.ceil(d.total / d.perPage) : 1;
  const tokenPct   = d ? Math.round((d.tokenStats.withToken / Math.max(d.tokenStats.total, 1)) * 100) : 0;

  return (
    <div className="adm-page">
      {/* Top bar */}
      <div className="adm-topbar">
        <div style={{ flex: 1 }}>
          <div className="adm-topbar-title">Notificações</div>
          {updatedAt && <div className="adm-topbar-sub">Atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>}
        </div>
        <button className="adm-btn-sm ghost" onClick={() => fetchData(page)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      <div className="adm-body">
        {error && <div className="adm-alert crit" style={{ marginBottom: 16 }}>{error}</div>}

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="adm-grid" style={{ marginBottom: 20 }}>
          <div className="col-3">
            <div className="kpi-card fade-up">
              <div className="kpi-label">Enviadas (24h)</div>
              <div className="kpi-value" style={{ color: 'var(--ok)' }}>{d ? d.stats24h.sent.toLocaleString() : '—'}</div>
              {d && <div className="kpi-context">{d.stats24h.failed} falhas</div>}
            </div>
          </div>
          <div className="col-3">
            <div className="kpi-card fade-up" style={{ animationDelay: '60ms' }}>
              <div className="kpi-label">Enviadas (7d)</div>
              <div className="kpi-value">{d ? d.stats7d.sent.toLocaleString() : '—'}</div>
              {d && <div className="kpi-context">{d.stats7d.failed} falhas</div>}
            </div>
          </div>
          <div className="col-3">
            <div className="kpi-card fade-up" style={{ animationDelay: '120ms' }}>
              <div className="kpi-label">Taxa de Entrega (7d)</div>
              <div className="kpi-value" style={{ color: d && (d.stats7d.deliveryRate ?? 100) >= 90 ? 'var(--ok)' : 'var(--warn)' }}>
                {d ? `${d.stats7d.deliveryRate ?? 100}%` : '—'}
              </div>
              <div className="kpi-context">sent / (sent + failed)</div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi-card fade-up" style={{ animationDelay: '180ms' }}>
              <div className="kpi-label">Usuarios com Token</div>
              <div className="kpi-value">{d ? d.tokenStats.withToken : '—'}</div>
              {d && <div className="kpi-context">{d.tokenStats.withoutToken} sem token</div>}
            </div>
          </div>
        </div>

        <div className="adm-grid" style={{ gap: 16, marginBottom: 20 }}>
          {/* ── Manual Trigger ──────────────────────────────────────────────── */}
          <div className="col-8">
            <div className="adm-panel">
              <div className="adm-panel-hdr">
                <span className="adm-panel-title">Disparo Manual</span>
                <span className="adm-panel-sub">executa imediatamente, ignorando horario agendado</span>
              </div>
              <div className="adm-panel-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {TASKS.map(t => {
                    const isRunning = trigger?.task === t.key && trigger.loading;
                    const isDone    = trigger?.task === t.key && !trigger.loading && !!trigger.result;
                    return (
                      <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={() => handleTrigger(t.key)}
                          disabled={!!trigger?.loading}
                          className="adm-btn-sm ghost"
                          style={{ minWidth: 110, display: 'flex', alignItems: 'center', gap: 6, borderColor: t.color, color: t.color }}
                        >
                          <Play size={11} />
                          {isRunning ? 'Enviando...' : t.label}
                        </button>
                        <span style={{ fontSize: 11.5, color: 'var(--t3)', minWidth: 100 }}>
                          <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {t.schedule}
                        </span>
                        {isDone && (
                          <span style={{ fontSize: 11.5, color: trigger.result.startsWith('Erro') ? 'var(--err)' : 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {trigger.result.startsWith('Erro') ? <XCircle size={12} /> : <CheckCircle size={12} />}
                            {trigger.result}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Token Health ─────────────────────────────────────────────────── */}
          <div className="col-4">
            <div className="adm-panel" style={{ height: '100%' }}>
              <div className="adm-panel-hdr"><span className="adm-panel-title">Token Health</span></div>
              <div className="adm-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Wifi size={16} color="var(--ok)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>
                      {d?.tokenStats.withToken ?? '—'} com token ({tokenPct}%)
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--b2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${tokenPct}%`, background: tokenPct >= 80 ? 'var(--ok)' : 'var(--warn)', borderRadius: 3, transition: 'width 600ms ease' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <WifiOff size={16} color="var(--t3)" />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                      {d?.tokenStats.withoutToken ?? '—'} sem token
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>nao instalaram o app ou negaram permissao</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
                  Total de usuarios: <strong style={{ color: 'var(--t2)' }}>{d?.tokenStats.total ?? '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── By Type ─────────────────────────────────────────────────────────── */}
        {d && d.byType.length > 0 && (
          <div className="adm-panel" style={{ marginBottom: 20 }}>
            <div className="adm-panel-hdr">
              <span className="adm-panel-title">Por Tipo (7d)</span>
              <span className="adm-panel-sub">{d.byType.length} tipos ativos</span>
            </div>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Enviadas</th>
                  <th style={{ textAlign: 'right' }}>Falhas</th>
                  <th style={{ textAlign: 'right' }}>Usuarios</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                {d.byType.map(r => {
                  const rate = r.sent + r.failed === 0 ? 100 : Math.round((r.sent / (r.sent + r.failed)) * 100);
                  const color = TYPE_COLORS[r.type] ?? 'var(--t3)';
                  return (
                    <tr key={r.type}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>{fmtType(r.type)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}><span className="num" style={{ color: 'var(--ok)' }}>{r.sent.toLocaleString()}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="num" style={{ color: r.failed > 0 ? 'var(--err)' : 'var(--t3)' }}>{r.failed}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="num">{r.uniqueUsers}</span></td>
                      <td style={{ width: 100 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: rate >= 90 ? 'var(--ok)' : 'var(--warn)', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--t3)', minWidth: 28, textAlign: 'right' }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Logs Recentes ────────────────────────────────────────────────────── */}
        <div className="adm-panel">
          <div className="adm-panel-hdr">
            <span className="adm-panel-title">Logs Recentes</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="adm-select-ghost"
                value={typeFilter}
                onChange={e => { setType(e.target.value); setPage(1); }}
              >
                <option value="">Todos os tipos</option>
                {d?.byType.map(t => (
                  <option key={t.type} value={t.type}>{fmtType(t.type)}</option>
                ))}
              </select>
              <select
                className="adm-select-ghost"
                value={statusFilter}
                onChange={e => { setSt(e.target.value); setPage(1); }}
              >
                <option value="">Todos os status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div className="skeleton" style={{ height: 14, width: '60%', margin: '0 auto 10px' }} />
              <div className="skeleton" style={{ height: 14, width: '80%', margin: '0 auto 10px' }} />
              <div className="skeleton" style={{ height: 14, width: '70%', margin: '0 auto' }} />
            </div>
          ) : d && d.logs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
              Nenhum log encontrado.
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Mensagem</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {(d?.logs ?? []).map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--t1)' }}>
                        {log.userName ?? <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>sem nome</span>}
                      </div>
                      {log.userEmail && (
                        <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{log.userEmail}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: TYPE_COLORS[log.notification_type] ?? 'var(--t2)' }}>
                        {fmtType(log.notification_type)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      {log.message_title && (
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message_title}
                        </div>
                      )}
                      {log.message_body && (
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message_body}
                        </div>
                      )}
                      {log.error_message && (
                        <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 2 }}>{log.error_message}</div>
                      )}
                    </td>
                    <td><StatusDot status={log.status} /></td>
                    <td style={{ fontSize: 11.5, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                {d && `${((page - 1) * d.perPage) + 1}–${Math.min(page * d.perPage, d.total)} de ${d.total}`}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="adm-btn-sm ghost">
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="adm-btn-sm ghost">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
