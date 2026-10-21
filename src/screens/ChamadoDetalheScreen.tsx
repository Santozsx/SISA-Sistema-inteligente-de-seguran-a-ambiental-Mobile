import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import StatusBadge from '../components/StatusBadge';
import EstadoTela from '../components/EstadoTela';
import { colors, radius, spacing } from '../theme/colors';
import { atualizarStatusChamado, fonteAnexo, obterChamado } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useAuth } from '../contexts/AuthContext';
import { Anexo, StatusChamado } from '../types';
import { dataHora } from '../utils/formatar';

const opcoesStatus: { valor: StatusChamado; label: string }[] = [
  { valor: 'aberto', label: 'Aberto' },
  { valor: 'em-analise', label: 'Em análise' },
  { valor: 'resolvido', label: 'Resolvido' },
];

function tamanho(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Info({ icone, rotulo, valor }: { icone: keyof typeof Feather.glyphMap; rotulo: string; valor: string }) {
  return (
    <View style={styles.info}>
      <Feather name={icone} size={14} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoRotulo}>{rotulo}</Text>
        <Text style={styles.infoValor}>{valor}</Text>
      </View>
    </View>
  );
}

function AnexoItem({ anexo }: { anexo: Anexo }) {
  // Imagens são baixadas com o token; o servidor decifra e confere o SHA-256 antes de entregar.
  // No navegador o <Image> não envia cabeçalhos, então lá mostramos só os dados do arquivo.
  const imagem = anexo.tipo_mime.startsWith('image/') && Platform.OS !== 'web';
  return (
    <View style={styles.anexo}>
      {imagem && <Image source={fonteAnexo(anexo)} style={styles.anexoImagem} resizeMode="cover" />}
      <View style={styles.anexoInfo}>
        <Feather name={imagem ? 'image' : 'file'} size={14} color={colors.textSecondary} />
        <Text style={styles.anexoNome} numberOfLines={1}>{anexo.nome_arquivo}</Text>
        <Text style={styles.anexoTamanho}>{tamanho(anexo.tamanho_bytes)}</Text>
      </View>
      <Text style={styles.hash} numberOfLines={1}>SHA-256 {anexo.hash_sha256}</Text>
    </View>
  );
}

export default function ChamadoDetalheScreen({ route, navigation }: any) {
  const chamadoId: number = route.params.chamadoId;
  const { perfil } = useAuth();
  const { dados: chamado, setDados, erro, carregando, recarregar } = useCarregar(() => obterChamado(chamadoId), [chamadoId]);
  const [salvando, setSalvando] = useState<StatusChamado | null>(null);
  const [erroStatus, setErroStatus] = useState<string | null>(null);

  async function mudarStatus(status: StatusChamado) {
    setSalvando(status);
    setErroStatus(null);
    try {
      setDados(await atualizarStatusChamado(chamadoId, status));
    } catch (e) {
      setErroStatus(e instanceof Error ? e.message : 'Não foi possível atualizar.');
    } finally {
      setSalvando(null);
    }
  }

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ChamadosList');
  }

  const meu = chamado?.instituto.id === perfil?.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Chamado #{chamadoId}</Text>
      </View>

      {!chamado ? (
        <EstadoTela carregando={carregando} erro={erro} onTentarNovamente={recarregar} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <StatusBadge status={chamado.status} label={chamado.status_label} />
          <Text style={styles.categoria}>{chamado.categoria_label}</Text>
          <Text style={styles.sub}>
            {chamado.instituto.nome}{meu ? ' (seu instituto)' : ''} · {dataHora(chamado.criado_em)}
          </Text>

          <View style={styles.card}>
            <Text style={styles.descricao}>{chamado.descricao}</Text>
          </View>

          <View style={styles.card}>
            {chamado.local && <Info icone="map-pin" rotulo="Local" valor={chamado.local} />}
            {chamado.latitude !== null && chamado.longitude !== null && (
              <Info icone="crosshair" rotulo="Coordenadas" valor={`${chamado.latitude.toFixed(5)}, ${chamado.longitude.toFixed(5)}`} />
            )}
            {chamado.valor_numerico !== null && (
              <Info icone="bar-chart-2" rotulo="Valor medido" valor={`${chamado.valor_numerico} ${chamado.unidade ?? ''}`.trim()} />
            )}
            <Info icone="clock" rotulo="Última atualização" valor={dataHora(chamado.atualizado_em)} />
          </View>

          {chamado.anexos.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Evidências ({chamado.anexos.length})</Text>
              {chamado.anexos.map((a) => (
                <AnexoItem key={a.id} anexo={a} />
              ))}
            </>
          )}

          <Text style={styles.sectionLabel}>Atualizar status</Text>
          <View style={styles.statusRow}>
            {opcoesStatus.map((o) => {
              const ativo = chamado.status === o.valor;
              return (
                <TouchableOpacity
                  key={o.valor}
                  style={[styles.statusBotao, ativo && styles.statusBotaoAtivo]}
                  onPress={() => mudarStatus(o.valor)}
                  disabled={ativo || salvando !== null}
                >
                  {salvando === o.valor ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Text style={[styles.statusTexto, ativo && styles.statusTextoAtivo]}>{o.label}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {erroStatus && <Text style={styles.erro}>{erroStatus}</Text>}

          {!meu && (
            <TouchableOpacity
              style={styles.conversar}
              onPress={() =>
                navigation.navigate('Mensagens', {
                  screen: 'Chat',
                  params: { institutoId: chamado.instituto.id, nome: chamado.instituto.nome },
                })
              }
            >
              <Feather name="message-circle" size={16} color={colors.accent} />
              <Text style={styles.conversarTexto}>Conversar com {chamado.instituto.nome}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.alertBox}>
            <Feather name="lock" size={14} color={colors.success} />
            <Text style={styles.alertText}>
              Descrição, local, valores e anexos ficam cifrados no servidor e só são decifrados para institutos autenticados.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitulo: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  categoria: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: spacing.xs },
  sub: { color: colors.textSecondary, fontSize: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md, marginTop: spacing.sm },
  descricao: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  info: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  infoRotulo: { color: colors.textMuted, fontSize: 11 },
  infoValor: { color: colors.textPrimary, fontSize: 13, marginTop: 1 },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  anexo: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  anexoImagem: { width: '100%', height: 200, backgroundColor: colors.cardAlt },
  anexoInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  anexoNome: { color: colors.textPrimary, fontSize: 13, flex: 1 },
  anexoTamanho: { color: colors.textMuted, fontSize: 11 },
  hash: { color: colors.textMuted, fontSize: 9, fontFamily: 'monospace', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, paddingTop: 2 },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusBotao: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  statusBotaoAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusTexto: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statusTextoAtivo: { color: '#FFFFFF' },
  erro: { color: colors.danger, fontSize: 12 },
  conversar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accent },
  conversarTexto: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.successBg, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.lg },
  alertText: { color: colors.success, fontSize: 12, flex: 1, lineHeight: 17 },
});
