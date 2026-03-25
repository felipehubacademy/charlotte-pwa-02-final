import { NextResponse } from 'next/server';

// Este endpoint foi removido — grupos Azure AD não são mais utilizados.
// A autenticação é feita inteiramente via Supabase Auth.

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint removido. Sistema migrado para Supabase Auth.' },
    { status: 410 }
  );
}
