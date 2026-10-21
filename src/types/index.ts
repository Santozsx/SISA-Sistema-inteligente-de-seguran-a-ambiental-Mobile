// Formatos devolvidos pela API do SISA (backend/app/schemas.py).

export type StatusInstituto = 'ativo' | 'em-rota' | 'inativo';
export type StatusChamado = 'aberto' | 'em-analise' | 'resolvido';
export type TagNoticia = 'urgente' | 'em-analise' | 'resolvido';

export interface InstitutoResumo {
  id: number;
  nome: string;
  iniciais: string;
}

export interface Instituto extends InstitutoResumo {
  email: string;
  tipo: string;
  status: StatusInstituto;
  status_label: string;
  verificado: boolean;
  latitude: number | null;
  longitude: number | null;
  distancia_km: number | null;
}

export interface Notificacoes {
  chamados: boolean;
  mensagens: boolean;
  email: boolean;
}

export interface Perfil extends Instituto {
  notificacoes: Notificacoes;
  criado_em: string;
}

export interface TokenSaida {
  access_token: string;
  token_type: string;
  expira_em_segundos: number;
  instituto: Perfil;
}

export interface Anexo {
  id: number;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  hash_sha256: string;
  url: string;
  criado_em: string;
}

export interface Chamado {
  id: number;
  categoria: string;
  categoria_label: string;
  status: StatusChamado;
  status_label: string;
  instituto: InstitutoResumo;
  descricao: string;
  local: string | null;
  latitude: number | null;
  longitude: number | null;
  valor_numerico: number | null;
  unidade: string | null;
  anexos: Anexo[];
  criado_em: string;
  atualizado_em: string;
}

export interface NovoChamado {
  categoria: string;
  descricao: string;
  local?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  valor_numerico?: number | null;
  unidade?: string | null;
}

export interface Opcao {
  valor: string;
  label: string;
}

export interface Noticia {
  id: number;
  tag: TagNoticia;
  titulo: string;
  resumo: string;
  fonte: string;
  criado_em: string;
}

export interface Mensagem {
  id: number;
  remetente_id: number;
  destinatario_id: number;
  enviada_por_mim: boolean;
  texto: string;
  lida: boolean;
  criado_em: string;
  cifrado_base64: string | null;
}

export interface Conversa {
  instituto: InstitutoResumo;
  ultima_mensagem: string | null;
  ultima_em: string | null;
  nao_lidas: number;
}

export interface AtualizarPerfil {
  nome?: string;
  email?: string;
  tipo?: string;
  status?: StatusInstituto;
  latitude?: number;
  longitude?: number;
  notificacoes?: Partial<Notificacoes>;
  senha_atual?: string;
  nova_senha?: string;
}

export interface Saude {
  status: string;
  versao: string;
  cifra: string;
}

export interface Versao {
  versao_api: string;
  versao_minima_app: string;
}
