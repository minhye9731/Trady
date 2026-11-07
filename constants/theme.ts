import { Platform, type TextStyle } from 'react-native';

/**
 * Trady design tokens — "slate pro" palette shared with the web dashboard.
 */
export const palette = {
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F8FA',
  border: '#E4E8EE',
  hairline: '#EDF0F4',

  ink: '#1C2333',
  inkSoft: '#3A4458',
  muted: '#8A94A6',
  faint: '#B8C0CC',
  onInk: '#F1F3F7',

  positive: '#2D7A4F',
  positiveBg: '#E8F5EE',
  negative: '#C94444',
  negativeBg: '#FDF0F0',
  warning: '#9A6A10',
  warningBg: '#FEF3E2',
  info: '#185FA5',
  infoBg: '#E6F1FB',
  violet: '#534AB7',
  violetBg: '#F3F0FE',
} as const;

export type Tone = 'neutral' | 'ink' | 'positive' | 'negative' | 'warning' | 'info' | 'violet';

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: palette.inkSoft, bg: palette.background },
  ink: { fg: palette.onInk, bg: palette.ink },
  positive: { fg: palette.positive, bg: palette.positiveBg },
  negative: { fg: palette.negative, bg: palette.negativeBg },
  warning: { fg: palette.warning, bg: palette.warningBg },
  info: { fg: palette.info, bg: palette.infoBg },
  violet: { fg: palette.violet, bg: palette.violetBg },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const type = {
  largeTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.6, color: palette.ink },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: palette.ink },
  headline: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, color: palette.ink },
  body: { fontSize: 15, fontWeight: '400', color: palette.ink, lineHeight: 22 },
  callout: { fontSize: 14, fontWeight: '400', color: palette.inkSoft, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', color: palette.muted },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: palette.muted,
  },
  number: { fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#1C2333',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  default: { elevation: 1 },
});

// Kept for the remaining Expo template files.
export const Colors = {
  light: {
    text: palette.ink,
    background: palette.background,
    tint: palette.ink,
    icon: palette.muted,
    tabIconDefault: palette.muted,
    tabIconSelected: palette.ink,
  },
  dark: {
    text: palette.ink,
    background: palette.background,
    tint: palette.ink,
    icon: palette.muted,
    tabIconDefault: palette.muted,
    tabIconSelected: palette.ink,
  },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
});

export const TradyColors = {
  background: palette.background,
  card: palette.surface,
  border: palette.border,
  textPrimary: palette.ink,
  textSecondary: palette.muted,
  buyGreen: palette.positive,
  sellRed: palette.negative,
  accent: palette.ink,
};
