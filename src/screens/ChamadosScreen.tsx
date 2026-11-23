import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ChamadoCard from '../components/ChamadoCard';
import EstadoTela from '../components/EstadoTela';
import { colors, radius, spacing } from '../theme/colors';
import { listarChamados } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { StatusChamado } from '../types';

const filtros: { key: StatusChamado | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'aberto', label: 'Abertos' },
  { key: 'em-analise', label: 'Em análise' },
  { key: 'resolvido', label: 'Resolvidos' },
];

export default function ChamadosScreen({ navigation }: any) {
  const [filtro, setFiltro] = useState<StatusChamado | 'todos'>('todos');
  const { dados, erro, carregando, atualizando, recarregar } = useCarregar(
    () => listarChamados(filtro === 'todos' ? undefined : filtro),
    [filtro],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chamados registrados</Text>
        <TouchableOpacity style={styles.novoButton} onPress={() => navigation.navigate('NovoChamado')}>
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.novoButtonText}>Novo chamado</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {filtros.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, filtro === f.key && styles.tabActive]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.tabText, filtro === f.key && styles.tabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={dados ?? []}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <ChamadoCard chamado={item} onPress={() => navigation.navigate('ChamadoDetalhe', { chamadoId: item.id })} />
        )}
        ListEmptyComponent={
          <EstadoTela carregando={carregando} erro={erro} onTentarNovamente={recarregar} vazio="Nenhum chamado nesse filtro." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  novoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  novoButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.textSecondary, fontSize: 12 },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
