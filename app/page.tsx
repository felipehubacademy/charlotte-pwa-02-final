import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Charlotte — Fale inglês com IA',
  description: 'Aprenda inglês conversando com uma IA que ouve, corrige e te evolui. 7 dias grátis.',
};

const STORE_URL = 'https://apps.apple.com/app/charlotte-fale-ingles-com-ia/id6760943273';

export default function Page() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #16153A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        a { text-decoration: none; }
        @media (max-width: 768px) {
          .hero-grid   { grid-template-columns: 1fr !important; }
          .feat-grid   { grid-template-columns: 1fr !important; }
          .steps-grid  { grid-template-columns: 1fr !important; }
          .nav-links   { display: none !important; }
          .hero-text h1 { font-size: 40px !important; }
          section      { padding: 72px 24px !important; }
          .hero-section { padding: 64px 24px 0 !important; }
          .phone-wrap  { margin-top: 48px; }
          .stats-row   { gap: 32px !important; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #EEEDF5',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/charlotte-avatar.png" alt="" width={28} height={28}
            style={{ borderRadius: '50%', border: '2px solid #A3FF3C' }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#16153A', letterSpacing: '-0.3px' }}>Charlotte</span>
          <span style={{ fontSize: 12, color: '#9896B8', paddingLeft: 4 }}>by Hub Academy</span>
        </div>

        <div className="nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#como" style={{ fontSize: 14, color: '#4B4A72', fontWeight: 500 }}>Como funciona</a>
          <a href="#planos" style={{ fontSize: 14, color: '#4B4A72', fontWeight: 500 }}>Planos</a>
          <a href="#suporte" style={{ fontSize: 14, color: '#4B4A72', fontWeight: 500 }}>Suporte</a>
        </div>

        <a href={STORE_URL} style={{
          background: '#16153A', color: '#fff',
          fontSize: 13, fontWeight: 700,
          padding: '9px 20px', borderRadius: 10,
        }}>
          Baixar grátis
        </a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero-section" style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '96px 40px 0',
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 64,
        alignItems: 'flex-end',
      }} id="hero">

        <div className="hero-text" style={{ paddingBottom: 80 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F0FDE4', border: '1px solid #C6F47A',
            borderRadius: 100, padding: '5px 14px', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3D8800', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3D8800' }}>Disponível no iOS</span>
          </div>

          <h1 style={{
            fontSize: 60, fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-2.5px', color: '#16153A', marginBottom: 24,
          }}>
            Aprenda inglês<br />
            <span style={{ color: '#3D8800' }}>conversando.</span>
          </h1>

          <p style={{
            fontSize: 18, lineHeight: 1.75, color: '#4B4A72',
            maxWidth: 420, marginBottom: 40,
          }}>
            Charlotte é sua professora de inglês com IA. Ela te ouve, corrige sua pronúncia e te faz evoluir desde a primeira conversa — 24h por dia.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={STORE_URL} style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#16153A', color: '#fff',
              borderRadius: 14, padding: '14px 24px',
              boxShadow: '0 8px 24px rgba(22,21,58,0.20)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>Baixar na</div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>App Store</div>
              </div>
            </a>
            <span style={{ fontSize: 13, color: '#9896B8' }}>7 dias grátis · sem cartão</span>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="phone-wrap" style={{ position: 'relative', alignSelf: 'flex-end' }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 280, height: 60,
            background: 'rgba(163,255,60,0.25)',
            filter: 'blur(40px)',
            borderRadius: '50%',
          }} />

          {/* Phone frame */}
          <div style={{
            width: 320, margin: '0 auto',
            background: '#fff',
            borderRadius: 44,
            border: '1px solid #EEEDF5',
            boxShadow: '0 32px 80px rgba(22,21,58,0.14), 0 0 0 1px rgba(22,21,58,0.04)',
            overflow: 'hidden',
          }}>
            {/* Status bar */}
            <div style={{ background: '#F4F3FA', padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={36} height={36}
                style={{ borderRadius: '50%', border: '2px solid #A3FF3C' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#16153A' }}>Charlotte</div>
                <div style={{ fontSize: 11, color: '#3D8800', fontWeight: 600 }}>online agora</div>
              </div>
              {/* streak */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(251,146,60,0.12)', borderRadius: 20, padding: '4px 10px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#EA580C"><path d="M12 2C8.5 8 6 11.5 6 15a6 6 0 0012 0c0-3.5-2.5-7-6-13z"/></svg>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#EA580C' }}>7</span>
              </div>
            </div>

            {/* Chat */}
            <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10, background: '#fff' }}>
              {/* Charlotte msg */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <Image src="/images/charlotte-avatar.png" alt="" width={24} height={24} style={{ borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ background: '#F4F3FA', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: 200 }}>
                  <p style={{ fontSize: 13, color: '#16153A', lineHeight: 1.5 }}>
                    How was your day? Tell me in English!
                  </p>
                </div>
              </div>

              {/* User msg */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#A3FF3C', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', maxWidth: 200 }}>
                  <p style={{ fontSize: 13, color: '#16153A', lineHeight: 1.5 }}>
                    It was good. I learned a lot today.
                  </p>
                </div>
              </div>

              {/* Charlotte correction */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <Image src="/images/charlotte-avatar.png" alt="" width={24} height={24} style={{ borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ background: '#F4F3FA', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: 220 }}>
                  <p style={{ fontSize: 13, color: '#16153A', lineHeight: 1.5 }}>
                    Great! Try &ldquo;I&rsquo;ve learned&rdquo; — sounds more natural.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F0FDE4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="#3D8800"><path d="M10 3L5 8.5 2 5.5"/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: '#3D8800', fontWeight: 700 }}>+5 XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div style={{ padding: '8px 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#9896B8', fontWeight: 600 }}>Progresso diário</span>
                <span style={{ fontSize: 11, color: '#3D8800', fontWeight: 700 }}>2/3 missões</span>
              </div>
              <div style={{ height: 5, background: '#F4F3FA', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '66%', height: '100%', background: '#A3FF3C', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF BAR ────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #EEEDF5', borderBottom: '1px solid #EEEDF5', background: '#FAFAF9', marginTop: 80 }}>
        <div className="stats-row" style={{
          maxWidth: 1100, margin: '0 auto', padding: '28px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 64, flexWrap: 'wrap',
        }}>
          {[
            ['3 níveis', 'Novice ao Advanced'],
            ['OpenAI', 'Realtime API'],
            ['24 / 7', 'Sempre disponível'],
            ['7 dias', 'Grátis para começar'],
          ].map(([v, l]) => (
            <div key={v} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16153A', letterSpacing: '-0.5px' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#9896B8', marginTop: 3, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="funcionalidades" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 40px' }}>
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D8800', marginBottom: 12 }}>
            Por que Charlotte
          </p>
          <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1.5px', color: '#16153A', maxWidth: 560, lineHeight: 1.1 }}>
            Tudo que você precisa para falar inglês de verdade.
          </h2>
        </div>

        <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              title: 'Conversação ao vivo',
              desc: 'Sessões de voz em tempo real com Charlotte. Ela te ouve, responde e corrige na hora — como ter uma professora nativa disponível 24h.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3D8800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              ),
            },
            {
              title: 'Trilha de aprendizado',
              desc: 'Lições personalizadas para o seu nível. Do básico ao avançado, com gramática, vocabulário e pronúncia — no seu ritmo.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3D8800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              ),
            },
            {
              title: 'Missões e progresso',
              desc: 'Três missões por dia, XP, streak e leaderboard. Você vê sua evolução acontecer — e Charlotte garante que você não para.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3D8800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              ),
            },
          ].map(f => (
            <div key={f.title} style={{
              background: '#fff',
              border: '1px solid #EEEDF5',
              borderRadius: 20,
              padding: '32px 28px',
              boxShadow: '0 1px 12px rgba(22,21,58,0.05)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#F0FDE4', border: '1px solid #C6F47A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#16153A', marginBottom: 10, letterSpacing: '-0.3px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: '#4B4A72', lineHeight: 1.75 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="como" style={{ background: '#F4F3FA', borderTop: '1px solid #EEEDF5', borderBottom: '1px solid #EEEDF5', padding: '96px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D8800', marginBottom: 12 }}>
            Como funciona
          </p>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', color: '#16153A', marginBottom: 60, lineHeight: 1.1 }}>
            Começa em 3 passos.
          </h2>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { n: 1, title: 'Baixe o app', desc: 'Disponível no iOS. Instale e crie sua conta em menos de 2 minutos.' },
              { n: 2, title: 'Faça o teste de nível', desc: 'Charlotte avalia seu inglês e monta uma trilha personalizada para você.' },
              { n: 3, title: 'Comece a falar', desc: 'Converse, pratique pronúncia e complete missões diárias. Sem enrolação.' },
            ].map(s => (
              <div key={s.n}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#fff', border: '1.5px solid #EEEDF5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: '#16153A',
                  marginBottom: 20,
                  boxShadow: '0 2px 8px rgba(22,21,58,0.08)',
                }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#16153A', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#4B4A72', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="planos" style={{ maxWidth: 680, margin: '0 auto', padding: '96px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3D8800', marginBottom: 12 }}>
          Planos
        </p>
        <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', color: '#16153A', marginBottom: 12 }}>
          Comece de graça.
        </h2>
        <p style={{ fontSize: 16, color: '#4B4A72', lineHeight: 1.7, marginBottom: 48 }}>
          7 dias com acesso completo. Sem cartão de crédito.
        </p>

        <div style={{
          background: '#fff',
          border: '1px solid #EEEDF5',
          borderRadius: 24,
          padding: '44px 48px',
          boxShadow: '0 8px 48px rgba(22,21,58,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 40 }}>
            {[
              { label: 'Mensal', price: 'R$ 29,90', sub: 'por mês' },
              { label: 'Anual', price: 'R$ 199,90', sub: 'por ano · economia de 44%' },
            ].map(p => (
              <div key={p.label} style={{
                flex: 1, background: '#F4F3FA',
                border: '1px solid #EEEDF5',
                borderRadius: 16, padding: '20px 16px',
              }}>
                <div style={{ fontSize: 12, color: '#9896B8', fontWeight: 600, marginBottom: 8 }}>{p.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#16153A', letterSpacing: '-0.5px' }}>{p.price}</div>
                <div style={{ fontSize: 11, color: '#9896B8', marginTop: 4 }}>{p.sub}</div>
              </div>
            ))}
          </div>

          <a href={STORE_URL} style={{
            display: 'inline-block',
            background: '#A3FF3C', color: '#16153A',
            fontWeight: 800, fontSize: 16,
            padding: '16px 48px', borderRadius: 14,
            boxShadow: '0 4px 20px rgba(163,255,60,0.35)',
          }}>
            Experimentar 7 dias grátis
          </a>
          <p style={{ fontSize: 12, color: '#9896B8', marginTop: 16 }}>
            Cancele quando quiser direto pelo App Store.
          </p>
        </div>
      </section>

      {/* ── SUPPORT ──────────────────────────────────────────────────────── */}
      <section id="suporte" style={{ background: '#F4F3FA', borderTop: '1px solid #EEEDF5', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#16153A', marginBottom: 14, letterSpacing: '-0.5px' }}>
            Precisando de ajuda?
          </h2>
          <p style={{ fontSize: 15, color: '#4B4A72', lineHeight: 1.75, marginBottom: 28 }}>
            Nossa equipe responde em até 24h. Para dúvidas sobre assinatura, cancele direto pelo App Store.
          </p>
          <a href="mailto:contato@hubacademybr.com" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #EEEDF5',
            borderRadius: 12, padding: '12px 22px',
            color: '#16153A', fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(22,21,58,0.06)',
          }}>
            contato@hubacademybr.com
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #EEEDF5',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/images/charlotte-avatar.png" alt="" width={22} height={22} style={{ borderRadius: '50%' }} />
          <span style={{ fontWeight: 800, fontSize: 13, color: '#16153A' }}>Charlotte</span>
          <span style={{ fontSize: 12, color: '#9896B8' }}>© 2026 Hub Academy Ltda</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacidade" style={{ fontSize: 12, color: '#9896B8' }}>Privacidade</a>
          <a href="/termos"      style={{ fontSize: 12, color: '#9896B8' }}>Termos</a>
          <a href="mailto:contato@hubacademybr.com" style={{ fontSize: 12, color: '#9896B8' }}>Contato</a>
        </div>
      </footer>
    </>
  );
}
