import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Digite seu e-mail.'); return; }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Não foi possível enviar o e-mail. Verifique o endereço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center px-6 gap-8">
        <View className="gap-2">
          <AppText className="text-2xl font-bold text-textPrimary">Recuperar senha</AppText>
          <AppText className="text-textSecondary text-sm">
            Enviaremos um link de redefinição para seu e-mail.
          </AppText>
        </View>

        {sent ? (
          <View className="gap-6">
            <AppText className="text-primary text-center text-base">
              ✅ E-mail enviado! Verifique sua caixa de entrada.
            </AppText>
            <Button label="Voltar ao login" onPress={() => router.back()} />
          </View>
        ) : (
          <View className="gap-4">
            <TextInput
              className="bg-surface text-textPrimary rounded-xl px-4 py-4 text-base"
              placeholder="E-mail"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            {error && <AppText className="text-red-400 text-sm">{error}</AppText>}
            <Button label={loading ? 'Enviando...' : 'Enviar link'} onPress={handleSubmit} disabled={loading} />
            <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
          </View>
        )}
      </View>
    </Screen>
  );
}
