import { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeSlash, CheckCircle, WarningCircle } from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ChangePasswordScreen() {
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const confirmRef                      = useRef<TextInput>(null);
  const { session }                     = useAuth();

  const handleSave = async () => {
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Marca must_change_password = false na tabela users
      if (session?.user?.id) {
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', session.user.id);
      }

      // 3. Redireciona para a home
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao salvar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16153A' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Ícone */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: 'rgba(163,255,60,0.1)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
              <Lock size={32} color="#A3FF3C" weight="duotone" />
            </View>
            <AppText style={{ fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              Crie sua senha
            </AppText>
            <AppText style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              É seu primeiro acesso.{'\n'}Defina uma senha pessoal para continuar.
            </AppText>
          </View>

          {/* Campos */}
          <View style={{ gap: 12, marginBottom: 24 }}>
            <View style={inputWrap}>
              <Lock size={18} color="rgba(255,255,255,0.35)" weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                value={password}
                onChangeText={t => { setPassword(t); setError(null); }}
                placeholder="Nova senha"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                style={[inputStyle, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 6 }}>
                {showPassword
                  ? <EyeSlash size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                  : <Eye     size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                }
              </TouchableOpacity>
            </View>

            <View style={inputWrap}>
              <Lock size={18} color="rgba(255,255,255,0.35)" weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                ref={confirmRef}
                value={confirm}
                onChangeText={t => { setConfirm(t); setError(null); }}
                placeholder="Confirmar senha"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showConfirm}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSave}
                style={[inputStyle, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={{ padding: 6 }}>
                {showConfirm
                  ? <EyeSlash size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                  : <Eye     size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                }
              </TouchableOpacity>
            </View>

            {/* Requisito mínimo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CheckCircle
                size={13}
                color={password.length >= 8 ? '#A3FF3C' : 'rgba(255,255,255,0.25)'}
                weight={password.length >= 8 ? 'fill' : 'regular'}
              />
              <AppText style={{ fontSize: 12, color: password.length >= 8 ? '#A3FF3C' : 'rgba(255,255,255,0.35)' }}>
                Mínimo 8 caracteres
              </AppText>
            </View>

            {!!error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WarningCircle size={15} color="#f87171" weight="fill" />
                <AppText style={{ color: '#f87171', fontSize: 13 }}>{error}</AppText>
              </View>
            )}
          </View>

          {/* Botão */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? 'rgba(163,255,60,0.5)' : '#A3FF3C',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            }}
          >
            <AppText style={{ color: '#16153A', fontWeight: '700', fontSize: 15 }}>
              {loading ? 'Salvando...' : 'Salvar e entrar'}
            </AppText>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputWrap = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#1A1939',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.09)',
  paddingHorizontal: 16,
  paddingVertical: 15,
};

const inputStyle = {
  color: '#fff',
  fontSize: 15,
};
