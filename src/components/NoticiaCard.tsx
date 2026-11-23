import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from './StatusBadge';
import { colors, radius, spacing } from '../theme/colors';
import { Noticia } from '../types';
import { tempoRelativo } from '../utils/formatar';

const rotuloTag = { urgente: 'urgente', 'em-analise': 'em análise', resolvido: 'resolvido' };

// O mural é montado pela API a partir dos chamados mais recentes (o id é o do chamado).
export default function NoticiaCard({ noticia, onPress }: { noticia: Noticia; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <StatusBadge status={noticia.tag} label={rotuloTag[noticia.tag]} />
      <Text style={styles.titulo} numberOfLines={2}>
        {noticia.titulo}
      </Text>
      <Text style={styles.resumo} numberOfLines={3}>
        {noticia.resumo}
      </Text>
      <View style={styles.rodape}>
        <Text style={styles.sub}>
          {noticia.fonte} · {tempoRelativo(noticia.criado_em)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  titulo: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  resumo: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  rodape: { marginTop: 2 },
  sub: { color: colors.textMuted, fontSize: 12 },
});
