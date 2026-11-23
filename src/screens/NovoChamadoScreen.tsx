import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing } from '../theme/colors';
import { criarChamado, enviarAnexo, listarCategorias } from '../services/api';
import { Opcao } from '../types';
import { extrairCoordenadas } from '../utils/formatar';
import { obterPosicao, Posicao } from '../utils/localizacao';

type Foto = { uri: string; nome: string; tipo: string };

export default function NovoChamadoScreen({ navigation }: any) {
  const [categorias, setCategorias] = useState<Opcao[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [gps, setGps] = useState<Posicao | null>(null);
  const [valor, setValor] = useState('');
  const [unidade, setUnidade] = useState('');
  const [foto, setFoto] = useState<Foto | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCategorias()
      .then((lista) => {
        setCategorias(lista);
        setCategoria(lista[0]?.valor ?? null);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Não foi possível carregar as categorias.'));
  }, []);

  async function usarLocalizacaoAtual() {
    setBuscandoLocal(true);
    try {
      const posicao = await obterPosicao();
      if (!posicao) {
        Alert.alert('Permissão necessária', 'Habilite a localização para preencher automaticamente.');
        return;
      }
      setGps(posicao);
      setLocal(`${posicao.latitude.toFixed(5)}, ${posicao.longitude.toFixed(5)}`);
    } finally {
      setBuscandoLocal(false);
    }
  }

  function guardarFoto(resultado: ImagePicker.ImagePickerResult) {
    if (resultado.canceled) return;
    const asset = resultado.assets[0];
    const tipo = asset.mimeType ?? 'image/jpeg';
    const extensao = tipo.split('/')[1] ?? 'jpg';
    setFoto({ uri: asset.uri, nome: asset.fileName ?? `evidencia-${Date.now()}.${extensao}`, tipo });
  }

  async function escolherDaGaleria() {
    guardarFoto(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 }));
  }

  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Habilite a câmera para fotografar a evidência.');
      return;
    }
    guardarFoto(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 }));
  }

  async function cifrarEEnviar() {
    if (!categoria) return setErro('Escolha uma categoria.');
    if (descricao.trim().length < 3) return setErro('Descreva o ocorrido (mínimo de 3 caracteres).');
    const numero = valor.trim() ? Number(valor.replace(',', '.')) : null;
    if (numero !== null && Number.isNaN(numero)) return setErro('O valor medido precisa ser um número.');

    // Se o local digitado for "lat, lon", também vira coordenada.
    const coordenadas = extrairCoordenadas(local) ?? gps;
    setErro(null);
    setEnviando(true);
    try {
      const chamado = await criarChamado({
        categoria,
        descricao: descricao.trim(),
        local: local.trim() || null,
        latitude: coordenadas?.latitude ?? null,
        longitude: coordenadas?.longitude ?? null,
        valor_numerico: numero,
        unidade: unidade.trim() || null,
      });

      let avisoAnexo = '';
      if (foto) {
        try {
          await enviarAnexo(chamado.id, foto);
        } catch (e) {
          avisoAnexo = `\n\nO chamado foi criado, mas a foto não foi enviada: ${e instanceof Error ? e.message : 'erro desconhecido'}`;
        }
      }

      Alert.alert('Chamado enviado', `O chamado #${chamado.id} foi cifrado e registrado.${avisoAnexo}`);
      navigation.replace('ChamadoDetalhe', { chamadoId: chamado.id });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar o chamado.');
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Novo registro</Text>
            <Text style={styles.subtitle}>Registre um dado ambiental identificado em campo</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Categoria</Text>
          {categorias.length === 0 && !erro ? (
            <ActivityIndicator color={colors.accent} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <View style={styles.chipsWrap}>
              {categorias.map((c) => (
                <TouchableOpacity
                  key={c.valor}
                  style={[styles.chip, categoria === c.valor && styles.chipActive]}
                  onPress={() => setCategoria(c.valor)}
                >
                  <Text style={[styles.chipText, categoria === c.valor && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Descrição do ocorrido</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Descreva o que foi identificado..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={5000}
            value={descricao}
            onChangeText={setDescricao}
          />

          <Text style={styles.label}>Local / coordenadas</Text>
          <View style={styles.localRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Ex: -23.55, -46.63 ou Rio Tapajós"
              placeholderTextColor={colors.textMuted}
              value={local}
              onChangeText={(t) => {
                setLocal(t);
                setGps(null);
              }}
            />
            <TouchableOpacity style={styles.gpsButton} onPress={usarLocalizacaoAtual} disabled={buscandoLocal}>
              {buscandoLocal ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Feather name="crosshair" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Valor medido (opcional)</Text>
          <View style={styles.localRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Ex: 12"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unidade (hectares, IQA...)"
              placeholderTextColor={colors.textMuted}
              maxLength={40}
              value={unidade}
              onChangeText={setUnidade}
            />
          </View>

          <Text style={styles.label}>Evidência (foto)</Text>
          {foto ? (
            <View style={styles.fotoBox}>
              <Image source={{ uri: foto.uri }} style={styles.foto} resizeMode="cover" />
              <View style={styles.fotoRodape}>
                <Text style={styles.anexoText} numberOfLines={1}>{foto.nome}</Text>
                <TouchableOpacity onPress={() => setFoto(null)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.localRow}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={[styles.anexoBox, { flex: 1 }]} onPress={tirarFoto}>
                  <Feather name="camera" size={16} color={colors.textSecondary} />
                  <Text style={styles.anexoText}>Tirar foto</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.anexoBox, { flex: 1 }]} onPress={escolherDaGaleria}>
                <Feather name="image" size={16} color={colors.textSecondary} />
                <Text style={styles.anexoText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.alertBox}>
            <Feather name="lock" size={14} color={colors.success} />
            <Text style={styles.alertText}>
              Descrição, local, valores e a foto são cifrados pelo servidor antes de serem guardados
            </Text>
          </View>

          {erro && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity
            style={[styles.button, enviando && { opacity: 0.7 }]}
            onPress={cifrarEEnviar}
            disabled={enviando}
            activeOpacity={0.85}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Cifrar e enviar chamado</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  localRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  gpsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anexoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  anexoText: { color: colors.textSecondary, fontSize: 13, flexShrink: 1 },
  fotoBox: { backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  foto: { width: '100%', height: 180 },
  fotoRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.sm },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  alertText: { color: colors.success, fontSize: 12, flex: 1, lineHeight: 17 },
  erro: { color: colors.danger, fontSize: 13, marginTop: spacing.md },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
