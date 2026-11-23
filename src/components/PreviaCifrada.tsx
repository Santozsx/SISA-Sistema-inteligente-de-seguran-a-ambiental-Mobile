import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { bytesCifradosBase64 } from '../services/api';
import { base64ParaBytes, bytesParaImagemBmp, hexParaBytes } from '../utils/previaCifrada';
import { colors } from '../theme/colors';

// Lado da prévia em pixels: 64 x 64 x 3 = 12 KB do arquivo cifrado.
const LADO = 64;

// Mostra os bytes cifrados da foto como pixels coloridos: prova que o conteúdo virou ruído.
export default function PreviaCifrada({ id, amostraHex }: { id: number; amostraHex: string }) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    bytesCifradosBase64(id, LADO * LADO * 3)
      .then((base64) => ativo && setImagem(bytesParaImagemBmp(base64ParaBytes(base64), LADO)))
      .catch(() => {
        // Sem conseguir baixar: usa a amostra que veio na lista (só 48 bytes, repetidos).
        if (!ativo) return;
        setFalhou(true);
        setImagem(bytesParaImagemBmp(hexParaBytes(amostraHex), LADO));
      });
    return () => {
      ativo = false;
    };
  }, [id, amostraHex]);

  return (
    <View style={styles.caixa}>
      {imagem && (
        <Image
          source={{ uri: imagem }}
          style={styles.imagem}
          resizeMode="stretch"
          accessibilityLabel="Bytes cifrados vistos como imagem"
        />
      )}
      <View style={styles.selo}>
        <Feather name="lock" size={10} color="#FFFFFF" />
        <Text style={styles.seloTexto}>{falhou ? 'amostra' : 'cifrada'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
  },
  imagem: { width: '100%', height: '100%' },
  selo: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11,15,25,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  seloTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
});
