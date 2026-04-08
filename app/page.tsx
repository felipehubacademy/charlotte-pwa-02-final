import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Charlotte: Fale Inglês com IA — Hub Academy',
  description: 'Converse em inglês com uma IA que parece uma professora nativa. Corrija sua pronúncia, pratique gramática e evolua de verdade. Experimente grátis por 7 dias.',
};

const STORE_URL = 'https://apps.apple.com/app/charlotte-fale-ingles-com-ia/id6760943273';

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3FF3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    title: 'Conversação ao vivo',
    desc: 'Sessões de voz em tempo real com Charlotte. Ela te ouve, responde e corrige como uma professora nativa disponível 24h.',
    accent: 'rgba(255,107,53,0.12)',
    border: 'rgba(255,107,53,0.2)',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3FF3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Lições personalizadas',
    desc: 'Trilha adaptada ao seu nível, do Novice ao Advanced. Gramática, pronúncia e vocabulário no seu ritmo.',
    accent: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.2)',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3FF3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Streak e missões diárias',
    desc: '3 missões por dia com XP, streak de dias consecutivos e leaderboard. Consistência é o segredo.',
    accent: 'rgba(163,255,60,0.08)',
    border: 'rgba(163,255,60,0.2)',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3FF3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: 'Feedback de pronúncia',
    desc: 'Grave sua voz e receba análise instantânea. Charlotte corrige e explica como os nativos falam de verdade.',
    accent: 'rgba(244,114,182,0.1)',
    border: 'rgba(244,114,182,0.2)',
  },
];

