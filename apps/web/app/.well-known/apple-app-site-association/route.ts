// app/.well-known/apple-app-site-association/route.ts
//
// Serve o arquivo AASA (Apple App Site Association) com Content-Type correto.
// Necessario para Universal Links funcionar no iOS.
//
// ACAO NECESSARIA antes de buildar:
//   Substitua APPLE_TEAM_ID pelo seu Team ID de 10 caracteres.
//   Encontre em: https://developer.apple.com/account/#/membership
//   Exemplo: "A1B2C3D4E5"
//
// Apos adicionar o Team ID e fazer o build com associatedDomains:
//   npx eas build --platform ios --profile testflight
//
// Verificar se esta funcionando:
//   curl -s https://charlotte.hubacademybr.com/.well-known/apple-app-site-association
//   https://branch.io/resources/aasa-validator/ (cole o dominio para validar)

import { NextResponse } from 'next/server';

const TEAM_ID        = 'S3BGJ3648D';
const BUNDLE_ID      = 'com.hubacademy.charlotte';
const APP_ID         = `${TEAM_ID}.${BUNDLE_ID}`;

// Paths que o iOS vai interceptar e abrir no app em vez do browser.
// Inclui /open (confirmacao de email e convite) e /auth/* (callbacks).
const UNIVERSAL_LINK_PATHS = [
  '/open',
  '/open/*',
  '/auth/confirm',
  '/auth/confirm/*',
  '/invite',
  '/invite/*',
];

const aasa = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: UNIVERSAL_LINK_PATHS.map(path => ({ '/': path, comment: 'Charlotte AI' })),
      },
    ],
  },
  // Suporte a Shared Web Credentials (opcional — para autofill de senhas)
  webcredentials: {
    apps: [APP_ID],
  },
};

export async function GET() {
  return new NextResponse(JSON.stringify(aasa, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
