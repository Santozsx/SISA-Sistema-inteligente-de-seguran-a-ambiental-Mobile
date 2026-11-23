import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from './StatusBadge';
import { colors, radius, spacing } from '../theme/colors';
import { Instituto } from '../types';
import { distancia } from '../utils/formatar';

type Props = {
  instituto: Instituto;
  variant?: 'carousel' | 'list';
  onConversar?: () => void;
};

export default function InstitutoCard({ instituto, variant = 'list', onConversar }: Props) {
  if (variant === 'carousel') {
    return (
      <TouchableOpacity style={styles.carouselCard} onPress={onConversar} disabled={!onConversar} activeOpacity={0.8}>
        <StatusBadge status={instituto.status} label={instituto.status_label} />
        <Text style={styles.carouselNome} numberOfLines={2}>{instituto.nome}</Text>
        <Text style={styles.carouselDistancia}>{distancia(instituto.distancia_km)}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.listCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{instituto.iniciais}</Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listNome}>{instituto.nome}</Text>
        <Text style={styles.listSub}>
          {instituto.tipo} · {distancia(instituto.distancia_km)}
        </Text>
      </View>
      <View style={styles.listRight}>
        <StatusBadge status={instituto.status} label={instituto.status_label} />
        <TouchableOpacity onPress={onConversar} hitSlop={8}>
          <Text style={styles.conversar}>conversar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    width: 170,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  carouselNome: { color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm, fontSize: 14 },
  carouselDistancia: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },

  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  listInfo: { flex: 1 },
  listNome: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  listSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  listRight: { alignItems: 'flex-end', gap: 6 },
  conversar: { color: colors.accent, fontSize: 12, marginTop: 4 },
});
