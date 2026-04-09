// app/api/test-microsoft-graph-email/route.ts
// Envia todos os templates de email para teste. Protegido por ADMIN_SECRET.
// POST { "to": "email@exemplo.com", "type": "all" | "invite" | "welcome" | "reset" | "trial" | "expired" }

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import {
  inviteTemplate,
  welcomeSubscriberTemplate,
  resetPasswordTemplate,
  trialExpiringTemplate,
  subscriptionExpiredTemplate,
} from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? '';
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to, type = 'all' } = await req.json();
  if (!to) return NextResponse.json({ error: 'to is required' }, { status: 400 });

  const templates = {
    invite:  inviteTemplate({ name: 'Felipe', email: to, tempPassword: 'Teste@1234' }),
    welcome: welcomeSubscriberTemplate({ name: 'Felipe', level: 'Intermediate', trialEndsAt: '16 de abril de 2026' }),
    reset:   resetPasswordTemplate({ name: 'Felipe', resetUrl: 'https://charlotte.hubacademybr.com/reset-password?token=exemplo' }),
    trial:   trialExpiringTemplate({ name: 'Felipe', expiresAt: '16 de abril de 2026' }),
    expired: subscriptionExpiredTemplate({ name: 'Felipe' }),
  };

  const toSend = type === 'all'
    ? Object.entries(templates)
    : [[type, templates[type as keyof typeof templates]]].filter(([, t]) => t);

  const results: Record<string, boolean> = {};

  for (const [name, tmpl] of toSend) {
    const t = tmpl as { subject: string; html: string };
    results[name] = await sendEmail({ to, subject: t.subject, html: t.html });
    // Pequeno delay para nao sobrecarregar o Graph
    await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({ success: true, results });
}
