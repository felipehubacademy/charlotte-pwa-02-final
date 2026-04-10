// app/api/auth/send-email/route.ts
// Supabase "Send Email" Auth Hook — substitui o envio nativo do Supabase.
// Configurar em: Supabase Dashboard -> Authentication -> Hooks -> Send Email
// URL:    https://charlotte-pwa-02-final.vercel.app/api/auth/send-email
// Secret: v1,whsec_<base64>  (mesma string do Supabase dashboard)

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import {
  confirmSignup,
  resetPassword,
  magicLink,
  emailChange,
} from '@/lib/supabase-email-templates';

const HOOK_SECRET  = process.env.SUPABASE_HOOK_SECRET ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Default redirect: deep link opens the mobile app after email verification.
// The scheme 'charlotte://' is registered in app.config.ts (scheme: 'charlotte').
const DEFAULT_REDIRECT = 'charlotte://auth/callback';

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
  const redirectTo = emailData.redirect_to || DEFAULT_REDIRECT;
  const url        = new URL(`${base}/auth/v1/verify`);
  url.searchParams.set('token',       emailData.token_hash ?? '');
  url.searchParams.set('type',        type);
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { subject: string; html: string }> = {
  signup:               { subject: 'Confirme seu email \u2014 Charlotte',            html: confirmSignup  },
  recovery:             { subject: 'Redefini\u00e7\u00e3o de senha \u2014 Charlotte', html: resetPassword  },
  magiclink:            { subject: 'Seu link de acesso \u2014 Charlotte',            html: magicLink      },
  email_change_new:     { subject: 'Confirme seu novo email \u2014 Charlotte',       html: emailChange    },
  email_change_current: { subject: 'Confirme seu novo email \u2014 Charlotte',       html: emailChange    },
};

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verificar assinatura Standard Webhooks
  // standardwebhooks so reconhece o prefixo "whsec_", nao "v1,whsec_"
  const whSecret = HOOK_SECRET.startsWith('v1,') ? HOOK_SECRET.slice(3) : HOOK_SECRET;
  try {
    const wh = new Webhook(whSecret);
    wh.verify(rawBody, {
      'webhook-id':        req.headers.get('webhook-id')        ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? '',
    });
  } catch (err) {
    console.error('[send-email hook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { user?: { email?: string }; email_data?: Record<string, string> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const to         = body.user?.email ?? '';
  const emailData  = body.email_data  ?? {};
  const actionType = emailData.email_action_type ?? '';

  if (!to || !actionType) {
    return NextResponse.json({ error: 'Missing email or action type' }, { status: 400 });
  }

  const tmpl = TEMPLATES[actionType];
  if (!tmpl) {
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
