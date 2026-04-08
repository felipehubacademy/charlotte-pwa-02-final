'use client';

/**
 * app/admin/page.tsx
 * Charlotte Admin Dashboard
 * Protected by ADMIN_SECRET (entered once, stored in sessionStorage).
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string | null;
  charlotte_level: 'Novice' | 'Inter' | 'Advanced';
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
  bg:       '#07071C',
  card:     '#0F0E2A',
  border:   'rgba(255,255,255,0.07)',
  green:    '#A3FF3C',
  greenDk:  '#3D8800',
  navy:     '#16153A',
  muted:    'rgba(255,255,255,0.45)',
  white:    '#FFFFFF',
  red:      '#F87171',
  orange:   '#FB923C',
  blue:     '#60A5FA',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(u: User) {
  if (u.is_institutional) return { label: 'Institucional', bg: 'rgba(96,165,250,0.15)', color: C.blue, border: 'rgba(96,165,250,0.3)' };
  if (u.subscription_status === 'active') return { label: 'Assinante', bg: 'rgba(163,255,60,0.1)', color: C.greenDk, border: 'rgba(163,255,60,0.25)' };
  if (u.subscription_status === 'trial') {
    const expired = u.trial_ends_at ? new Date(u.trial_ends_at) < new Date() : true;
    if (expired) return { label: 'Trial expirado', bg: 'rgba(248,113,113,0.12)', color: C.red, border: 'rgba(248,113,113,0.25)' };
    const days = u.trial_ends_at ? Math.ceil((new Date(u.trial_ends_at).getTime() - Date.now()) / 86400000) : 0;
    return { label: `Trial • ${days}d`, bg: 'rgba(251,146,60,0.12)', color: C.orange, border: 'rgba(251,146,60,0.25)' };
  }
  return { label: 'Sem plano', bg: 'rgba(255,255,255,0.06)', color: C.muted, border: C.border };
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

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    is_institutional: false,
    charlotte_level: 'Novice' as 'Novice' | 'Inter' | 'Advanced',
    must_change_password: true,
    subscription_status: 'none' as 'none' | 'trial' | 'active',
  });

  // Restore session
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
      setForm({ email: '', password: '', name: '', is_institutional: false, charlotte_level: 'Novice', must_change_password: true, subscription_status: 'none' });
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
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ width: 360, backgroundColor: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={36} height={36} style={{ borderRadius: '50%', border: `2px solid ${C.green}` }} />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>Charlotte Admin</div>
              <div style={{ color: C.muted, fontSize: 12 }}>Hub Academy</div>
            </div>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="password"
              placeholder="Senha de admin"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.white, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              required
            />
            {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}
            <button type="submit" style={{ backgroundColor: C.green, color: C.navy, fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Filtered users ─────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.includes(search) || (u.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'institutional' ? u.is_institutional :
      filter === 'subscriber' ? u.subscription_status === 'active' :
      filter === 'trial' ? u.subscription_status === 'trial' :
      filter === 'none' ? (u.subscription_status === 'none') :
      true;
    return matchSearch && matchFilter;
  });

  // ── Dashboard ───────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '11px 14px',
    color: C.white,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { color: C.muted, fontSize: 12, marginBottom: 6, display: 'block' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: C.white }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, backgroundColor: 'rgba(7,7,28,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={28} height={28} style={{ borderRadius: '50%', border: `1.5px solid ${C.green}` }} />
          <span style={{ backgroundColor: C.green, color: C.navy, fontWeight: 800, fontSize: 13, padding: '2px 8px', borderRadius: 5 }}>Charlotte</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => fetchData(secret)} style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>
            Atualizar
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: C.green, color: C.navy, fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            + Novo usuário
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Total de alunos', value: stats.total, color: C.white },
              { label: 'Institucionais', value: stats.institutional, color: C.blue },
              { label: 'Assinantes', value: stats.subscribers, color: C.greenDk },
              { label: 'Em trial', value: stats.onTrial, color: C.orange },
              {
                label: 'Crescimento (30d)',
                value: stats.growthPct !== null ? `${stats.growthPct > 0 ? '+' : ''}${stats.growthPct}%` : `+${stats.last30}`,
                color: C.green,
                sub: `${stats.last30} novos`,
              },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 18px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Filters + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 280 }}
          />
          {(['all', 'institutional', 'subscriber', 'trial', 'none'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? C.green : 'rgba(255,255,255,0.06)',
                color: filter === f ? C.navy : C.muted,
                fontWeight: filter === f ? 700 : 400,
                fontSize: 13, padding: '7px 14px', borderRadius: 8,
                border: `1px solid ${filter === f ? C.green : C.border}`,
                cursor: 'pointer',
              }}
            >
              {{ all: 'Todos', institutional: 'Institucional', subscriber: 'Assinante', trial: 'Trial', none: 'Sem plano' }[f]}
            </button>
          ))}
        </div>

        {error && <div style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '12px 16px', color: C.red, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>Carregando...</div>
        ) : (
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Aluno', 'Nível', 'Status', 'Cadastro', 'Placement'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>Nenhum usuário encontrado.</td></tr>
                )}
                {filtered.map((u, i) => {
                  const badge = statusBadge(u);
                  return (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      {/* Aluno */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.white }}>{u.name ?? '—'}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{u.email}</div>
                      </td>
                      {/* Nível */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>
                          {{ Novice: 'Novice', Inter: 'Intermediate', Advanced: 'Advanced' }[u.charlotte_level]}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      {/* Cadastro */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.muted }}>
                        {fmtDate(u.created_at)}
                      </td>
                      {/* Placement */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, color: u.placement_test_done ? C.greenDk : C.muted }}>
                          {u.placement_test_done ? 'Feito' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Create user modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Novo usuário</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>&times;</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input style={inputStyle} type="text" placeholder="Ex: Ana Souza" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="aluno@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>

              <div>
                <label style={labelStyle}>Senha temporária *</label>
                <input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>

              <div>
                <label style={labelStyle}>Nível inicial</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={form.charlotte_level}
                  onChange={e => setForm(f => ({ ...f, charlotte_level: e.target.value as 'Novice' | 'Inter' | 'Advanced' }))}
                >
                  <option value="Novice">Novice (Iniciante)</option>
                  <option value="Inter">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tipo de acesso</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={form.subscription_status}
                  onChange={e => setForm(f => ({ ...f, subscription_status: e.target.value as 'none' | 'trial' | 'active' }))}
                >
                  <option value="none">Sem plano (fluxo normal)</option>
                  <option value="trial">Trial (7 dias grátis)</option>
                  <option value="active">Assinante ativo</option>
                </select>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, color: C.white }}>Institucional</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8, flex: 1, paddingLeft: 12 }}>Acesso permanente sem paywall</span>
                  <input type="checkbox" checked={form.is_institutional} onChange={e => setForm(f => ({ ...f, is_institutional: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.green }} />
                </label>
                <div style={{ borderTop: `1px solid ${C.border}` }} />
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, color: C.white }}>Trocar senha no primeiro login</span>
                  <input type="checkbox" checked={form.must_change_password} onChange={e => setForm(f => ({ ...f, must_change_password: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.green }} />
                </label>
              </div>

              {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, padding: '13px', borderRadius: 10, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ flex: 2, backgroundColor: C.green, color: C.navy, fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
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
