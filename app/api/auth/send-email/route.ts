// app/api/auth/send-email/route.ts
// Supabase "Send Email" Auth Hook — substitui o envio nativo do Supabase.
// Configurar em: Supabase Dashboard -> Authentication -> Hooks -> Send Email
// URL: https://charlotte-pwa-02-final.vercel.app/api/auth/send-email
// Secret: SUPABASE_HOOK_SECRET (env var)

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import {
  confirmSignup,
  resetPassword,
  magicLink,
  emailChange,
} from '@/lib/supabase-email-templates';

const HOOK_SECRET  = process.env.SUPABASE_HOOK_SECRET ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charlotte.hubacademybr.com';

// Mapeia email_action_type -> type param na URL de verificacao do Supabase
const ACTION_TYPE_MAP: Record<string, string> = {
  signup:               'signup',
  recovery:             'recovery',
  magiclink:            'magiclink',
  email_change_new:     'email_change',
  email_change_current: 'email_change',
  invite:               'invite',
  reauthentication:     'reauthentication',
};

function buildConfirmationUrl(emailData: {
  token_hash:        string;
  email_action_type: string;
  redirect_to?:      string;
  site_url?:         string;
}): string {
  const base        = emailData.site_url || SUPABASE_URL;
  const type        = ACTION_TYPE_MAP[emailData.email_action_type] ?? emailData.email_action_type;
  const redirectTo  = emailData.redirect_to || APP_URL;
  const url         = new URL(`${base}/auth/v1/verify`);
  url.searchParams.set('token',       emailData.token_hash);
  url.searchParams.set('type',        type);
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

// Templates prontos — substituir {{ .ConfirmationURL }} pelo link real
const TEMPLATES: Record<string, { subject: string; html: string }> = {
  signup: {
    subject: 'Confirme seu email \u2014 Charlotte',
    html:    confirmSignup,
  },
  recovery: {
    subject: 'Redefini\u00e7\u00e3o de senha \u2014 Charlotte',
    html:    resetPassword,
  },
  magiclink: {
    subject: 'Seu link de acesso \u2014 Charlotte',
    html:    magicLink,
  },
  email_change_new: {
    subject: 'Confirme seu novo email \u2014 Charlotte',
    html:    emailChange,
  },
  email_change_current: {
    subject: 'Confirme seu novo email \u2014 Charlotte',
    html:    emailChange,
  },
};

export async function POST(req: NextRequest) {
  // Verificar secret do hook
  const authHeader = req.headers.get('authorization') ?? '';
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!HOOK_SECRET || token !== HOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { user?: { email?: string }; email_data?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const to         = body.user?.email ?? '';
  const emailData  = body.email_data ?? {};
  const actionType = emailData.email_action_type ?? '';

  if (!to || !actionType) {
    return NextResponse.json({ error: 'Missing user email or action type' }, { status: 400 });
  }

  const tmpl = TEMPLATES[actionType];
  if (!tmpl) {
    // Tipo desconhecido — deixar o Supabase usar o fallback (retornar 2xx sem enviar)
    console.warn('[send-email hook] Unknown action type:', actionType);
    return NextResponse.json({});
  }

  const confirmationUrl = buildConfirmationUrl({
    token_hash:        emailData.token_hash        ?? '',
    email_action_type: actionType,
    redirect_to:       emailData.redirect_to,
    site_url:          emailData.site_url,
  });

  const html = tmpl.html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, confirmationUrl);

  const ok = await sendEmail({ to, subject: tmpl.subject, html });
  if (!ok) {
    // Retornar 500 faz o Supabase retentar ou usar fallback
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({});
}
