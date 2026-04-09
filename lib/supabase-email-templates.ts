// lib/supabase-email-templates.ts
// Templates HTML para os emails de autenticação do Supabase.
// Cole cada template em: Supabase Dashboard → Authentication → Email Templates
//
// Variaveis Supabase:
//   {{ .ConfirmationURL }} — link de confirmacao / reset
//   {{ .Email }}          — email do usuario
//   {{ .SiteURL }}        — URL base do projeto
//   {{ .Token }}          — token OTP (se usar magic link)

const AVATAR_URL = 'https://charlotte-pwa-02-final.vercel.app/charlotte-avatar.png';
const APP_URL    = 'https://charlotte.hubacademybr.com';

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

        <tr>
          <td align="center" style="padding-bottom:32px;">
            <img src="${AVATAR_URL}" width="80" height="80"
              style="border-radius:50%;display:block;" alt="Charlotte" />
          </td>
        </tr>

        <tr><td>${content}</td></tr>

        <tr>
          <td style="padding:48px 0 32px;">
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:0;" />
          </td>
        </tr>

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

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:17px;color:#515154;line-height:1.6;text-align:center;">${text}</p>`;
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

// ── 1. Confirm signup ─────────────────────────────────────────────────────────
// Subject: Confirme seu email — Charlotte
export const confirmSignup = base(`
  ${h1('Confirme seu email.')}
  ${p('Clique no bot&atilde;o abaixo para confirmar seu endere&ccedil;o de email e ativar sua conta no Charlotte AI.')}
  ${btn('Confirmar email', '{{ .ConfirmationURL }}')}
  ${note('Se voc&ecirc; n&atilde;o criou uma conta no Charlotte, ignore este email.')}
`);

// ── 2. Reset password ─────────────────────────────────────────────────────────
// Subject: Redefinição de senha — Charlotte
export const resetPassword = base(`
  ${h1('Redefini&ccedil;&atilde;o<br>de senha.')}
  ${p('Recebemos uma solicita&ccedil;&atilde;o para redefinir a senha da sua conta Charlotte.')}
  ${btn('Criar nova senha', '{{ .ConfirmationURL }}')}
  ${note('Este link expira em <strong>1 hora</strong>.<br>Se voc&ecirc; n&atilde;o solicitou, ignore este email &mdash; sua senha permanece a mesma.')}
`);

// ── 3. Magic link ─────────────────────────────────────────────────────────────
// Subject: Seu link de acesso — Charlotte
export const magicLink = base(`
  ${h1('Seu link de acesso.')}
  ${p('Clique abaixo para entrar no Charlotte AI.<br>O link expira em 1 hora.')}
  ${btn('Entrar no Charlotte', '{{ .ConfirmationURL }}')}
  ${note('Se voc&ecirc; n&atilde;o solicitou este link, ignore este email.')}
`);

// ── 4. Email change ───────────────────────────────────────────────────────────
// Subject: Confirme seu novo email — Charlotte
export const emailChange = base(`
  ${h1('Confirme seu novo email.')}
  ${p('Clique abaixo para confirmar a troca do seu endere&ccedil;o de email no Charlotte AI.')}
  ${btn('Confirmar novo email', '{{ .ConfirmationURL }}')}
  ${note('Se voc&ecirc; n&atilde;o solicitou esta altera&ccedil;&atilde;o, entre em contato com a equipe Hub Academy imediatamente.')}
`);

// ── Export como strings prontas para colar no Supabase ────────────────────────
export const SUPABASE_TEMPLATES = {
  confirmSignup: {
    subject: 'Confirme seu email \u2014 Charlotte',
    html: confirmSignup,
  },
  resetPassword: {
    subject: 'Redefini\u00e7\u00e3o de senha \u2014 Charlotte',
    html: resetPassword,
  },
  magicLink: {
    subject: 'Seu link de acesso \u2014 Charlotte',
    html: magicLink,
  },
  emailChange: {
    subject: 'Confirme seu novo email \u2014 Charlotte',
    html: emailChange,
  },
};
