import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InstitutoCard from '../components/InstitutoCard';
import InstitutosMap from '../components/InstitutosMap';
import EstadoTela from '../components/EstadoTela';
import { colors, radius, spacing } from '../theme/colors';
import { listarInstitutos } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { obterPosicao, Posicao } from '../utils/localizacao';

export default function InstitutosScreen({ navigation }: any) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);

  // Com o GPS, a API ordena pela distância até o aparelho; sem ele, até o endereço do instituto.
  const { dados, erro, carregando, atualizando, recarregar } = useCarregar(async () => {
    const atual = await obterPosicao();
    setPosicao(atual);
    return listarInstitutos(atual);
  });

  const institutos = dados ?? [];
  const legenda = posicao ? 'ordenados pela sua localização' : 'ordenados pelo endereço do instituto';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Institutos próximos</Text>
        <Text style={styles.subtitle}>
          {institutos.length} {institutos.length === 1 ? 'instituto' : 'institutos'}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        {dados && <InstitutosMap institutos={institutos} posicao={posicao} />}
      </View>
      {dados && <Text style={styles.legenda}>{legenda}</Text>}

      <FlatList
        data={institutos}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={colors.accent} />}
        ListEmptyComponent={
          <EstadoTela carregando={carregando} erro={erro} onTentarNovamente={recarregar} vazio="Nenhum outro instituto cadastrado ainda." />
        }
        renderItem={({ item }) => (
          <InstitutoCard
            instituto={item}
            variant="list"
            onConversar={() =>
              navigation.navigate('Mensagens', { screen: 'Chat', params: { institutoId: item.id, nome: item.nome } })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 11 },
  mapWrap: {
    height: 170,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  legenda: { color: colors.textMuted, fontSize: 11, marginHorizontal: spacing.lg, marginTop: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
});
