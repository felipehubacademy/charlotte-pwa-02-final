'use client';

/**
 * app/admin/page.tsx
 * Charlotte Admin Dashboard — light theme (matches charlotte.hubacademybr.com)
 * Protected by ADMIN_SECRET (entered once, stored in sessionStorage).
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string | null;
  charlotte_level: 'Novice' | 'Inter' | 'Advanced' | null;
  placement_test_done: boolean;
  is_institutional: boolean;
  is_active: boolean;
  subscription_status: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;
  must_change_password: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  institutional: number;
  subscribers: number;
  onTrial: number;
  trialExpired: number;
  last30: number;
  growthPct: number | null;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:          '#F4F3FA',
  card:        '#FFFFFF',
  navy:        '#16153A',
  navyMid:     '#4B4A72',
  navyLight:   '#9896B8',
  navyGhost:   'rgba(22,21,58,0.05)',
  border:      'rgba(22,21,58,0.08)',
  green:       '#A3FF3C',
  greenDark:   '#3D8800',
  greenBg:     '#F0FFD9',
  blue:        '#3B82F6',
  blueBg:      '#EFF6FF',
  orange:      '#EA580C',
  orangeBg:    '#FFF7ED',
  red:         '#EF4444',
  redBg:       '#FEF2F2',
  shadow:      '0 1px 3px rgba(22,21,58,0.08), 0 1px 2px rgba(22,21,58,0.04)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(u: User) {
  if (u.is_institutional) return { label: 'Institucional', bg: C.blueBg,   color: C.blue,      border: '#BFDBFE' };
  if (u.subscription_status === 'active') return { label: 'Assinante',   bg: C.greenBg,  color: C.greenDark, border: '#BBF7D0' };
  if (u.subscription_status === 'trial') {
    const expired = u.trial_ends_at ? new Date(u.trial_ends_at) < new Date() : true;
    if (expired) return { label: 'Trial expirado', bg: C.redBg,    color: C.red,       border: '#FECACA' };
    const days = u.trial_ends_at ? Math.ceil((new Date(u.trial_ends_at).getTime() - Date.now()) / 86400000) : 0;
    return { label: `Trial • ${days}d`, bg: C.orangeBg, color: C.orange,    border: '#FED7AA' };
  }
  return { label: 'Sem plano', bg: C.navyGhost, color: C.navyLight, border: C.border };
}

function levelLabel(level: User['charlotte_level']) {
  if (!level) return { text: '—', color: C.navyLight };
  if (level === 'Novice')   return { text: 'Novice',       color: '#7C3AED' };
  if (level === 'Inter')    return { text: 'Intermediate', color: C.blue };
  if (level === 'Advanced') return { text: 'Advanced',     color: C.greenDark };
  return { text: level, color: C.navyLight };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret]       = useState('');
  const [authed, setAuthed]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [users, setUsers]         = useState<User[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'all' | 'institutional' | 'subscriber' | 'trial' | 'none'>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    const s = sessionStorage.getItem('admin_secret');
    if (s) { setSecret(s); setAuthed(true); }
  }, []);

  const fetchData = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-secret': s } });
      if (res.status === 401) { setError('Senha incorreta.'); setAuthed(false); return; }
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setUsers(json.users ?? []);
      setStats(json.stats ?? null);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && secret) fetchData(secret);
  }, [authed, secret, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    setAuthed(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setShowModal(false);
      setForm({ email: '', password: '', name: '' });
      fetchData(secret);
    } catch {
      setError('Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  };

  // ── Login screen ────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          width: 380, backgroundColor: C.card,
          borderRadius: 20, border: `1px solid ${C.border}`,
          boxShadow: C.shadow, padding: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={36} height={36}
              style={{ borderRadius: '50%', border: `2px solid ${C.green}` }} />
            <div>
              <div style={{ color: C.navy, fontWeight: 800, fontSize: 15 }}>Charlotte Admin</div>
              <div style={{ color: C.navyLight, fontSize: 12 }}>Hub Academy</div>
            </div>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="password"
              placeholder="Senha de admin"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={{
                backgroundColor: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '12px 14px',
                color: C.navy, fontSize: 14, outline: 'none',
                width: '100%', boxSizing: 'border-box',
              }}
              required
            />
            {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
            <button type="submit" style={{
              backgroundColor: C.navy, color: '#fff',
              fontWeight: 700, fontSize: 14,
              padding: '13px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
            }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Filtered users ─────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.email.toLowerCase().includes(search.toLowerCase())
      || (u.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'           ? true :
      filter === 'institutional' ? u.is_institutional :
      filter === 'subscriber'    ? u.subscription_status === 'active' :
      filter === 'trial'         ? u.subscription_status === 'trial' :
      filter === 'none'          ? u.subscription_status === 'none' :
      true;
    return matchSearch && matchFilter;
  });

  // ── Shared input style ─────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    backgroundColor: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '11px 14px',
    color: C.navy, fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    color: C.navyMid, fontSize: 12, fontWeight: 600,
    marginBottom: 6, display: 'block',
  };

  // ── Dashboard ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: C.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: C.navy,
    }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${C.border}`,
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={28} height={28}
            style={{ borderRadius: '50%', border: `2px solid ${C.green}` }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: C.navy, letterSpacing: '-0.3px' }}>Charlotte</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.navyLight,
            backgroundColor: C.navyGhost, borderRadius: 6,
            padding: '2px 8px', marginLeft: 4,
          }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => fetchData(secret)} style={{
            backgroundColor: 'transparent', border: `1px solid ${C.border}`,
            color: C.navyMid, fontSize: 13, padding: '7px 14px',
            borderRadius: 8, cursor: 'pointer',
          }}>
            ↻ Atualizar
          </button>
          <button onClick={() => setShowModal(true)} style={{
            backgroundColor: C.navy, color: '#fff',
            fontWeight: 700, fontSize: 13,
            padding: '8px 18px', borderRadius: 8,
            border: 'none', cursor: 'pointer',
          }}>
            + Novo usuário
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Stats cards ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Total de alunos',   value: stats.total,         accent: C.navy,      icon: '👥' },
              { label: 'Institucionais',    value: stats.institutional,  accent: C.blue,      icon: '🏛' },
              { label: 'Assinantes',        value: stats.subscribers,    accent: C.greenDark, icon: '✅' },
              { label: 'Em trial',          value: stats.onTrial,        accent: C.orange,    icon: '⏳' },
              {
                label: 'Novos (30 dias)',
                value: stats.growthPct !== null
                  ? `${stats.growthPct > 0 ? '+' : ''}${stats.growthPct}%`
                  : `+${stats.last30}`,
                sub: `${stats.last30} cadastros`,
                accent: C.greenDark,
                icon: '📈',
              },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '20px 20px 18px',
                boxShadow: C.shadow,
              }}>
                <div style={{ fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.accent, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.navyLight, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 11, color: C.navyLight, marginTop: 2, opacity: 0.7 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Filters + search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 260, paddingLeft: 36 }}
            />
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navyLight} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'institutional', 'subscriber', 'trial', 'none'] as const).map(f => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    backgroundColor: active ? C.navy : C.card,
                    color: active ? '#fff' : C.navyMid,
                    fontWeight: active ? 700 : 500,
                    fontSize: 13, padding: '7px 14px', borderRadius: 8,
                    border: `1px solid ${active ? C.navy : C.border}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {{ all: 'Todos', institutional: 'Institucional', subscriber: 'Assinante', trial: 'Trial', none: 'Sem plano' }[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            backgroundColor: C.redBg, border: `1px solid #FECACA`,
            borderRadius: 10, padding: '12px 16px',
            color: C.red, fontSize: 13, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.navyLight }}>Carregando...</div>
        ) : (
          <div style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: C.shadow,
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.bg,
            }}>
              {['Aluno', 'Nível', 'Status', 'Cadastro', 'Placement'].map(h => (
                <div key={h} style={{
                  fontSize: 11, fontWeight: 700, color: C.navyLight,
                  letterSpacing: '0.6px', textTransform: 'uppercase',
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: C.navyLight, fontSize: 14 }}>
                Nenhum usuário encontrado.
              </div>
            ) : (
              filtered.map((u, i) => {
                const badge = statusBadge(u);
                const lvl   = levelLabel(u.charlotte_level);
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      padding: '14px 20px',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                      alignItems: 'center',
                    }}
                  >
                    {/* Aluno */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.navy }}>{u.name ?? '—'}</div>
                      <div style={{ fontSize: 12, color: C.navyLight, marginTop: 2 }}>{u.email}</div>
                    </div>

                    {/* Nível */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: lvl.color }}>{lvl.text}</div>

                    {/* Status */}
                    <div>
                      <span style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Cadastro */}
                    <div style={{ fontSize: 13, color: C.navyMid }}>{fmtDate(u.created_at)}</div>

                    {/* Placement */}
                    <div>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: u.placement_test_done ? C.greenDark : C.navyLight,
                      }}>
                        {u.placement_test_done ? '✓ Feito' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Footer */}
            {filtered.length > 0 && (
              <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${C.border}`,
                backgroundColor: C.bg,
                fontSize: 12, color: C.navyLight,
              }}>
                {filtered.length} {filtered.length === 1 ? 'usuário' : 'usuários'} {filter !== 'all' ? 'filtrados' : 'no total'}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Create user modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(22,21,58,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 36,
            width: '100%', maxWidth: 460,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(22,21,58,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.navy }}>Novo usuário</h2>
                <p style={{ fontSize: 12, color: C.navyLight, margin: '4px 0 0' }}>Acesso institucional, sem paywall</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background: C.navyGhost, border: 'none',
                color: C.navyMid, cursor: 'pointer',
                width: 32, height: 32, borderRadius: 8,
                fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input style={inputStyle} type="text" placeholder="Ex: Ana Souza"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Email <span style={{ color: C.red }}>*</span></label>
                <input style={inputStyle} type="email" placeholder="aluno@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>

              <div>
                <label style={labelStyle}>Senha temporária <span style={{ color: C.red }}>*</span></label>
                <input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>

              {/* Info */}
              <div style={{
                backgroundColor: C.blueBg, border: '1px solid #BFDBFE',
                borderRadius: 10, padding: '12px 14px',
                fontSize: 12, color: '#1D4ED8', lineHeight: 1.7,
              }}>
                <strong>Institucional automático</strong> — acesso completo sem paywall.<br />
                Nível definido após o placement test. Senha deve ser trocada no 1º login.
              </div>

              {error && (
                <div style={{
                  backgroundColor: C.redBg, border: '1px solid #FECACA',
                  borderRadius: 8, padding: '10px 12px',
                  color: C.red, fontSize: 13,
                }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  flex: 1, backgroundColor: C.bg, border: `1px solid ${C.border}`,
                  color: C.navyMid, fontSize: 14, padding: '13px',
                  borderRadius: 10, cursor: 'pointer',
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, backgroundColor: C.navy, color: '#fff',
                  fontWeight: 700, fontSize: 14, padding: '13px',
                  borderRadius: 10, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Criando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
