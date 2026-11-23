import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const { entrar } = useAuth();

  // Ao entrar, o AuthContext guarda o perfil e o App.tsx troca para as abas.
  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setErro(null);
    setEntrando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setEntrando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <Feather name="shield" size={20} color={colors.accent} />
            <Text style={styles.logoText}>SISA</Text>
          </View>
          <Text style={styles.logoSub}>Sistema Inteligente de Segurança Ambiental</Text>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Acesso restrito</Text>
            <Text style={styles.headline}>Acesso exclusivo. Somente institutos verificados.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="contato@institutoxyz.org"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={handleEntrar}
            />

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <TouchableOpacity
              style={[styles.button, entrando && { opacity: 0.7 }]}
              onPress={handleEntrar}
              disabled={entrando}
              activeOpacity={0.85}
            >
              {entrando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
              <Text style={styles.linkText}>
                Ainda não possui uma conta? <Text style={styles.linkAccent}>Cadastrar agora</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  logoSub: { color: colors.accent, fontSize: 12, marginTop: 2, marginBottom: spacing.xxl },
  hero: { marginBottom: spacing.xl },
  eyebrow: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm },
  headline: { color: colors.textPrimary, fontSize: 26, fontWeight: '700', lineHeight: 34 },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  erro: { color: colors.danger, fontSize: 13, marginTop: spacing.md },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linkWrap: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.textSecondary, fontSize: 13 },
  linkAccent: { color: colors.accent, fontWeight: '600' },
});
