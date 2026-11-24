import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { palette, radius, shadow, space, toneColors, type, type Tone } from '@/constants/theme';
import { IconSymbol, type IconSymbolName } from './icon-symbol';

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const base = [styles.card, padded && styles.padded, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.headline}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  tone = 'neutral',
  icon,
  size = 'sm',
}: {
  label: string;
  tone?: Tone;
  icon?: IconSymbolName;
  size?: 'sm' | 'md';
}) {
  const c = toneColors[tone];
  return (
    <View style={[styles.chip, size === 'md' && styles.chipMd, { backgroundColor: c.bg }]}>
      {icon ? <IconSymbol name={icon} size={size === 'md' ? 13 : 11} color={c.fg} weight="semibold" /> : null}
      <Text style={[styles.chipText, size === 'md' && styles.chipTextMd, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  children,
}: {
  icon: IconSymbolName;
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <IconSymbol name={icon} size={24} color={palette.muted} />
      </View>
      <Text style={[type.headline, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[type.callout, styles.emptyMessage]}>{message}</Text> : null}
      {children ? <View style={{ marginTop: space.md, alignSelf: 'stretch' }}>{children}</View> : null}
    </Card>
  );
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.muted} />
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <IconSymbol name="exclamationmark.triangle.fill" size={16} color={palette.negative} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={styles.errorRetry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    ...shadow,
  },
  padded: { padding: space.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -space.xs,
  },
  sectionAction: { fontSize: 14, fontWeight: '500', color: palette.info },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm - 2,
  },
  chipMd: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  chipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  chipTextMd: { fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 6 },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyMessage: { textAlign: 'center', color: palette.muted, maxWidth: 280 },
  loading: { paddingVertical: 60, alignItems: 'center' },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.negativeBg,
  },
  errorText: { flex: 1, color: palette.negative, fontSize: 13 },
  errorRetry: { color: palette.negative, fontSize: 13, fontWeight: '600' },
});
