import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CaretLeft,
  CaretRight,
  User,
  CheckCircle,
  Lock,
  Key,
  DeviceMobile,
  GraduationCap,
  SignOut,
  ShieldCheck,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

function SettingRow({ icon, label, value, onPress, destructive = false, chevron }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: '#1A1939',
        borderRadius: 14,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: destructive ? 'rgba(248,113,113,0.12)' : 'rgba(163,255,60,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </View>
        <AppText style={{ fontSize: 14, fontWeight: '500', color: destructive ? '#f87171' : '#fff' }}>
          {label}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {!!value && (
          <AppText style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
            {value}
          </AppText>
        )}
        {(chevron || (!!onPress && !value)) && (
          <CaretRight size={15} color="rgba(255,255,255,0.25)" weight="bold" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <AppText style={{
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.35)',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    }}>
      {label}
    </AppText>
  );
}

export default function ConfiguracoesScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const userLevel       = profile?.user_level ?? '—';
  const isActive        = profile?.is_active;
  const subscriptionStatus = profile?.subscription_status ?? 'none';
  const isInstitutional = !!profile?.lms_role;

  // Label e cor do status de acesso
  const accessLabel = (() => {
    if (!isActive) return { text: 'Inativa', color: '#f87171' };
    if (isInstitutional) return { text: 'Institucional', color: '#A3FF3C' };
    if (subscriptionStatus === 'active')  return { text: 'Ativa', color: '#A3FF3C' };
    if (subscriptionStatus === 'trial')   return { text: 'Trial', color: '#60A5FA' };
    if (subscriptionStatus === 'expired') return { text: 'Expirada', color: '#f87171' };
    return { text: 'Sem acesso', color: '#f87171' };
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={{
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, borderRadius: 20, marginRight: 4 }}
          accessibilityLabel="Voltar"
        >
          <CaretLeft size={22} color="rgba(255,255,255,0.8)" weight="bold" />
        </TouchableOpacity>
        <AppText style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Configurações</AppText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de usuário */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1A1939',
          borderRadius: 16,
          padding: 16,
          marginTop: 16,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: 'rgba(163,255,60,0.12)',
          gap: 14,
        }}>
          <View style={{
            width: 50, height: 50, borderRadius: 25,
            backgroundColor: 'rgba(163,255,60,0.1)',
            borderWidth: 2, borderColor: '#A3FF3C',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={24} color="#A3FF3C" weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              {profile?.name ?? profile?.email?.split('@')[0] ?? '—'}
            </AppText>
            <AppText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {profile?.email ?? ''}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={{ backgroundColor: '#A3FF3C', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
              <AppText style={{ color: '#000', fontWeight: '700', fontSize: 11 }}>{userLevel}</AppText>
            </View>
            <View style={{ backgroundColor: `${accessLabel.color}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText style={{ color: accessLabel.color, fontWeight: '600', fontSize: 10 }}>{accessLabel.text}</AppText>
            </View>
          </View>
        </View>

        {/* Conta */}
        <SectionTitle label="Conta" />
        <SettingRow
          icon={<ShieldCheck size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Nível"
          value={userLevel}
        />
        <SettingRow
          icon={<Key size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Alterar senha"
          onPress={() => router.push('/(auth)/forgot-password')}
          chevron
        />

        {/* Sobre */}
        <SectionTitle label="Sobre" />
        <SettingRow
          icon={<DeviceMobile size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Charlotte"
          value="v1.0.0"
        />
        <SettingRow
          icon={<GraduationCap size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Hub Academy"
        />

        {/* Sessão */}
        <SectionTitle label="Sessão" />
        <SettingRow
          icon={<SignOut size={18} color="#f87171" weight="duotone" />}
          label="Sair da conta"
          onPress={handleSignOut}
          destructive
          chevron
        />
      </ScrollView>
    </SafeAreaView>
  );
}
