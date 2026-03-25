import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
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

const REMINDER_KEY = 'push_reminder_hour';
const REMINDER_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22];

async function scheduleOrCancelDailyReminder(hour: number | null) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour === null) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Hora de praticar!',
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
      hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
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
        minHeight: 52,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 36,
          height: 36,
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
          <AppText style={{ fontSize: 13, color: valueColor ?? 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
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
  const [reminderHour, setReminderHour] = React.useState<number | null>(null);

  // Load saved reminder hour on mount
  React.useEffect(() => {
    SecureStore.getItemAsync(REMINDER_KEY)
      .then(val => {
        if (val !== null) setReminderHour(parseInt(val, 10));
      })
      .catch(() => {});
  }, []);

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

  const handleReminderPress = () => {
    const optionLabels = REMINDER_OPTIONS.map(h => {
      const label = `${h.toString().padStart(2, '0')}:00`;
      return label;
    });

    const buttons = [
      ...REMINDER_OPTIONS.map((h, i) => ({
        text: optionLabels[i],
        onPress: async () => {
          setReminderHour(h);
          await SecureStore.setItemAsync(REMINDER_KEY, String(h));
          await scheduleOrCancelDailyReminder(h);
        },
      })),
      {
        text: 'Desativar',
        style: 'destructive' as const,
        onPress: async () => {
          setReminderHour(null);
          await SecureStore.deleteItemAsync(REMINDER_KEY).catch(() => {});
          await scheduleOrCancelDailyReminder(null);
        },
      },
      { text: 'Cancelar', style: 'cancel' as const },
    ];

    Alert.alert('Lembrete diário', 'Escolha o horário do seu lembrete:', buttons);
  };

  const userLevel            = profile?.user_level ?? '—';
  const subscriptionStatus   = profile?.subscription_status ?? 'none';
  const isActive             = profile?.is_active;
  const isInstitutional      = !!profile?.lms_role;

  const accessLabel = (() => {
    if (!isActive)                              return { text: 'Inativa',       color: '#f87171' };
    if (isInstitutional)                        return { text: 'Institucional', color: '#A3FF3C' };
    if (subscriptionStatus === 'active')        return { text: 'Ativa',         color: '#A3FF3C' };
    if (subscriptionStatus === 'trial')         return { text: 'Trial',         color: '#60A5FA' };
    if (subscriptionStatus === 'expired')       return { text: 'Expirada',      color: '#f87171' };
    return                                             { text: 'Sem acesso',    color: '#f87171' };
  })();

  const reminderLabel = reminderHour !== null
    ? `${reminderHour.toString().padStart(2, '0')}:00`
    : 'Desativado';

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
          style={{ padding: 10, borderRadius: 20, marginRight: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
        {/* Card de usuário — apenas nome + email */}
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
        </View>

        {/* Conta */}
        <SectionTitle label="Conta" />
        <SettingRow
          icon={<ShieldCheck size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
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
          icon={<Key size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Alterar senha"
          onPress={() => router.push('/(auth)/forgot-password')}
          chevron
        />

        {/* Notificações */}
        <SectionTitle label="Notificações" />
        <SettingRow
          icon={<Clock size={18} color="rgba(255,255,255,0.7)" weight="duotone" />}
          label="Lembrete diário"
          value={reminderLabel}
          onPress={handleReminderPress}
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
