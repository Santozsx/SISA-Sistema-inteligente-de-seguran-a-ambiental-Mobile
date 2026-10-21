import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { atualizarPerfil, saude } from '../services/api';
import { API_URL, VERSAO_APP } from '../services/config';
import { AtualizarPerfil, Notificacoes, StatusInstituto } from '../types';
import { obterPosicao } from '../utils/localizacao';

const nomesCifra: Record<string, string> = { sisa: 'SISA-Cifra', 'aes-gcm': 'AES-256-GCM' };

const opcoesStatus: { valor: StatusInstituto; label: string }[] = [
  { valor: 'ativo', label: 'Ativo' },
  { valor: 'em-rota', label: 'Em rota' },
  { valor: 'inativo', label: 'Inativo' },
];

function Row({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={16} color={colors.textSecondary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function RowSwitch({ icon, label, value, onChange }: { icon: keyof typeof Feather.glyphMap; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={16} color={colors.textSecondary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#FFFFFF" />
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

export default function ConfigScreen() {
  const { perfil, sair, atualizarPerfilLocal } = useAuth();
  const [cifra, setCifra] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [atualizandoLocal, setAtualizandoLocal] = useState(false);

  useEffect(() => {
    saude().then((s) => setCifra(nomesCifra[s.cifra] ?? s.cifra)).catch(() => setCifra(null));
  }, []);

  if (!perfil) return null;

  async function salvar(dados: AtualizarPerfil) {
    try {
      atualizarPerfilLocal(await atualizarPerfil(dados));
      return true;
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
      return false;
    }
  }

  function mudarNotificacao(campo: keyof Notificacoes, valor: boolean) {
    // Atualiza na hora e desfaz se a API recusar.
    const anterior = perfil!;
    atualizarPerfilLocal({ ...anterior, notificacoes: { ...anterior.notificacoes, [campo]: valor } });
    salvar({ notificacoes: { [campo]: valor } }).then((ok) => !ok && atualizarPerfilLocal(anterior));
  }

  async function atualizarLocalizacao() {
    setAtualizandoLocal(true);
    const posicao = await obterPosicao();
    if (!posicao) {
      Alert.alert('Permissão necessária', 'Habilite a localização para atualizar o endereço do instituto.');
    } else if (await salvar(posicao)) {
      Alert.alert('Localização atualizada', 'As distâncias passam a ser calculadas a partir daqui.');
    }
    setAtualizandoLocal(false);
  }

  async function trocarSenha() {
    if (novaSenha.length < 8) return Alert.alert('Senha muito curta', 'A nova senha precisa ter pelo menos 8 caracteres.');
    setSalvandoSenha(true);
    if (await salvar({ senha_atual: senhaAtual, nova_senha: novaSenha })) {
      setSenhaAtual('');
      setNovaSenha('');
      Alert.alert('Senha alterada', 'Use a nova senha no próximo login.');
    }
    setSalvandoSenha(false);
  }

  const temLocal = perfil.latitude !== null && perfil.longitude !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{perfil.iniciais}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nomeRow}>
              <Text style={styles.profileNome} numberOfLines={1}>{perfil.nome}</Text>
              {perfil.verificado && <Feather name="check-circle" size={14} color={colors.success} />}
            </View>
            <Text style={styles.profileEmail}>{perfil.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Segurança e criptografia</Text>
        <View style={styles.card}>
          <Row icon="key" label="Cifra dos dados" value={cifra ? `${cifra} · ativa` : 'indisponível'} />
          <Divider />
          <Row icon="shield" label="Instituto verificado" value={perfil.verificado ? 'sim' : 'aguardando'} />
        </View>

        <Text style={styles.sectionLabel}>Notificações</Text>
        <View style={styles.card}>
          <RowSwitch icon="alert-triangle" label="Novos chamados" value={perfil.notificacoes.chamados} onChange={(v) => mudarNotificacao('chamados', v)} />
          <Divider />
          <RowSwitch icon="message-circle" label="Mensagens" value={perfil.notificacoes.mensagens} onChange={(v) => mudarNotificacao('mensagens', v)} />
          <Divider />
          <RowSwitch icon="mail" label="Resumo por e-mail" value={perfil.notificacoes.email} onChange={(v) => mudarNotificacao('email', v)} />
        </View>

        <Text style={styles.sectionLabel}>Instituto</Text>
        <View style={styles.card}>
          <Row icon="file-text" label="Área de atuação" value={perfil.tipo} />
          <Divider />
          <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm }]}>
            <View style={styles.rowLeft}>
              <Feather name="activity" size={16} color={colors.textSecondary} />
              <Text style={styles.rowLabel}>Status</Text>
            </View>
            <View style={styles.statusRow}>
              {opcoesStatus.map((o) => (
                <TouchableOpacity
                  key={o.valor}
                  style={[styles.statusBotao, perfil.status === o.valor && styles.statusBotaoAtivo]}
                  onPress={() => salvar({ status: o.valor })}
                  disabled={perfil.status === o.valor}
                >
                  <Text style={[styles.statusTexto, perfil.status === o.valor && { color: '#FFFFFF' }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Divider />
          <TouchableOpacity style={styles.row} onPress={atualizarLocalizacao} disabled={atualizandoLocal}>
            <View style={styles.rowLeft}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <View>
                <Text style={styles.rowLabel}>Usar minha localização</Text>
                <Text style={styles.rowHint}>
                  {temLocal ? `${perfil.latitude!.toFixed(4)}, ${perfil.longitude!.toFixed(4)}` : 'Sem localização cadastrada'}
                </Text>
              </View>
            </View>
            {atualizandoLocal ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="crosshair" size={16} color={colors.accent} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Trocar senha</Text>
        <View style={[styles.card, { padding: spacing.md, gap: spacing.sm }]}>
          <TextInput
            style={styles.input}
            placeholder="Senha atual"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={senhaAtual}
            onChangeText={setSenhaAtual}
          />
          <TextInput
            style={styles.input}
            placeholder="Nova senha (mínimo de 8 caracteres)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={novaSenha}
            onChangeText={setNovaSenha}
          />
          <TouchableOpacity
            style={[styles.botao, (!senhaAtual || !novaSenha || salvandoSenha) && { opacity: 0.6 }]}
            onPress={trocarSenha}
            disabled={!senhaAtual || !novaSenha || salvandoSenha}
          >
            {salvandoSenha ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.botaoTexto}>Salvar nova senha</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={sair}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>Versão {VERSAO_APP} · {API_URL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontWeight: '700' },
  nomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileNome: { color: colors.textPrimary, fontWeight: '700', fontSize: 15, flexShrink: 1 },
  profileEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  rowLabel: { color: colors.textPrimary, fontSize: 14 },
  rowHint: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  rowValue: { color: colors.textSecondary, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusBotao: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundAlt },
  statusBotaoAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusTexto: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botao: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  rodape: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: spacing.sm },
});
