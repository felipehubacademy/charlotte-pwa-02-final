import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Charlotte: Fale Inglês com IA — Hub Academy',
  description: 'Converse em inglês com uma IA que parece uma professora nativa. Corrija sua pronúncia, pratique gramática e evolua de verdade. Experimente grátis por 7 dias.',
};

const STORE_URL = 'https://apps.apple.com/app/charlotte-fale-ingles-com-ia/id6760943273';

// ── Palette (same as RN app light theme) ──────────────────────────────────────
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.08)',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  greenBg:   'rgba(163,255,60,0.10)',
  greenBdr:  'rgba(163,255,60,0.25)',
};

const features = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    title: 'Conversação ao vivo',
    desc: 'Sessões de voz em tempo real com Charlotte. Ela te ouve, responde e corrige como uma professora nativa — 24h por dia.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: 'Lições personalizadas',
    desc: 'Trilha adaptada ao seu nível — do Novice ao Advanced. Gramática, pronúncia e vocabulário no seu ritmo.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: 'Streak e missões diárias',
    desc: '3 missões por dia com XP, streak de dias consecutivos e leaderboard. Consistência é o segredo — Charlotte te mantém no ritmo.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    title: 'Feedback de pronúncia',
    desc: 'Grave sua voz e receba análise instantânea. Charlotte corrige e explica como os nativos falam de verdade.',
  },
];

