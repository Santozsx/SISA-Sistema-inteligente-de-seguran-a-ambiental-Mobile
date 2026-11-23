import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { colors, radius, spacing } from '../theme/colors';
import { Chamado } from '../types';
import { tempoRelativo } from '../utils/formatar';

export default function ChamadoCard({ chamado, onPress }: { chamado: Chamado; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <View style={styles.topRow}>
        <Text style={styles.numero}>#{chamado.id}</Text>
        <StatusBadge status={chamado.status} label={chamado.status_label} />
      </View>
      <Text style={styles.categoria}>{chamado.categoria_label}</Text>
      <View style={styles.subRow}>
        <Text style={styles.sub}>
          {chamado.instituto.nome} · {tempoRelativo(chamado.criado_em)}
        </Text>
        {chamado.anexos.length > 0 && (
          <View style={styles.anexos}>
            <Feather name="paperclip" size={11} color={colors.textMuted} />
            <Text style={styles.sub}>{chamado.anexos.length}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  categoria: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sub: { color: colors.textSecondary, fontSize: 12 },
  anexos: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
