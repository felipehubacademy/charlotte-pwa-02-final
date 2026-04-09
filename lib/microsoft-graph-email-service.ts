// lib/microsoft-graph-email-service.ts
// Envia emails via Microsoft Graph API usando client credentials (server-to-server).
// Remetente: charlotte@hubacademybr.com (alias de hub@hubacademybr.com)

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const FROM_EMAIL    = 'charlotte@hubacademybr.com';
const FROM_NAME     = 'Charlotte';

// ── Token cache (in-memory, valido por ~1h) ───────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope:         'https://graph.microsoft.com/.default',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph token error: ${res.status} — ${err}`);
  }

  const json = await res.json();
  cachedToken    = json.access_token;
  tokenExpiresAt = Date.now() + json.expires_in * 1000;
  return cachedToken!;
}

// ── Send ──────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  try {
    const token = await getAccessToken();

    const payload = {
      message: {
        subject: opts.subject,
        body: {
          contentType: 'HTML',
          content: opts.html,
        },
        toRecipients: [
          { emailAddress: { address: opts.to } },
        ],
        from: {
          emailAddress: { address: FROM_EMAIL, name: FROM_NAME },
        },
      },
      saveToSentItems: false,
    };

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${FROM_EMAIL}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[Graph] sendMail error:', res.status, err);
      return false;
    }

    console.log(`[Graph] Email enviado para ${opts.to} — "${opts.subject}"`);
    return true;
  } catch (e) {
    console.error('[Graph] sendEmail exception:', e);
    return false;
  }
}
