import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CaretLeft,
  CaretRight,
  User,
  Key,
  DeviceMobile,
  GraduationCap,
  Buildings,
  SignOut,
  ShieldCheck,
  CheckCircle,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Light theme palette
const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.07)',
  green:     '#A3FF3C',
  greenDark: '#3D8800',
  error:     '#DC2626',
  shadow: Platform.select({
    ios: {
      shadowColor: 'rgba(22,21,58,0.08)',
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 3 },
  }),
};


interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

function SettingRow({ icon, label, value, valueColor, onPress, destructive = false, chevron }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 15,
        backgroundColor: C.card,
        borderRadius: 14,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: C.border,
        minHeight: 52,
        ...C.shadow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: destructive ? 'rgba(220,38,38,0.08)' : 'rgba(163,255,60,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </View>
        <AppText style={{ fontSize: 14, fontWeight: '600', color: destructive ? C.error : C.navy }}>
          {label}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {!!value && (
          <AppText style={{ fontSize: 13, color: valueColor ?? C.navyLight, fontWeight: '600' }}>
            {value}
          </AppText>
        )}
        {(chevron || (!!onPress && !value)) && (
          <CaretRight size={15} color={C.navyLight} weight="bold" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <AppText style={{
      fontSize: 11, fontWeight: '700', color: C.navyLight,
      letterSpacing: 0.8, textTransform: 'uppercase',
      marginTop: 22, marginBottom: 8, paddingHorizontal: 4,
    }}>
      {label}
    </AppText>
  );
}

export default function ConfiguracoesScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const isPt = (profile?.charlotte_level ?? 'Novice') === 'Novice';

  const handleRetakePlacementTest = () => {
    Alert.alert(
      isPt ? 'Refazer teste de nível' : 'Retake placement test',
      isPt
        ? 'Isso vai sobrescrever seu nível atual. Deseja continuar?'
        : 'This will override your current level. Continue?',
      [
        { text: isPt ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: isPt ? 'Refazer' : 'Retake',
          onPress: async () => {
            if (!profile?.id) return;
            await supabase
              .from('charlotte_users')
              .update({ placement_test_done: false })
              .eq('id', profile.id);
            await refreshProfile();
            router.push('/(app)/placement-test');
          },
        },
      ]
    );
  };
  const handleSignOut = () => {
    Alert.alert(
      isPt ? 'Sair da conta' : 'Sign out',
      isPt ? 'Tem certeza que deseja sair?' : 'Are you sure you want to sign out?',
      [
        { text: isPt ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: isPt ? 'Sair' : 'Sign out', style: 'destructive',
          onPress: () => { signOut().catch(console.error); },
        },
      ]
    );
  };

  const userLevel          = profile?.charlotte_level ?? '—';
  const subscriptionStatus = profile?.subscription_status ?? 'none';
  const isActive           = profile?.is_active;
  const isInstitutional    = !!profile?.is_institutional;

  const accessLabel = (() => {
    if (!isActive)                             return { text: isPt ? 'Inativa'       : 'Inactive',      color: C.error };
    if (isInstitutional)                       return { text: isPt ? 'Institucional' : 'Institutional', color: C.greenDark };
    if (subscriptionStatus === 'active')       return { text: isPt ? 'Ativa'         : 'Active',        color: C.greenDark };
    if (subscriptionStatus === 'trial')        return { text: 'Trial',                                  color: '#1D4ED8' };
    if (subscriptionStatus === 'expired')      return { text: isPt ? 'Expirada'      : 'Expired',       color: C.error };
    return                                            { text: isPt ? 'Sem acesso'    : 'No access',     color: C.error };
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 10, borderRadius: 20, marginRight: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <CaretLeft size={22} color={C.navy} weight="bold" />
        </TouchableOpacity>
        <AppText style={{ fontSize: 17, fontWeight: '700', color: C.navy }}>{isPt ? 'Configurações' : 'Settings'}</AppText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.card,
          borderRadius: 18,
          padding: 16,
          marginTop: 16,
          marginBottom: 4,
          borderWidth: 1,
          borderColor: 'rgba(163,255,60,0.2)',
          gap: 14,
          ...C.shadow,
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: 'rgba(163,255,60,0.10)',
            borderWidth: 2, borderColor: C.green,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={26} color={C.greenDark} weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ color: C.navy, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              {profile?.name ?? profile?.email?.split('@')[0] ?? '—'}
            </AppText>
            <AppText style={{ color: C.navyLight, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {profile?.email ?? ''}
            </AppText>
          </View>
        </View>

        {/* Account */}
        <SectionTitle label={isPt ? 'Conta' : 'Account'} />
        <SettingRow
          icon={<ShieldCheck size={18} color={C.greenDark} weight="duotone" />}
          label={isPt ? 'Nível' : 'Level'}
          value={userLevel}
        />
        <SettingRow
          icon={<CheckCircle size={18} color={accessLabel.color} weight="duotone" />}
          label={isPt ? 'Acesso' : 'Access'}
          value={accessLabel.text}
          valueColor={accessLabel.color}
        />
        <SettingRow
          icon={<Key size={18} color={C.navyMid} weight="duotone" />}
          label={isPt ? 'Alterar senha' : 'Change password'}
          onPress={() => router.push('/(app)/change-password')}
          chevron
        />
        <SettingRow
          icon={<GraduationCap size={18} color={C.greenDark} weight="duotone" />}
          label={isPt ? 'Refazer teste de nível' : 'Retake placement test'}
          onPress={handleRetakePlacementTest}
          chevron
        />

        {/* About */}
        <SectionTitle label={isPt ? 'Sobre' : 'About'} />
        <SettingRow
          icon={<DeviceMobile size={18} color={C.navyMid} weight="duotone" />}
          label="Charlotte"
          value="v1.0.0"
        />
        <SettingRow
          icon={<Buildings size={18} color={C.navyMid} weight="duotone" />}
          label="Hub Academy"
        />

        {/* Session */}
        <SectionTitle label={isPt ? 'Sessão' : 'Session'} />
        <SettingRow
          icon={<SignOut size={18} color={C.error} weight="duotone" />}
          label={isPt ? 'Sair da conta' : 'Sign out'}
          onPress={handleSignOut}
          destructive
          chevron
        />
      </ScrollView>
    </SafeAreaView>
  );
}
