/**
 * lib/purchases.ts
 * RevenueCat integration layer.
 *
 * Responsabilidades:
 *  1. Inicializar o SDK com a API key correta por plataforma
 *  2. Identificar o usuário (login/logout)
 *  3. Buscar offerings (planos disponíveis)
 *  4. Comprar / restaurar compras
 *  5. Verificar entitlement "premium" localmente
 *  6. Sincronizar status com Supabase após compra/restauração
 *
 * Product IDs (configurados no App Store Connect + RevenueCat):
 *   com.hubacademy.charlotte.monthly  — R$ 29,90/mês  (7-day trial)
 *   com.hubacademy.charlotte.yearly   — R$ 199,90/ano (7-day trial)
 *
 * Entitlement ID: "premium"
 * Offering ID:    "default"
 */

import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// ── API Keys ──────────────────────────────────────────────────────────────────
// Replace REVENUECAT_IOS_KEY and REVENUECAT_ANDROID_KEY with your actual keys
// from RevenueCat Dashboard → Project Settings → API Keys → Public app-specific keys
const RC_IOS_KEY     = 'appl_ZfuDMNvBXEVXSjWSAErBuihcPv';
const RC_ANDROID_KEY = 'goog_hIkklVeoKyULqjSKpqojZUiZwVg';

export const ENTITLEMENT_ID = 'premium';
export const PRODUCT_MONTHLY = 'com.hubacademy.charlotte.monthly';
export const PRODUCT_YEARLY  = 'com.hubacademy.charlotte.yearly';

// ── Init ──────────────────────────────────────────────────────────────────────
export function initPurchases() {
  const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
}

// ── Identify user ─────────────────────────────────────────────────────────────
export async function identifyUser(userId: string) {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[purchases] identifyUser error:', e);
  }
}

export async function resetUser() {
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('[purchases] resetUser error:', e);
  }
}

// ── Fetch current offering ────────────────────────────────────────────────────
export interface OfferingResult {
  offering: PurchasesOffering | null;
  errorMessage?: string;
  diagnostics?: string;
}

export async function getOfferingDetailed(): Promise<OfferingResult> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (current && current.availablePackages.length > 0) {
      return { offering: current };
    }

    // Sem offering atual OU offering existe mas sem pacotes disponíveis
    const allOfferings = Object.keys(offerings.all);
    const diag = [
      `Platform: ${Platform.OS}`,
      `offerings.current: ${current ? current.identifier : 'null'}`,
      `offerings.all keys: [${allOfferings.join(', ')}]`,
      `current.packages: ${current?.availablePackages.length ?? 0}`,
    ].join(' | ');

    console.warn('[purchases] no current offering or no packages:', diag);

    return {
      offering: null,
      errorMessage: current
        ? 'Os produtos deste app ainda não estão prontos. Isso pode acontecer se os IAPs ainda não foram aprovados pela Apple ou se o Paid Apps Agreement não está ativo.'
        : 'Nenhuma oferta de plano disponível. Verifique se o RevenueCat está conectado ao App Store Connect.',
      diagnostics: diag,
    };
  } catch (e: any) {
    const raw = e?.message ?? e?.code ?? String(e);
    console.warn('[purchases] getOffering error:', e);
    return {
      offering: null,
      errorMessage: `Erro ao buscar planos: ${raw}`,
      diagnostics: raw,
    };
  }
}

// Legacy wrapper — mantém compatibilidade com callers existentes
export async function getOffering(): Promise<PurchasesOffering | null> {
  const r = await getOfferingDetailed();
  return r.offering;
}

// ── Check entitlement ─────────────────────────────────────────────────────────
export async function checkPremiumAccess(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch (e) {
    console.warn('[purchases] checkPremiumAccess error:', e);
    return false;
  }
}

// ── Purchase a package ────────────────────────────────────────────────────────
export async function purchasePackage(
  pkg: import('react-native-purchases').PurchasesPackage,
): Promise<{ success: boolean; customerInfo?: CustomerInfo; cancelled?: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    console.warn('[purchases] purchasePackage error:', e);
    return { success: false };
  }
}

// ── Restore purchases ─────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const info = await Purchases.restorePurchases();
    return info;
  } catch (e) {
    console.warn('[purchases] restorePurchases error:', e);
    return null;
  }
}

// ── Sync to Supabase ──────────────────────────────────────────────────────────
// Called after purchase or restore — keeps our DB in sync with RevenueCat.
// RevenueCat webhook also does this server-side, but this is the client-side
// immediate update so the user doesn't have to wait for the webhook.
export async function syncSubscriptionToSupabase(
  userId: string,
  customerInfo: CustomerInfo,
) {
  const hasPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];

  const update: Record<string, unknown> = {
    subscription_status: hasPremium ? 'active' : 'expired',
    is_active: hasPremium,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('charlotte_users')
    .update(update)
    .eq('id', userId);

  if (error) console.warn('[purchases] syncSubscriptionToSupabase error:', error.message);
}
