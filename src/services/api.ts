// Comunicação com o back end do SISA. Usa as mesmas rotas e o mesmo token Bearer do site.
import { Platform } from 'react-native';
import { API_URL } from './config';
import { lerItem, salvarItem } from './armazenamento';
import { bytesParaBase64 } from '../utils/previaCifrada';
import {
  Anexo,
  AtualizarPerfil,
  CaixaCofre,
  Chamado,
  ConteudoCofre,
  Conversa,
  DesbloqueioCofre,
  Instituto,
  ItemCofre,
  Mensagem,
  Noticia,
  NovoChamado,
  Opcao,
  Perfil,
  Saude,
  StatusChamado,
  TokenSaida,
  Versao,
} from '../types';

const CHAVE_TOKEN = 'sisa.token';

// ------------------------------------------------------------------ token
// Mantido em memória para não ler o armazenamento a cada requisição.

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export async function carregarToken(): Promise<string | null> {
  tokenAtual = await lerItem(CHAVE_TOKEN);
  return tokenAtual;
}

async function salvarToken(token: string | null) {
  tokenAtual = token;
  await salvarItem(CHAVE_TOKEN, token);
}

export function obterToken(): string | null {
  return tokenAtual;
}

// O AuthContext registra aqui o que fazer quando a API responde 401 (voltar ao login).
export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback;
}

// ------------------------------------------------------------- requisições

export class ErroApi extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

// Converte o "detail" do FastAPI (texto ou lista de erros de validação) em uma frase.
function mensagemDeErro(corpo: unknown, status: number): string {
  const detalhe = (corpo as { detail?: unknown } | null)?.detail;
  if (typeof detalhe === 'string') return detalhe;
  if (Array.isArray(detalhe) && detalhe.length > 0) {
    const primeiro = detalhe[0] as { loc?: unknown[]; msg?: string };
    const campo = primeiro.loc?.[primeiro.loc.length - 1];
    return campo ? `Campo "${String(campo)}": ${primeiro.msg}` : (primeiro.msg ?? 'Dados inválidos.');
  }
  return `Erro ${status} ao falar com o servidor.`;
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const cabecalhos = new Headers(opcoes.headers);
  if (tokenAtual) cabecalhos.set('Authorization', `Bearer ${tokenAtual}`);
  if (opcoes.body && !(opcoes.body instanceof FormData)) cabecalhos.set('Content-Type', 'application/json');

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers: cabecalhos });
  } catch (e) {
    // Mostra também o erro original do aparelho (ajuda a diferenciar rede, permissão e arquivo).
    const detalhe = e instanceof Error ? e.message : String(e);
    console.warn(`[API] ${opcoes.method ?? 'GET'} ${caminho} falhou:`, e);
    throw new ErroApi(0, `Não foi possível conectar ao servidor (${API_URL}). Detalhe: ${detalhe}`);
  }

  if (resposta.status === 401 && tokenAtual) {
    // Sessão expirou: limpa o token e volta para o login.
    await salvarToken(null);
    aoExpirarSessao?.();
  }

  if (resposta.status === 204) return undefined as T;
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new ErroApi(resposta.status, mensagemDeErro(corpo, resposta.status));
  return corpo as T;
}

const json = (dados: unknown) => JSON.stringify(dados);

// Envio de arquivos (multipart). Usa XMLHttpRequest em vez de fetch porque, a partir do
// SDK 58, o fetch do Expo não aceita mais o formato { uri, name, type } no FormData
// ("Unsupported FormDataPart implementation"). O XMLHttpRequest do React Native aceita
// e lê o arquivo direto do aparelho.
const TEMPO_MAXIMO_ENVIO_MS = 120_000;

