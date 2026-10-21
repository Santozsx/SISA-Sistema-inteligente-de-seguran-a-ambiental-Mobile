import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MessageBubble from '../components/MessageBubble';
import EstadoTela from '../components/EstadoTela';
import { colors, radius, spacing } from '../theme/colors';
import { enviarMensagem, listarMensagens, obterInstituto } from '../services/api';
import { Instituto, Mensagem } from '../types';
import { distancia } from '../utils/formatar';

const INTERVALO_ATUALIZACAO_MS = 4000;

export default function ChatScreen({ route, navigation }: any) {
  const institutoId: number = route.params.institutoId;
  const [instituto, setInstituto] = useState<Instituto | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarCifrado, setMostrarCifrado] = useState(false);
  const lista = useRef<FlatList<Mensagem>>(null);

  useEffect(() => {
    obterInstituto(institutoId).then(setInstituto).catch(() => {});
  }, [institutoId]);

  const carregar = useCallback(async () => {
    try {
      setMensagens(await listarMensagens(institutoId, mostrarCifrado));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    }
  }, [institutoId, mostrarCifrado]);

  // Busca novas mensagens periodicamente enquanto a conversa está aberta.
  useFocusEffect(
    useCallback(() => {
      carregar();
      const timer = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
      return () => clearInterval(timer);
    }, [carregar]),
  );

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    try {
      await enviarMensagem(institutoId, conteudo);
      setTexto('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  // Quando o chat é aberto direto de outra aba, não há tela anterior na pilha de Mensagens.
  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ConversasList');
  }

  const nome = instituto?.nome ?? route.params.nome ?? 'Conversa';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerNome} numberOfLines={1}>{nome}</Text>
          {instituto && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {instituto.tipo} · {distancia(instituto.distancia_km)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.canalSeguro, mostrarCifrado && styles.canalSeguroAtivo]}
          onPress={() => setMostrarCifrado((v) => !v)}
        >
          <Feather name="lock" size={10} color={mostrarCifrado ? '#FFFFFF' : colors.accent} />
          <Text style={[styles.canalSeguroText, mostrarCifrado && { color: '#FFFFFF' }]}>
            {mostrarCifrado ? 'vendo cifrado' : 'canal seguro'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={lista}
          data={mensagens ?? []}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <MessageBubble mensagem={item} mostrarCifrado={mostrarCifrado} />}
          ListEmptyComponent={
            <EstadoTela
              carregando={mensagens === null && !erro}
              erro={mensagens === null ? erro : null}
              onTentarNovamente={carregar}
              vazio="Nenhuma mensagem ainda. As mensagens são cifradas antes de ir para o banco."
            />
          }
        />

        {erro && mensagens !== null && <Text style={styles.erro}>{erro}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escrever mensagem..."
            placeholderTextColor={colors.textMuted}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[styles.enviarButton, (!texto.trim() || enviando) && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.85}
          >
            {enviando ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.enviarText}>Enviar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerInfo: { flex: 1 },
  headerNome: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  headerSub: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
  canalSeguro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  canalSeguroAtivo: { backgroundColor: colors.accent },
  canalSeguroText: { color: colors.accent, fontSize: 10, fontWeight: '600' },
  messagesContent: { padding: spacing.lg, flexGrow: 1, justifyContent: 'flex-end' },
  erro: { color: colors.danger, fontSize: 12, textAlign: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 100,
  },
  enviarButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    minWidth: 76,
    alignItems: 'center',
  },
  enviarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
