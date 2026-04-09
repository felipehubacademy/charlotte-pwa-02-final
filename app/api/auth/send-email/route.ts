// app/api/auth/send-email/route.ts
// Supabase "Send Email" Auth Hook — substitui o envio nativo do Supabase.
// Configurar em: Supabase Dashboard -> Authentication -> Hooks -> Send Email
// URL:    https://charlotte-pwa-02-final.vercel.app/api/auth/send-email
// Secret: v1,whsec_<base64> gerado a partir do SUPABASE_HOOK_SECRET (hex)

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import {
  confirmSignup,
  resetPassword,
  magicLink,
  emailChange,
} from '@/lib/supabase-email-templates';

const HEX_SECRET   = process.env.SUPABASE_HOOK_SECRET ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte.hubacademybr.com';

// ── Standard Webhooks verification (formato exigido pelo Supabase) ────────────
async function verifyStandardWebhook(
  body: string,
  headers: Headers,
  hexSecret: string,
): Promise<boolean> {
  const msgId        = headers.get('webhook-id')        ?? '';
  const msgTimestamp = headers.get('webhook-timestamp') ?? '';
  const msgSignature = headers.get('webhook-signature') ?? '';

  if (!msgId || !msgTimestamp || !msgSignature || !hexSecret) return false;

  // Rejeitar timestamps muito antigos (>5 min) para evitar replay attacks
  const ts = parseInt(msgTimestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // Converter hex -> bytes
  const secretBytes = Uint8Array.from(
    (hexSecret.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)),
  );

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const toSign    = `${msgId}\n${msgTimestamp}\n${body}`;
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
  const computed  = `v1,${btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))}`;

  // O header pode conter multiplas assinaturas separadas por espaco
  return msgSignature.split(' ').some(sig => sig === computed);
}

// ── URL de confirmacao ────────────────────────────────────────────────────────
const ACTION_TYPE_MAP: Record<string, string> = {
  signup:               'signup',
  recovery:             'recovery',
  magiclink:            'magiclink',
  email_change_new:     'email_change',
  email_change_current: 'email_change',
  invite:               'invite',
  reauthentication:     'reauthentication',
};

function buildConfirmationUrl(emailData: Record<string, string>): string {
  const base       = emailData.site_url || SUPABASE_URL;
  const type       = ACTION_TYPE_MAP[emailData.email_action_type] ?? emailData.email_action_type;
  const redirectTo = emailData.redirect_to || APP_URL;
  const url        = new URL(`${base}/auth/v1/verify`);
  url.searchParams.set('token',       emailData.token_hash ?? '');
  url.searchParams.set('type',        type);
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { subject: string; html: string }> = {
  signup:               { subject: 'Confirme seu email \u2014 Charlotte',      html: confirmSignup },
  recovery:             { subject: 'Redefini\u00e7\u00e3o de senha \u2014 Charlotte', html: resetPassword },
  magiclink:            { subject: 'Seu link de acesso \u2014 Charlotte',      html: magicLink },
  email_change_new:     { subject: 'Confirme seu novo email \u2014 Charlotte', html: emailChange },
  email_change_current: { subject: 'Confirme seu novo email \u2014 Charlotte', html: emailChange },
};

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const valid = await verifyStandardWebhook(rawBody, req.headers, HEX_SECRET);
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { user?: { email?: string }; email_data?: Record<string, string> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const to         = body.user?.email ?? '';
  const emailData  = body.email_data ?? {};
  const actionType = emailData.email_action_type ?? '';

  if (!to || !actionType) {
    return NextResponse.json({ error: 'Missing email or action type' }, { status: 400 });
  }

  const tmpl = TEMPLATES[actionType];
  if (!tmpl) {
    // Tipo nao mapeado — retornar 200 para Supabase nao bloquear o fluxo
    console.warn('[send-email hook] Unmapped action type:', actionType);
    return NextResponse.json({});
  }

  const confirmationUrl = buildConfirmationUrl(emailData);
  const html = tmpl.html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, confirmationUrl);

  const ok = await sendEmail({ to, subject: tmpl.subject, html });
  if (!ok) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({});
}
