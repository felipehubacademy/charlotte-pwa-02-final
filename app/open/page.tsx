'use client';

// app/open/page.tsx
// Smart redirect page — abre o app Charlotte se instalado,
// senao mostra botoes para App Store / Google Play.
//
// Fluxo principal (confirmacao de email):
//   Supabase verifica token -> redireciona para esta pagina com
//   #access_token=...&refresh_token=...&type=signup no hash
//   -> esta pagina tenta abrir charlotte://auth/callback#...
//
// Fluxo convite (admin criou usuario):
//   Email com link /open?mode=invite
//   -> tenta abrir charlotte:// (tela de login)
//   -> se nao instalado, mostra lojas

import { useEffect, useState } from 'react';

// Substitua pelos IDs reais apos publicacao nas lojas
const IOS_URL     = 'https://apps.apple.com/app/id6745037039';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.hubacademy.charlotte';

type Phase = 'launching' | 'fallback';

function getOS(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

export default function OpenPage() {
  const [phase, setPhase] = useState<Phase>('launching');
  const [os, setOs]       = useState<'ios' | 'android' | 'other'>('other');
  const [dots, setDots]   = useState('.');

  useEffect(() => {
    setOs(getOS());

    // Lê tokens do hash (Supabase redirect) e query string (mode=invite)
    const hash   = window.location.hash.slice(1);
    const search = window.location.search.slice(1);
    const hashParams  = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(search);

    const accessToken  = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type         = hashParams.get('type') ?? 'signup';
    const mode         = queryParams.get('mode'); // 'invite' ou null

    // Monta o deep link
    let deepLink = 'charlotte://';
    if (accessToken && refreshToken) {
      // Email confirmation — passa tokens para o app via hash
      deepLink = `charlotte://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&type=${type}`;
    } else if (mode === 'invite') {
      // Convite — abre na tela de login
      deepLink = 'charlotte://';
    }

    // Tenta abrir o app via custom scheme
    // iOS/Android: se o app estiver instalado, o OS vai interceptar
    const tryOpen = () => {
      // Iframe hidden (iOS — mais suave, nao quebra o fallback timer)
      try {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', deepLink);
        iframe.setAttribute('style', 'display:none;width:0;height:0;border:0;');
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 3000);
      } catch {
        // ignore
      }

      // Android usa Intent URL para melhor compatibilidade
      const currentOs = getOS();
      if (currentOs === 'android' && accessToken) {
        const intentUrl = `intent://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&type=${type}#Intent;scheme=charlotte;package=com.hubacademy.charlotte;end`;
        setTimeout(() => { window.location.href = intentUrl; }, 100);
      } else {
        setTimeout(() => { window.location.href = deepLink; }, 100);
      }
    };

    tryOpen();

    // Fallback: se o usuario ainda estiver na pagina apos 2.5s, o app nao abriu
    const fallbackTimer = setTimeout(() => setPhase('fallback'), 2500);

    // Animacao de pontos
    const dotsTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.');
    }, 500);

    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(dotsTimer);
    };
  }, []);

  const storeUrl = os === 'android' ? ANDROID_URL : IOS_URL;
  const storeLabel = os === 'android'
    ? 'Baixar na Google Play'
    : 'Baixar na App Store';

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Abrindo Charlotte...</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #F4F3FA;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
          }
          .card {
            background: #fff;
            border-radius: 24px;
            padding: 48px 32px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 24px rgba(22,21,58,0.08);
          }
          .avatar {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: #16153A;
            margin: 0 auto 28px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .avatar img { width: 100%; height: 100%; object-fit: cover; }
          .brand {
            font-size: 11px;
            font-weight: 700;
            color: #9896B8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
          }
          h1 {
            font-size: 24px;
            font-weight: 800;
            color: #16153A;
            letter-spacing: -0.3px;
            margin-bottom: 12px;
          }
          .sub {
            font-size: 15px;
            color: #4B4A72;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .dots { display: inline-block; width: 20px; text-align: left; }
          .spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(163,255,60,0.3);
            border-top-color: #A3FF3C;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 32px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .btn-primary {
            display: block;
            background: #16153A;
            color: #fff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: -0.2px;
            margin-bottom: 12px;
            transition: opacity 0.15s;
          }
          .btn-primary:hover { opacity: 0.85; }
          .btn-secondary {
            display: block;
            background: transparent;
            color: #16153A;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 600;
            border: 1.5px solid rgba(22,21,58,0.15);
            transition: background 0.15s;
          }
          .btn-secondary:hover { background: rgba(22,21,58,0.04); }
          .note {
            font-size: 12px;
            color: #9896B8;
            margin-top: 24px;
            line-height: 1.6;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="avatar">
            <img
              src="https://charlotte.hubacademybr.com/charlotte-bust.png"
              alt="Charlotte"
            />
          </div>

          <p className="brand">Charlotte AI</p>

          {phase === 'launching' ? (
            <>
              <div className="spinner" />
              <h1>Abrindo o app<span className="dots">{dots}</span></h1>
              <p className="sub">
                Aguarde enquanto abrimos o Charlotte AI no seu dispositivo.
              </p>
            </>
          ) : (
            <>
              <h1>Baixe o Charlotte AI</h1>
              <p className="sub">
                Instale o app para confirmar sua conta e comecar a praticar ingles com a Charlotte.
              </p>

              {os !== 'other' ? (
                <>
                  <a href={storeUrl} className="btn-primary">
                    {storeLabel}
                  </a>
                  {os === 'ios' && (
                    <a href={ANDROID_URL} className="btn-secondary">
                      Tenho Android
                    </a>
                  )}
                  {os === 'android' && (
                    <a href={IOS_URL} className="btn-secondary">
                      Tenho iPhone
                    </a>
                  )}
                </>
              ) : (
                <>
                  <a href={IOS_URL} className="btn-primary">
                    App Store (iPhone)
                  </a>
                  <a href={ANDROID_URL} className="btn-secondary" style={{ marginTop: 12 }}>
                    Google Play (Android)
                  </a>
                </>
              )}

              <p className="note">
                Ja tem o app? Abra o Charlotte AI e entre com seu email e senha.
              </p>
            </>
          )}
        </div>
      </body>
    </html>
  );
}
