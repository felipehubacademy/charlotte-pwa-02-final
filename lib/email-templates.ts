// lib/email-templates.ts
// Templates HTML para todos os emails transacionais do Charlotte.
// Sem emojis nos assuntos — melhor deliverability.

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte.hubacademybr.com';
const GREEN    = '#A3FF3C';
const NAVY     = '#16153A';
const NAVY_MID = '#4B4A72';
const BG       = '#F4F3FA';

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: ${BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(22,21,58,0.08); }
    .header { background: ${NAVY}; padding: 32px 40px; text-align: center; }
    .header-title { color: ${GREEN}; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px; }
    .header-sub { color: rgba(255,255,255,0.55); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 17px; font-weight: 700; color: ${NAVY}; margin: 0 0 12px; }
    p { font-size: 14px; color: ${NAVY_MID}; line-height: 1.7; margin: 0 0 16px; }
    .card { background: ${BG}; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .card-row { font-size: 13px; color: ${NAVY_MID}; margin: 6px 0; }
    .card-row strong { color: ${NAVY}; }
    .btn { display: inline-block; background: ${GREEN}; color: ${NAVY}; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 8px 0; }
    .center { text-align: center; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid rgba(22,21,58,0.08); margin: 28px 0; }
    .footer { background: ${BG}; padding: 20px 40px; text-align: center; }
    .footer p { font-size: 12px; color: rgba(22,21,58,0.35); margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p class="header-title">Charlotte</p>
      <p class="header-sub">Hub Academy</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Hub Academy &mdash; Charlotte AI<br>Este e um email automatico. Nao responda a esta mensagem.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. Convite institucional (admin criou pelo dashboard) ─────────────────────

export function inviteTemplate(opts: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const subject = `Seu acesso ao Charlotte esta pronto`;
  const html = base(`
    <p class="greeting">Ola, ${opts.name}!</p>
    <p>Seu acesso ao <strong>Charlotte</strong> foi criado pela equipe Hub Academy. Voce ja pode entrar e comecar a praticar ingles.</p>
    <div class="card">
      <div class="card-row"><strong>Email:</strong> ${opts.email}</div>
      <div class="card-row"><strong>Senha temporaria:</strong> ${opts.tempPassword}</div>
    </div>
    <p>No primeiro acesso voce sera solicitado a criar uma nova senha.</p>
    <div class="center">
      <a class="btn" href="${APP_URL}">Acessar o Charlotte</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px">Duvidas? Fale com a equipe Hub Academy.</p>
  `);
  return { subject, html };
}

// ── 2. Boas-vindas subscriber (cadastro pelo app) ─────────────────────────────

export function welcomeSubscriberTemplate(opts: {
  name: string;
  level: string;
  trialEndsAt: string; // data formatada ex: "16 de abril de 2026"
}) {
  const subject = `Bem-vindo ao Charlotte, ${opts.name}`;
  const html = base(`
    <p class="greeting">Ola, ${opts.name}!</p>
    <p>Seu teste gratuito do <strong>Charlotte</strong> esta ativo. Voce tem <strong>7 dias de acesso completo</strong> para praticar ingles do seu jeito.</p>
    <div class="card">
      <div class="card-row"><strong>Nivel:</strong> ${opts.level}</div>
      <div class="card-row"><strong>Trial expira em:</strong> ${opts.trialEndsAt}</div>
    </div>
    <div class="center">
      <a class="btn" href="${APP_URL}">Comecar agora</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px">Aproveite ao maximo — converse com a Charlotte, faca licoes e acompanhe seu progresso.</p>
  `);
  return { subject, html };
}

// ── 3. Redefinicao de senha ───────────────────────────────────────────────────

export function resetPasswordTemplate(opts: {
  name: string;
  resetUrl: string;
}) {
  const subject = `Redefinicao de senha — Charlotte`;
  const html = base(`
    <p class="greeting">Ola, ${opts.name}!</p>
    <p>Recebemos uma solicitacao para redefinir a senha da sua conta Charlotte. Clique no botao abaixo para criar uma nova senha.</p>
    <div class="center">
      <a class="btn" href="${opts.resetUrl}">Redefinir senha</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px">Este link expira em <strong>1 hora</strong>. Se voce nao solicitou a redefinicao, ignore este email &mdash; sua senha permanece a mesma.</p>
  `);
  return { subject, html };
}

// ── 4. Trial expirando (2 dias antes) ────────────────────────────────────────

export function trialExpiringTemplate(opts: {
  name: string;
  expiresAt: string;
}) {
  const subject = `Seu periodo gratuito expira em 2 dias`;
  const html = base(`
    <p class="greeting">Ola, ${opts.name}!</p>
    <p>Seu periodo de teste gratuito do Charlotte expira em <strong>${opts.expiresAt}</strong>.</p>
    <p>Para continuar praticando sem interrupcao, assine o Charlotte agora.</p>
    <div class="center">
      <a class="btn" href="${APP_URL}">Assinar o Charlotte</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px">Duvidas sobre os planos? Responda a este email ou fale com a equipe Hub Academy.</p>
  `);
  return { subject, html };
}

// ── 5. Assinatura cancelada / expirada ────────────────────────────────────────

export function subscriptionExpiredTemplate(opts: {
  name: string;
}) {
  const subject = `Sua assinatura Charlotte foi encerrada`;
  const html = base(`
    <p class="greeting">Ola, ${opts.name}!</p>
    <p>Sua assinatura do Charlotte foi encerrada. O acesso ao app foi suspenso temporariamente.</p>
    <p>Quando quiser voltar, e so reativar — seu historico de progresso fica salvo.</p>
    <div class="center">
      <a class="btn" href="${APP_URL}">Reativar acesso</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px">Saudades de voce por aqui. A Charlotte tambem.</p>
  `);
  return { subject, html };
}
