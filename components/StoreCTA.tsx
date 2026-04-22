'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * StoreCTA — botão que leva pra loja certa baseado no device.
 * - Mobile iOS → App Store direto (se disponível)
 * - Mobile Android → Play Store direto
 * - Desktop ou ambíguo → abre modal com os 2 badges
 *
 * Para "virar on" quando Apple aprovar: troca APP_STORE_AVAILABLE pra true.
 */

const APP_STORE_URL = 'https://apps.apple.com/app/id6760943273';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.hubacademy.charlotte';
const APP_STORE_AVAILABLE = false; // Flag: true quando Apple aprovar

type Variant = 'nav' | 'hero' | 'pricing';

interface Props {
  variant: Variant;
  label: string;
  className?: string;
}

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export default function StoreCTA({ variant, label, className }: Props) {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [modalOpen, setModalOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPlatform(detectPlatform()); }, []);

  // Fecha modal ao clicar fora ou Esc
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModalOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (platform === 'android') {
      window.open(PLAY_STORE_URL, '_blank');
      return;
    }
    if (platform === 'ios' && APP_STORE_AVAILABLE) {
      window.open(APP_STORE_URL, '_blank');
      return;
    }
    // iOS sem flag ou desktop → modal
    setModalOpen(true);
  };

  // Styles por variant
  const styleByVariant: Record<Variant, React.CSSProperties> = {
    nav: {
      background: '#16153A', color: '#fff',
      fontSize: 13, fontWeight: 700,
      padding: '9px 20px', borderRadius: 10,
      border: 'none', cursor: 'pointer',
    },
    hero: {
      display: 'inline-flex', alignItems: 'center', gap: 12,
      background: '#16153A', color: '#fff',
      borderRadius: 14, padding: '14px 24px',
      boxShadow: '0 8px 24px rgba(22,21,58,0.20)',
      border: 'none', cursor: 'pointer',
      fontFamily: 'inherit',
    },
    pricing: {
      display: 'inline-block',
      background: '#A3FF3C', color: '#16153A',
      fontWeight: 800, fontSize: 16,
      padding: '16px 48px', borderRadius: 14,
      boxShadow: '0 4px 20px rgba(163,255,60,0.35)',
      border: 'none', cursor: 'pointer',
      fontFamily: 'inherit',
    },
  };

  const hero = (
    <>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <div>
        <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>Baixar no</div>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{label}</div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        style={styleByVariant[variant]}
        type="button"
      >
        {variant === 'hero' ? hero : label}
      </button>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Escolha a loja"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(22,21,58,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            ref={dialogRef}
            style={{
              background: '#fff', borderRadius: 20,
              maxWidth: 440, width: '100%',
              padding: '36px 28px 28px',
              boxShadow: '0 20px 60px rgba(22,21,58,0.25)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Fechar"
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'transparent', border: 'none',
                fontSize: 22, color: '#9896B8', cursor: 'pointer',
                padding: 8, lineHeight: 1,
              }}
            >
              ×
            </button>

            <h3 style={{
              fontSize: 22, fontWeight: 800, color: '#16153A',
              marginBottom: 8, letterSpacing: '-0.5px',
            }}>
              Baixe o Charlotte
            </h3>
            <p style={{
              fontSize: 14, color: '#4B4A72', marginBottom: 24,
              lineHeight: 1.5,
            }}>
              Escolha a loja do seu dispositivo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setModalOpen(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, background: '#16153A', color: '#fff',
                  padding: '14px 20px', borderRadius: 12,
                  fontWeight: 700, fontSize: 15,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.6 1.7c-.3.3-.5.8-.5 1.4v17.8c0 .6.2 1.1.5 1.4l.1.1L13.5 12.6v-.2L3.7 1.6l-.1.1zM17.1 9.5L14.3 12l2.8 2.5c1.6-.9 2.4-1.4 2.4-2.5s-.8-1.6-2.4-2.5zM14.3 12l-10.6 10.3c.6.6 1.5.6 2.5.1l11.6-6.6L14.3 12zm-8.1-11c-1-.5-1.9-.4-2.5.1L14.3 11.4 16.6 9.1 5.9 2.8c-.1-.1-.1-.1-.2-.1s-.3-.2-.4-.3z"/>
                </svg>
                Baixar no Google Play
              </a>

              {APP_STORE_AVAILABLE ? (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setModalOpen(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    gap: 12, background: '#fff', color: '#16153A',
                    padding: '14px 20px', borderRadius: 12,
                    fontWeight: 700, fontSize: 15,
                    border: '1.5px solid #E8E7F0',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Baixar na App Store
                </a>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  gap: 10, background: '#F4F3FA', color: '#9896B8',
                  padding: '14px 20px', borderRadius: 12,
                  fontWeight: 600, fontSize: 14,
                  border: '1.5px dashed #D8D7E5',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store — em breve
                </div>
              )}
            </div>

            <p style={{
              fontSize: 12, color: '#9896B8', marginTop: 20,
            }}>
              7 dias grátis · sem cartão
            </p>
          </div>
        </div>
      )}
    </>
  );
}
