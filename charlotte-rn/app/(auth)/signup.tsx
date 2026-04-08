import { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Envelope, Lock, Eye, EyeSlash, UserCircle,
  WarningCircle, ArrowLeft,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  navyLight: '#9896B8',
  border:    'rgba(22,21,58,0.10)',
  green:     '#A3FF3C',
  error:     '#DC2626',
};

export default function SignupScreen() {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!name.trim())     { setError('Digite seu nome.'); return; }
    if (!email.trim())    { setError('Digite seu e-mail.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      // AuthGuard vai redirecionar automaticamente para placement-test
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (msg.includes('invalid') || msg.includes('Invalid')) {
        setError('E-mail inválido.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Back ── */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: 'absolute', top: 16, left: 0 }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={C.navy} weight="bold" />
          </TouchableOpacity>

          {/* ── Branding ── */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              borderWidth: 3, borderColor: C.green,
              overflow: 'hidden', marginBottom: 16,
              backgroundColor: C.card,
              shadowColor: C.navy, shadowOpacity: 0.12,
              shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
            }}>
              <Image
                source={require('@/assets/charlotte-avatar.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <AppText style={{ fontSize: 28, fontWeight: '800', color: C.navy, letterSpacing: -0.5, marginBottom: 4 }}>
              Criar conta
            </AppText>
            <AppText style={{ fontSize: 13, color: C.navyMid, textAlign: 'center' }}>
              7 dias grátis, cancele quando quiser.
            </AppText>
          </View>

          {/* ── Campos ── */}
          <View style={{ gap: 12, marginBottom: 24 }}>

            {/* Nome */}
            <View style={[inputWrap, { borderColor: C.border }]}>
              <UserCircle size={18} color={C.navyLight} weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                value={name}
                onChangeText={t => { setName(t); setError(null); }}
                placeholder="Seu nome"
                placeholderTextColor={C.navyLight}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                style={[inputStyle, { color: C.navy }]}
              />
            </View>

            {/* E-mail */}
            <View style={[inputWrap, { borderColor: C.border }]}>
              <Envelope size={18} color={C.navyLight} weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                placeholder="E-mail"
                placeholderTextColor={C.navyLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={[inputStyle, { color: C.navy }]}
              />
            </View>

            {/* Senha */}
            <View style={[inputWrap, { borderColor: C.border }]}>
              <Lock size={18} color={C.navyLight} weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={t => { setPassword(t); setError(null); }}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor={C.navyLight}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                style={[inputStyle, { flex: 1, color: C.navy }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 6 }}>
                {showPassword
                  ? <EyeSlash size={18} color={C.navyLight} weight="regular" />
                  : <Eye      size={18} color={C.navyLight} weight="regular" />
                }
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WarningCircle size={15} color={C.error} weight="fill" />
                <AppText style={{ color: C.error, fontSize: 13, flex: 1 }}>{error}</AppText>
              </View>
            )}
          </View>

          {/* ── Botão criar ── */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            style={{
              backgroundColor: loading ? `${C.green}80` : C.green,
              borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20,
              shadowColor: C.green, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
            }}
          >
            <AppText style={{ color: C.navy, fontWeight: '800', fontSize: 15 }}>
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </AppText>
          </TouchableOpacity>

          {/* ── Já tenho conta ── */}
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 10 }}
            onPress={() => router.back()}
          >
            <AppText style={{ color: C.navyMid, fontSize: 13 }}>
              Já tenho uma conta
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
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  paddingHorizontal: 16,
  paddingVertical: 15,
  shadowColor: 'rgba(22,21,58,0.06)',
  shadowOpacity: 1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
};

const inputStyle = {
  fontSize: 15,
  flex: 1,
};
