// lib/email-templates.ts
// Templates HTML para todos os emails transacionais do Charlotte.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte.hubacademybr.com';

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F3FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(22,21,58,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#16153A;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#A3FF3C;letter-spacing:-0.3px;">Charlotte</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Hub Academy</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F4F3FA;padding:20px 40px;text-align:center;border-top:1px solid rgba(22,21,58,0.06);">
            <p style="margin:0;font-size:12px;color:rgba(22,21,58,0.35);line-height:1.6;">
              Hub Academy &mdash; Charlotte AI<br>
              Este &eacute; um email autom&aacute;tico. N&atilde;o responda a esta mensagem.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="background:#A3FF3C;border-radius:10px;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#16153A;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function card(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r =>
    `<p style="margin:6px 0;font-size:13px;color:#4B4A72;">
      <strong style="color:#16153A;">${r.label}:</strong> ${r.value}
    </p>`
  ).join('');
  return `<div style="background:#F4F3FA;border-radius:12px;padding:20px 24px;margin:24px 0;">${rowsHtml}</div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid rgba(22,21,58,0.08);margin:28px 0;" />`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#16153A;">Ol&aacute;, ${name}!</p>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#4B4A72;line-height:1.7;">${text}</p>`;
}

function note(text: string): string {
  return `<p style="margin:0;font-size:13px;color:#9896B8;line-height:1.6;">${text}</p>`;
}

// ── 1. Convite institucional (admin criou pelo dashboard) ─────────────────────

export function inviteTemplate(opts: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const subject = `Seu acesso ao Charlotte est\u00e1 pronto`;
  const html = base(`
    ${greeting(opts.name)}
    ${p(`Seu acesso ao <strong>Charlotte</strong> foi criado pela equipe Hub Academy. Voc&ecirc; j&aacute; pode entrar e come&ccedil;ar a praticar ingl&ecirc;s.`)}
    ${card([
      { label: 'Email', value: opts.email },
      { label: 'Senha tempor&aacute;ria', value: `<code style="background:#eee;padding:2px 6px;border-radius:4px;">${opts.tempPassword}</code>` },
    ])}
    ${p(`No primeiro acesso voc&ecirc; ser&aacute; solicitado a criar uma nova senha.`)}
    ${btn('Acessar o Charlotte', APP_URL)}
    ${divider()}
    ${note(`D&uacute;vidas? Fale com a equipe Hub Academy.`)}
  `);
  return { subject, html };
}

// ── 2. Boas-vindas subscriber (cadastro pelo app) ─────────────────────────────

export function welcomeSubscriberTemplate(opts: {
  name: string;
  level: string;
  trialEndsAt: string;
}) {
  const subject = `Bem-vindo ao Charlotte, ${opts.name}`;
  const html = base(`
    ${greeting(opts.name)}
    ${p(`Seu teste gratuito do <strong>Charlotte</strong> est&aacute; ativo. Voc&ecirc; tem <strong>7 dias de acesso completo</strong> para praticar ingl&ecirc;s do seu jeito.`)}
    ${card([
      { label: 'N&iacute;vel', value: opts.level },
      { label: 'Trial expira em', value: opts.trialEndsAt },
    ])}
    ${btn('Come&ccedil;ar agora', APP_URL)}
    ${divider()}
    ${note(`Aproveite ao m&aacute;ximo &mdash; converse com a Charlotte, fa&ccedil;a li&ccedil;&otilde;es e acompanhe seu progresso.`)}
  `);
  return { subject, html };
}

// ── 3. Redefinicao de senha ───────────────────────────────────────────────────

export function resetPasswordTemplate(opts: {
  name: string;
  resetUrl: string;
}) {
  const subject = `Redefini&ccedil;&atilde;o de senha &mdash; Charlotte`;
  const html = base(`
    ${greeting(opts.name)}
    ${p(`Recebemos uma solicita&ccedil;&atilde;o para redefinir a senha da sua conta Charlotte. Clique no bot&atilde;o abaixo para criar uma nova senha.`)}
    ${btn('Redefinir senha', opts.resetUrl)}
    ${divider()}
    ${note(`Este link expira em <strong>1 hora</strong>. Se voc&ecirc; n&atilde;o solicitou a redefini&ccedil;&atilde;o, ignore este email &mdash; sua senha permanece a mesma.`)}
  `);
  return { subject, html };
}

// ── 4. Trial expirando (2 dias antes) ────────────────────────────────────────

export function trialExpiringTemplate(opts: {
  name: string;
  expiresAt: string;
}) {
  const subject = `Seu per&iacute;odo gratuito expira em 2 dias`;
  const html = base(`
    ${greeting(opts.name)}
    ${p(`Seu per&iacute;odo de teste gratuito do Charlotte expira em <strong>${opts.expiresAt}</strong>.`)}
    ${p(`Para continuar praticando sem interrup&ccedil;&atilde;o, assine o Charlotte agora.`)}
    ${btn('Assinar o Charlotte', APP_URL)}
    ${divider()}
    ${note(`D&uacute;vidas sobre os planos? Fale com a equipe Hub Academy.`)}
  `);
  return { subject, html };
}

// ── 5. Assinatura cancelada / expirada ────────────────────────────────────────

export function subscriptionExpiredTemplate(opts: {
  name: string;
}) {
  const subject = `Sua assinatura Charlotte foi encerrada`;
  const html = base(`
    ${greeting(opts.name)}
    ${p(`Sua assinatura do Charlotte foi encerrada. O acesso ao app foi suspenso temporariamente.`)}
    ${p(`Quando quiser voltar, &eacute; s&oacute; reativar &mdash; seu hist&oacute;rico de progresso fica salvo.`)}
    ${btn('Reativar acesso', APP_URL)}
    ${divider()}
    ${note(`Saudades de voc&ecirc; por aqui. A Charlotte tamb&eacute;m.`)}
  `);
  return { subject, html };
}
