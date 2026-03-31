import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import {
  CaretLeft,
  CaretRight,
  User,
  Lock,
  Key,
  DeviceMobile,
  GraduationCap,
  SignOut,
  ShieldCheck,
  CheckCircle,
  Bell,
  Clock,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';

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

const REMINDER_KEY = 'push_reminder_hour';
const REMINDER_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22];

async function scheduleOrCancelDailyReminder(hour: number | null) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour === null) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de praticar!',
      body: 'Que tal conversar com a Charlotte hoje?',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

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
  const { profile, signOut } = useAuth();
  const userId = profile?.id;
  const [reminderHour, setReminderHour] = React.useState<number | null>(null);

  React.useEffect(() => {
    SecureStore.getItemAsync(REMINDER_KEY)
      .then(val => { if (val !== null) setReminderHour(parseInt(val, 10)); })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair', style: 'destructive',
          onPress: () => { signOut().catch(console.error); },
        },
      ]
    );
  };

  const handleReminderPress = () => {
    const buttons = [
      ...REMINDER_OPTIONS.map(h => ({
        text: `${h.toString().padStart(2, '0')}:00`,
        onPress: async () => {
          setReminderHour(h);
          await SecureStore.setItemAsync(REMINDER_KEY, String(h));
          await scheduleOrCancelDailyReminder(h);
          if (userId) {
            supabase.from('users')
              .update({ preferred_reminder_time: `${String(h).padStart(2, '0')}:00:00` })
              .eq('id', userId).then(() => {}).catch(() => {});
          }
        },
      })),
      {
        text: 'Desativar', style: 'destructive' as const,
        onPress: async () => {
          setReminderHour(null);
          await SecureStore.deleteItemAsync(REMINDER_KEY).catch(() => {});
          await scheduleOrCancelDailyReminder(null);
          if (userId) {
            supabase.from('users')
              .update({ preferred_reminder_time: null })
              .eq('id', userId).then(() => {}).catch(() => {});
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' as const },
    ];
    Alert.alert('Lembrete diário', 'Escolha o horário do seu lembrete:', buttons);
  };

  const userLevel          = profile?.user_level ?? '—';
  const subscriptionStatus = profile?.subscription_status ?? 'none';
  const isActive           = profile?.is_active;
  const isInstitutional    = !!profile?.lms_role;

  const accessLabel = (() => {
    if (!isActive)                             return { text: 'Inativa',       color: C.error };
    if (isInstitutional)                       return { text: 'Institucional', color: C.greenDark };
    if (subscriptionStatus === 'active')       return { text: 'Ativa',         color: C.greenDark };
    if (subscriptionStatus === 'trial')        return { text: 'Trial',         color: '#1D4ED8' };
    if (subscriptionStatus === 'expired')      return { text: 'Expirada',      color: C.error };
    return                                            { text: 'Sem acesso',    color: C.error };
  })();

  const reminderLabel = reminderHour !== null
    ? `${reminderHour.toString().padStart(2, '0')}:00`
    : 'Desativado';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>

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
        <AppText style={{ fontSize: 17, fontWeight: '700', color: C.navy }}>Configurações</AppText>
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

        {/* Conta */}
        <SectionTitle label="Conta" />
        <SettingRow
          icon={<ShieldCheck size={18} color={C.greenDark} weight="duotone" />}
          label="Nível"
          value={userLevel}
        />
        <SettingRow
          icon={<CheckCircle size={18} color={accessLabel.color} weight="duotone" />}
          label="Acesso"
          value={accessLabel.text}
          valueColor={accessLabel.color}
        />
        <SettingRow
          icon={<Key size={18} color={C.navyMid} weight="duotone" />}
          label="Alterar senha"
          onPress={() => router.push('/(app)/change-password')}
          chevron
        />

        {/* Notificações */}
        <SectionTitle label="Notificações" />
        <SettingRow
          icon={<Clock size={18} color={C.navyMid} weight="duotone" />}
          label="Lembrete diário"
          value={reminderLabel}
          onPress={handleReminderPress}
          chevron
        />

        {/* Sobre */}
        <SectionTitle label="Sobre" />
        <SettingRow
          icon={<DeviceMobile size={18} color={C.navyMid} weight="duotone" />}
          label="Charlotte"
          value="v1.0.0"
        />
        <SettingRow
          icon={<GraduationCap size={18} color={C.navyMid} weight="duotone" />}
          label="Hub Academy"
        />

        {/* Sessão */}
        <SectionTitle label="Sessão" />
        <SettingRow
          icon={<SignOut size={18} color={C.error} weight="duotone" />}
          label="Sair da conta"
          onPress={handleSignOut}
          destructive
          chevron
        />
      </ScrollView>
    </SafeAreaView>
  );
}
