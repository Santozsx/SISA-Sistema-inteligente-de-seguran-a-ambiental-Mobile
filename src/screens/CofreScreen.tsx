import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import PreviaCifrada from '../components/PreviaCifrada';
import EstadoTela from '../components/EstadoTela';
import { useAuth } from '../contexts/AuthContext';
import {
  desbloquearCofre,
  enviarAoCofre,
  ErroApi,
  excluirDoCofre,
  FotoLocal,
  listarCofre,
  listarInstitutos,
  revelarDoCofre,
} from '../services/api';
import { CaixaCofre, Instituto, ItemCofre } from '../types';
import { colors, radius, spacing } from '../theme/colors';
import { dataHora, tempoRelativo } from '../utils/formatar';
import { relogio, tamanhoLegivel } from '../utils/previaCifrada';

// Mesmas regras da tela Cofre do site.
const VISIVEL_POR_MS = 60_000; // foto revelada some depois de 1 minuto
const TAMANHO_MAXIMO_MB = 5;
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface Revelada {
  uri: string;
  nome: string;
  legenda: string | null;
  ate: number;
}

type Foto = FotoLocal & { tamanho?: number };

export default function CofreScreen({ route }: any) {
  const { perfil } = useAuth();
  const [institutos, setInstitutos] = useState<Instituto[]>([]);
  const [caixa, setCaixa] = useState<CaixaCofre>('todos');
  // Lista junto com a caixa de onde veio, para não mostrar itens de outra aba durante a troca.
  const [lista, setLista] = useState<{ caixa: CaixaCofre; itens: ItemCofre[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // envio
  const [foto, setFoto] = useState<Foto | null>(null);
  const [destino, setDestino] = useState<number | null>(null); // null = só para mim
  const [legenda, setLegenda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null); // mostrado junto do botão de enviar

  // desbloqueio: o token fica só na memória e some ao bloquear
  const [sessao, setSessao] = useState<{ token: string; ate: number } | null>(null);
  const [pedindoSenha, setPedindoSenha] = useState<number | null>(null); // id do item, 0 = só desbloquear
  const [senha, setSenha] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [reveladas, setReveladas] = useState<Record<number, Revelada>>({});
  const [abrindo, setAbrindo] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  const carregar = useCallback(async (qual: CaixaCofre) => {
    try {
      const itens = await listarCofre(qual);
      setLista({ caixa: qual, itens });
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar o cofre.');
    }
  }, []);

  const itens = lista?.caixa === caixa ? lista.itens : null;
  const mudarItens = (mudar: (atual: ItemCofre[]) => ItemCofre[]) =>
    setLista((atual) => (atual ? { ...atual, itens: mudar(atual.itens) } : atual));

  const bloquear = useCallback(() => {
    setSessao(null);
    setReveladas({});
  }, []);

  // Ao entrar na tela: busca os institutos. Ao sair (trocar de aba do app): fecha o cofre.
  useFocusEffect(
    useCallback(() => {
      listarInstitutos().then(setInstitutos).catch(() => undefined);
      return bloquear;
    }, [bloquear]),
  );

  // Recarrega a lista ao entrar na tela e ao trocar entre Todos / Recebidos / Enviados.
  useFocusEffect(
    useCallback(() => {
      carregar(caixa);
    }, [caixa, carregar]),
  );

  // Veio do chat com um destinatário escolhido ("Enviar foto cifrada").
  useEffect(() => {
    const id = route?.params?.destinoId;
    if (typeof id === 'number') setDestino(id);
  }, [route?.params?.destinoId]);

  // App foi para segundo plano: fecha o cofre (no site é ao trocar de aba do navegador).
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') bloquear();
    });
    return () => assinatura.remove();
  }, [bloquear]);

  // Relógio: a cada segundo, expira o desbloqueio e esconde fotos reveladas há mais de 1 minuto.
  useEffect(() => {
    const timer = setInterval(() => {
      const instante = Date.now();
      setAgora(instante);
      setSessao((atual) => (atual && instante >= atual.ate ? null : atual));
      setReveladas((atual) => {
        const vencidas = Object.keys(atual).filter((id) => instante >= atual[Number(id)].ate);
        if (vencidas.length === 0) return atual;
        const resto = { ...atual };
        vencidas.forEach((id) => delete resto[Number(id)]);
        return resto;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ------------------------------------------------------------ escolher foto

  function guardarFoto(resultado: ImagePicker.ImagePickerResult) {
    if (resultado.canceled) return;
    const asset = resultado.assets[0];
    const tipo = asset.mimeType ?? 'image/jpeg';
    if (!TIPOS_ACEITOS.includes(tipo)) {
      setErroEnvio(`Formato ${tipo} não aceito. Envie uma imagem jpg, png, webp ou gif.`);
      return;
    }
    if (asset.fileSize && asset.fileSize > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErroEnvio(`A imagem passa de ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }
    const extensao = tipo.split('/')[1] ?? 'jpg';
    setErroEnvio(null);
    setSucesso(null);
    setFoto({ uri: asset.uri, nome: asset.fileName ?? `foto-${Date.now()}.${extensao}`, tipo, tamanho: asset.fileSize });
  }

  async function escolherDaGaleria() {
    guardarFoto(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }));
  }

  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Habilite a câmera para fotografar.');
      return;
    }
    guardarFoto(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
  }

  // ------------------------------------------------------------------ enviar

  async function enviar() {
    if (!foto || enviando) return;
    setEnviando(true);
    setErroEnvio(null);
    setSucesso(null);
    try {
      const item = await enviarAoCofre(foto, destino, legenda);
      setSucesso(
        `Foto cifrada com ${item.algoritmo_nome}: ${tamanhoLegivel(item.tamanho_bytes)} → ${tamanhoLegivel(item.tamanho_cifrado)}.`,
      );
      setFoto(null);
      setLegenda('');
      carregar(caixa);
    } catch (e) {
      console.warn('[Cofre] falha ao enviar', e);
      setErroEnvio(e instanceof Error ? e.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  // ------------------------------------------------------- revelar / ocultar

  async function revelar(id: number, token: string) {
    setAbrindo(id);
    try {
      const conteudo = await revelarDoCofre(id, token);
      setReveladas((atual) => ({
        ...atual,
        [id]: {
          uri: `data:${conteudo.tipo_mime};base64,${conteudo.imagem_base64}`,
          nome: conteudo.nome_arquivo,
          legenda: conteudo.legenda,
          ate: Date.now() + VISIVEL_POR_MS,
        },
      }));
      mudarItens((atual) => atual.map((i) => (i.id === id && !i.enviado_por_mim ? { ...i, visualizado: true } : i)));
    } catch (e) {
      if (e instanceof ErroApi && e.status === 403) {
        // Desbloqueio venceu no servidor: pede a senha de novo.
        setSessao(null);
        setPedindoSenha(id);
      } else {
        setErro(e instanceof Error ? e.message : 'Não foi possível decifrar.');
      }
    } finally {
      setAbrindo(null);
    }
  }

  function pedirRevelar(id: number) {
    if (sessao && agora < sessao.ate) revelar(id, sessao.token);
    else setPedindoSenha(id);
  }

  function ocultar(id: number) {
    setReveladas((atual) => {
      const resto = { ...atual };
      delete resto[id];
      return resto;
    });
  }

  async function confirmarSenha() {
    if (!senha || conferindo) return;
    setConferindo(true);
    setErroSenha(null);
    try {
      const { token_cofre, expira_em_segundos } = await desbloquearCofre(senha);
      setSessao({ token: token_cofre, ate: Date.now() + expira_em_segundos * 1000 });
      const id = pedindoSenha;
      fecharModal();
      if (id !== null && id > 0) revelar(id, token_cofre);
    } catch (e) {
      setErroSenha(e instanceof Error ? e.message : 'Senha incorreta.');
    } finally {
      setConferindo(false);
    }
  }

  function fecharModal() {
    setPedindoSenha(null);
    setSenha('');
    setErroSenha(null);
  }

  // ------------------------------------------------------------------ excluir

  async function excluir(item: ItemCofre) {
    const pergunta = 'Excluir esta foto do cofre? O arquivo cifrado será apagado.';
    // No navegador (Expo Web) o Alert com botões não aparece; usa o confirm do navegador.
    const confirmado =
      Platform.OS === 'web'
        ? window.confirm(pergunta)
        : await new Promise<boolean>((resolve) =>
            Alert.alert('Excluir foto', pergunta, [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
            ]),
          );
    if (!confirmado) return;
    try {
      await excluirDoCofre(item.id);
      ocultar(item.id);
      mudarItens((atual) => atual.filter((i) => i.id !== item.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.');
    }
  }

  // -------------------------------------------------------------------- tela

  const desbloqueado = sessao !== null && agora < sessao.ate;
  const outros = institutos.filter((i) => i.id !== perfil?.id);

  const cabecalho = (
    <View>
      <View style={styles.topo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Cofre</Text>
          <Text style={styles.subtitulo}>Fotos guardadas cifradas. Para ver o conteúdo, confirme sua senha.</Text>
        </View>
        {desbloqueado ? (
          <TouchableOpacity style={[styles.estado, styles.estadoAberto]} onPress={bloquear}>
            <Feather name="unlock" size={12} color={colors.success} />
            <Text style={[styles.estadoTexto, { color: colors.success }]}>{relogio(sessao.ate - agora)} · bloquear</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.estado} onPress={() => setPedindoSenha(0)}>
            <Feather name="lock" size={12} color={colors.warning} />
            <Text style={styles.estadoTexto}>Bloqueado</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ---------- envio ---------- */}
      <View style={styles.cartao}>
        <Text style={styles.secao}>Enviar foto cifrada</Text>

        <Text style={styles.rotulo}>Para</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: null as number | null, nome: 'Só para mim' }, ...outros.map((i) => ({ id: i.id as number | null, nome: i.nome }))].map(
            (opcao) => {
              const ativo = destino === opcao.id;
              return (
                <TouchableOpacity
                  key={String(opcao.id)}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setDestino(opcao.id)}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]} numberOfLines={1}>
                    {opcao.nome}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>

        {foto ? (
          <View style={styles.fotoEscolhida}>
            <Image source={{ uri: foto.uri }} style={styles.fotoImagem} resizeMode="cover" />
            <View style={styles.fotoRodape}>
              <Text style={styles.dica} numberOfLines={1}>
                {foto.nome}
                {foto.tamanho ? ` · ${tamanhoLegivel(foto.tamanho)}` : ''} — será cifrada antes de ser guardada.
              </Text>
              <TouchableOpacity onPress={() => setFoto(null)} hitSlop={8}>
                <Feather name="trash-2" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.linha}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.escolher} onPress={tirarFoto}>
                <Feather name="camera" size={16} color={colors.textSecondary} />
                <Text style={styles.escolherTexto}>Câmera</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.escolher} onPress={escolherDaGaleria}>
              <Feather name="image" size={16} color={colors.textSecondary} />
              <Text style={styles.escolherTexto}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.rotulo}>Mensagem (também cifrada)</Text>
        <TextInput
          style={[styles.campo, styles.legenda]}
          placeholder="Ex.: balsas de garimpo no trecho norte, 06:40"
          placeholderTextColor={colors.textMuted}
          value={legenda}
          onChangeText={setLegenda}
          maxLength={1000}
          multiline
        />

        {sucesso && <Text style={styles.sucesso}>{sucesso}</Text>}
        {erroEnvio && <Text style={styles.erro}>{erroEnvio}</Text>}
        <TouchableOpacity
          style={[styles.botao, (!foto || enviando) && { opacity: 0.5 }]}
          onPress={enviar}
          disabled={!foto || enviando}
        >
          {enviando ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="shield" size={15} color="#FFFFFF" />}
          <Text style={styles.botaoTexto}>{enviando ? 'Cifrando... (pode levar alguns segundos)' : 'Cifrar e enviar'}</Text>
        </TouchableOpacity>
      </View>

      {/* ---------- abas ---------- */}
      <View style={styles.abas}>
        {(['todos', 'recebidos', 'enviados'] as const).map((qual) => (
          <TouchableOpacity
            key={qual}
            style={[styles.aba, caixa === qual && styles.abaAtiva]}
            onPress={() => setCaixa(qual)}
          >
            <Text style={[styles.abaTexto, caixa === qual && styles.abaTextoAtiva]}>
              {qual[0].toUpperCase() + qual.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {erro && itens !== null && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );

  function renderItem({ item }: { item: ItemCofre }) {
    const revelada = reveladas[item.id];
    const comQuem = item.enviado_por_mim
      ? item.destinatario.id === item.remetente.id
        ? 'Só para mim'
        : `Para ${item.destinatario.nome}`
      : `De ${item.remetente.nome}`;

    return (
      <View style={styles.cartao}>
        {revelada ? (
          <View style={styles.reveladaCaixa}>
            <Image source={{ uri: revelada.uri }} style={styles.reveladaImagem} resizeMode="contain" />
            <View style={[styles.selo, { backgroundColor: 'rgba(6,78,59,0.9)' }]}>
              <Feather name="shield" size={10} color="#FFFFFF" />
              <Text style={styles.seloTexto}>íntegra · some em {relogio(revelada.ate - agora)}</Text>
            </View>
          </View>
        ) : (
          <PreviaCifrada id={item.id} amostraHex={item.amostra_hex} />
        )}

        <View style={styles.itemTopo}>
          <Text style={styles.itemQuem} numberOfLines={1}>{comQuem}</Text>
          <Text style={styles.itemQuando}>{tempoRelativo(item.criado_em)}</Text>
        </View>

        {revelada ? (
          <View style={styles.mensagemCaixa}>
            <Text style={styles.mensagemNome}>{revelada.nome}</Text>
            <Text style={styles.mensagemTexto}>{revelada.legenda ?? 'Sem mensagem.'}</Text>
          </View>
        ) : (
          <Text style={styles.hex} numberOfLines={3}>{item.amostra_hex}…</Text>
        )}

        <View style={styles.dados}>
          <Dado rotulo="Algoritmo" valor={item.algoritmo_nome} />
          <Dado rotulo="Tamanho" valor={`${tamanhoLegivel(item.tamanho_bytes)} → ${tamanhoLegivel(item.tamanho_cifrado)}`} />
          <Dado
            rotulo="Entropia (máx. 8)"
            valor={`${item.entropia_original.toFixed(2)} → ${item.entropia_cifrado.toFixed(2)}`}
          />
          <Dado rotulo="SHA-256 original" valor={`${item.hash_sha256.slice(0, 16)}…`} mono />
          <Dado rotulo="Enviada em" valor={dataHora(item.criado_em)} />
        </View>

        <View style={styles.acoes}>
          {revelada ? (
            <TouchableOpacity style={[styles.botao, styles.botaoSecundario]} onPress={() => ocultar(item.id)}>
              <Feather name="eye-off" size={14} color={colors.textPrimary} />
              <Text style={styles.botaoTexto}>Ocultar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.botao, abrindo === item.id && { opacity: 0.6 }]}
              onPress={() => pedirRevelar(item.id)}
              disabled={abrindo === item.id}
            >
              <Feather name="eye" size={14} color="#FFFFFF" />
              <Text style={styles.botaoTexto}>{abrindo === item.id ? 'Decifrando...' : 'Revelar'}</Text>
            </TouchableOpacity>
          )}
          {!item.enviado_por_mim && (
            <Text style={[styles.status, !item.visualizado && { color: colors.accent }]}>
              {item.visualizado ? 'vista' : 'nova'}
            </Text>
          )}
          {item.enviado_por_mim && (
            <TouchableOpacity style={styles.icone} onPress={() => excluir(item)} hitSlop={8}>
              <Feather name="trash-2" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={itens ?? []}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EstadoTela
            carregando={itens === null && !erro}
            erro={itens === null ? erro : null}
            onTentarNovamente={() => carregar(caixa)}
            vazio="Nenhuma foto aqui ainda."
          />
        }
      />

      {/* ---------- confirmação de senha ---------- */}
      <Modal visible={pedindoSenha !== null} transparent animationType="fade" onRequestClose={fecharModal}>
        <KeyboardAvoidingView style={styles.modalFundo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalFechar} onPress={fecharModal} hitSlop={10} accessibilityLabel="Fechar">
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Feather name="lock" size={22} color={colors.accent} />
            <Text style={styles.secao}>Confirme sua senha</Text>
            <Text style={styles.dica}>
              O cofre fica aberto por alguns minutos e fecha sozinho, ou quando você sai desta tela ou do app.
            </Text>
            <TextInput
              style={styles.campo}
              placeholder="Senha do instituto"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={confirmarSenha}
            />
            {erroSenha && <Text style={styles.erro}>{erroSenha}</Text>}
            <TouchableOpacity
              style={[styles.botao, (!senha || conferindo) && { opacity: 0.5 }]}
              onPress={confirmarSenha}
              disabled={!senha || conferindo}
            >
              <Text style={styles.botaoTexto}>{conferindo ? 'Conferindo...' : 'Desbloquear'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Uma linha "rótulo: valor" dos dados técnicos da cifragem.
function Dado({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <View style={styles.dado}>
      <Text style={styles.dadoRotulo}>{rotulo}</Text>
      <Text style={[styles.dadoValor, mono && styles.mono]} numberOfLines={1}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  conteudo: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  subtitulo: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  estadoAberto: { borderColor: 'rgba(16,185,129,0.45)', backgroundColor: 'rgba(16,185,129,0.1)' },
  estadoTexto: { color: colors.warning, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },

  cartao: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  secao: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rotulo: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    maxWidth: 200,
  },
  chipAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTexto: { color: colors.textSecondary, fontSize: 12 },
  chipTextoAtivo: { color: '#FFFFFF', fontWeight: '600' },
  linha: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  escolher: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  escolherTexto: { color: colors.textSecondary, fontSize: 13 },
  fotoEscolhida: { marginTop: spacing.xs, gap: spacing.xs },
  fotoImagem: { width: '100%', aspectRatio: 1.6, borderRadius: radius.md, backgroundColor: colors.cardAlt },
  fotoRodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dica: { flex: 1, color: colors.textMuted, fontSize: 11 },
  campo: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    alignSelf: 'stretch',
  },
  legenda: { minHeight: 70, textAlignVertical: 'top' },
  sucesso: { color: colors.success, fontSize: 12 },
  erro: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    alignSelf: 'stretch',
  },
  botaoSecundario: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  abas: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  aba: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.cardAlt },
  abaAtiva: { backgroundColor: colors.accent },
  abaTexto: { color: colors.textSecondary, fontSize: 12 },
  abaTextoAtiva: { color: '#FFFFFF', fontWeight: '600' },

  reveladaCaixa: { width: '100%', aspectRatio: 1.6, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000000' },
  reveladaImagem: { width: '100%', height: '100%' },
  selo: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  seloTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  itemTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  itemQuem: { flex: 1, color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  itemQuando: { color: colors.textMuted, fontSize: 11 },
  hex: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: spacing.sm,
  },
  mensagemCaixa: { backgroundColor: colors.background, borderRadius: 6, padding: spacing.sm, gap: 2 },
  mensagemNome: { color: colors.textMuted, fontSize: 11 },
  mensagemTexto: { color: colors.textPrimary, fontSize: 13 },
  dados: { gap: 4 },
  dado: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  dadoRotulo: { color: colors.textMuted, fontSize: 11 },
  dadoValor: { color: colors.textPrimary, fontSize: 11, flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  status: { color: colors.textMuted, fontSize: 11 },
  icone: { marginLeft: 'auto', padding: 4 },

  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.xl },
  modal: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  modalFechar: { position: 'absolute', top: spacing.md, right: spacing.md },
});
