import React from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EstadoTela from '../components/EstadoTela';
import { colors, radius, spacing } from '../theme/colors';
import { listarConversas, listarInstitutos } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { tempoRelativo } from '../utils/formatar';

type Linha = {
  id: number;
  nome: string;
  iniciais: string;
  preview: string;
  quando: string | null;
  naoLidas: number;
};

export default function MensagensScreen({ navigation }: any) {
  // Conversas existentes primeiro; depois os institutos com quem ainda não houve conversa.
  const { dados, erro, carregando, atualizando, recarregar } = useCarregar(async () => {
    const [conversas, institutos] = await Promise.all([listarConversas(), listarInstitutos()]);
    const comConversa = new Set(conversas.map((c) => c.instituto.id));
    const recentes: Linha[] = conversas.map((c) => ({
      id: c.instituto.id,
      nome: c.instituto.nome,
      iniciais: c.instituto.iniciais,
      preview: c.ultima_mensagem ?? '',
      quando: c.ultima_em,
      naoLidas: c.nao_lidas,
    }));
    const novos: Linha[] = institutos
      .filter((i) => !comConversa.has(i.id))
      .map((i) => ({ id: i.id, nome: i.nome, iniciais: i.iniciais, preview: i.tipo, quando: null, naoLidas: 0 }));
    return [
      ...(recentes.length ? [{ titulo: 'Conversas', data: recentes }] : []),
      ...(novos.length ? [{ titulo: 'Iniciar conversa', data: novos }] : []),
    ];
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversas</Text>
      </View>
      <SectionList
        sections={dados ?? []}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={colors.accent} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.sectionLabel}>{section.titulo}</Text>}
        ListEmptyComponent={
          <EstadoTela carregando={carregando} erro={erro} onTentarNovamente={recarregar} vazio="Nenhum outro instituto cadastrado ainda." />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { institutoId: item.id, nome: item.nome })}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.iniciais}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.topo}>
                <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
                {item.quando && <Text style={styles.quando}>{tempoRelativo(item.quando)}</Text>}
              </View>
              <View style={styles.topo}>
                <Text style={[styles.preview, item.naoLidas > 0 && styles.previewNaoLida]} numberOfLines={1}>
                  {item.quando ? item.preview : 'Nenhuma mensagem ainda'}
                </Text>
                {item.naoLidas > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.naoLidas}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  info: { flex: 1, gap: 2 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  nome: { color: colors.textPrimary, fontWeight: '600', fontSize: 15, flexShrink: 1 },
  quando: { color: colors.textMuted, fontSize: 11 },
  preview: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  previewNaoLida: { color: colors.textPrimary, fontWeight: '600' },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});
