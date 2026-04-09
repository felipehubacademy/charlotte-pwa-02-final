// app/api/admin/email-templates/route.ts
// Retorna os HTMLs prontos para colar no Supabase Auth Email Templates.
// GET /api/admin/email-templates?secret=xxx

import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_TEMPLATES } from '@/lib/supabase-email-templates';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(SUPABASE_TEMPLATES);
}
