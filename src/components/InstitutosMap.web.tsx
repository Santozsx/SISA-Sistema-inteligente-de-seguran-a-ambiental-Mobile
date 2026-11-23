import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { Instituto } from '../types';

// react-native-maps não roda no navegador; na web mostramos um aviso no lugar do mapa
export default function InstitutosMap({ institutos }: { institutos: Instituto[]; posicao?: { latitude: number; longitude: number } | null }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="map-outline" size={28} color={colors.textMuted} />
      <Text style={styles.text}>Mapa disponível apenas no app (Android/iOS)</Text>
      <Text style={styles.sub}>{institutos.length} institutos listados abaixo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  text: { color: colors.textSecondary, fontSize: 13 },
  sub: { color: colors.textMuted, fontSize: 11 },
});
