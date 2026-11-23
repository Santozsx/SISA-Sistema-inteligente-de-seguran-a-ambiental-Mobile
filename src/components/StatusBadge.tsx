import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusKind, statusStyles, radius, spacing } from '../theme/colors';

// label: texto vindo da API (status_label); se não vier, usa o padrão do tema.
export default function StatusBadge({ status, label }: { status: StatusKind; label?: string }) {
  const s = statusStyles[status] ?? statusStyles.inativo;
  return (
    <View style={[styles.container, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <Text style={[styles.text, { color: s.fg }]}>{label ?? s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '600' },
});