export default function MarketingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07071C', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#fff' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(7,7,28,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={30} height={30} style={{ borderRadius: '50%', border: '1.5px solid rgba(163,255,60,0.5)' }} />
          <span style={{ backgroundColor: '#A3FF3C', color: '#07071C', fontWeight: 800, fontSize: 14, padding: '3px 9px', borderRadius: 6, letterSpacing: '-0.3px' }}>Charlotte</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>by Hub Academy</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#features" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none' }}>Funcionalidades</a>
          <a href="#pricing" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none' }}>Planos</a>
          <a href="#support" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none' }}>Suporte</a>
          <a href={STORE_URL} style={{ backgroundColor: '#A3FF3C', color: '#07071C', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>Baixar app</a>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 32px 88px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(163,255,60,0.08)', border: '1px solid rgba(163,255,60,0.2)', borderRadius: 100, padding: '6px 14px', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A3FF3C', display: 'inline-block' }} />
            <span style={{ color: '#A3FF3C', fontSize: 13, fontWeight: 600 }}>Disponível agora no iOS</span>
          </div>

          <h1 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1.5px', margin: '0 0 22px' }}>
            Fale inglês<br />
            <span style={{ color: '#A3FF3C' }}>sem enrolação.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: '0 0 40px', maxWidth: 440 }}>
            Charlotte é sua professora de inglês com IA. Ela te ouve, corrige sua pronúncia e te faz evoluir desde a primeira conversa — 24h por dia, sem julgamento.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={STORE_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#fff', color: '#07071C', borderRadius: 12, padding: '12px 20px', textDecoration: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#07071C">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.5, lineHeight: 1 }}>Baixar na</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>App Store</div>
              </div>
            </a>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>7 dias grátis · Cancele quando quiser</span>
          </div>
        </div>

        {/* Charlotte avatar + mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 268, background: 'linear-gradient(160deg, rgba(163,255,60,0.06) 0%, rgba(255,255,255,0.03) 100%)', borderRadius: 40, border: '1px solid rgba(255,255,255,0.09)', padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1.5px solid rgba(163,255,60,0.25)', animation: 'pulse 2s ease-in-out infinite' }} />
              <Image
                src="/images/charlotte-avatar.png"
                alt="Charlotte AI"
                width={80}
                height={80}
                style={{ borderRadius: '50%', border: '2.5px solid #A3FF3C', display: 'block' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#A3FF3C', fontWeight: 700, fontSize: 15 }}>Charlotte</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>online agora</div>
            </div>

            {/* Mock chat */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                How was your day? Tell me in English!
              </div>
              <div style={{ backgroundColor: 'rgba(163,255,60,0.12)', border: '1px solid rgba(163,255,60,0.18)', borderRadius: '12px 12px 4px 12px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)', alignSelf: 'flex-end', lineHeight: 1.55 }}>
                It was good. I learned a lot today.
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                Great sentence! Tip: &ldquo;I&rsquo;ve learned&rdquo; sounds more natural.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56, flexWrap: 'wrap' }}>
          {[
            ['3 níveis', 'Novice ao Advanced'],
            ['IA nativa', 'OpenAI Realtime API'],
            ['7 dias', 'Grátis para começar'],
            ['24/7', 'Disponível sempre'],
          ].map(([val, label]) => (
            <div key={val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#A3FF3C', letterSpacing: '-0.5px' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ color: '#A3FF3C', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Funcionalidades</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Tudo que você precisa<br />para falar inglês de verdade</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {features.map(f => (
            <div key={f.title} style={{ backgroundColor: f.accent, border: `1px solid ${f.border}`, borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(163,255,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#A3FF3C', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Como funciona</p>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', margin: 0 }}>3 passos para começar</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { n: '01', title: 'Baixe o app', desc: 'Disponível no iOS. Instale e crie sua conta em menos de 2 minutos.' },
              { n: '02', title: 'Faça o teste de nível', desc: 'Charlotte avalia seu inglês e personaliza a experiência para o seu perfil.' },
              { n: '03', title: 'Comece a falar', desc: 'Converse, pratique pronúncia e complete missões diárias. Sem enrolação.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(163,255,60,0.1)', border: '1px solid rgba(163,255,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#A3FF3C', margin: '0 auto 20px' }}>{s.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 680, margin: '0 auto', padding: '96px 32px', textAlign: 'center' }}>
        <p style={{ color: '#A3FF3C', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Planos</p>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 48px' }}>Comece de graça</h2>
        <div style={{ backgroundColor: 'rgba(163,255,60,0.05)', border: '1px solid rgba(163,255,60,0.18)', borderRadius: 24, padding: '40px 48px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(163,255,60,0.15)', border: '1.5px solid rgba(163,255,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3FF3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>7 dias grátis</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: '0 0 32px' }}>
            Acesso completo a todas as funcionalidades — conversação ao vivo, lições, missões e pronúncia — sem compromisso. Após o trial, escolha o plano que funciona para você.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[['Mensal', 'R$ 29,90/mês'], ['Anual', 'R$ 199,90/ano']].map(([label, price]) => (
              <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '16px 28px', minWidth: 140 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{price}</div>
              </div>
            ))}
          </div>
          <a href={STORE_URL} style={{ display: 'inline-block', backgroundColor: '#A3FF3C', color: '#07071C', fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 12, textDecoration: 'none' }}>
            Experimentar grátis
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 14 }}>Cancele quando quiser, direto pelo App Store.</p>
        </div>
      </section>

      {/* ── SUPPORT ──────────────────────────────────────────── */}
      <section id="support" style={{ backgroundColor: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#A3FF3C', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Suporte</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 16px' }}>Precisando de ajuda?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 32px' }}>
            Nossa equipe responde em até 24 horas. Para dúvidas sobre assinatura, cancele direto pelo App Store.
          </p>
          <a href="mailto:contato@hubacademybr.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 24px', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            contato@hubacademybr.com
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={22} height={22} style={{ borderRadius: '50%' }} />
          <span style={{ backgroundColor: '#A3FF3C', color: '#07071C', fontWeight: 800, fontSize: 12, padding: '2px 7px', borderRadius: 5 }}>Charlotte</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2026 Hub Academy Ltda</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/privacidade" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textDecoration: 'none' }}>Privacidade</a>
          <a href="/termos" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textDecoration: 'none' }}>Termos</a>
          <a href="mailto:contato@hubacademybr.com" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textDecoration: 'none' }}>Contato</a>
        </div>
      </footer>

    </div>
  );
}
