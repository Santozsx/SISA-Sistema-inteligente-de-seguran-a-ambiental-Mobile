import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { colors, radius, spacing } from '../theme/colors';
import { fonteAnexo } from '../services/api';
import { Noticia } from '../types';
import { tempoRelativo } from '../utils/formatar';

const rotuloTag = { urgente: 'urgente', 'em-analise': 'em análise', resolvido: 'resolvido' };

// A imagem do anexo precisa do token no cabeçalho; no navegador (Expo web) o <Image> não envia
// cabeçalhos, por isso lá a foto fica de fora (igual à tela de detalhe do chamado).
const MOSTRAR_FOTOS = Platform.OS !== 'web';

// O mural é montado pela API a partir dos chamados mais recentes (o id é o do chamado).
export default function NoticiaCard({ noticia, onPress }: { noticia: Noticia; onPress?: () => void }) {
  const imagens = noticia.imagens ?? [];
  const capa = MOSTRAR_FOTOS ? imagens[0] : undefined;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      {capa && (
        <View style={styles.capaBox}>
          <Image source={fonteAnexo(capa)} style={styles.capa} resizeMode="cover" accessibilityLabel={capa.nome_arquivo} />
          {imagens.length > 1 && (
            <View style={styles.maisFotos}>
              <Feather name="image" size={11} color="#FFFFFF" />
              <Text style={styles.maisFotosText}>+{imagens.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.corpo}>
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
          {!capa && imagens.length > 0 && (
            <View style={styles.contagemFotos}>
              <Feather name="image" size={12} color={colors.textMuted} />
              <Text style={styles.sub}>{imagens.length}</Text>
            </View>
          )}
        </View>
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
    overflow: 'hidden',
  },
  capaBox: { width: '100%', height: 160, backgroundColor: colors.cardAlt },
  capa: { width: '100%', height: '100%' },
  maisFotos: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(8, 11, 20, 0.75)',
  },
  maisFotosText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  corpo: { padding: spacing.md, gap: 6 },
  titulo: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  resumo: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  rodape: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contagemFotos: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { color: colors.textMuted, fontSize: 12 },
});
