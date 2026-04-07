/**
 * app/api/webhooks/revenuecat/route.ts
 * RevenueCat webhook — keeps charlotte_users.subscription_status in sync
 * whenever a subscription event occurs (purchase, renewal, cancellation, etc.)
 *
 * Setup in RevenueCat Dashboard:
 *   Project Settings → Integrations → Webhooks
 *   URL: https://charlotte-pwa-02-final.vercel.app/api/webhooks/revenuecat
 *   Authorization header: set a secret and add it to REVENUECAT_WEBHOOK_SECRET env var
 *
 * Docs: https://www.revenuecat.com/docs/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role for server-side writes
);

const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET ?? '';

// RevenueCat event types that affect subscription status
const ACTIVE_EVENTS   = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
const EXPIRED_EVENTS  = new Set(['EXPIRATION', 'CANCELLATION', 'BILLING_ISSUE']);
const TRIAL_EVENTS    = new Set(['TRIAL_STARTED']);
const TRIAL_CONVERTED = new Set(['TRIAL_CONVERTED']);

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event     = body?.event;
  const eventType = event?.type as string | undefined;
  const appUserId = event?.app_user_id as string | undefined; // = Supabase user ID

  if (!eventType || !appUserId) {
    return NextResponse.json({ error: 'Missing event type or app_user_id' }, { status: 400 });
  }

  console.log(`[RC webhook] ${eventType} for user ${appUserId}`);

  // ── Map event → subscription_status ──────────────────────────────────────
  let subscriptionStatus: string | null = null;
  let isActive: boolean | null          = null;

  if (ACTIVE_EVENTS.has(eventType) || TRIAL_CONVERTED.has(eventType)) {
    subscriptionStatus = 'active';
    isActive           = true;
  } else if (TRIAL_EVENTS.has(eventType)) {
    subscriptionStatus = 'trial';
    isActive           = true;
  } else if (EXPIRED_EVENTS.has(eventType)) {
    subscriptionStatus = 'expired';
    isActive           = false;
  } else {
    // Unhandled event type — acknowledge but don't update
    return NextResponse.json({ received: true, action: 'ignored', eventType });
  }

  // ── Update Supabase ───────────────────────────────────────────────────────
  const { error } = await supabase
    .from('charlotte_users')
    .update({
      subscription_status: subscriptionStatus,
      is_active:           isActive,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', appUserId);

  if (error) {
    console.error('[RC webhook] Supabase update error:', error.message);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  console.log(`[RC webhook] Updated user ${appUserId} → ${subscriptionStatus}`);
  return NextResponse.json({ received: true, eventType, subscriptionStatus });
}
