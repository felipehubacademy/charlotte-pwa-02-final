import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Charlotte: Fale Inglês com IA — Hub Academy',
  description: 'Converse em inglês com uma IA que parece uma professora nativa. Corrija sua pronúncia, pratique gramática e evolua de verdade. Experimente grátis por 7 dias.',
};

const STORE_URL = '#'; // Atualizar após publicação na App Store

export default function MarketingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#16153A', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, backgroundColor: 'rgba(22,21,58,0.95)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ backgroundColor: '#A3FF3C', color: '#16153A', fontWeight: 800, fontSize: 15, padding: '4px 10px', borderRadius: 6, letterSpacing: '-0.3px' }}>Charlotte</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>by Hub Academy</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#features" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>Funcionalidades</a>
          <a href="#pricing" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>Planos</a>
          <a href="#support" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>Suporte</a>
          <a href={STORE_URL} style={{ backgroundColor: '#A3FF3C', color: '#16153A', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>Baixar app</a>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(163,255,60,0.1)', border: '1px solid rgba(163,255,60,0.2)', borderRadius: 100, padding: '6px 14px', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A3FF3C', display: 'inline-block' }}></span>
            <span style={{ color: '#A3FF3C', fontSize: 13, fontWeight: 600 }}>Disponível agora no iOS</span>
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
            Fale inglês<br />
            <span style={{ color: '#A3FF3C' }}>sem enrolação.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 460 }}>
            Charlotte é sua professora de inglês com IA. Ela te ouve, corrige sua pronúncia e te faz evoluir desde a primeira conversa — 24h por dia, sem julgamento.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={STORE_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#fff', color: '#16153A', borderRadius: 12, padding: '12px 20px', textDecoration: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#16153A"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.6, lineHeight: 1 }}>Baixar na</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>App Store</div>
              </div>
            </a>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              7 dias grátis · Cancele quando quiser
            </div>
          </div>
        </div>

        {/* App mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 260, height: 520, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            {/* Avatar placeholder */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(163,255,60,0.15)', border: '2px solid rgba(163,255,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              🎓
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#A3FF3C', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Charlotte</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>online agora</div>
            </div>
            {/* Mock chat bubbles */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                How was your day? Tell me in English! 😊
              </div>
              <div style={{ backgroundColor: 'rgba(163,255,60,0.15)', border: '1px solid rgba(163,255,60,0.2)', borderRadius: '12px 12px 4px 12px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)', alignSelf: 'flex-end', lineHeight: 1.5 }}>
                It was good. I learned a lot today.
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                ✨ Great sentence! Small tip: try "I've learned" for more natural flow.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            ['3 níveis', 'Beginner ao Advanced C2'],
            ['IA nativa', 'OpenAI Realtime API'],
            ['7 dias', 'Grátis para começar'],
            ['24/7', 'Disponível sempre'],
          ].map(([val, label]) => (
            <div key={val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#A3FF3C' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#A3FF3C', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Funcionalidades</p>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Tudo que você precisa<br />para falar inglês de verdade</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[
            { emoji: '🎙️', title: 'Conversação ao vivo', desc: 'Sessões de voz em tempo real com Charlotte via IA. Ela te ouve, responde e corrige — como uma aula particular disponível 24h.', color: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.2)' },
            { emoji: '📚', title: 'Lições personalizadas', desc: 'Trilha de aprendizado adaptada ao seu nível, do Beginner ao Advanced C2. Gramática, pronúncia e vocabulário no seu ritmo.', color: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
            { emoji: '🎯', title: 'Missões e streak diário', desc: '3 missões por dia com XP, streak de dias consecutivos e leaderboard. Consistência é o segredo — e Charlotte te mantém motivado.', color: 'rgba(163,255,60,0.1)', border: 'rgba(163,255,60,0.2)' },
            { emoji: '🗣️', title: 'Feedback de pronúncia', desc: 'Grave sua voz e receba análise instantânea. Charlotte corrige sua pronúncia e explica como os nativos falam de verdade.', color: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
          ].map(f => (
            <div key={f.title} style={{ backgroundColor: f.color, border: `1px solid ${f.border}`, borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#A3FF3C', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Como funciona</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', margin: 0 }}>3 passos para começar</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { n: '01', title: 'Baixe o app', desc: 'Disponível no iOS. Instale e crie sua conta em menos de 2 minutos.' },
              { n: '02', title: 'Faça o teste de nível', desc: 'Charlotte avalia seu inglês e personaliza a experiência para o seu perfil.' },
              { n: '03', title: 'Comece a falar', desc: 'Converse, pratique pronúncia e complete missões diárias. Sem enrolação.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(163,255,60,0.15)', border: '1px solid rgba(163,255,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#A3FF3C', margin: '0 auto 20px' }}>{s.n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 700, margin: '0 auto', padding: '96px 32px', textAlign: 'center' }}>
        <p style={{ color: '#A3FF3C', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Planos</p>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 48px' }}>Comece de graça</h2>

        <div style={{ backgroundColor: 'rgba(163,255,60,0.06)', border: '1px solid rgba(163,255,60,0.2)', borderRadius: 24, padding: '40px 48px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>7 dias grátis</h3>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Acesso completo a todas as funcionalidades — conversação ao vivo, lições, missões, pronunciação — sem compromisso. Após o trial, escolha o plano que funciona para você.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              ['Mensal', 'R$ 29,90/mês'],
              ['Anual', 'R$ 199,90/ano'],
            ].map(([label, price]) => (
              <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 24px', minWidth: 140 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{price}</div>
              </div>
            ))}
          </div>
          <a href={STORE_URL} style={{ display: 'inline-block', backgroundColor: '#A3FF3C', color: '#16153A', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 12, textDecoration: 'none' }}>
            Experimentar grátis
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 16 }}>Cancele quando quiser, direto pelo App Store.</p>
        </div>
      </section>

      {/* ── SUPPORT ──────────────────────────────────────────── */}
      <section id="support" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#A3FF3C', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Suporte</p>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 16px' }}>Precisando de ajuda?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Nossa equipe responde em até 24 horas. Para dúvidas sobre assinatura, cancele direto pelo App Store.
          </p>
          <a href="mailto:contato@hubacademybr.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 24px', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
            ✉️ contato@hubacademybr.com
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ backgroundColor: '#A3FF3C', color: '#16153A', fontWeight: 800, fontSize: 13, padding: '3px 8px', borderRadius: 5 }}>Charlotte</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>© 2026 Hub Academy Ltda</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/privacidade" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Política de Privacidade</a>
          <a href="/termos" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Termos de Uso</a>
          <a href="mailto:contato@hubacademybr.com" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Contato</a>
        </div>
      </footer>

    </div>
  );
}
