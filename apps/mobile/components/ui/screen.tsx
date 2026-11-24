import { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, space, type } from '@/constants/theme';

type Props = {
  /** Large in-content title for tab roots. Omit on screens that use the native stack header. */
  title?: string;
  overline?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  title,
  overline,
  subtitle,
  right,
  children,
  refreshing = false,
  onRefresh,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const hasLargeHeader = !!title;

  return (
    <ScrollView
      style={styles.root}
      contentInsetAdjustmentBehavior={hasLargeHeader ? 'never' : 'automatic'}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        hasLargeHeader && { paddingTop: insets.top + space.md },
        contentStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.muted} />
        ) : undefined
      }>
      {hasLargeHeader && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {overline ? <Text style={type.overline}>{overline}</Text> : null}
            <Text style={[type.largeTitle, overline ? { marginTop: 2 } : null]}>{title}</Text>
            {subtitle ? <Text style={[type.callout, { marginTop: 4 }]}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: space.lg, paddingBottom: 48, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.xs },
  right: { flexDirection: 'row', gap: space.sm, marginLeft: space.md, paddingBottom: 4 },
});
