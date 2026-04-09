// app/api/test-microsoft-graph-email/route.ts
// Testa envio via Microsoft Graph. Protegido por ADMIN_SECRET.
// POST { "to": "email@exemplo.com" }

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/microsoft-graph-email-service';
import { inviteTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? '';
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: 'to is required' }, { status: 400 });

  const { subject, html } = inviteTemplate({
    name: 'Felipe',
    email: to,
    tempPassword: 'Teste@1234',
  });

  const ok = await sendEmail({ to, subject, html });
  if (!ok) return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 });

  return NextResponse.json({ success: true, to, subject });
}
