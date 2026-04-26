'use client';

/**
 * /auth/confirm
 *
 * Supabase redirects here after verifying an email link
 * (signup confirmation, password reset, magic link, admin invite).
 *
 * URL format from Supabase:
 *   https://charlotte.hubacademybr.com/auth/confirm
 *     #access_token=...&refresh_token=...&type=signup|recovery|invite|magiclink
 *
 * Behaviour:
 *   - iOS / Android user-agent  ->  deep link charlotte://auth/callback#<same params>
 *   - Desktop                   ->  show success page with download link
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';

type FlowType = 'signup' | 'recovery' | 'invite' | 'magiclink' | 'unknown';

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'desktop' | 'error'>('loading');
  const [flowType, setFlowType] = useState<FlowType>('unknown');
  const [deepLink, setDeepLink] = useState('');

  useEffect(() => {
    // Hash params are only available client-side
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type         = (params.get('type') ?? 'unknown') as FlowType;
    const errorDesc    = params.get('error_description');

    setFlowType(type);

    if (errorDesc) {
      console.error('[auth/confirm] Supabase error:', errorDesc);
      setStatus('error');
      return;
    }

    if (!accessToken || !refreshToken) {
      // Supabase may send token_hash for PKCE flow (no access_token in hash yet)
      // Just show the desktop/download screen — the user will open the app manually.
      setStatus('desktop');
      return;
    }

    const link = `charlotte://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&type=${type}`;
    setDeepLink(link);

    if (isMobileUA()) {
      // Try to open the app via deep link
      setStatus('redirecting');
      window.location.href = link;
    } else {
      setStatus('desktop');
    }
  }, []);

  const titleByType: Record<FlowType, string> = {
    signup:    'E-mail confirmado!',
    recovery:  'Pronto para redefinir.',
    invite:    'Conta criada com sucesso!',
    magiclink: 'Link verificado!',
    unknown:   'Verificacao concluida!',
  };

  const subtitleByType: Record<FlowType, string> = {
    signup:    'Sua conta foi confirmada. Abra o app Charlotte para comecar.',
    recovery:  'Abra o app Charlotte para criar sua nova senha.',
    invite:    'Seu acesso foi configurado. Abra o app Charlotte para entrar.',
    magiclink: 'Abra o app Charlotte para continuar.',
    unknown:   'Abra o app Charlotte para continuar.',
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconCircle('#DC2626')}>
            <span style={{ fontSize: 28 }}>!</span>
          </div>
          <h1 style={styles.title}>Link invalido ou expirado</h1>
          <p style={styles.subtitle}>
            O link pode ter expirado. Solicite um novo link de verificacao ou recuperacao.
          </p>
        </div>
      </div>
    );
  }

  // ── Mobile redirecting ───────────────────────────────────────────────────
  if (status === 'redirecting') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.avatarWrap}>
            <img src="/charlotte-avatar.png" alt="Charlotte" style={styles.avatar} />
          </div>
          <h1 style={styles.title}>{titleByType[flowType]}</h1>
          <p style={styles.subtitle}>Abrindo o app Charlotte...</p>
          <a href={deepLink} style={styles.btn}>
            Abrir o app
          </a>
        </div>
      </div>
    );
  }

  // ── Desktop (or mobile without tokens) ──────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatarWrap}>
          <img src="/charlotte-avatar.png" alt="Charlotte" style={styles.avatar} />
        </div>

        <div style={styles.iconCircle('#A3FF3C')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#16153A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={styles.title}>{titleByType[flowType]}</h1>
        <p style={styles.subtitle}>{subtitleByType[flowType]}</p>

        <p style={{ ...styles.subtitle, marginTop: 24, fontSize: 13, color: '#9896B8' }}>
          Ainda nao tem o app?
        </p>

        <a
          href="https://apps.apple.com/br/app/charlotte-ai/id6744929557"
          style={styles.btn}
          target="_blank"
          rel="noopener noreferrer"
        >
          Baixar para iPhone
        </a>
      </div>
    </div>
  );
}

// ── Inline styles (no Tailwind needed in this isolated page) ────────────────
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F4F3FA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: '40px 32px',
    maxWidth: 380,
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 4px 32px rgba(22,21,58,0.10)',
    border: '1px solid rgba(22,21,58,0.08)',
  } as React.CSSProperties,

  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    border: '3px solid #A3FF3C',
    marginBottom: 4,
    boxShadow: '0 4px 20px rgba(163,255,60,0.25)',
  } as React.CSSProperties,

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,

  iconCircle: (bg: string) => ({
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as React.CSSProperties),

  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#16153A',
    textAlign: 'center' as const,
    margin: 0,
    letterSpacing: -0.3,
  } as React.CSSProperties,

  subtitle: {
    fontSize: 15,
    color: '#4B4A72',
    textAlign: 'center' as const,
    margin: 0,
    lineHeight: 1.5,
  } as React.CSSProperties,

  btn: {
    marginTop: 8,
    backgroundColor: '#A3FF3C',
    color: '#16153A',
    fontWeight: 800,
    fontSize: 15,
    borderRadius: 14,
    padding: '14px 32px',
    textDecoration: 'none',
    display: 'block',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 4px 16px rgba(163,255,60,0.30)',
  } as React.CSSProperties,

  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    border: '3px solid rgba(22,21,58,0.10)',
    borderTop: '3px solid #16153A',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
};
