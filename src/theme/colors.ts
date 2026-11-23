// Design system do SISA — Dark Navy / Slate Blue
// Mantém a mesma identidade visual da versão web.
export const colors = {
  background: '#0B0F19',
  backgroundAlt: '#0D111D',
  card: '#161B26',
  cardAlt: '#1E2430',
  border: '#232A3A',

  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  accent: '#3B82F6',
  accentPressed: '#2563EB',

  success: '#10B981',
  successBg: '#064E3B',

  warning: '#F59E0B',
  warningBg: '#78350F',

  danger: '#EF4444',
  dangerBg: '#7F1D1D',
};

// Status usados pela API: institutos (ativo, em-rota, inativo), chamados (aberto, em-analise,
// resolvido) e tags do mural (urgente). O texto exibido vem do back end (status_label).
export type StatusKind = 'ativo' | 'em-rota' | 'inativo' | 'aberto' | 'em-analise' | 'resolvido' | 'urgente';

export const statusStyles: Record<StatusKind, { label: string; fg: string; bg: string }> = {
  ativo: { label: 'ativo', fg: colors.success, bg: colors.successBg },
  resolvido: { label: 'resolvido', fg: colors.success, bg: colors.successBg },
  'em-rota': { label: 'em rota', fg: colors.warning, bg: colors.warningBg },
  'em-analise': { label: 'em análise', fg: colors.warning, bg: colors.warningBg },
  urgente: { label: 'urgente', fg: colors.danger, bg: colors.dangerBg },
  aberto: { label: 'aberto', fg: colors.danger, bg: colors.dangerBg },
  inativo: { label: 'inativo', fg: colors.textMuted, bg: colors.cardAlt },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
