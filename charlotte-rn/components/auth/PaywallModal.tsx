/**
 * components/auth/PaywallModal.tsx
 * Full-screen paywall shown when the user has no active subscription.
 * Replaces the old TrialExpiredModal (WhatsApp redirect) with a real
 * in-app purchase flow via RevenueCat.
 *
 * Layout:
 *  • Dark navy background (#07071C)
 *  • Charlotte avatar + headline
 *  • Feature highlights (3 bullets)
 *  • Annual card (highlighted — best value)
 *  • Monthly card
 *  • CTA button → purchase selected plan
 *  • "Restore purchases" link
 *  • "Sign out" ghost link
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, TouchableOpacity, ActivityIndicator,
  ScrollView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, SignOut, ArrowsClockwise } from 'phosphor-react-native';
import { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import {
  getOffering,
  purchasePackage,
  restorePurchases,
  syncSubscriptionToSupabase,
  PRODUCT_YEARLY,
} from '@/lib/purchases';

const C = {
  bg:         '#F4F3FA',
  card:       '#FFFFFF',
  cardBorder: 'rgba(22,21,58,0.10)',
  green:      '#A3FF3C',
  greenDark:  '#3D8800',
  navy:       '#16153A',
  navyMid:    '#4B4A72',
  white:      '#FFFFFF',
  muted:      '#9896B8',
  highlight:  'rgba(163,255,60,0.12)',
  selected:   'rgba(163,255,60,0.08)',
};

const FEATURES = [
  { pt: 'Mini-aulas narradas por Charlotte',        en: 'Mini-lessons narrated by Charlotte' },
  { pt: 'Exercícios de gramática e pronúncia',      en: 'Grammar & pronunciation exercises' },
  { pt: 'Chat e chamadas em voz com IA',            en: 'AI chat & live voice calls' },
];

export function PaywallModal() {
  const { profile, hasAccess, signOut, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const isPt   = (profile?.charlotte_level ?? 'Novice') === 'Novice';

  const visible = !!profile && !hasAccess;

  const [offering, setOffering]       = useState<PurchasesOffering | null>(null);
  const [selected, setSelected]       = useState<string>(PRODUCT_YEARLY);
  const [loading, setLoading]         = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoadingOffer(true);
    getOffering().then(o => {
      setOffering(o);
      setLoadingOffer(false);
    });
  }, [visible]);

  const selectedPkg = useCallback((): PurchasesPackage | null => {
    if (!offering) return null;
    return offering.availablePackages.find(
      p => p.product.identifier === selected
    ) ?? offering.availablePackages[0] ?? null;
  }, [offering, selected]);

  const handlePurchase = async () => {
    const pkg = selectedPkg();
    if (!pkg) return;
    setLoading(true);
    const result = await purchasePackage(pkg);
    setLoading(false);

    if (result.cancelled) return;

    if (result.success && result.customerInfo && profile?.id) {
      await syncSubscriptionToSupabase(profile.id, result.customerInfo);
      await refreshProfile();
    } else if (!result.success) {
      Alert.alert(
        isPt ? 'Erro na compra' : 'Purchase failed',
        isPt ? 'Não foi possível processar o pagamento. Tente novamente.' : 'Could not process payment. Please try again.',
      );
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const info = await restorePurchases();
    setLoading(false);

    if (info && profile?.id) {
      await syncSubscriptionToSupabase(profile.id, info);
      await refreshProfile();
      const hasPremium = !!info.entitlements.active['premium'];
      if (!hasPremium) {
        Alert.alert(
          isPt ? 'Nenhuma compra encontrada' : 'No purchases found',
          isPt ? 'Não encontramos uma assinatura ativa para esta conta.' : 'No active subscription found for this account.',
        );
      }
    }
  };

  // ── Package display helpers ───────────────────────────────────────────────
  const monthlyPkg = offering?.availablePackages.find(
    p => p.product.identifier.includes('monthly')
  );
  const yearlyPkg = offering?.availablePackages.find(
    p => p.product.identifier.includes('yearly')
  );

  const monthlyPrice = monthlyPkg?.product.priceString ?? 'R$ 29,90';
  const yearlyPrice  = yearlyPkg?.product.priceString  ?? 'R$ 199,90';

  // Monthly equivalent of yearly plan (divide by 12)
  const yearlyMonthly = yearlyPkg
    ? `${yearlyPkg.product.currencyCode} ${(yearlyPkg.product.price / 12).toFixed(2).replace('.', ',')}`
    : 'R$ 16,66';

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Badge ── */}
          <View style={{
            backgroundColor: C.highlight,
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(61,136,0,0.20)',
            paddingHorizontal: 14, paddingVertical: 5, marginBottom: 28,
          }}>
            <AppText style={{ color: C.greenDark, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
              {isPt ? '7 DIAS GRÁTIS' : '7-DAY FREE TRIAL'}
            </AppText>
          </View>

          {/* ── Headline ── */}
          <AppText style={{ fontSize: 26, fontWeight: '800', color: C.navy, textAlign: 'center', marginBottom: 10, lineHeight: 34 }}>
            {isPt ? 'Aprenda inglês com\nCharlotte AI' : 'Learn English with\nCharlotte AI'}
          </AppText>
          <AppText style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
            {isPt
              ? 'Comece hoje. Cancele quando quiser.'
              : 'Start today. Cancel anytime.'}
          </AppText>

          {/* ── Feature bullets ── */}
          <View style={{ alignSelf: 'stretch', gap: 12, marginBottom: 32 }}>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} color={C.greenDark} weight="fill" />
                <AppText style={{ color: C.navyMid, fontSize: 14, flex: 1 }}>
                  {isPt ? f.pt : f.en}
                </AppText>
              </View>
            ))}
          </View>

          {/* ── Plan cards ── */}
          {loadingOffer ? (
            <ActivityIndicator color={C.greenDark} style={{ marginVertical: 24 }} />
          ) : (
            <View style={{ alignSelf: 'stretch', gap: 12, marginBottom: 28 }}>

              {/* Annual — highlighted */}
              <TouchableOpacity
                onPress={() => setSelected(yearlyPkg?.product.identifier ?? PRODUCT_YEARLY)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: selected.includes('yearly') ? C.highlight : C.card,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selected.includes('yearly') ? C.greenDark : C.cardBorder,
                  padding: 18,
                  shadowColor: 'rgba(22,21,58,0.08)',
                  shadowOpacity: 1, shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                {/* Best value badge */}
                <View style={{
                  position: 'absolute', top: -10, right: 16,
                  backgroundColor: C.greenDark, borderRadius: 10,
                  paddingHorizontal: 10, paddingVertical: 3,
                }}>
                  <AppText style={{ color: C.white, fontSize: 11, fontWeight: '800' }}>
                    {isPt ? 'MELHOR VALOR' : 'BEST VALUE'}
                  </AppText>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <AppText style={{ color: C.navy, fontSize: 15, fontWeight: '700' }}>
                      {isPt ? 'Anual' : 'Annual'}
                    </AppText>
                    <AppText style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                      {yearlyMonthly}/{isPt ? 'mês' : 'mo'}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText style={{ color: C.greenDark, fontSize: 20, fontWeight: '800' }}>
                      {yearlyPrice}
                    </AppText>
                    <AppText style={{ color: C.muted, fontSize: 11 }}>
                      /{isPt ? 'ano' : 'year'}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                onPress={() => setSelected(monthlyPkg?.product.identifier ?? 'com.hubacademy.charlotte.monthly')}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.card,
                  borderRadius: 16,
                  borderWidth: selected.includes('monthly') ? 2 : 1,
                  borderColor: selected.includes('monthly') ? C.greenDark : C.cardBorder,
                  padding: 18,
                  shadowColor: 'rgba(22,21,58,0.06)',
                  shadowOpacity: 1, shadowRadius: 6,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText style={{ color: C.navy, fontSize: 15, fontWeight: '700' }}>
                    {isPt ? 'Mensal' : 'Monthly'}
                  </AppText>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText style={{ color: C.navy, fontSize: 20, fontWeight: '800' }}>
                      {monthlyPrice}
                    </AppText>
                    <AppText style={{ color: C.muted, fontSize: 11 }}>
                      /{isPt ? 'mês' : 'mo'}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>

            </View>
          )}

          {/* ── CTA Button ── */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading || loadingOffer}
            activeOpacity={0.85}
            style={{
              alignSelf: 'stretch',
              backgroundColor: C.green,
              borderRadius: 16,
              paddingVertical: 17,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              opacity: loading || loadingOffer ? 0.6 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color={C.navy} />
              : (
                <AppText style={{ color: C.navy, fontSize: 16, fontWeight: '800' }}>
                  {isPt ? 'Começar 7 dias grátis' : 'Start 7-day free trial'}
                </AppText>
              )
            }
          </TouchableOpacity>

          <AppText style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginBottom: 24, lineHeight: 16 }}>
            {isPt
              ? 'Cancele antes do período de teste terminar e não será cobrado. Renovação automática.'
              : 'Cancel before trial ends and you won\'t be charged. Auto-renews.'}
          </AppText>

          {/* ── Restore ── */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 4 }}
          >
            <ArrowsClockwise size={14} color={C.muted} />
            <AppText style={{ color: C.muted, fontSize: 13 }}>
              {isPt ? 'Restaurar compras' : 'Restore purchases'}
            </AppText>
          </TouchableOpacity>

          {/* ── Sign out ── */}
          <TouchableOpacity
            onPress={signOut}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
          >
            <SignOut size={14} color={C.muted} />
            <AppText style={{ color: C.muted, fontSize: 13 }}>
              {isPt ? 'Sair da conta' : 'Sign out'}
            </AppText>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </Modal>
  );
}
