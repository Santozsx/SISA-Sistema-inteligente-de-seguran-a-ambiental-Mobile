import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { Mensagem } from '../types';
import { hora } from '../utils/formatar';

// Toda mensagem é guardada cifrada no servidor; com mostrarCifrado, exibe como ela está no banco.
export default function MessageBubble({ mensagem, mostrarCifrado }: { mensagem: Mensagem; mostrarCifrado?: boolean }) {
  const enviada = mensagem.enviada_por_mim;
  const cifrado = mostrarCifrado ? mensagem.cifrado_base64 : null;
  return (
    <View style={[styles.row, enviada ? styles.rowEnviada : styles.rowRecebida]}>
      <View style={[styles.bubble, enviada ? styles.bubbleEnviada : styles.bubbleRecebida]}>
        <Text style={styles.texto}>{mensagem.texto}</Text>
        {cifrado && (
          <Text style={styles.cifrado} numberOfLines={4}>
            {cifrado}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Feather name="lock" size={10} color={enviada ? '#DBEAFE' : colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.hora, enviada && styles.horaEnviada]}>
            cifrada · {hora(mensagem.criado_em)}
            {enviada && mensagem.lida ? ' · lida' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  rowEnviada: { justifyContent: 'flex-end' },
  rowRecebida: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleEnviada: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleRecebida: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  texto: { color: colors.textPrimary, fontSize: 14 },
  cifrado: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 6,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  hora: { color: colors.textSecondary, fontSize: 10 },
  horaEnviada: { color: '#DBEAFE' },
});
