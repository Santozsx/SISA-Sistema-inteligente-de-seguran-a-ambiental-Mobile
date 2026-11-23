import React from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import InstitutoCard from '../components/InstitutoCard';
import NoticiaCard from '../components/NoticiaCard';
import EstadoTela from '../components/EstadoTela';
import { colors, spacing } from '../theme/colors';
import { listarInstitutos, listarMural } from '../services/api';
import { useCarregar } from '../hooks/useCarregar';
import { useAuth } from '../contexts/AuthContext';

export default function MuralScreen({ navigation }: any) {
  const { perfil } = useAuth();
  const { dados, erro, carregando, atualizando, recarregar } = useCarregar(async () => {
    const [institutos, noticias] = await Promise.all([listarInstitutos(), listarMural()]);
    return { institutos, noticias };
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <Feather name="shield" size={18} color={colors.accent} />
              <Text style={styles.headerTitle}>SISA</Text>
            </View>
            {perfil && <Text style={styles.headerSub}>{perfil.nome}</Text>}
          </View>
          <TouchableOpacity style={styles.chatRapido} onPress={() => navigation.navigate('Mensagens')}>
            <Text style={styles.chatRapidoText}>chat rápido</Text>
            <Feather name="arrow-up-right" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {!dados ? (
          <EstadoTela carregando={carregando} erro={erro} onTentarNovamente={recarregar} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Institutos próximos</Text>
            {dados.institutos.length === 0 ? (
              <EstadoTela vazio="Nenhum outro instituto cadastrado ainda." />
            ) : (
              <FlatList
                data={dados.institutos}
                keyExtractor={(i) => String(i.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: spacing.lg }}
                renderItem={({ item }) => (
                  <InstitutoCard
                    instituto={item}
                    variant="carousel"
                    onConversar={() =>
                      navigation.navigate('Mensagens', { screen: 'Chat', params: { institutoId: item.id, nome: item.nome } })
                    }
                  />
                )}
              />
            )}

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Mural de notícias</Text>
            {dados.noticias.length === 0 ? (
              <EstadoTela vazio="Nenhum chamado registrado ainda." />
            ) : (
              dados.noticias.map((n) => (
                <NoticiaCard
                  key={n.id}
                  noticia={n}
                  onPress={() => navigation.navigate('Chamados', { screen: 'ChamadoDetalhe', params: { chamadoId: n.id }, initial: false })}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chatRapido: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatRapidoText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
});
