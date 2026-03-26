import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  SignIn,
  WarningCircle,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const passwordRef                 = useRef<TextInput>(null);
  const { signIn }                  = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return; }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (msg.includes('Email not confirmed'))  setError('Confirme seu e-mail antes de entrar.');
      else setError('Erro ao entrar. Tente novamente.');
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

          {/* ── Branding ── */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{
              width: 96, height: 96, borderRadius: 48,
              borderWidth: 2.5, borderColor: '#A3FF3C',
              overflow: 'hidden', marginBottom: 20,
              backgroundColor: '#1E1D4A',
            }}>
              <Image
                source={require('@/assets/charlotte-avatar.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <AppText style={{ fontSize: 34, fontWeight: '800', color: '#A3FF3C', letterSpacing: -0.5 }}>
              Charlotte
            </AppText>
            <AppText style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Aprenda inglês com IA
            </AppText>
          </View>

          {/* ── Campos ── */}
          <View style={{ gap: 12, marginBottom: 24 }}>

            {/* E-mail */}
            <View style={inputWrap}>
              <Envelope size={18} color="rgba(255,255,255,0.35)" weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                placeholder="E-mail"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            {/* Senha */}
            <View style={inputWrap}>
              <Lock size={18} color="rgba(255,255,255,0.35)" weight="regular" style={{ marginRight: 10 }} />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={t => { setPassword(t); setError(null); }}
                placeholder="Senha"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"   // ← iOS Keychain / Face ID autofill
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                style={[inputStyle, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 6 }}>
                {showPassword
                  ? <EyeSlash size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                  : <Eye     size={18} color="rgba(255,255,255,0.35)" weight="regular" />
                }
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WarningCircle size={15} color="#f87171" weight="fill" />
                <AppText style={{ color: '#f87171', fontSize: 13 }}>{error}</AppText>
              </View>
            )}
          </View>

          {/* ── Botão entrar ── */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? 'rgba(163,255,60,0.5)' : '#A3FF3C',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SignIn size={18} color="#16153A" weight="bold" />
              <AppText style={{ color: '#16153A', fontWeight: '700', fontSize: 15 }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* ── Esqueceu senha ── */}
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 10 }}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <AppText style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>
              Esqueceu sua senha?
            </AppText>
          </TouchableOpacity>

          <AppText style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center', marginTop: 40 }}>
            Hub Academy · Charlotte v1.0
          </AppText>

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
  flex: 1,
};
