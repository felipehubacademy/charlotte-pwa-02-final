'use client';

/**
 * app/admin/page.tsx
 * Charlotte Admin Dashboard — professional user management
 * Protected by ADMIN_SECRET (entered once, stored in sessionStorage).
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Engagement {
  totalXP:      number;
  lastActive:   string | null;
  sessionDays:  number;
  lessonCount:  number;
  messageCount: number;
}

interface TrailProgress {
  topicsCompleted: number;
  moduleIndex:     number;
  topicIndex:      number;
}

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
  engagement:    Engagement | null;
  trailProgress: TrailProgress | null;
  streak:        number;
  longestStreak: number;
}

type SortKey = 'name' | 'level' | 'created_at' | 'xp' | 'lastActive' | 'lessons' | 'topics' | 'streak';
type SortDir = 'asc' | 'desc';

interface Stats {
  total: number;
  institutional: number;
  subscribers: number;
  onTrial: number;
  trialExpired: number;
  last30: number;
  growthPct: number | null;
  activeToday: number;
  activeWeek:  number;
}

type ModalMode = 'create' | 'edit' | 'delete' | null;

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:          '#F4F3FA',
  card:        '#FFFFFF',
  navy:        '#16153A',
  navyMid:     '#4B4A72',
  navyLight:   '#9896B8',
  navyGhost:   'rgba(22,21,58,0.05)',
  navyGhost2:  'rgba(22,21,58,0.08)',
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
  shadowLg:    '0 20px 60px rgba(22,21,58,0.14)',
};

// ── RevenueCat ────────────────────────────────────────────────────────────────
// app_user_id no RevenueCat = id do usuario no Supabase (via Purchases.logIn(userId))
const RC_CUSTOMER_URL = (userId: string) =>
  `https://app.revenuecat.com/customers?app_user_id=${encodeURIComponent(userId)}`;

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const Icon = {
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  building: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  checkCircle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  trendUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  externalLink: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(u: User) {
  if (u.is_institutional) return { label: 'Institucional', bg: C.blueBg,    color: C.blue,      border: '#BFDBFE' };
  if (u.subscription_status === 'active')
                          return { label: 'Assinante',     bg: C.greenBg,   color: C.greenDark, border: '#BBF7D0' };
  if (u.subscription_status === 'trial') {
    const expired = u.trial_ends_at ? new Date(u.trial_ends_at) < new Date() : true;
    if (expired) return   { label: 'Trial expirado', bg: C.redBg,    color: C.red,       border: '#FECACA' };
    const days = u.trial_ends_at
      ? Math.ceil((new Date(u.trial_ends_at).getTime() - Date.now()) / 86400000)
      : 0;
    return                { label: `Trial · ${days}d`, bg: C.orangeBg, color: C.orange,  border: '#FED7AA' };
  }
  return                  { label: 'Sem plano',    bg: C.navyGhost, color: C.navyLight, border: C.border };
}

function levelLabel(level: User['charlotte_level']) {
  if (!level)              return { text: '—',            color: C.navyLight };
  if (level === 'Novice')  return { text: 'Novice',       color: '#7C3AED' };
  if (level === 'Inter')   return { text: 'Intermediate', color: C.blue };
  if (level === 'Advanced')return { text: 'Advanced',     color: C.greenDark };
  return                          { text: level,          color: C.navyLight };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = diff / 3600000;
  if (h < 1)   return 'agora';
  if (h < 24)  return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7)   return `${Math.floor(d)}d`;
  if (d < 30)  return `${Math.floor(d / 7)}sem`;
  return `${Math.floor(d / 30)}m`;
}

function activityColor(iso: string | null): string {
  if (!iso) return C.navyLight;
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days < 2)  return C.greenDark;
  if (days < 7)  return C.orange;
  return C.red;
}

function fmtFull(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function sortUsers(list: User[], key: SortKey, dir: SortDir): User[] {
  return [...list].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    switch (key) {
      case 'name':       av = (a.name ?? '').toLowerCase();              bv = (b.name ?? '').toLowerCase(); break;
      case 'level':      av = a.charlotte_level ?? '';                   bv = b.charlotte_level ?? ''; break;
      case 'created_at': av = a.created_at;                              bv = b.created_at; break;
      case 'xp':         av = a.engagement?.totalXP    ?? -1;            bv = b.engagement?.totalXP    ?? -1; break;
      case 'lastActive': av = a.engagement?.lastActive ?? '';            bv = b.engagement?.lastActive ?? ''; break;
      case 'lessons':    av = a.engagement?.lessonCount ?? -1;           bv = b.engagement?.lessonCount ?? -1; break;
      case 'topics':     av = a.trailProgress?.topicsCompleted ?? -1;   bv = b.trailProgress?.topicsCompleted ?? -1; break;
      case 'streak':     av = a.streak ?? -1;                            bv = b.streak ?? -1; break;
      default:           return 0;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortableHeader({ label, sortK, currentKey, dir, onSort }: {
  label: string; sortK: SortKey; currentKey: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = currentKey === sortK;
  return (
    <div
      onClick={() => onSort(sortK)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        cursor: 'pointer', userSelect: 'none',
        fontSize: 11, fontWeight: 700, color: active ? C.navy : C.navyLight,
        letterSpacing: '0.6px', textTransform: 'uppercase',
      }}
    >
      {label}
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.35 }}>
        {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
      </span>
    </div>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: C.navy,
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '5px 10px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          zIndex: 200,
          boxShadow: '0 4px 12px rgba(22,21,58,0.25)',
          pointerEvents: 'none',
        }}>
          {text}
          {/* Seta */}
          <div style={{
            position: 'absolute',
            top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${C.navy}`,
          }} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: C.shadow,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: C.navyLight, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.navyLight, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret]         = useState('');
  const [authed, setAuthed]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [users, setUsers]           = useState<User[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<'all' | 'institutional' | 'subscriber' | 'trial' | 'none'>('all');
  const [modalMode, setModalMode]   = useState<ModalMode>(null);
  const [selectedUser, setSelected] = useState<User | null>(null);
  const [saving, setSaving]         = useState(false);
  const [sortKey, setSortKey]       = useState<SortKey>('lastActive');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [form, setForm]             = useState({
    email: '', password: '', name: '',
    charlotte_level: '' as string,
    is_institutional: true,
    is_active: true,
    subscription_status: 'none' as string,
    must_change_password: true,
    placement_test_done: false,
  });

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

  const openCreate = () => {
    setForm({ email: '', password: '', name: '', charlotte_level: '', is_institutional: true, is_active: true, subscription_status: 'none', must_change_password: true, placement_test_done: false });
    setError('');
    setModalMode('create');
  };

  const openEdit = (u: User) => {
    setSelected(u);
    setForm({
      email: u.email,
      password: '',
      name: u.name ?? '',
      charlotte_level: u.charlotte_level ?? '',
      is_institutional: u.is_institutional,
      is_active: u.is_active,
      subscription_status: u.subscription_status,
      must_change_password: u.must_change_password,
      placement_test_done: u.placement_test_done,
    });
    setError('');
    setModalMode('edit');
  };

  const openDelete = (u: User) => {
    setSelected(u);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          charlotte_level: form.charlotte_level || null,
          is_institutional: form.is_institutional,
          is_active: form.is_active,
          subscription_status: form.subscription_status,
          must_change_password: form.must_change_password,
          placement_test_done: form.placement_test_done,
        }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      closeModal();
      fetchData(secret);
    } catch { setError('Erro ao criar usuário.'); }
    finally   { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true); setError('');
    try {
      const body: Record<string, unknown> = {
        id: selectedUser.id,
        name: form.name || null,
        charlotte_level: form.charlotte_level || null,
        is_institutional: form.is_institutional,
        is_active: form.is_active,
        subscription_status: form.subscription_status,
        must_change_password: form.must_change_password,
        placement_test_done: form.placement_test_done,
      };
      if (form.email !== selectedUser.email) body.email = form.email;
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      closeModal();
      fetchData(secret);
    } catch { setError('Erro ao atualizar usuário.'); }
    finally   { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id: selectedUser.id }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      closeModal();
      fetchData(secret);
    } catch { setError('Erro ao excluir usuário.'); }
    finally   { setSaving(false); }
  };

  // ── Login screen ─────────────────────────────────────────────────────────────

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
          boxShadow: C.shadowLg, padding: 40,
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

  // ── Sort toggle ───────────────────────────────────────────────────────────────
  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  // ── Filtered + sorted list ────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || u.email.toLowerCase().includes(q)
      || (u.name ?? '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'           ? true :
      filter === 'institutional' ? u.is_institutional :
      filter === 'subscriber'    ? u.subscription_status === 'active' :
      filter === 'trial'         ? u.subscription_status === 'trial' :
      filter === 'none'          ? u.subscription_status === 'none' :
      true;
    return matchSearch && matchFilter;
  });

  const sorted = sortUsers(filtered, sortKey, sortDir);

  // ── Shared styles ─────────────────────────────────────────────────────────────

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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239896B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    paddingRight: 36,
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: C.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: C.navy,
    }}>

      <style>{`
        @media (max-width: 768px) {
          .admin-header { padding: 0 16px !important; height: auto !important; min-height: 60px; flex-wrap: wrap; gap: 8px; padding-top: 10px !important; padding-bottom: 10px !important; }
          .admin-header-actions { gap: 6px !important; }
          .admin-header-actions button, .admin-header-actions a { font-size: 12px !important; padding: 8px 10px !important; min-height: 44px; }
          .admin-main { padding: 20px 14px !important; }
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .admin-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .admin-search-wrap { width: 100% !important; }
          .admin-search-wrap input { width: 100% !important; }
          .admin-filters { flex-wrap: wrap !important; gap: 6px !important; }
          .admin-filters button { font-size: 12px !important; padding: 8px 10px !important; min-height: 44px; }
          .admin-count { margin-left: 0 !important; }
          .admin-table-wrap { display: none !important; }
          .admin-user-cards { display: flex !important; }
          .admin-modal-box { padding: 20px !important; border-radius: 14px !important; max-height: 95vh !important; }
          .admin-modal-overlay { padding: 10px !important; align-items: flex-end !important; }
          .admin-form-grid { grid-template-columns: 1fr !important; }
        }
        .admin-user-cards { display: none; flex-direction: column; gap: 10px; }
      `}</style>

      {/* Header */}
      <header className="admin-header" style={{
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
        <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href="/admin/metrics"
            style={{
              backgroundColor: 'transparent', border: `1px solid ${C.border}`,
              color: C.navyMid, fontSize: 13, padding: '7px 14px',
              borderRadius: 8, cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Métricas
          </a>
          <button
            onClick={() => fetchData(secret)}
            title="Atualizar"
            style={{
              backgroundColor: 'transparent', border: `1px solid ${C.border}`,
              color: C.navyMid, fontSize: 13, padding: '7px 14px',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {Icon.refresh} Atualizar
          </button>
          <button
            onClick={openCreate}
            style={{
              backgroundColor: C.navy, color: '#fff',
              fontWeight: 700, fontSize: 13,
              padding: '8px 16px', borderRadius: 8,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {Icon.plus} Novo usuário
          </button>
        </div>
      </header>

      <main className="admin-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        {stats && (
          <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, marginBottom: 32 }}>
            <StatCard label="Total"          value={stats.total}            color={C.navy}      icon={Icon.users} />
            <StatCard label="Institucionais" value={stats.institutional}    color={C.blue}      icon={Icon.building} />
            <StatCard label="Assinantes"     value={stats.subscribers}      color={C.greenDark} icon={Icon.checkCircle} />
            <StatCard label="Em trial"       value={stats.onTrial}          color={C.orange}    icon={Icon.clock} />
            <StatCard
              label="Novos (30d)"
              value={stats.growthPct !== null ? `${stats.growthPct > 0 ? '+' : ''}${stats.growthPct}%` : `+${stats.last30}`}
              sub={`${stats.last30} cadastros`}
              color={C.greenDark}
              icon={Icon.trendUp}
            />
            <StatCard
              label="Ativos hoje"
              value={stats.activeToday}
              sub="com atividade nas ultimas 24h"
              color={stats.activeToday > 0 ? C.greenDark : C.navyLight}
              icon={Icon.checkCircle}
            />
            <StatCard
              label="Ativos semana"
              value={stats.activeWeek}
              sub="com atividade nos ultimos 7d"
              color={stats.activeWeek > 0 ? C.blue : C.navyLight}
              icon={Icon.trendUp}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="admin-search-wrap" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 280, paddingLeft: 38 }}
            />
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.navyLight, pointerEvents: 'none' }}>
              {Icon.search}
            </span>
          </div>
          <div className="admin-filters" style={{ display: 'flex', gap: 6 }}>
            {(['all', 'institutional', 'subscriber', 'trial', 'none'] as const).map(f => {
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  backgroundColor: active ? C.navy : C.card,
                  color: active ? '#fff' : C.navyMid,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13, padding: '7px 14px', borderRadius: 8,
                  border: `1px solid ${active ? C.navy : C.border}`,
                  cursor: 'pointer',
                }}>
                  {{ all: 'Todos', institutional: 'Institucional', subscriber: 'Assinante', trial: 'Trial', none: 'Sem plano' }[f]}
                </button>
              );
            })}
          </div>
          <div className="admin-count" style={{ marginLeft: 'auto', fontSize: 13, color: C.navyLight }}>
            {sorted.length} {sorted.length === 1 ? 'usuario' : 'usuarios'}
          </div>
        </div>

        {/* Error banner */}
        {error && !modalMode && (
          <div style={{
            backgroundColor: C.redBg, border: `1px solid #FECACA`,
            borderRadius: 10, padding: '12px 16px',
            color: C.red, fontSize: 13, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.navyLight, fontSize: 14 }}>
            Carregando...
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="admin-table-wrap" style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: C.shadow,
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.65fr 1fr 0.65fr 0.7fr 0.7fr 0.65fr 0.7fr 0.65fr 90px',
                padding: '11px 20px',
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: C.bg,
              }}>
                <SortableHeader label="Aluno"     sortK="name"       currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Nivel"     sortK="level"      currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Status</div>
                <SortableHeader label="Cadastro"  sortK="created_at" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="XP"        sortK="xp"         currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Ult. ativ." sortK="lastActive" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Licoes"    sortK="lessons"    currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Topicos"   sortK="topics"     currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Streak"    sortK="streak"     currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <div />
              </div>

              {/* Rows */}
              {sorted.length === 0 ? (
                <div style={{ padding: 56, textAlign: 'center', color: C.navyLight, fontSize: 14 }}>
                  Nenhum usuario encontrado.
                </div>
              ) : (
                sorted.map((u, i) => {
                  const badge   = statusBadge(u);
                  const lvl     = levelLabel(u.charlotte_level);
                  const eng     = u.engagement;
                  const trail   = u.trailProgress;
                  const lastAct = eng?.lastActive ?? null;
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.65fr 1fr 0.65fr 0.7fr 0.7fr 0.65fr 0.7fr 0.65fr 90px',
                        padding: '13px 20px',
                        borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none',
                        alignItems: 'center',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.bg)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Aluno */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.navy }}>
                          {u.name ?? <span style={{ color: C.navyLight, fontWeight: 400 }}>Sem nome</span>}
                        </div>
                        <div style={{ fontSize: 12, color: C.navyLight, marginTop: 2 }}>{u.email}</div>
                      </div>

                      {/* Nivel */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: lvl.color }}>{lvl.text}</div>

                      {/* Status */}
                      <div>
                        <span style={{
                          backgroundColor: badge.bg, color: badge.color,
                          border: `1px solid ${badge.border}`,
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Cadastro */}
                      <div style={{ fontSize: 12, color: C.navyMid }}>{fmtDate(u.created_at)}</div>

                      {/* XP */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: eng && eng.totalXP > 0 ? C.greenDark : C.navyLight }}>
                        {eng ? eng.totalXP.toLocaleString('pt-BR') : '—'}
                      </div>

                      {/* Ultima atividade — hover mostra data/hora completa */}
                      <Tooltip text={fmtFull(lastAct)}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: activityColor(lastAct), cursor: 'default' }}>
                          {fmtRelative(lastAct)}
                        </span>
                      </Tooltip>

                      {/* Licoes */}
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: eng && eng.lessonCount > 0 ? C.navy : C.navyLight }}>
                          {eng ? eng.lessonCount : '—'}
                        </span>
                        {eng && eng.sessionDays > 0 && (
                          <div style={{ fontSize: 10, color: C.navyLight, marginTop: 1 }}>
                            {eng.sessionDays}d ativas
                          </div>
                        )}
                      </div>

                      {/* Topicos (trilha) */}
                      <div>
                        {trail ? (
                          <>
                            <span style={{ fontSize: 13, fontWeight: 700, color: trail.topicsCompleted > 0 ? C.blue : C.navyLight }}>
                              {trail.topicsCompleted}
                            </span>
                            <div style={{ fontSize: 10, color: C.navyLight, marginTop: 1 }}>
                              M{trail.moduleIndex + 1} T{trail.topicIndex + 1}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 13, color: C.navyLight }}>—</span>
                        )}
                      </div>

                      {/* Streak */}
                      <div>
                        {u.streak > 0 ? (
                          <>
                            <span style={{ fontSize: 13, fontWeight: 700, color: u.streak >= 7 ? C.orange : C.navy }}>
                              {u.streak}🔥
                            </span>
                            {u.longestStreak > u.streak && (
                              <div style={{ fontSize: 10, color: C.navyLight, marginTop: 1 }}>
                                max {u.longestStreak}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 13, color: C.navyLight }}>—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(u)}
                          title="Editar"
                          style={{
                            background: 'transparent', border: `1px solid ${C.border}`,
                            borderRadius: 7, padding: '6px 8px',
                            cursor: 'pointer', color: C.navyMid,
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          {Icon.edit}
                        </button>
                        <button
                          onClick={() => openDelete(u)}
                          title="Excluir"
                          style={{
                            background: 'transparent', border: `1px solid #FECACA`,
                            borderRadius: 7, padding: '6px 8px',
                            cursor: 'pointer', color: C.red,
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          {Icon.trash}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile card list */}
            <div className="admin-user-cards">
              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.navyLight, fontSize: 14,
                  backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                  Nenhum usuário encontrado.
                </div>
              ) : (
                sorted.map(u => {
                  const badge = statusBadge(u);
                  const lvl   = levelLabel(u.charlotte_level);
                  return (
                    <div key={u.id} style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: '16px',
                      boxShadow: C.shadow,
                    }}>
                      {/* Top row: name + actions */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.name ?? <span style={{ color: C.navyLight, fontWeight: 400 }}>Sem nome</span>}
                          </div>
                          <div style={{ fontSize: 12, color: C.navyLight, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => openEdit(u)}
                            title="Editar"
                            style={{
                              background: 'transparent', border: `1px solid ${C.border}`,
                              borderRadius: 8, padding: '10px 12px',
                              cursor: 'pointer', color: C.navyMid,
                              display: 'flex', alignItems: 'center',
                              minHeight: 44, minWidth: 44, justifyContent: 'center',
                            }}
                          >
                            {Icon.edit}
                          </button>
                          <button
                            onClick={() => openDelete(u)}
                            title="Excluir"
                            style={{
                              background: 'transparent', border: `1px solid #FECACA`,
                              borderRadius: 8, padding: '10px 12px',
                              cursor: 'pointer', color: C.red,
                              display: 'flex', alignItems: 'center',
                              minHeight: 44, minWidth: 44, justifyContent: 'center',
                            }}
                          >
                            {Icon.trash}
                          </button>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: badge.bg, color: badge.color,
                          border: `1px solid ${badge.border}`,
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {badge.label}
                        </span>
                        {u.charlotte_level && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: lvl.color }}>
                            {lvl.text}
                          </span>
                        )}
                      </div>

                      {/* Engagement row */}
                      {u.engagement && (
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>XP</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: u.engagement.totalXP > 0 ? C.greenDark : C.navyLight }}>
                              {u.engagement.totalXP.toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>Ativo</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: activityColor(u.engagement.lastActive) }}>
                              {fmtRelative(u.engagement.lastActive)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>Licoes</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{u.engagement.lessonCount}</div>
                          </div>
                          {u.trailProgress && (
                            <div>
                              <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>Topicos</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>
                                {u.trailProgress.topicsCompleted} <span style={{ fontWeight: 400, color: C.navyLight }}>M{u.trailProgress.moduleIndex + 1}</span>
                              </div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>Sessoes</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{u.engagement.sessionDays}d</div>
                          </div>
                          {u.streak > 0 && (
                            <div>
                              <div style={{ fontSize: 10, color: C.navyLight, textTransform: 'uppercase', fontWeight: 700 }}>Streak</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: u.streak >= 7 ? C.orange : C.navy }}>
                                {u.streak}🔥
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <div style={{ fontSize: 11, color: C.navyLight, marginTop: 8 }}>
                        Cadastro: {fmtDate(u.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}

      {modalMode && (
        <div
          className="admin-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(22,21,58,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
        >
          {/* ── DELETE confirmation ── */}
          {modalMode === 'delete' && selectedUser && (
            <div className="admin-modal-box" style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: 36,
              width: '100%', maxWidth: 420,
              boxShadow: C.shadowLg,
            }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: C.redBg, border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.red, flexShrink: 0,
                }}>
                  {Icon.warning}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: C.navy }}>Excluir usuário</h2>
                  <p style={{ fontSize: 13, color: C.navyLight, margin: '4px 0 0', lineHeight: 1.5 }}>
                    Esta acao e irreversivel. Todos os dados de{' '}
                    <strong style={{ color: C.navy }}>{selectedUser.name ?? selectedUser.email}</strong>{' '}
                    serao apagados permanentemente.
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{selectedUser.name ?? '—'}</div>
                <div style={{ fontSize: 12, color: C.navyLight, marginTop: 2 }}>{selectedUser.email}</div>
              </div>

              {error && (
                <div style={{ backgroundColor: C.redBg, border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', color: C.red, fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={closeModal} style={{
                  flex: 1, backgroundColor: C.bg, border: `1px solid ${C.border}`,
                  color: C.navyMid, fontSize: 14, padding: '12px',
                  borderRadius: 10, cursor: 'pointer',
                }}>
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={saving} style={{
                  flex: 1, backgroundColor: C.red, color: '#fff',
                  fontWeight: 700, fontSize: 14, padding: '12px',
                  borderRadius: 10, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          )}

          {/* ── CREATE / EDIT form ── */}
          {(modalMode === 'create' || modalMode === 'edit') && (
            <div className="admin-modal-box" style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: 36,
              width: '100%', maxWidth: 520,
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: C.shadowLg,
            }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.navy }}>
                    {modalMode === 'create' ? 'Novo usuário' : 'Editar usuário'}
                  </h2>
                  <p style={{ fontSize: 12, color: C.navyLight, margin: '4px 0 0' }}>
                    {modalMode === 'create'
                      ? 'Novo usuario'
                      : selectedUser?.email}
                  </p>
                </div>
                <button onClick={closeModal} style={{
                  background: C.navyGhost, border: 'none',
                  color: C.navyMid, cursor: 'pointer',
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon.close}
                </button>
              </div>

              <form onSubmit={modalMode === 'create' ? handleCreate : handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Nome */}
                <div>
                  <label style={labelStyle}>Nome completo</label>
                  <input style={inputStyle} type="text" placeholder="Ex: Ana Souza"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email <span style={{ color: C.red }}>*</span></label>
                  <input style={inputStyle} type="email" placeholder="aluno@email.com" required
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>

                {/* Senha — only on create */}
                {modalMode === 'create' && (
                  <div>
                    <label style={labelStyle}>Senha temporária <span style={{ color: C.red }}>*</span></label>
                    <input style={inputStyle} type="password" placeholder="Minimo 8 caracteres"
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required minLength={8} />
                  </div>
                )}

                {/* Nivel + Plano */}
                <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nivel</label>
                    <select style={selectStyle}
                      value={form.charlotte_level}
                      onChange={e => setForm(f => ({ ...f, charlotte_level: e.target.value }))}>
                      <option value="">Nao definido</option>
                      <option value="Novice">Novice</option>
                      <option value="Inter">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Plano</label>
                    <select style={selectStyle}
                      value={form.subscription_status}
                      onChange={e => setForm(f => ({ ...f, subscription_status: e.target.value }))}>
                      <option value="none">Sem plano</option>
                      <option value="trial">Trial</option>
                      <option value="active">Assinante</option>
                      <option value="expired">Expirado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* RevenueCat — edit only */}
                {modalMode === 'edit' && (
                  <div style={{
                    backgroundColor: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                      RevenueCat
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: C.navyLight, marginBottom: 2 }}>Customer ID (= User ID)</div>
                        <div style={{
                          fontSize: 12, fontWeight: 500, color: C.navyMid,
                          fontFamily: 'monospace', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {selectedUser?.id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          title="Copiar ID"
                          onClick={() => navigator.clipboard.writeText(selectedUser?.id ?? '')}
                          style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 7, padding: '6px 10px', cursor: 'pointer',
                            color: C.navyMid, fontSize: 12, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          {Icon.copy} Copiar
                        </button>
                        <a
                          href={RC_CUSTOMER_URL(selectedUser?.id ?? '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 7, padding: '6px 10px', cursor: 'pointer',
                            color: C.blue, fontSize: 12, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 5,
                            textDecoration: 'none',
                          }}
                        >
                          {Icon.externalLink} Ver no RC
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'is_institutional',    label: 'Acesso institucional (sem paywall)' },
                    { key: 'is_active',            label: 'Conta ativa' },
                    { key: 'must_change_password', label: 'Exigir troca de senha no proximo login' },
                    { key: 'placement_test_done',  label: 'Placement test concluido' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: C.navyMid }}>
                      <input
                        type="checkbox"
                        checked={!!form[key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: C.navy, cursor: 'pointer' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {error && (
                  <div style={{ backgroundColor: C.redBg, border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', color: C.red, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={closeModal} style={{
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
                    {saving
                      ? (modalMode === 'create' ? 'Criando...' : 'Salvando...')
                      : (modalMode === 'create' ? 'Criar usuário' : 'Salvar alteracoes')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
