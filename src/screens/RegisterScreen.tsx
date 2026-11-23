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

const areasAtuacao = ['Fiscalização florestal', 'Resgate de fauna', 'Monitoramento hídrico', 'Combate a queimadas'];

export default function RegisterScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState(areasAtuacao[0]);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { cadastrar } = useAuth();

  // Cadastra o instituto e já entra com a conta nova.
  async function handleCadastrar() {
    if (nome.trim().length < 2) return setErro('Informe o nome do instituto.');
    if (!email.includes('@')) return setErro('Informe um e-mail válido.');
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
    setErro(null);
    setEnviando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), tipo: area, senha });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Feather name="arrow-left" size={18} color={colors.textSecondary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Cadastro de instituto</Text>
            <Text style={styles.headline}>Faça parte do SISA. Proteja dados ambientais.</Text>
            <Text style={styles.desc}>
              Cadastre seu instituto para ter acesso ao sistema e registrar informações ambientais de
              forma segura.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nome do instituto</Text>
            <TextInput
              style={styles.input}
              placeholder="Instituto de Preservação Ambiental"
              placeholderTextColor={colors.textMuted}
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>E-mail institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="contato@instituto.org"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Área de atuação</Text>
            <View style={styles.chipsWrap}>
              {areasAtuacao.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, area === a && styles.chipActive]}
                  onPress={() => setArea(a)}
                >
                  <Text style={[styles.chipText, area === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo de 8 caracteres"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <TouchableOpacity
              style={[styles.button, enviando && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleCadastrar}
              disabled={enviando}
            >
              {enviando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Criar conta</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
              <Text style={styles.linkText}>
                Já possui uma conta? <Text style={styles.linkAccent}>Entrar</Text>
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
  scroll: { padding: spacing.xl, flexGrow: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl },
  backText: { color: colors.textSecondary, fontSize: 13 },
  hero: { marginBottom: spacing.xl },
  eyebrow: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm },
  headline: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', lineHeight: 32 },
  desc: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.md, lineHeight: 19 },
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
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
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