function requisitarMultipart<T>(caminho: string, formulario: FormData): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${caminho}`);
    if (tokenAtual) xhr.setRequestHeader('Authorization', `Bearer ${tokenAtual}`);
    // Não definimos Content-Type: o XMLHttpRequest monta o "multipart/form-data; boundary=..." sozinho.
    xhr.timeout = TEMPO_MAXIMO_ENVIO_MS;

    xhr.onload = async () => {
      if (xhr.status === 401 && tokenAtual) {
        await salvarToken(null);
        aoExpirarSessao?.();
      }
      let corpo: unknown = null;
      try {
        corpo = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        corpo = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(corpo as T);
      else reject(new ErroApi(xhr.status, mensagemDeErro(corpo, xhr.status)));
    };
    xhr.onerror = () =>
      reject(new ErroApi(0, `Não foi possível enviar o arquivo para o servidor (${API_URL}). Verifique a conexão.`));
    xhr.ontimeout = () => reject(new ErroApi(0, 'O envio demorou demais. Tente uma foto menor ou verifique a conexão.'));

    xhr.send(formulario);
  });
}

// ------------------------------------------------------------- autenticação

export async function login(email: string, senha: string): Promise<Perfil> {
  const resposta = await requisitar<TokenSaida>('/auth/login', {
    method: 'POST',
    body: json({ email: email.trim(), senha }),
  });
  await salvarToken(resposta.access_token);
  return resposta.instituto;
}

// Troca o token salvo por um novo (mantém a sessão sem pedir login de novo).
export async function renovarSessao(): Promise<Perfil> {
  const resposta = await requisitar<TokenSaida>('/auth/renovar', { method: 'POST' });
  await salvarToken(resposta.access_token);
  return resposta.instituto;
}

export async function logout() {
  await salvarToken(null);
}

export const cadastrar = (dados: { nome: string; email: string; tipo: string; senha: string; latitude?: number; longitude?: number }) =>
  requisitar<Perfil>('/auth/cadastro', { method: 'POST', body: json(dados) });

// ---------------------------------------------------------------- institutos

export const meuPerfil = () => requisitar<Perfil>('/institutos/eu');

export const atualizarPerfil = (dados: AtualizarPerfil) =>
  requisitar<Perfil>('/institutos/eu', { method: 'PATCH', body: json(dados) });

// Com lat/lon (GPS do celular) a API ordena pela distância até o aparelho.
export function listarInstitutos(posicao?: { latitude: number; longitude: number } | null) {
  const consulta = posicao ? `?lat=${posicao.latitude}&lon=${posicao.longitude}` : '';
  return requisitar<Instituto[]>(`/institutos${consulta}`);
}

export const obterInstituto = (id: number) => requisitar<Instituto>(`/institutos/${id}`);

// ----------------------------------------------------------------- chamados

export const listarCategorias = () => requisitar<Opcao[]>('/chamados/categorias');

export function listarChamados(status?: StatusChamado) {
  const consulta = status ? `?status=${status}` : '';
  return requisitar<Chamado[]>(`/chamados${consulta}`);
}

export const obterChamado = (id: number) => requisitar<Chamado>(`/chamados/${id}`);

export const criarChamado = (dados: NovoChamado) =>
  requisitar<Chamado>('/chamados', { method: 'POST', body: json(dados) });

export const atualizarStatusChamado = (id: number, status: StatusChamado) =>
  requisitar<Chamado>(`/chamados/${id}/status`, { method: 'PATCH', body: json({ status }) });

export type FotoLocal = { uri: string; nome: string; tipo: string };

// Coloca a foto (uri local do expo-image-picker) no campo "arquivo" de um FormData.
async function anexarFoto(formulario: FormData, arquivo: FotoLocal) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(arquivo.uri)).blob();
    formulario.append('arquivo', blob, arquivo.nome);
  } else {
    // No React Native o FormData aceita { uri, name, type } e lê o arquivo do aparelho.
    formulario.append('arquivo', { uri: arquivo.uri, name: arquivo.nome, type: arquivo.tipo } as unknown as Blob);
  }
}

// Foto da galeria ou da câmera.
export async function enviarAnexo(chamadoId: number, arquivo: FotoLocal) {
  const formulario = new FormData();
  await anexarFoto(formulario, arquivo);
  return requisitarMultipart<Anexo>(`/chamados/${chamadoId}/anexos`, formulario);
}

// A url do anexo vem como "/api/v1/chamados/1/anexos/2"; a imagem precisa do token no cabeçalho.
export function fonteAnexo(anexo: Anexo) {
  const base = API_URL.replace(/\/api\/v1$/, '');
  return { uri: `${base}${anexo.url}`, headers: { Authorization: `Bearer ${tokenAtual ?? ''}` } };
}

// -------------------------------------------------------------------- mural

export const listarMural = () => requisitar<Noticia[]>('/mural');

// ---------------------------------------------------------------- mensagens

export const listarConversas = () => requisitar<Conversa[]>('/mensagens/conversas');

export const listarMensagens = (institutoId: number, mostrarCifrado = false) =>
  requisitar<Mensagem[]>(`/mensagens/${institutoId}?mostrar_cifrado=${mostrarCifrado}`);

export const enviarMensagem = (institutoId: number, texto: string) =>
  requisitar<Mensagem>(`/mensagens/${institutoId}`, { method: 'POST', body: json({ texto }) });

// -------------------------------------------------------------------- cofre
// Mesmo funcionamento do site: a foto e a legenda são cifradas no servidor; para ver,
// confirma-se a senha e o token curto devolvido vai no cabeçalho X-Token-Cofre.

export const listarCofre = (caixa: CaixaCofre = 'todos') => requisitar<ItemCofre[]>(`/cofre?caixa=${caixa}`);

// destinatarioId null = "só para mim".
export async function enviarAoCofre(foto: FotoLocal, destinatarioId: number | null, legenda: string) {
  const formulario = new FormData();
  await anexarFoto(formulario, foto);
  if (destinatarioId !== null) formulario.append('destinatario_id', String(destinatarioId));
  if (legenda.trim()) formulario.append('legenda', legenda.trim());
  return requisitarMultipart<ItemCofre>('/cofre', formulario);
}

// Confere a senha. O token devolvido fica só na memória da tela (nunca no armazenamento).
export const desbloquearCofre = (senha: string) =>
  requisitar<DesbloqueioCofre>('/cofre/desbloquear', { method: 'POST', body: json({ senha }) });

export const revelarDoCofre = (id: number, tokenCofre: string) =>
  requisitar<ConteudoCofre>(`/cofre/${id}/conteudo`, {
    headers: { 'X-Token-Cofre': tokenCofre },
    cache: 'no-store',
  });

export const excluirDoCofre = (id: number) => requisitar<void>(`/cofre/${id}`, { method: 'DELETE' });

// Começo do arquivo como está guardado no disco (para desenhar a prévia "ruído").
export async function bytesCifradosBase64(id: number, limite: number): Promise<string> {
  const resposta = await fetch(`${API_URL}/cofre/${id}/cifrado?limite_bytes=${limite}`, {
    headers: { Authorization: `Bearer ${tokenAtual ?? ''}` },
    cache: 'no-store',
  });
  if (!resposta.ok) throw new ErroApi(resposta.status, 'Não foi possível ler o arquivo cifrado.');
  // O fetch do Expo (SDK 58+) entrega os bytes direto com arrayBuffer().
  try {
    return bytesParaBase64(new Uint8Array(await resposta.clone().arrayBuffer()));
  } catch {
    // Motores antigos: lê como data URL pelo FileReader.
  }
  const blob = await resposta.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Falha ao ler os bytes cifrados.'));
    leitor.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

// ------------------------------------------------------------------ sistema

export const saude = () => requisitar<Saude>('/saude');

export const versaoMinima = () => requisitar<Versao>('/mobile/versao');
