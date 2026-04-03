import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, ActivityIndicator,
  Platform, Alert, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Lock, Eye, EyeSlash, CheckCircle } from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';

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

export default function ChangePasswordScreen() {
  const { profile } = useAuth();
  const isPt = (profile?.charlotte_level ?? 'Novice') === 'Novice';

  const [current,    setCurrent]    = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);

  const validate = () => {
    if (!current.trim())           return isPt ? 'Informe sua senha atual.' : 'Please enter your current password.';
    if (newPass.length < 6)        return isPt ? 'A nova senha deve ter pelo menos 6 caracteres.' : 'New password must be at least 6 characters.';
    if (newPass !== confirm)       return isPt ? 'As senhas não coincidem.' : 'Passwords do not match.';
    if (newPass === current)       return isPt ? 'A nova senha deve ser diferente da atual.' : 'New password must be different from current.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert(isPt ? 'Atenção' : 'Attention', err); return; }

    setLoading(true);
    try {
      // Re-authenticate with current password to confirm identity
      const { data: session } = await supabase.auth.getSession();
      const email = session?.session?.user?.email;
      if (!email) throw new Error(isPt ? 'Sessão não encontrada. Faça login novamente.' : 'Session not found. Please log in again.');

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) throw new Error(isPt ? 'Senha atual incorreta.' : 'Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (updateError) throw updateError;

      setSuccess(true);
    } catch (e: any) {
      Alert.alert(isPt ? 'Erro' : 'Error', e.message ?? (isPt ? 'Não foi possível alterar a senha.' : 'Could not change password.'));
    } finally {
      setLoading(false);
    }
  };

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
        <AppText style={{ fontSize: 17, fontWeight: '700', color: C.navy }}>{isPt ? 'Alterar senha' : 'Change password'}</AppText>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {success ? (
            <View style={{
              alignItems: 'center',
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 32,
              borderWidth: 1,
              borderColor: 'rgba(163,255,60,0.2)',
              ...C.shadow,
            }}>
              <CheckCircle size={56} color={C.greenDark} weight="duotone" />
              <AppText style={{ fontSize: 18, fontWeight: '800', color: C.navy, marginTop: 16, textAlign: 'center' }}>
                {isPt ? 'Senha alterada!' : 'Password changed!'}
              </AppText>
              <AppText style={{ fontSize: 14, color: C.navyLight, marginTop: 8, textAlign: 'center' }}>
                {isPt ? 'Sua senha foi atualizada com sucesso.' : 'Your password was updated successfully.'}
              </AppText>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  marginTop: 28,
                  backgroundColor: C.green,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 40,
                }}
              >
                <AppText style={{ fontSize: 15, fontWeight: '700', color: C.navy }}>{isPt ? 'Voltar' : 'Back'}</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <AppText style={{ fontSize: 13, color: C.navyLight, marginBottom: 20 }}>
                {isPt
                  ? 'Informe sua senha atual e escolha uma nova senha com pelo menos 6 caracteres.'
                  : 'Enter your current password and choose a new one with at least 6 characters.'}
              </AppText>

              <PasswordField
                label={isPt ? 'Senha atual' : 'Current password'}
                value={current}
                onChangeText={setCurrent}
                show={showCur}
                onToggle={() => setShowCur(v => !v)}
              />
              <PasswordField
                label={isPt ? 'Nova senha' : 'New password'}
                value={newPass}
                onChangeText={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
              />
              <PasswordField
                label={isPt ? 'Confirmar nova senha' : 'Confirm new password'}
                value={confirm}
                onChangeText={setConfirm}
                show={showConf}
                onToggle={() => setShowConf(v => !v)}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  backgroundColor: C.green,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 12,
                  opacity: loading ? 0.7 : 1,
                  ...C.shadow,
                }}
              >
                {loading
                  ? <ActivityIndicator color={C.navy} />
                  : <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy }}>{isPt ? 'Alterar senha' : 'Change password'}</AppText>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Password field ────────────────────────────────────────────────────────────
function PasswordField({
  label, value, onChangeText, show, onToggle,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <AppText style={{ fontSize: 12, fontWeight: '700', color: C.navyMid, marginBottom: 6 }}>
        {label}
      </AppText>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
        ...C.shadow,
      }}>
        <Lock size={16} color={C.navyLight} weight="duotone" style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            height: 50,
            color: C.navy,
            fontSize: 15,
            fontFamily: 'Nunito_400Regular',
          }}
          placeholderTextColor={C.navyLight}
          placeholder="••••••••"
        />
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {show
            ? <EyeSlash size={18} color={C.navyLight} />
            : <Eye size={18} color={C.navyLight} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
