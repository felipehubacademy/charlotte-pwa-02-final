// lib/email-templates.ts
// Templates HTML — Apple-style: clean, centered, generous whitespace.

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte-pwa-02-final.vercel.app/install';
const AVATAR_URL = 'https://charlotte-pwa-02-final.vercel.app/charlotte-avatar.png';

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1d1d1f;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 24px 64px;">
      <table width="480" cellpadding="0" cellspacing="0">

        <!-- Avatar -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <img src="${AVATAR_URL}" width="80" height="80"
              style="border-radius:50%;display:block;"
              alt="Charlotte" />
          </td>
        </tr>

        <!-- Content -->
        <tr><td>${content}</td></tr>

        <!-- Divider -->
        <tr>
          <td style="padding:48px 0 32px;">
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center">
            <p style="margin:0;font-size:12px;color:#86868b;line-height:1.7;">
              Charlotte &mdash; Hub Academy<br>
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

function h1(text: string): string {
  return `<p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1d1d1f;line-height:1.2;text-align:center;letter-spacing:-0.3px;">${text}</p>`;
}

function p(text: string, centered = true): string {
  const align = centered ? 'center' : 'left';
  return `<p style="margin:0 0 16px;font-size:17px;color:#515154;line-height:1.6;text-align:${align};">${text}</p>`;
}

function meta(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r =>
    `<tr>
      <td style="padding:12px 0;font-size:14px;color:#86868b;border-bottom:1px solid #f2f2f2;width:140px;">${r.label}</td>
      <td style="padding:12px 0;font-size:14px;color:#1d1d1f;border-bottom:1px solid #f2f2f2;font-weight:500;">${r.value}</td>
    </tr>`
  ).join('');
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:28px 0;">${rowsHtml}</table>`;
}

function btn(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:32px auto 0;text-align:center;">
    <tr>
      <td align="center" style="background:#A3FF3C;border-radius:980px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#1d1d1f;text-decoration:none;letter-spacing:-0.1px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function note(text: string): string {
  return `<p style="margin:24px 0 0;font-size:13px;color:#86868b;line-height:1.6;text-align:center;">${text}</p>`;
}

// ── 1. Convite institucional ───────────────────────────────────────────────────

export function inviteTemplate(opts: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const subject = `Seu acesso ao Charlotte AI est\u00e1 pronto`;
  const html = base(`
    ${h1(`Ol&aacute;, ${opts.name}.`)}
    ${p(`A equipe da Hub Academy criou seu acesso ao Charlotte AI.<br>Voc&ecirc; j&aacute; pode entrar e come&ccedil;ar a praticar ingl&ecirc;s.`)}
    ${meta([
      { label: 'Email', value: opts.email },
      { label: 'Senha tempor&aacute;ria', value: `<code style="font-family:monospace;background:#f5f5f7;padding:2px 8px;border-radius:4px;">${opts.tempPassword}</code>` },
    ])}
    ${p(`No primeiro acesso voc&ecirc; ser&aacute; solicitado<br>a criar uma nova senha.`)}
    ${btn('Acessar o Charlotte AI', APP_URL)}
    ${note(`D&uacute;vidas? Fale com a equipe Hub Academy.`)}
  `);
  return { subject, html };
}

// ── 2. Boas-vindas subscriber ──────────────────────────────────────────────────

export function welcomeSubscriberTemplate(opts: {
  name: string;
  level: string;
  trialEndsAt: string;
}) {
  const subject = `Bem-vindo ao Charlotte AI, ${opts.name}`;
  const html = base(`
    ${h1(`Bem-vindo, ${opts.name}.`)}
    ${p(`Seu teste gratuito est&aacute; ativo.<br>Voc&ecirc; tem <strong style="color:#1d1d1f;">7 dias de acesso completo</strong> para praticar ingl&ecirc;s.`)}
    ${meta([
      { label: 'N&iacute;vel', value: opts.level },
      { label: 'Acesso gratuito at&eacute;', value: opts.trialEndsAt },
    ])}
    ${btn('Come&ccedil;ar agora', APP_URL)}
    ${note(`Converse com a Charlotte, fa&ccedil;a li&ccedil;&otilde;es<br>e acompanhe seu progresso.`)}
  `);
  return { subject, html };
}

// ── 3. Redefinicao de senha ────────────────────────────────────────────────────

export function resetPasswordTemplate(opts: {
  name: string;
  resetUrl: string;
}) {
  const subject = `Redefini\u00e7\u00e3o de senha \u2014 Charlotte`;
  const html = base(`
    ${h1(`Redefini&ccedil;&atilde;o<br>de senha`)}
    ${p(`Ol&aacute;, ${opts.name}. Recebemos uma solicita&ccedil;&atilde;o para<br>redefinir a senha da sua conta Charlotte.`)}
    ${btn('Criar nova senha', opts.resetUrl)}
    ${note(`Este link expira em <strong>1 hora</strong>.<br>Se voc&ecirc; n&atilde;o solicitou, ignore este email &mdash; sua senha permanece a mesma.`)}
  `);
  return { subject, html };
}

// ── 4. Trial expirando ─────────────────────────────────────────────────────────

export function trialExpiringTemplate(opts: {
  name: string;
  expiresAt: string;
}) {
  const subject = `Seu acesso gratuito expira em 2 dias`;
  const html = base(`
    ${h1(`Seu per&iacute;odo gratuito<br>est&aacute; acabando.`)}
    ${p(`Ol&aacute;, ${opts.name}. Seu acesso gratuito expira em <strong style="color:#1d1d1f;">${opts.expiresAt}</strong>.<br>Assine agora para continuar praticando.`)}
    ${btn('Assinar o Charlotte AI', APP_URL)}
    ${note(`D&uacute;vidas? Fale com a equipe Hub Academy.`)}
  `);
  return { subject, html };
}

// ── 5. Assinatura encerrada ────────────────────────────────────────────────────

export function subscriptionExpiredTemplate(opts: {
  name: string;
}) {
  const subject = `Sua assinatura Charlotte foi encerrada`;
  const html = base(`
    ${h1(`Sentimos sua falta,<br>${opts.name}.`)}
    ${p(`Sua assinatura foi encerrada e o acesso ao app foi suspenso.<br>Seu hist&oacute;rico de progresso fica salvo.`)}
    ${btn('Reativar acesso', APP_URL)}
    ${note(`A Charlotte est&aacute; aqui quando voc&ecirc; quiser voltar.`)}
  `);
  return { subject, html };
}