export default function MarketingPage() {
  return (
    <div style={{ backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: C.navy, minHeight: '100vh' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(244,243,250,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        height: 64, padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={32} height={32}
            style={{ borderRadius: '50%', border: `2px solid ${C.green}` }} />
          <span style={{ backgroundColor: C.green, color: C.navy, fontWeight: 800, fontSize: 14, padding: '3px 10px', borderRadius: 7, letterSpacing: '-0.3px' }}>Charlotte</span>
          <span style={{ color: C.navyLight, fontSize: 13 }}>by Hub Academy</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#features" style={{ color: C.navyMid, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Funcionalidades</a>
          <a href="#pricing" style={{ color: C.navyMid, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Planos</a>
          <a href="#support" style={{ color: C.navyMid, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Suporte</a>
          <a href={STORE_URL} style={{ backgroundColor: C.navy, color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, textDecoration: 'none' }}>
            Baixar app
          </a>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '100px 40px 88px', display: 'grid', gridTemplateColumns: '1fr 480px', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: C.greenDark, display: 'inline-block' }} />
            <span style={{ color: C.greenDark, fontSize: 13, fontWeight: 700 }}>Disponível agora no iOS</span>
          </div>

          <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.06, letterSpacing: '-2px', margin: '0 0 22px', color: C.navy }}>
            Fale inglês<br />
            <span style={{ color: C.greenDark }}>sem enrolação.</span>
          </h1>

          <p style={{ fontSize: 19, color: C.navyMid, lineHeight: 1.7, margin: '0 0 40px', maxWidth: 460 }}>
            Charlotte é sua professora de inglês com IA. Ela te ouve, corrige sua pronúncia e te faz evoluir desde a primeira conversa — 24h por dia, sem julgamento.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href={STORE_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: C.navy, color: '#fff', borderRadius: 14, padding: '14px 22px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(22,21,58,0.18)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, lineHeight: 1 }}>Baixar na</div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>App Store</div>
              </div>
            </a>
            <span style={{ color: C.navyLight, fontSize: 13 }}>7 dias grátis · Cancele quando quiser</span>
          </div>
        </div>

        {/* App preview card */}
        <div style={{ background: C.card, borderRadius: 32, border: `1px solid ${C.border}`, boxShadow: '0 24px 80px rgba(22,21,58,0.10)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header do app */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={52} height={52}
              style={{ borderRadius: '50%', border: `2.5px solid ${C.green}` }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.navy }}>Charlotte</div>
              <div style={{ fontSize: 12, color: C.greenDark, fontWeight: 600, marginTop: 2 }}>online agora</div>
            </div>
            {/* Streak pill */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,146,60,0.1)', borderRadius: 20, paddingInline: 10, paddingBlock: 5 }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#EA580C' }}>7</span>
            </div>
          </div>

          {/* Chat bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ backgroundColor: C.bg, borderRadius: '16px 16px 16px 4px', padding: '12px 16px', fontSize: 14, color: C.navyMid, lineHeight: 1.55, maxWidth: '85%' }}>
              How was your day? Tell me in English!
            </div>
            <div style={{ backgroundColor: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: '16px 16px 4px 16px', padding: '12px 16px', fontSize: 14, color: C.navy, lineHeight: 1.55, maxWidth: '85%', alignSelf: 'flex-end' }}>
              It was good. I learned a lot today.
            </div>
            <div style={{ backgroundColor: C.bg, borderRadius: '16px 16px 16px 4px', padding: '12px 16px', fontSize: 14, color: C.navyMid, lineHeight: 1.55, maxWidth: '90%' }}>
              Great sentence! Tip: &ldquo;I&rsquo;ve learned&rdquo; sounds more natural to native speakers.
            </div>
          </div>

          {/* XP bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', backgroundColor: C.green, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>+10 XP</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, backgroundColor: C.card, padding: '28px 40px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
          {[
            ['3 níveis', 'Novice ao Advanced'],
            ['IA nativa', 'OpenAI Realtime API'],
            ['7 dias', 'Grátis para começar'],
            ['24/7', 'Disponível sempre'],
          ].map(([val, label]) => (
            <div key={val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: '-0.5px' }}>{val}</div>
              <div style={{ fontSize: 12, color: C.navyLight, marginTop: 3, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Funcionalidades</p>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1.2px', margin: 0, color: C.navy }}>
            Tudo que você precisa<br />para falar inglês de verdade
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 28px', boxShadow: '0 2px 16px rgba(22,21,58,0.05)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.greenBg, border: `1px solid ${C.greenBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', color: C.navy, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: C.navyMid, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Como funciona</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.8px', margin: 0, color: C.navy }}>3 passos para começar</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            {[
              { n: '01', title: 'Baixe o app', desc: 'Disponível no iOS. Instale e crie sua conta em menos de 2 minutos.' },
              { n: '02', title: 'Faça o teste de nível', desc: 'Charlotte avalia seu inglês e personaliza a trilha para o seu perfil.' },
              { n: '03', title: 'Comece a falar', desc: 'Converse, pratique pronúncia e complete missões diárias. Sem enrolação.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: C.greenBg, border: `1.5px solid ${C.greenBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: C.greenDark, margin: '0 auto 20px' }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px', color: C.navy }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.navyMid, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 640, margin: '0 auto', padding: '96px 40px', textAlign: 'center' }}>
        <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Planos</p>
        <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 48px', color: C.navy }}>Comece de graça</h2>

        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: '44px 48px', boxShadow: '0 8px 40px rgba(22,21,58,0.08)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: C.greenBg, border: `1.5px solid ${C.greenBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 14px', color: C.navy }}>7 dias grátis</h3>
          <p style={{ fontSize: 15, color: C.navyMid, lineHeight: 1.75, margin: '0 0 32px' }}>
            Acesso completo a todas as funcionalidades — conversação ao vivo, lições, missões e pronúncia — sem compromisso. Após o trial, escolha o plano ideal.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 32 }}>
            {[['Mensal', 'R$ 29,90/mês'], ['Anual', 'R$ 199,90/ano']].map(([label, price]) => (
              <div key={label} style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 28px', minWidth: 140 }}>
                <div style={{ fontSize: 12, color: C.navyLight, marginBottom: 6, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>{price}</div>
              </div>
            ))}
          </div>
          <a href={STORE_URL} style={{ display: 'inline-block', backgroundColor: C.green, color: C.navy, fontWeight: 800, fontSize: 15, padding: '14px 40px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(163,255,60,0.3)' }}>
            Experimentar grátis
          </a>
          <p style={{ fontSize: 12, color: C.navyLight, marginTop: 14 }}>Cancele quando quiser, direto pelo App Store.</p>
        </div>
      </section>

      {/* ── SUPPORT ─────────────────────────────────────────────────────────── */}
      <section id="support" style={{ backgroundColor: C.card, borderTop: `1px solid ${C.border}`, padding: '80px 40px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Suporte</p>
          <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 16px', color: C.navy }}>Precisando de ajuda?</h2>
          <p style={{ fontSize: 15, color: C.navyMid, lineHeight: 1.75, margin: '0 0 32px' }}>
            Nossa equipe responde em até 24 horas. Para dúvidas sobre assinatura, cancele direto pelo App Store.
          </p>
          <a href="mailto:contato@hubacademybr.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 24px', color: C.navy, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navyLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            contato@hubacademybr.com
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, backgroundColor: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/images/charlotte-avatar.png" alt="Charlotte" width={24} height={24} style={{ borderRadius: '50%' }} />
          <span style={{ backgroundColor: C.green, color: C.navy, fontWeight: 800, fontSize: 12, padding: '2px 8px', borderRadius: 5 }}>Charlotte</span>
          <span style={{ color: C.navyLight, fontSize: 12 }}>© 2026 Hub Academy Ltda</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/privacidade" style={{ color: C.navyLight, fontSize: 12, textDecoration: 'none' }}>Privacidade</a>
          <a href="/termos" style={{ color: C.navyLight, fontSize: 12, textDecoration: 'none' }}>Termos</a>
          <a href="mailto:contato@hubacademybr.com" style={{ color: C.navyLight, fontSize: 12, textDecoration: 'none' }}>Contato</a>
        </div>
      </footer>

    </div>
  );
}
