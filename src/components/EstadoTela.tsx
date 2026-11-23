import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

// Carregando, erro (com "tentar de novo") ou lista vazia.
export default function EstadoTela({
  carregando,
  erro,
  vazio,
  onTentarNovamente,
}: {
  carregando?: boolean;
  erro?: string | null;
  vazio?: string;
  onTentarNovamente?: () => void;
}) {
  if (carregando) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (erro) {
    return (
      <View style={styles.wrap}>
        <Feather name="wifi-off" size={22} color={colors.danger} />
        <Text style={styles.erro}>{erro}</Text>
        {onTentarNovamente && (
          <TouchableOpacity style={styles.botao} onPress={onTentarNovamente}>
            <Text style={styles.botaoTexto}>Tentar de novo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (vazio) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.vazio}>{vazio}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  erro: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  vazio: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  botao: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accent },
  botaoTexto: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
