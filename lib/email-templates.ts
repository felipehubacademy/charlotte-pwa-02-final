// lib/email-templates.ts
// Templates HTML para todos os emails transacionais do Charlotte.
// Design: plain, clean, sem fundos escuros.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte.hubacademybr.com';

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr>
          <td style="padding-bottom:40px;">
            <p style="margin:0;font-size:18px;font-weight:800;color:#16153A;letter-spacing:-0.3px;">Charlotte</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td>${content}</td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:48px;border-top:1px solid #f0f0f0;margin-top:48px;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.7;">
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
  return `<table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
    <tr>
      <td style="background:#A3FF3C;border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#16153A;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function card(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r =>
    `<tr>
      <td style="padding:8px 0;font-size:13px;color:#666;border-bottom:1px solid #f5f5f5;">
        <strong style="color:#1a1a1a;display:inline-block;width:140px;">${r.label}</strong>${r.value}
      </td>
    </tr>`
  ).join('');
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0;border-top:1px solid #f5f5f5;">${rowsHtml}</table>`;
}

function h1(text: string): string {
  return `<p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#16153A;line-height:1.3;">${text}</p>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">${text}</p>`;
}

function note(text: string): string {
  return `<p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.6;">${text}</p>`;
}

// ── 1. Convite institucional (admin criou pelo dashboard) ─────────────────────

export function inviteTemplate(opts: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const subject = `Seu acesso ao Charlotte est\u00e1 pronto`;
  const html = base(`
    ${h1(`Ol&aacute;, ${opts.name} &mdash; seu acesso est&aacute; pronto.`)}
    ${p(`A equipe Hub Academy criou seu acesso ao <strong>Charlotte</strong>. Voc&ecirc; j&aacute; pode entrar e come&ccedil;ar a praticar ingl&ecirc;s.`)}
    ${card([
      { label: 'Email', value: opts.email },
      { label: 'Senha tempor&aacute;ria', value: `<code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;font-family:monospace;">${opts.tempPassword}</code>` },
    ])}
    ${p(`No primeiro acesso voc&ecirc; ser&aacute; solicitado a criar uma nova senha.`)}
    ${btn('Acessar o Charlotte', APP_URL)}
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
    ${h1(`Bem-vindo, ${opts.name}.`)}
    ${p(`Seu teste gratuito do <strong>Charlotte</strong> est&aacute; ativo. Voc&ecirc; tem <strong>7 dias de acesso completo</strong> para praticar ingl&ecirc;s.`)}
    ${card([
      { label: 'N&iacute;vel', value: opts.level },
      { label: 'Acesso gratuito at&eacute;', value: opts.trialEndsAt },
    ])}
    ${btn('Come&ccedil;ar agora', APP_URL)}
    ${note(`Aproveite ao m&aacute;ximo &mdash; converse com a Charlotte, fa&ccedil;a li&ccedil;&otilde;es e acompanhe seu progresso.`)}
  `);
  return { subject, html };
}

// ── 3. Redefinicao de senha ───────────────────────────────────────────────────

export function resetPasswordTemplate(opts: {
  name: string;
  resetUrl: string;
}) {
  const subject = `Redefini\u00e7\u00e3o de senha \u2014 Charlotte`;
  const html = base(`
    ${h1(`Redefini&ccedil;&atilde;o de senha`)}
    ${p(`Ol&aacute;, ${opts.name}. Recebemos uma solicita&ccedil;&atilde;o para redefinir a senha da sua conta Charlotte.`)}
    ${btn('Criar nova senha', opts.resetUrl)}
    ${note(`Este link expira em <strong>1 hora</strong>. Se voc&ecirc; n&atilde;o solicitou a redefini&ccedil;&atilde;o, ignore este email &mdash; sua senha permanece a mesma.`)}
  `);
  return { subject, html };
}

// ── 4. Trial expirando (2 dias antes) ────────────────────────────────────────

export function trialExpiringTemplate(opts: {
  name: string;
  expiresAt: string;
}) {
  const subject = `Seu acesso gratuito expira em 2 dias`;
  const html = base(`
    ${h1(`Seu per&iacute;odo gratuito est&aacute; acabando.`)}
    ${p(`Ol&aacute;, ${opts.name}. Seu acesso gratuito ao Charlotte expira em <strong>${opts.expiresAt}</strong>.`)}
    ${p(`Para continuar praticando sem interrup&ccedil;&atilde;o, assine agora.`)}
    ${btn('Assinar o Charlotte', APP_URL)}
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
    ${h1(`Sentimos sua falta, ${opts.name}.`)}
    ${p(`Sua assinatura do Charlotte foi encerrada e o acesso ao app foi suspenso.`)}
    ${p(`Quando quiser voltar, &eacute; s&oacute; reativar &mdash; seu hist&oacute;rico de progresso fica salvo.`)}
    ${btn('Reativar acesso', APP_URL)}
    ${note(`A Charlotte est&aacute; aqui quando voc&ecirc; quiser voltar.`)}
  `);
  return { subject, html };
}
