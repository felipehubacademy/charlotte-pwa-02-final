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
  const [current,    setCurrent]    = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);

  const validate = () => {
    if (!current.trim())           return 'Informe sua senha atual.';
    if (newPass.length < 6)        return 'A nova senha deve ter pelo menos 6 caracteres.';
    if (newPass !== confirm)       return 'As senhas não coincidem.';
    if (newPass === current)       return 'A nova senha deve ser diferente da atual.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert('Atenção', err); return; }

    setLoading(true);
    try {
      // Re-authenticate with current password to confirm identity
      const { data: session } = await supabase.auth.getSession();
      const email = session?.session?.user?.email;
      if (!email) throw new Error('Sessão não encontrada. Faça login novamente.');

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) throw new Error('Senha atual incorreta.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (updateError) throw updateError;

      setSuccess(true);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

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
        <AppText style={{ fontSize: 17, fontWeight: '700', color: C.navy }}>Alterar senha</AppText>
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
                Senha alterada!
              </AppText>
              <AppText style={{ fontSize: 14, color: C.navyLight, marginTop: 8, textAlign: 'center' }}>
                Sua senha foi atualizada com sucesso.
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
                <AppText style={{ fontSize: 15, fontWeight: '700', color: C.navy }}>Voltar</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <AppText style={{ fontSize: 13, color: C.navyLight, marginBottom: 20 }}>
                Informe sua senha atual e escolha uma nova senha com pelo menos 6 caracteres.
              </AppText>

              <PasswordField
                label="Senha atual"
                value={current}
                onChangeText={setCurrent}
                show={showCur}
                onToggle={() => setShowCur(v => !v)}
              />
              <PasswordField
                label="Nova senha"
                value={newPass}
                onChangeText={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
              />
              <PasswordField
                label="Confirmar nova senha"
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
                  : <AppText style={{ fontSize: 15, fontWeight: '800', color: C.navy }}>Alterar senha</AppText>
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
